import * as vscode from 'vscode';
import { previewStructure, buildProject, modifyProject } from './generator';
import { exportGitHub } from './github';

export function openPanel(ctx:vscode.ExtensionContext){
 const panel=vscode.window.createWebviewPanel('treeforge','TreeForge AI',vscode.ViewColumn.One,{enableScripts:true});
 panel.webview.html=`<!DOCTYPE html><html><body>
 <h2>TreeForge AI</h2>
 <textarea id='goal' style='width:100%;height:120px' placeholder='Describe your project'></textarea>
 <br/><button onclick='preview()'>Preview</button>
 <button onclick='gen()'>Generate</button>
 <button onclick='git()'>Export GitHub</button>
 <pre id='out'></pre>
 <hr/>
 <input id='chat' placeholder='Add auth system...' style='width:80%'/><button onclick='chat()'>Modify</button>
 <script>
 const vscode=acquireVsCodeApi();
 function preview(){vscode.postMessage({cmd:'preview',goal:goal.value});}
 function gen(){vscode.postMessage({cmd:'generate',goal:goal.value});}
 function git(){vscode.postMessage({cmd:'git'});}
 function chat(){vscode.postMessage({cmd:'modify',text:chat.value});}
 window.addEventListener('message',e=>{out.textContent=e.data.text||'';});
 </script></body></html>`;
 panel.webview.onDidReceiveMessage(async m=>{
   if(m.cmd==='preview') panel.webview.postMessage({text:await previewStructure(m.goal)});
   if(m.cmd==='generate') await buildProject(m.goal);
   if(m.cmd==='git') await exportGitHub();
   if(m.cmd==='modify') await modifyProject(m.text);
 });
}