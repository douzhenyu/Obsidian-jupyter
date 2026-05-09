import { JupyterSettings } from "../types";
import { PythonKernel } from "./PythonKernel";
import { join } from "path";

export class KernelManager {
  private kernels = new Map<string, PythonKernel>();
  private settings: JupyterSettings;
  private scriptPath: string;

  constructor(settings: JupyterSettings, pluginDir: string) {
    this.settings = settings;
    this.scriptPath = join(pluginDir, "kernel_script.py");
  }

  getKernel(filePath: string): PythonKernel {
    let kernel = this.kernels.get(filePath);
    if (!kernel) {
      kernel = new PythonKernel(this.settings, this.scriptPath);
      this.kernels.set(filePath, kernel);
    }
    return kernel;
  }

  async restartKernel(filePath: string): Promise<void> {
    const kernel = this.kernels.get(filePath);
    if (kernel) {
      await kernel.restart();
    }
  }

  async interruptKernel(filePath: string): Promise<void> {
    const kernel = this.kernels.get(filePath);
    if (kernel) {
      await kernel.interrupt();
    }
  }

  updateSettings(settings: JupyterSettings): void {
    this.settings = settings;
  }

  disposeAll(): void {
    for (const [, kernel] of this.kernels) {
      kernel.shutdown();
    }
    this.kernels.clear();
  }
}
