import { App, PluginSettingTab, Setting } from "obsidian";
import type JupyterPlugin from "../main";

export class JupyterSettingTab extends PluginSettingTab {
  plugin: JupyterPlugin;

  constructor(app: App, plugin: JupyterPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Obsidian Jupyter 设置" });

    new Setting(containerEl)
      .setName("Python 路径")
      .setDesc("Python 解释器的路径，默认为 'python'")
      .addText((text) =>
        text
          .setPlaceholder("python")
          .setValue(this.plugin.settings.pythonPath)
          .onChange(async (value) => {
            this.plugin.settings.pythonPath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("超时时间（秒）")
      .setDesc("代码执行的最大时间限制")
      .addText((text) =>
        text
          .setPlaceholder("30")
          .setValue(String(this.plugin.settings.timeout))
          .onChange(async (value) => {
            const num = parseInt(value);
            if (!isNaN(num) && num >= 1) {
              this.plugin.settings.timeout = num;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("最大输出字符数")
      .setDesc("输出内容的最大字符数，超出部分将被截断")
      .addText((text) =>
        text
          .setPlaceholder("50000")
          .setValue(String(this.plugin.settings.maxOutputChars))
          .onChange(async (value) => {
            const num = parseInt(value);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.maxOutputChars = num;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("图片最大宽度（px）")
      .setDesc("输出图片的最大宽度")
      .addText((text) =>
        text
          .setPlaceholder("600")
          .setValue(String(this.plugin.settings.maxImageWidth))
          .onChange(async (value) => {
            const num = parseInt(value);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.maxImageWidth = num;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("空闲内核超时（秒）")
      .setDesc("内核空闲超过此时间将自动关闭，0 表示不自动关闭")
      .addText((text) =>
        text
          .setPlaceholder("300")
          .setValue(String(this.plugin.settings.idleTimeout))
          .onChange(async (value) => {
            const num = parseInt(value);
            if (!isNaN(num) && num >= 0) {
              this.plugin.settings.idleTimeout = num;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("显示执行序号")
      .setDesc("在代码块左侧显示 In[n]/Out[n] 序号")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showExecutionCount)
          .onChange(async (value) => {
            this.plugin.settings.showExecutionCount = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
