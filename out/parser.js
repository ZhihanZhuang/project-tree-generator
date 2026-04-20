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
exports.defaultIgnore = defaultIgnore;
exports.parseDirectoryTree = parseDirectoryTree;
const vscode = __importStar(require("vscode"));
const DEFAULT_IGNORED_DIRS = new Set([
    ".git",
    ".hg",
    ".svn",
    "node_modules",
    "dist",
    "out",
    "build",
    "coverage",
    ".next",
    ".turbo",
    ".vscode",
    ".idea",
]);
function defaultIgnore(name, _uri, kind) {
    if (name.startsWith(".DS_Store"))
        return true;
    if (kind === vscode.FileType.Directory && DEFAULT_IGNORED_DIRS.has(name))
        return true;
    return false;
}
async function parseDirectoryTree(rootDir, opts) {
    const options = {
        maxDepth: opts?.maxDepth ?? 8,
        maxEntries: opts?.maxEntries ?? 5000,
        ignore: opts?.ignore ?? defaultIgnore,
    };
    let entryCount = 0;
    let truncated = false;
    async function walk(dir, depth) {
        const name = basename(dir);
        if (depth > options.maxDepth) {
            return { kind: "dir", name, uri: dir, children: [] };
        }
        let children = [];
        const entries = await vscode.workspace.fs.readDirectory(dir);
        const sorted = entries
            .filter(([childName, kind]) => !options.ignore(childName, vscode.Uri.joinPath(dir, childName), kind))
            .sort(([aName, aKind], [bName, bKind]) => {
            if (aKind !== bKind)
                return aKind === vscode.FileType.Directory ? -1 : 1;
            return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: "base" });
        });
        for (const [childName, kind] of sorted) {
            if (entryCount >= options.maxEntries) {
                truncated = true;
                break;
            }
            entryCount++;
            const childUri = vscode.Uri.joinPath(dir, childName);
            if (kind === vscode.FileType.Directory) {
                children.push(await walk(childUri, depth + 1));
            }
            else {
                children.push({ kind: "file", name: childName, uri: childUri });
            }
        }
        return { kind: "dir", name, uri: dir, children };
    }
    return { root: await walk(rootDir, 0), truncated };
}
function basename(uri) {
    const parts = uri.path.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : uri.fsPath;
}
