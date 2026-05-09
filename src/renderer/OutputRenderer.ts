import { OutputItem } from "../types";

export function renderText(text: string): HTMLElement {
  const el = document.createElement("pre");
  el.className = "jupyter-output-text";
  el.textContent = text;
  return el;
}

export function renderStderr(text: string): HTMLElement {
  const el = document.createElement("pre");
  el.className = "jupyter-output-stderr";
  el.textContent = text;
  return el;
}

export function renderImage(
  base64: string,
  format: string,
  maxWidth: number
): HTMLElement {
  const container = document.createElement("div");
  container.className = "jupyter-output-image";

  const img = document.createElement("img");
  img.src = `data:image/${format};base64,${base64}`;
  img.style.maxWidth = maxWidth + "px";

  container.appendChild(img);
  return container;
}

export function renderHtml(html: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "jupyter-output-html";
  el.innerHTML = html;
  return el;
}

export function renderError(
  ename: string,
  evalue: string,
  traceback: string[]
): HTMLElement {
  const container = document.createElement("div");
  container.className = "jupyter-error";

  const pre = document.createElement("pre");
  pre.className = "jupyter-error-traceback";
  pre.textContent = traceback.join("") + (traceback.length > 0 ? "" : "") + ename + ": " + evalue;

  container.appendChild(pre);
  return container;
}

export function renderOutput(
  outputItems: OutputItem[],
  maxWidth: number
): HTMLElement {
  const container = document.createElement("div");
  container.className = "jupyter-output";

  for (const item of outputItems) {
    switch (item.type) {
      case "text":
        container.appendChild(renderText(item.data));
        break;
      case "stderr":
        container.appendChild(renderStderr(item.data));
        break;
      case "image":
        container.appendChild(
          renderImage(item.data, item.format || "png", maxWidth)
        );
        break;
      case "html":
        container.appendChild(renderHtml(item.data));
        break;
      case "error":
        container.appendChild(
          renderError(
            item.ename || "Error",
            item.evalue || "",
            item.traceback || []
          )
        );
        break;
    }
  }

  return container;
}

export function renderAnsi(text: string): HTMLElement {
  const el = document.createElement("pre");
  el.className = "jupyter-output-ansi";

  const ansiColors: Record<string, string> = {
    "30": "black",
    "31": "red",
    "32": "green",
    "33": "yellow",
    "34": "blue",
    "35": "magenta",
    "36": "cyan",
    "37": "white",
    "40": "black",
    "41": "red",
    "42": "green",
    "43": "yellow",
    "44": "blue",
    "45": "magenta",
    "46": "cyan",
    "47": "white",
  };

  let html = "";
  const parts = text.split(/\x1b\[/);

  for (let i = 0; i < parts.length; i++) {
    if (i === 0) {
      html += escapeHtml(parts[i]);
      continue;
    }

    const match = parts[i].match(/^(\d+(?:;\d+)*)m(.*)$/s);
    if (match) {
      const codes = match[1].split(";");
      const content = match[2];
      let style = "";
      let spanClass = "";

      for (const code of codes) {
        if (code === "0") {
          style = "";
          spanClass = "";
        } else if (code === "1") {
          style += "font-weight:bold;";
        } else if (ansiColors[code]) {
          if (parseInt(code) >= 40) {
            style += `background-color:${ansiColors[code]};`;
          } else {
            style += `color:${ansiColors[code]};`;
          }
        }
      }

      if (style) {
        html += `<span style="${style}">${escapeHtml(content)}</span>`;
      } else {
        html += escapeHtml(content);
      }
    } else {
      html += escapeHtml(parts[i]);
    }
  }

  el.innerHTML = html;
  return el;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
