type ChatMessage = { role: "user" | "system" | "assistant"; content: string };

async function ask(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  // #region agent log
  fetch('http://127.0.0.1:7614/ingest/2291adef-6eb0-4f64-bcfa-6f2e07c8d653',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6db0f6'},body:JSON.stringify({sessionId:'6db0f6',runId:'pre-fix',hypothesisId:'D',location:'src/ai.ts:6',message:'ask() called',data:{hasKey:Boolean(apiKey),promptLen:prompt.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in environment.");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt } satisfies ChatMessage],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // #region agent log
    fetch('http://127.0.0.1:7614/ingest/2291adef-6eb0-4f64-bcfa-6f2e07c8d653',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6db0f6'},body:JSON.stringify({sessionId:'6db0f6',runId:'pre-fix',hypothesisId:'D',location:'src/ai.ts:26',message:'OpenAI response not ok',data:{status:res.status,statusText:res.statusText,bodyLen:text.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}${text ? `\n${text}` : ""}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content ?? "";
}

export const getTree = (goal: string) => ask(`Return only project tree for: ${goal}`);
export const getCode = (file: string, goal: string) => ask(`Write starter code for ${file}. Goal: ${goal}. Only code.`);
export const getPatch = (req: string) => ask(`List files to add or modify for request: ${req}`);