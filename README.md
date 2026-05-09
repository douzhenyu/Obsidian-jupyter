
<p align="center">
  <h1 align="center">🔬 Obsidian Jupyter</h1>
  <p align="center">
    <em>在 Obsidian 中体验 Jupyter Notebook 风格的 Python 编程</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="version">
    <img src="https://img.shields.io/badge/Obsidian-%3E%3D1.4.0-7C3AED" alt="obsidian">
    <img src="https://img.shields.io/badge/desktop-only-lightgrey" alt="desktop">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
  </p>
</p>

---

## ✨ 概述

**Obsidian Jupyter** 是一款将 Jupyter Notebook 交互式编程体验带入 Obsidian 的桌面端插件。它允许你在笔记中直接编写、运行 Python 代码块，并通过**持久化内核**在 cell 之间共享变量状态，实时查看文本、图表和表格等丰富输出。

> 无需离开 Obsidian — 你的笔记就是你的笔记本。

---

## 🎯 核心特性

| 特性 | 说明 |
|------|------|
| 🐍 **Python 代码执行** | 在 ` ```jupyter ` 代码块中编写 Python 代码，一键运行 |
| 🔄 **持久化内核** | 每个笔记文件拥有独立的 Python 进程，跨 cell 共享全局变量 |
| 📊 **Matplotlib 图表** | 自动捕获 matplotlib 绘制的图表，以图片形式直接展示 |
| 🗂️ **Pandas DataFrame** | 自动识别 DataFrame 对象，渲染为 HTML 表格 |
| 📝 **富文本输出** | 支持 stdout、stderr、图片、HTML 表格、错误回溯等多种输出 |
| 💾 **输出缓存** | 单元格输出自动保存，重新打开笔记时无需重新运行 |
| ⏱️ **超时保护** | 可配置的执行超时时间，防止代码死循环 |
| 🎨 **原生风格** | 完美适配 Obsidian 主题，支持亮色/暗色模式 |
| ⌨️ **快捷键** | `Shift+Enter` 运行当前 cell，`Ctrl+Shift+Enter` 运行全部 |
| 🌐 **中文本地化** | 设置面板完全中文化 |

---

## 🚀 快速开始

### 环境要求

- **Obsidian** ≥ 1.4.0（桌面版）
- **Python** ≥ 3.7 并已添加到系统 PATH

### 安装步骤

1. **下载插件** — 将本仓库克隆或下载到你的 Obsidian 插件目录：

   ```
   {vault}/.obsidian/plugins/obsidian-jupyter/
   ```

2. **安装依赖**：

   ```bash
   npm install
   ```

3. **构建插件**：

   ```bash
   npm run build
   ```

4. **启用插件** — 在 Obsidian 设置 → 第三方插件中，找到 "Obsidian Jupyter" 并启用。

5. **配置 Python 路径**（可选）— 如果 `python` 命令不在系统 PATH 中，请在插件设置中指定完整路径。

---

## 📖 使用指南

### 基本用法

在任意笔记中创建一个 `jupyter` 代码块，点击 **Run** 按钮或按 `Shift+Enter` 运行：

````markdown
```jupyter
print("Hello, Obsidian!")
x = 42
y = x * 2
print(f"x = {x}, y = {y}")
```
````

### 变量跨 cell 共享

同一个笔记文件中的所有 cell 共享一个 Python 内核，变量不会丢失：

````markdown
```jupyter
import numpy as np
data = np.random.randn(1000)
```
````

````markdown
```jupyter
print(f"均值: {data.mean():.4f}")
print(f"标准差: {data.std():.4f}")
```
````

### Matplotlib 绘图

图表会自动捕获并展示：

````markdown
```jupyter
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2 * np.pi, 100)
plt.plot(x, np.sin(x), label="sin(x)")
plt.plot(x, np.cos(x), label="cos(x)")
plt.legend()
plt.title("三角函数")
plt.show()
```
````

### Pandas 数据分析

DataFrame 对象会自动渲染为表格：

````markdown
```jupyter
import pandas as pd

