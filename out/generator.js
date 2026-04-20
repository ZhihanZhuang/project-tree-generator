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
exports.previewStructure = previewStructure;
exports.buildProject = buildProject;
exports.modifyProject = modifyProject;
const vscode = __importStar(require("vscode"));
const ai_1 = require("./ai");
function parseTreeText(treeText) {
    const entries = [];
    const stack = [];
    const lines = treeText
        .split(/\r?\n/)
        .map((l) => l.trimEnd())
        .filter((l) => l.trim().length > 0);
    for (const line of lines) {
        // Accept formats like:
        // root/
        // ├── core/
        // │   └── main.py
        const m = line.match(/^(\s*)(?:[│ ]{0,4})*(├──|└──)\s(.+)$/);
        const rootLike = !line.includes("──") && !line.includes("├") && !line.includes("└");
        if (rootLike) {
            const name = line.replace(/\/$/, "");
            stack.length = 0;
            stack.push(name);
            entries.push({ path: name, kind: "dir" });
            continue;
        }
        if (!m)
            continue;
        const indent = m[1].length;
        const nameRaw = m[3].trim();
        const isDir = nameRaw.endsWith("/");
        const name = nameRaw.replace(/\/$/, "");
        const depth = Math.floor(indent / 4) + 1; // best-effort for "    " indents
        stack.length = Math.min(stack.length, depth);
        stack[depth] = name;
        const rel = stack.slice(0, depth + 1).join("/");
        entries.push({ path: rel, kind: isDir ? "dir" : "file" });
    }
    // de-dup
    const seen = new Set();
    return entries.filter((e) => (seen.has(`${e.kind}:${e.path}`) ? false : (seen.add(`${e.kind}:${e.path}`), true)));
}
function ensureWorkspaceFolder() {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder)
        throw new Error("Open a folder (workspace) first.");
    return folder.uri;
}
async function previewStructure(goal) {
    if (!goal.trim())
        return "Describe a project first.";
    return await (0, ai_1.getTree)(goal);
}
async function buildProject(goal) {
    const root = ensureWorkspaceFolder();
    if (!goal.trim())
        throw new Error("Project goal is empty.");
    const tree = await (0, ai_1.getTree)(goal);
    const entries = parseTreeText(tree).slice(0, 200);
    for (const entry of entries) {
        const uri = vscode.Uri.joinPath(root, ...entry.path.split("/"));
        if (entry.kind === "dir") {
            await vscode.workspace.fs.createDirectory(uri);
        }
        else {
            const code = await (0, ai_1.getCode)(entry.path, goal);
            await vscode.workspace.fs.writeFile(uri, Buffer.from(code, "utf8"));
        }
    }
    void vscode.window.showInformationMessage("Project generated (best-effort).");
}
async function modifyProject(request) {
    if (!request.trim())
        return;
    const patchPlan = await (0, ai_1.getPatch)(request);
    void vscode.window.showInformationMessage("Modify plan generated. See output in developer console.");
    // eslint-disable-next-line no-console
    console.log(patchPlan);
}
