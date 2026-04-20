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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const panel_1 = require("./webview/panel");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const promises_2 = require("node:fs/promises");
function activate(ctx) {
    const ch = getDebugChannel();
    // #region agent log
    safeHttpLog({ sessionId: "6db0f6", runId: "pre-fix", hypothesisId: "A", location: "src/extension.ts:8", message: "activate()", data: { extensionUri: ctx.extensionUri.toString() }, timestamp: Date.now() });
    safeFileLog(ctx, { sessionId: "6db0f6", runId: "pre-fix", hypothesisId: "A", location: "src/extension.ts:9", message: "activate()", data: { extensionUri: ctx.extensionUri.toString() }, timestamp: Date.now() });
    // #endregion
    ch.appendLine(`[TreeForge][activate] ${new Date().toISOString()} extensionUri=${ctx.extensionUri.toString()}`);
    void vscode.window.showInformationMessage("TreeForge Debug: activate() ran. Check Output → TreeForge Debug.");
    ctx.subscriptions.push(vscode.commands.registerCommand("treeforge.open", () => (0, panel_1.openPanel)(ctx)));
}
function deactivate() { }
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