df = pd.DataFrame({
    "名称": ["张三", "李四", "王五"],
    "分数": [95, 87, 92],
    "等级": ["A", "B", "A"]
})
df
```
````

---

## ⚙️ 插件设置

| 设置项 | 默认值 | 描述 |
|--------|--------|------|
| Python 路径 | `python` | Python 解释器的路径 |
| 超时时间 | `30` 秒 | 单次代码执行的最大时间限制 |
| 最大输出字符数 | `50000` | 输出内容超出部分将被截断 |
| 图片最大宽度 | `600` px | 输出图片的最大宽度 |
| 空闲内核超时 | `300` 秒 | 空闲超时后自动关闭内核（0 = 不关闭） |
| 显示执行序号 | ✅ 开启 | 在代码块左侧显示 In[n] / Out[n] |

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────┐
│                    Obsidian 笔记                      │
│  ┌───────────────────────────────────────────────┐  │
│  │           ```jupyter code block```            │  │
│  └───────────────────┬───────────────────────────┘  │
│                      │ 拦截渲染                        │
│                      ▼                                │
│  ┌──────────────────────────────────────────────┐  │
│  │      JupyterCodeBlockProcessor               │  │
│  │   • 渲染 Run 按钮 + In[n] 提示               │  │
│  │   • 管理 cell 缓存与生命周期                  │  │
│  └───────────────────┬──────────────────────────┘  │
│                      │ execute()                      │
│                      ▼                                │
│  ┌──────────────────────────────────────────────┐  │
│  │           KernelManager                       │  │
│  │   • Map<filePath, PythonKernel>              │  │
│  │   • 每个笔记文件一个独立内核                  │  │
│  └───────────────────┬──────────────────────────┘  │
│                      │ JSON 行协议                    │
│                      ▼                                │
│  ┌──────────────────────────────────────────────┐  │
│  │           PythonKernel                        │  │
│  │   • spawn("python", [kernel_script.py])      │  │
│  │   • stdin 写入, stdout 读取                  │  │
│  │   • 超时保护 + 空闲超时                      │  │
│  └───────────────────┬──────────────────────────┘  │
│                      │                                │
│                      ▼                                │
│  ┌──────────────────────────────────────────────┐  │
│  │         kernel_script.py (Python 端)          │  │
│  │   • exec(code, globals_dict) 持久化状态      │  │
│  │   • 捕获 matplotlib → base64 PNG             │  │
│  │   • 检测 pandas DataFrame → HTML 表格        │  │
│  │   • 错误捕获 → traceback 回溯                │  │
│  └───────────────────┬──────────────────────────┘  │
│                      │                                │
│                      ▼                                │
│  ┌──────────────────────────────────────────────┐  │
│  │            OutputRenderer                     │  │
│  │   text │ stderr │ image │ html │ error       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 通信协议

TypeScript 前端与 Python 后端通过 **JSON 行协议**（JSON Lines）进行通信：

**请求方向** (TypeScript → Python, stdin)：

```json
{"type": "execute", "id": "cell-xxx", "code": "print(1+1)"}
{"type": "interrupt", "id": "cell-xxx"}
{"type": "shutdown"}
```

**响应方向** (Python → TypeScript, stdout)：

```json
{"type": "ready"}
{"type": "started", "id": "cell-xxx"}
{"type": "stdout", "id": "cell-xxx", "data": "Hello World\n"}
{"type": "image", "id": "cell-xxx", "data": "iVBORw0KG...", "format": "png"}
{"type": "html", "id": "cell-xxx", "data": "<table>...</table>"}
{"type": "error", "id": "cell-xxx", "ename": "NameError", "evalue": "...", "traceback": [...]}
{"type": "done", "id": "cell-xxx", "execution_count": 3}
```

---

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 开发模式（自动 watch）
npm run dev

# 生产构建
npm run build
```

### 项目结构

```
obsidian-jupyter/
├── src/
│   ├── main.ts                          # 插件入口
│   ├── types.ts                         # 类型定义
│   ├── kernel/
│   │   ├── KernelManager.ts             # 内核生命周期管理
│   │   ├── PythonKernel.ts              # Python 子进程包装器
│   │   └── kernel_script.py             # Python 内核脚本
│   ├── processors/
│   │   └── JupyterCodeBlockProcessor.ts # 代码块拦截与渲染
│   ├── renderer/
│   │   └── OutputRenderer.ts            # 多类型输出渲染
│   └── settings/
│       └── Settings.ts                  # 设置面板
├── styles.css                           # 单元格样式
├── manifest.json                        # Obsidian 插件清单
├── esbuild.config.mjs                   # esbuild 构建配置
└── package.json
```

---

## 🎨 主题适配

插件使用 Obsidian CSS 变量（如 `--background-primary`、`--text-normal`、`--interactive-accent` 等），自动适配所有主题的亮色/暗色模式，无需额外配置。

单元格设计灵感来源于 Jupyter Notebook 经典样式：灰色标题栏、圆角边框、执行序号提示，与 Obsidian 原生界面自然融合。

---

## 📄 License

MIT © Your Name
