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
const generator_1 = require("./generator");
const github_1 = require("./github");
function openPanel(ctx) {
    const panel = vscode.window.createWebviewPanel('treeforge', 'TreeForge AI', vscode.ViewColumn.One, { enableScripts: true });
    panel.webview.html = `<!DOCTYPE html><html><body>
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
    panel.webview.onDidReceiveMessage(async (m) => {
        if (m.cmd === 'preview')
            panel.webview.postMessage({ text: await (0, generator_1.previewStructure)(m.goal) });
        if (m.cmd === 'generate')
            await (0, generator_1.buildProject)(m.goal);
        if (m.cmd === 'git')
            await (0, github_1.exportGitHub)();
        if (m.cmd === 'modify')
            await (0, generator_1.modifyProject)(m.text);
    });
}
