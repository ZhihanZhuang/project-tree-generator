import * as vscode from "vscode";

export type TreeNode =
  | {
      kind: "dir";
      name: string;
      uri: vscode.Uri;
      children: TreeNode[];
    }
  | {
      kind: "file";
      name: string;
      uri: vscode.Uri;
    };

export type ParseOptions = {
  maxDepth: number;
  maxEntries: number;
  ignore: (name: string, uri: vscode.Uri, kind: vscode.FileType) => boolean;
};

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

export function defaultIgnore(name: string, _uri: vscode.Uri, kind: vscode.FileType): boolean {
  if (name.startsWith(".DS_Store")) return true;
  if (kind === vscode.FileType.Directory && DEFAULT_IGNORED_DIRS.has(name)) return true;
  return false;
}

export async function parseDirectoryTree(
  rootDir: vscode.Uri,
  opts?: Partial<ParseOptions>
): Promise<{ root: TreeNode; truncated: boolean }> {
  const options: ParseOptions = {
    maxDepth: opts?.maxDepth ?? 8,
    maxEntries: opts?.maxEntries ?? 5000,
    ignore: opts?.ignore ?? defaultIgnore,
  };

  let entryCount = 0;
  let truncated = false;

  async function walk(dir: vscode.Uri, depth: number): Promise<TreeNode> {
    const name = basename(dir);
    if (depth > options.maxDepth) {
      return { kind: "dir", name, uri: dir, children: [] };
    }

    let children: TreeNode[] = [];
    const entries = await vscode.workspace.fs.readDirectory(dir);

    const sorted = entries
      .filter(([childName, kind]) => !options.ignore(childName, vscode.Uri.joinPath(dir, childName), kind))
      .sort(([aName, aKind], [bName, bKind]) => {
        if (aKind !== bKind) return aKind === vscode.FileType.Directory ? -1 : 1;
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
      } else {
        children.push({ kind: "file", name: childName, uri: childUri });
      }
    }

    return { kind: "dir", name, uri: dir, children };
  }

  return { root: await walk(rootDir, 0), truncated };
}

function basename(uri: vscode.Uri): string {
  const parts = uri.path.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : uri.fsPath;
}

