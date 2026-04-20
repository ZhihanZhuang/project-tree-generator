import React, { useMemo, useState } from "react";

type VsCodeApi = { postMessage: (msg: unknown) => void };

declare function acquireVsCodeApi(): VsCodeApi;

export type AppProps = { title?: string };

type Outgoing =
  | { cmd: "preview"; goal: string }
  | { cmd: "generate"; goal: string }
  | { cmd: "git" }
  | { cmd: "modify"; text: string };

type Incoming =
  | { type: "output"; text: string }
  | { type: "status"; text: string }
  | { type: "error"; text: string };

export function App({ title }: AppProps) {
  const vscode = useMemo(() => acquireVsCodeApi(), []);
  const [goal, setGoal] = useState("");
  const [chat, setChat] = useState("");
  const [out, setOut] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  React.useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7614/ingest/2291adef-6eb0-4f64-bcfa-6f2e07c8d653',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6db0f6'},body:JSON.stringify({sessionId:'6db0f6',runId:'pre-fix',hypothesisId:'B',location:'src/webview/App.tsx:32',message:'App mounted',data:{ua:navigator.userAgent},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const onMessage = (e: MessageEvent) => {
      const msg = e.data as Incoming;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "output") setOut(msg.text ?? "");
      if (msg.type === "status") setStatus(msg.text ?? "");
      if (msg.type === "error") {
        setStatus(null);
        setOut(msg.text ?? "");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const send = (m: Outgoing) => {
    // #region agent log
    fetch('http://127.0.0.1:7614/ingest/2291adef-6eb0-4f64-bcfa-6f2e07c8d653',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6db0f6'},body:JSON.stringify({sessionId:'6db0f6',runId:'pre-fix',hypothesisId:'C',location:'src/webview/App.tsx:55',message:'UI postMessage',data:{cmd:(m as any).cmd},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    vscode.postMessage(m);
  };

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", padding: 12 }}>
      <h2 style={{ margin: "0 0 12px 0" }}>{title ?? "TreeForge AI"}</h2>

      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Project Goal</label>
      <textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        style={{ width: "100%", height: 120 }}
        placeholder="Describe your project…"
      />

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={() => send({ cmd: "preview", goal })}>Preview</button>
        <button onClick={() => send({ cmd: "generate", goal })}>Generate</button>
        <button onClick={() => send({ cmd: "git" })}>Export GitHub</button>
      </div>

      {status ? <div style={{ marginTop: 10, opacity: 0.8 }}>{status}</div> : null}

      <pre
        style={{
          marginTop: 10,
          padding: 10,
          background: "rgba(127,127,127,0.10)",
          borderRadius: 6,
          overflow: "auto",
          maxHeight: 340,
        }}
      >
        {out}
      </pre>

      <hr style={{ margin: "14px 0" }} />

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={chat}
          onChange={(e) => setChat(e.target.value)}
          placeholder="Add login system…"
          style={{ flex: 1 }}
        />
        <button onClick={() => send({ cmd: "modify", text: chat })}>Modify</button>
      </div>
    </div>
  );
}

