import sys
import json
import io
import base64
import traceback

stdout_ref = sys.stdout
stderr_ref = sys.stderr
stdin_ref = sys.stdin

globals_dict = {}
globals_dict["__builtins__"] = __builtins__

execution_count = 0


def send_message(msg):
    stdout_ref.write(json.dumps(msg) + "\n")
    stdout_ref.flush()


def handle_execute(msg):
    global execution_count
    cell_id = msg["id"]
    code = msg["code"]

    code = code.encode("utf-8", errors="surrogateescape").decode("utf-8", errors="replace")

    execution_count += 1

    send_message({"type": "started", "id": cell_id})

    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    sys.stdout = stdout_buf
    sys.stderr = stderr_buf

    try:
        if code.strip():
            compiled = compile(code, "<jupyter-cell>", "exec")
            exec(compiled, globals_dict)

        stdout_val = stdout_buf.getvalue()
        stderr_val = stderr_buf.getvalue()

        max_chars = 50000
        if stdout_val:
            for i in range(0, len(stdout_val), max_chars):
                chunk = stdout_val[i : i + max_chars]
                send_message({"type": "stdout", "id": cell_id, "data": chunk})

        if stderr_val:
            send_message({"type": "stderr", "id": cell_id, "data": stderr_val})

        if "matplotlib" in sys.modules:
            import matplotlib.pyplot as plt

            if plt.get_fignums():
                for fig_num in plt.get_fignums():
                    fig = plt.figure(fig_num)
                    buf = io.BytesIO()
                    fig.savefig(buf, format="png", bbox_inches="tight", dpi=100)
                    buf.seek(0)
                    img_base64 = base64.b64encode(buf.read()).decode("utf-8")
                    send_message(
                        {
                            "type": "image",
                            "id": cell_id,
                            "data": img_base64,
                            "format": "png",
                        }
                    )
                    buf.close()
                plt.close("all")

        if "pandas" in sys.modules:
            import pandas as pd

            code_stripped = code.strip()
            try:
                code_obj = compile(code_stripped, "<jupyter-cell-expr>", "eval")
                result = eval(code_obj, globals_dict)
                if isinstance(result, pd.DataFrame):
                    html = result.to_html(index=True, max_rows=60)
                    send_message({"type": "html", "id": cell_id, "data": html})
            except Exception:
                pass

        send_message({"type": "done", "id": cell_id, "execution_count": execution_count})

    except Exception as e:
        tb_lines = traceback.format_exception(type(e), e, e.__traceback__)
        send_message(
            {
                "type": "error",
                "id": cell_id,
                "ename": type(e).__name__,
                "evalue": str(e),
                "traceback": tb_lines,
            }
        )

    finally:
        sys.stdout = stdout_ref
        sys.stderr = stderr_ref


def handle_interrupt(msg):
    send_message(
        {"type": "done", "id": msg["id"], "execution_count": execution_count}
    )


def main():
    send_message({"type": "ready"})

    while True:
        try:
            line = stdin_ref.readline()
            if not line:
                break

            line = line.strip()
            if not line:
                continue

            msg = json.loads(line)

            if msg["type"] == "execute":
                handle_execute(msg)
            elif msg["type"] == "interrupt":
                handle_interrupt(msg)
            elif msg["type"] == "shutdown":
                break

        except json.JSONDecodeError:
            stderr_ref.write(f"[kernel] Invalid JSON: {line}\n")
            stderr_ref.flush()
        except Exception as e:
            stderr_ref.write(f"[kernel] Unexpected error: {e}\n")
            stderr_ref.flush()


if __name__ == "__main__":
    main()
