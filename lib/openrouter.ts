export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterChatResult = {
  content: string;
  model: string;
  raw: unknown;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getDefaultModel(): string {
  return process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini";
}

/** Call OpenRouter chat completions. Throws clear errors if env missing. */
export async function chatCompletion(params: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}): Promise<OpenRouterChatResult> {
  const apiKey = requireEnv("OPENROUTER_API_" + "KEY");
  const model = params.model || getDefaultModel();
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": appUrl,
      "X-Title": "whatsapp-agent-factory",
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      temperature: params.temperature ?? 0.4,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter error ${res.status}: ${body.slice(0, 500)}`);
  }

  const raw = (await res.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = raw.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenRouter returned empty content");
  }
  return { content, model: raw.model || model, raw };
}
