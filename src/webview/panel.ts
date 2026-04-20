import * as vscode from "vscode";
import { previewStructure, buildProject, modifyProject } from "../generator";
import { exportGitHub } from "../github";
import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";

export function openPanel(ctx: vscode.ExtensionContext) {
  const ch = getDebugChannel();
  const panel = vscode.window.createWebviewPanel("treeforge", "TreeForge AI", vscode.ViewColumn.One, {
    enableScripts: true,
    retainContextWhenHidden: true,
  });

  const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(ctx.extensionUri, "media", "webview.js"));
  const nonce = randomNonce();

  // #region agent log
  safeHttpLog({ sessionId: "6db0f6", runId: "pre-fix", hypothesisId: "B", location: "src/webview/panel.ts:20", message: "openPanel() created webview", data: { scriptUri: String(scriptUri), cspSource: panel.webview.cspSource }, timestamp: Date.now() });
  safeFileLog(ctx, { sessionId: "6db0f6", runId: "pre-fix", hypothesisId: "B", location: "src/webview/panel.ts:21", message: "openPanel() created webview", data: { scriptUri: String(scriptUri), cspSource: panel.webview.cspSource }, timestamp: Date.now() });
  // #endregion
  ch.appendLine(`[TreeForge][openPanel] ${new Date().toISOString()} scriptUri=${String(scriptUri)}`);

  panel.webview.html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${
      panel.webview.cspSource
    } https:; style-src ${panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TreeForge AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;

  panel.webview.onDidReceiveMessage(async (m) => {
    // #region agent log
    safeHttpLog({ sessionId: "6db0f6", runId: "pre-fix", hypothesisId: "C", location: "src/webview/panel.ts:52", message: "onDidReceiveMessage()", data: { cmd: (m as any)?.cmd, keys: m ? Object.keys(m) : null }, timestamp: Date.now() });
    safeFileLog(ctx, { sessionId: "6db0f6", runId: "pre-fix", hypothesisId: "C", location: "src/webview/panel.ts:53", message: "onDidReceiveMessage()", data: { cmd: (m as any)?.cmd, keys: m ? Object.keys(m) : null }, timestamp: Date.now() });
    // #endregion
    ch.appendLine(`[TreeForge][msg] ${new Date().toISOString()} cmd=${String((m as any)?.cmd)}`);
    try {
      if (m?.cmd === "preview") {
        panel.webview.postMessage({ type: "status", text: "Generating preview…" });
        const text = await previewStructure(String(m.goal ?? ""));
        panel.webview.postMessage({ type: "output", text });
        panel.webview.postMessage({ type: "status", text: "Ready." });
        return;
      }

      if (m?.cmd === "generate") {
        panel.webview.postMessage({ type: "status", text: "Generating files…" });
        await buildProject(String(m.goal ?? ""));
        panel.webview.postMessage({ type: "status", text: "Done." });
        return;
      }

      if (m?.cmd === "git") {
        panel.webview.postMessage({ type: "status", text: "Exporting to git…" });
        await exportGitHub();
        panel.webview.postMessage({ type: "status", text: "Done." });
        return;
      }

      if (m?.cmd === "modify") {
        panel.webview.postMessage({ type: "status", text: "Generating patch plan…" });
        await modifyProject(String(m.text ?? ""));
        panel.webview.postMessage({ type: "status", text: "Done." });
        return;
      }
    } catch (err) {
      panel.webview.postMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
    }
  });

  ctx.subscriptions.push(panel);
}

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

function randomNonce(): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

