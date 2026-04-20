"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.openPanel = openPanel;
const vscode = __importStar(require("vscode"));
const generator_1 = require("../generator");
const github_1 = require("../github");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const promises_2 = require("node:fs/promises");
function openPanel(ctx) {
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource} https:; style-src ${panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
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
        safeHttpLog({ sessionId: "6db0f6", runId: "pre-fix", hypothesisId: "C", location: "src/webview/panel.ts:52", message: "onDidReceiveMessage()", data: { cmd: m?.cmd, keys: m ? Object.keys(m) : null }, timestamp: Date.now() });
        safeFileLog(ctx, { sessionId: "6db0f6", runId: "pre-fix", hypothesisId: "C", location: "src/webview/panel.ts:53", message: "onDidReceiveMessage()", data: { cmd: m?.cmd, keys: m ? Object.keys(m) : null }, timestamp: Date.now() });
        // #endregion
        ch.appendLine(`[TreeForge][msg] ${new Date().toISOString()} cmd=${String(m?.cmd)}`);
        try {
            if (m?.cmd === "preview") {
                panel.webview.postMessage({ type: "status", text: "Generating preview…" });
                const text = await (0, generator_1.previewStructure)(String(m.goal ?? ""));
                panel.webview.postMessage({ type: "output", text });
                panel.webview.postMessage({ type: "status", text: "Ready." });
                return;
            }
            if (m?.cmd === "generate") {
                panel.webview.postMessage({ type: "status", text: "Generating files…" });
                await (0, generator_1.buildProject)(String(m.goal ?? ""));
                panel.webview.postMessage({ type: "status", text: "Done." });
                return;
            }
            if (m?.cmd === "git") {
                panel.webview.postMessage({ type: "status", text: "Exporting to git…" });
                await (0, github_1.exportGitHub)();
                panel.webview.postMessage({ type: "status", text: "Done." });
                return;
            }
            if (m?.cmd === "modify") {
                panel.webview.postMessage({ type: "status", text: "Generating patch plan…" });
                await (0, generator_1.modifyProject)(String(m.text ?? ""));
                panel.webview.postMessage({ type: "status", text: "Done." });
                return;
            }
        }
        catch (err) {
            panel.webview.postMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
        }
    });
    ctx.subscriptions.push(panel);
}
function safeHttpLog(payload) {
    try {
        const f = globalThis.fetch;
        if (!f)
            return;
        f("http://127.0.0.1:7614/ingest/2291adef-6eb0-4f64-bcfa-6f2e07c8d653", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "6db0f6" },
            body: JSON.stringify(payload),
        }).catch(() => { });
    }
    catch {
        // ignore
    }
}
function safeFileLog(ctx, payload) {
    try {
        void (async () => {
            const targets = new Set();
            targets.add(ctx.extensionPath);
            const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (ws)
                targets.add(ws);
            // Absolute fallback to ensure logs are readable from this repo during debugging.
            targets.add("c:\\Users\\arthu\\project-tree-generator");
            await Promise.all(Array.from(targets).map(async (base) => {
                const dir = (0, node_path_1.join)(base, ".cursor");
                const logPath = (0, node_path_1.join)(dir, "debug-6db0f6.log");
                await (0, promises_2.mkdir)(dir, { recursive: true });
                await (0, promises_1.appendFile)(logPath, JSON.stringify(payload) + "\n");
            }));
        })().catch(() => { });
    }
    catch {
        // ignore
    }
}
let _debugChannel;
function getDebugChannel() {
    if (!_debugChannel)
        _debugChannel = vscode.window.createOutputChannel("TreeForge Debug");
    return _debugChannel;
}
function randomNonce() {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
