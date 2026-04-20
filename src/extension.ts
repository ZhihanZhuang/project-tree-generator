import * as vscode from "vscode";
import { openPanel } from "./webview/panel";
import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";

export function activate(ctx: vscode.ExtensionContext) {
  const ch = getDebugChannel();
  // #region agent log
  safeHttpLog({ sessionId: "6db0f6", runId: "pre-fix", hypothesisId: "A", location: "src/extension.ts:8", message: "activate()", data: { extensionUri: ctx.extensionUri.toString() }, timestamp: Date.now() });
  safeFileLog(ctx, { sessionId: "6db0f6", runId: "pre-fix", hypothesisId: "A", location: "src/extension.ts:9", message: "activate()", data: { extensionUri: ctx.extensionUri.toString() }, timestamp: Date.now() });
  // #endregion

  ch.appendLine(`[TreeForge][activate] ${new Date().toISOString()} extensionUri=${ctx.extensionUri.toString()}`);
  void vscode.window.showInformationMessage("TreeForge Debug: activate() ran. Check Output → TreeForge Debug.");

  ctx.subscriptions.push(vscode.commands.registerCommand("treeforge.open", () => openPanel(ctx)));
}

export function deactivate() {}

type LogPayload = {
  sessionId: "6db0f6";
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
};

function safeHttpLog(payload: LogPayload) {
  try {
    const f = (globalThis as any).fetch as undefined | ((...args: any[]) => Promise<any>);
    if (!f) return;
    f("http://127.0.0.1:7614/ingest/2291adef-6eb0-4f64-bcfa-6f2e07c8d653", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "6db0f6" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // ignore
  }
}

function safeFileLog(ctx: vscode.ExtensionContext, payload: LogPayload) {
  try {
    void (async () => {
      const targets = new Set<string>();
      targets.add(ctx.extensionPath);
      const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (ws) targets.add(ws);
      // Absolute fallback to ensure logs are readable from this repo during debugging.
      targets.add("c:\\Users\\arthu\\project-tree-generator");

      await Promise.all(
        Array.from(targets).map(async (base) => {
          const dir = join(base, ".cursor");
          const logPath = join(dir, "debug-6db0f6.log");
          await mkdir(dir, { recursive: true });
          await appendFile(logPath, JSON.stringify(payload) + "\n");
        })
      );
    })().catch(() => {});
  } catch {
    // ignore
  }
}

let _debugChannel: vscode.OutputChannel | undefined;
function getDebugChannel(): vscode.OutputChannel {
  if (!_debugChannel) _debugChannel = vscode.window.createOutputChannel("TreeForge Debug");
  return _debugChannel;
}