export type CellStatus = "idle" | "running" | "done" | "error";

export interface KernelRequestMessage {
  type: "execute";
  id: string;
  code: string;
  timeout: number;
}

export interface KernelInterruptMessage {
  type: "interrupt";
  id: string;
}

export interface KernelShutdownMessage {
  type: "shutdown";
}

export type KernelRequest = KernelRequestMessage | KernelInterruptMessage | KernelShutdownMessage;

export interface KernelReadyMessage {
  type: "ready";
}

export interface KernelStartedMessage {
  type: "started";
  id: string;
}

export interface KernelStdoutMessage {
  type: "stdout";
  id: string;
  data: string;
}

export interface KernelStderrMessage {
  type: "stderr";
  id: string;
  data: string;
}

export interface KernelImageMessage {
  type: "image";
  id: string;
  data: string;
  format: string;
}

export interface KernelHtmlMessage {
  type: "html";
  id: string;
  data: string;
}

export interface KernelDoneMessage {
  type: "done";
  id: string;
  execution_count: number;
}

export interface KernelErrorMessage {
  type: "error";
  id: string;
  ename: string;
  evalue: string;
  traceback: string[];
}

export type KernelResponse =
  | KernelReadyMessage
  | KernelStartedMessage
  | KernelStdoutMessage
  | KernelStderrMessage
  | KernelImageMessage
  | KernelHtmlMessage
  | KernelDoneMessage
  | KernelErrorMessage;

export interface OutputItem {
  type: "text" | "stderr" | "image" | "html" | "error";
  data: string;
  format?: string;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

export interface CellOutputData {
  executionCount: number;
  outputs: OutputItem[];
}

export interface CellCache {
  [cellId: string]: CellOutputData;
}

export interface JupyterSettings {
  pythonPath: string;
  timeout: number;
  maxOutputChars: number;
  maxImageWidth: number;
  idleTimeout: number;
  showExecutionCount: boolean;
}

export const DEFAULT_SETTINGS: JupyterSettings = {
  pythonPath: "python",
  timeout: 30,
  maxOutputChars: 50000,
  maxImageWidth: 600,
  idleTimeout: 300,
  showExecutionCount: true,
};
