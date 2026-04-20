import * as vscode from "vscode";
import { getCode, getPatch, getTree } from "./ai";

type ParsedEntry = { path: string; kind: "dir" | "file" };

function parseTreeText(treeText: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  const stack: string[] = [];

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

    if (!m) continue;

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
  const seen = new Set<string>();
  return entries.filter((e) => (seen.has(`${e.kind}:${e.path}`) ? false : (seen.add(`${e.kind}:${e.path}`), true)));
}

function ensureWorkspaceFolder(): vscode.Uri {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) throw new Error("Open a folder (workspace) first.");
  return folder.uri;
}

export async function previewStructure(goal: string): Promise<string> {
  if (!goal.trim()) return "Describe a project first.";
  return await getTree(goal);
}

export async function buildProject(goal: string): Promise<void> {
  const root = ensureWorkspaceFolder();
  if (!goal.trim()) throw new Error("Project goal is empty.");

  const tree = await getTree(goal);
  const entries = parseTreeText(tree).slice(0, 200);

  for (const entry of entries) {
    const uri = vscode.Uri.joinPath(root, ...entry.path.split("/"));
    if (entry.kind === "dir") {
      await vscode.workspace.fs.createDirectory(uri);
    } else {
      const code = await getCode(entry.path, goal);
      await vscode.workspace.fs.writeFile(uri, Buffer.from(code, "utf8"));
    }
  }

  void vscode.window.showInformationMessage("Project generated (best-effort).");
}

export async function modifyProject(request: string): Promise<void> {
  if (!request.trim()) return;
  const patchPlan = await getPatch(request);
  void vscode.window.showInformationMessage("Modify plan generated. See output in developer console.");
  // eslint-disable-next-line no-console
  console.log(patchPlan);
}

