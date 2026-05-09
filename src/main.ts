import { Plugin } from "obsidian";
import { JupyterSettings, DEFAULT_SETTINGS, CellCache, CellOutputData } from "./types";
import { JupyterSettingTab } from "./settings/Settings";
import { KernelManager } from "./kernel/KernelManager";
import { registerJupyterCodeBlockProcessor } from "./processors/JupyterCodeBlockProcessor";

export function makeCellId(filePath: string, source: string): string {
  let hash = 5381;
  for (let i = 0; i < source.length; i++) {
    hash = ((hash << 5) + hash) + source.charCodeAt(i);
    hash = hash & hash;
  }
  return filePath + "::" + hash.toString(36);
}

export default class JupyterPlugin extends Plugin {
  settings!: JupyterSettings;
  kernelManager!: KernelManager;
  cellCache: CellCache = {};

  async onload() {
    await this.loadSettings();
    await this.loadCellCache();

    const pluginDir = (this.app.vault.adapter as any).basePath
      ? `${(this.app.vault.adapter as any).basePath}/.obsidian/plugins/obsidian-jupyter`
      : "";

    this.kernelManager = new KernelManager(this.settings, pluginDir);

    this.addSettingTab(new JupyterSettingTab(this.app, this));

    registerJupyterCodeBlockProcessor(this);

    this.registerCommands();

    console.log("Obsidian Jupyter plugin loaded");
  }

  async onunload() {
    this.kernelManager.disposeAll();
    console.log("Obsidian Jupyter plugin unloaded");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async saveCellOutput(cellId: string, outputData: CellOutputData) {
    this.cellCache[cellId] = outputData;
    await this.saveData(this.cellCache);
  }

  async loadCellCache() {
    const data = await this.loadData();
    if (data && typeof data === "object" && !("pythonPath" in data)) {
      this.cellCache = data as CellCache;
    }
  }

  getCellOutput(cellId: string): CellOutputData | undefined {
    return this.cellCache[cellId];
  }

  clearCellCache(filePath: string) {
    const prefix = filePath + "::";
    for (const key of Object.keys(this.cellCache)) {
      if (key.startsWith(prefix)) {
        delete this.cellCache[key];
      }
    }
    this.saveData(this.cellCache);
  }

  private registerCommands() {
    this.addCommand({
      id: "run-jupyter-cell",
      name: "Run Jupyter Cell",
      hotkeys: [{ modifiers: ["Shift"], key: "Enter" }],
      editorCallback: (_editor, _view) => {
        // Handled via code block processor interaction
      },
    });

    this.addCommand({
      id: "run-all-jupyter-cells",
      name: "Run All Jupyter Cells",
      hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "Enter" }],
      callback: () => {
        // Handled via code block processor
      },
    });

    this.addCommand({
      id: "restart-kernel",
      name: "Restart Kernel",
      callback: () => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          this.kernelManager.restartKernel(file.path);
        }
      },
    });

    this.addCommand({
      id: "clear-all-outputs",
      name: "Clear All Outputs",
      callback: () => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          this.clearCellCache(file.path);
        }
      },
    });

    this.addCommand({
      id: "interrupt-kernel",
      name: "Interrupt Kernel",
      callback: () => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          this.kernelManager.interruptKernel(file.path);
        }
      },
    });
  }
}
