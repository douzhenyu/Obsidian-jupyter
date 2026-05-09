import { ChildProcess, spawn } from "child_process";
import { OutputItem, JupyterSettings, KernelRequest, KernelResponse } from "../types";
import { join } from "path";

export class PythonKernel {
  private process: ChildProcess | null = null;
  private settings: JupyterSettings;
  private scriptPath: string;
  private ready: boolean = false;
  private readyResolve: (() => void) | null = null;
  private buffer = "";
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private restarting = false;

  constructor(settings: JupyterSettings, scriptPath: string) {
    this.settings = settings;
    this.scriptPath = scriptPath;
  }

  private startProcess(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.process) {
        resolve();
        return;
      }

      this.process = spawn(this.settings.pythonPath, [this.scriptPath], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.ready = false;
      this.buffer = "";

      this.process.stdout?.on("data", (data: Buffer) => {
        this.buffer += data.toString();
        const lines = this.buffer.split("\n");
        this.buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const msg = JSON.parse(trimmed) as KernelResponse;
            if (msg.type === "ready") {
              this.ready = true;
              if (this.readyResolve) {
                this.readyResolve();
                this.readyResolve = null;
              }
            }
          } catch {
            // Non-JSON output from kernel (shouldn't happen)
          }
        }
      });

      this.process.stderr?.on("data", (data: Buffer) => {
        console.error("[kernel stderr]", data.toString());
      });

      this.process.on("error", (err) => {
        console.error("[kernel] Process error:", err);
        reject(err);
      });

      this.process.on("exit", (code) => {
        this.ready = false;
        this.process = null;
        if (code !== 0 && !this.restarting) {
          console.warn("[kernel] Process exited with code", code);
          reject(new Error(`Python 进程异常退出，退出码: ${code}。请检查 Python 路径配置和 kernel_script.py 是否存在。`));
        }
      });

      this.readyResolve = () => resolve();
    });
  }

  async ensureReady(): Promise<void> {
    if (this.ready && this.process) return;
    this.restarting = false;
    return this.startProcess();
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    if (this.settings.idleTimeout > 0) {
      this.idleTimer = setTimeout(() => {
        this.shutdown();
      }, this.settings.idleTimeout * 1000);
    }
  }

  async execute(code: string, cellId: string): Promise<OutputItem[]> {
    await this.ensureReady();
    this.resetIdleTimer();

    const request: KernelRequest = {
      type: "execute",
      id: cellId,
      code,
      timeout: this.settings.timeout,
    };

    this.sendRequest(request);

    const outputs: OutputItem[] = [];
    let done = false;
    let currentStdout = "";
    let currentStderr = "";

    return new Promise<OutputItem[]>((resolve) => {
      const timeoutId = setTimeout(() => {
        if (!done) {
          this.killProcess();
          const errorOutput: OutputItem = {
            type: "error",
            data: "",
            ename: "TimeoutError",
            evalue: `代码执行超时 (${this.settings.timeout}秒)`,
            traceback: [],
          };
          outputs.push(errorOutput);
          done = true;
          resolve(outputs);
        }
      }, this.settings.timeout * 1000);

      const onData = (data: Buffer) => {
        this.buffer += data.toString();
        const lines = this.buffer.split("\n");
        this.buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const msg = JSON.parse(trimmed) as KernelResponse;

            switch (msg.type) {
              case "stdout":
                currentStdout += msg.data;
                break;
              case "stderr":
                currentStderr += msg.data;
                break;
              case "image":
                outputs.push({
                  type: "image",
                  data: msg.data,
                  format: msg.format,
                });
                break;
              case "html":
                outputs.push({
                  type: "html",
                  data: msg.data,
                });
                break;
              case "error":
                outputs.push({
                  type: "error",
                  data: "",
                  ename: msg.ename,
                  evalue: msg.evalue,
                  traceback: msg.traceback,
                });
                break;
              case "done":
                if (currentStdout) {
                  outputs.unshift({
                    type: "text",
                    data: this.truncateOutput(currentStdout),
                  });
                }
                if (currentStderr) {
                  const stderrIdx =
                    outputs.length > 0 && outputs[0].type === "text" ? 1 : 0;
                  outputs.splice(stderrIdx, 0, {
                    type: "stderr",
                    data: this.truncateOutput(currentStderr),
                  });
                }
                done = true;
                clearTimeout(timeoutId);
                this.process?.stdout?.removeListener("data", onData);
                resolve(outputs);
                break;
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      };

      this.process?.stdout?.on("data", onData);
    });
  }

  private sendRequest(request: KernelRequest): void {
    if (this.process?.stdin) {
      this.process.stdin.write(JSON.stringify(request) + "\n");
    }
  }

  private truncateOutput(text: string): string {
    if (text.length > this.settings.maxOutputChars) {
      return (
        text.substring(0, this.settings.maxOutputChars) +
        "\n...（输出已截断）"
      );
    }
    return text;
  }

  async interrupt(): Promise<void> {
    if (this.process) {
      this.sendRequest({ type: "interrupt", id: "interrupt" });
    }
  }

  async restart(): Promise<void> {
    this.restarting = true;
    this.killProcess();
    this.ready = false;
    this.buffer = "";
  }

  shutdown(): void {
    if (this.process) {
      this.sendRequest({ type: "shutdown" });
      setTimeout(() => {
        this.killProcess();
      }, 2000);
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private killProcess(): void {
    if (this.process) {
      try {
        this.process.kill();
      } catch {
        // Process may already be dead
      }
      this.process = null;
      this.ready = false;
    }
  }

  get isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}
