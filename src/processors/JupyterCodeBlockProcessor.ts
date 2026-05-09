import { MarkdownRenderChild } from "obsidian";
import JupyterPlugin, { makeCellId } from "../main";
import { renderOutput } from "../renderer/OutputRenderer";
import { OutputItem } from "../types";

export function registerJupyterCodeBlockProcessor(plugin: JupyterPlugin): void {
  plugin.registerMarkdownCodeBlockProcessor(
    "jupyter",
    (source, el, ctx) => {
      const filePath = ctx.sourcePath;
      const cellId = makeCellId(filePath, source);

      const child = new JupyterCellRenderChild(
        el,
        source,
        filePath,
        cellId,
        plugin
      );
      ctx.addChild(child);
    }
  );
}

class JupyterCellRenderChild extends MarkdownRenderChild {
  private source: string;
  private filePath: string;
  private cellId: string;
  private plugin: JupyterPlugin;
  private outputContainer: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private isRunning = false;

  constructor(
    containerEl: HTMLElement,
    source: string,
    filePath: string,
    cellId: string,
    plugin: JupyterPlugin
  ) {
    super(containerEl);
    this.source = source;
    this.filePath = filePath;
    this.cellId = cellId;
    this.plugin = plugin;
  }

  onload() {
    this.renderCell();
  }

  private renderCell() {
    const container = this.containerEl;
    container.empty();
    container.addClass("jupyter-cell");

    const executionCount = this.getExecutionCount();

    const header = container.createDiv("jupyter-cell-header");

    const promptEl = header.createSpan("jupyter-prompt");
    if (this.plugin.settings.showExecutionCount) {
      promptEl.setText(executionCount > 0 ? `In [${executionCount}]` : "In [ ]");
    }

    const runBtn = header.createEl("button", {
      cls: "jupyter-run-btn",
      text: "▶ Run",
    });
    runBtn.addEventListener("click", () => this.runCell(runBtn, promptEl));

    const codeEl = container.createEl("pre", {
      cls: "jupyter-code",
      text: this.source,
    });

    this.outputContainer = container.createDiv("jupyter-output");

    this.statusEl = container.createDiv("jupyter-output-empty");
    this.statusEl.setText("");

    const cached = this.plugin.getCellOutput(this.cellId);
    if (cached) {
      this.displayOutput(cached.outputs);
      if (this.plugin.settings.showExecutionCount) {
        promptEl.setText(`In [${cached.executionCount}]`);
      }
    }
  }

  private async runCell(btn: HTMLButtonElement, promptEl: HTMLElement) {
    if (this.isRunning) return;

    this.isRunning = true;
    btn.disabled = true;
    btn.empty();

    const spinner = btn.createSpan("jupyter-run-btn-spinner");
    btn.appendText(" Running");

    if (this.outputContainer) {
      this.outputContainer.empty();
    }
    if (this.statusEl) {
      this.statusEl.empty();
    }

    try {
      const kernel = this.plugin.kernelManager.getKernel(this.filePath);
      const outputs: OutputItem[] = await kernel.execute(
        this.source,
        `cell-${this.cellId}`
      );

      this.displayOutput(outputs);

      const errorOutput = outputs.find((o) => o.type === "error");
      const executionCount = this.getExecutionCount() + 1;

      this.plugin.saveCellOutput(this.cellId, {
        executionCount,
        outputs,
      });

      if (this.plugin.settings.showExecutionCount) {
        promptEl.setText(`In [${executionCount}]`);
      }
    } catch (err) {
      if (this.outputContainer) {
        this.outputContainer.empty();
        const errorEl = this.outputContainer.createDiv("jupyter-error");
        const errorPre = errorEl.createEl("pre", {
          cls: "jupyter-error-traceback",
          text: `运行失败: ${err}`,
        });
      }
    } finally {
      this.isRunning = false;
      btn.disabled = false;
      btn.empty();
      btn.setText("▶ Run");
    }
  }

  private displayOutput(outputs: OutputItem[]) {
    if (!this.outputContainer) return;

    this.outputContainer.empty();

    if (outputs.length === 0) {
      this.outputContainer.createDiv({
        cls: "jupyter-output-empty",
        text: "执行完成，无输出",
      });
      return;
    }

    const rendered = renderOutput(outputs, this.plugin.settings.maxImageWidth);
    while (rendered.firstChild) {
      this.outputContainer.appendChild(rendered.firstChild);
    }

    const executionCount = this.getExecutionCount();
    if (this.plugin.settings.showExecutionCount) {
      const outPrompt = this.outputContainer.createDiv("jupyter-prompt");
      outPrompt.setText(`Out[${executionCount}]`);
      outPrompt.style.padding = "4px 12px 0 12px";
    }
  }

  private getExecutionCount(): number {
    const cached = this.plugin.getCellOutput(this.cellId);
    return cached?.executionCount ?? 0;
  }
}
