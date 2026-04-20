import * as vscode from "vscode";
import { execFile } from "node:child_process";

function execGit(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd }, (err, stdout, stderr) => {
      if (err) reject(Object.assign(err, { stdout, stderr }));
      else resolve({ stdout, stderr });
    });
  });
}

export async function exportGitHub(): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    throw new Error("Open a folder (workspace) before exporting to Git.");
  }

  const cwd = folder.uri.fsPath;
  // #region agent log
  fetch('http://127.0.0.1:7614/ingest/2291adef-6eb0-4f64-bcfa-6f2e07c8d653',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6db0f6'},body:JSON.stringify({sessionId:'6db0f6',runId:'pre-fix',hypothesisId:'E',location:'src/github.ts:21',message:'exportGitHub() start',data:{cwd},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  try {
    await execGit(["init"], cwd);
  } catch {
    // ignore if already initialized
  }

  await execGit(["add", "."], cwd);

  try {
    await execGit(["commit", "-m", "Initial commit"], cwd);
  } catch {
    // ignore if nothing to commit or user hasn't configured identity
  }

  void vscode.window.showInformationMessage("Export ready: initialized git repo and created commit (if possible).");
}

