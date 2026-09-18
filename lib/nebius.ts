import {
  MODELS,
  TOKEN_FACTORY_BASE_URL,
  hasTokenFactoryKey,
} from "./config";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

/**
 * Minimal OpenAI-compatible chat completion client for Nebius Token Factory.
 * Uses fetch directly (no SDK) so the Serverless image stays tiny.
 * Throws on non-2xx so callers can fall back to deterministic demo mode.
 */
export async function tokenFactoryChat(
  model: string,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<{ text: string; usage: TokenUsage; model: string; latencyMs: number }> {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) throw new Error("NEBIUS_API_KEY not configured");

  const started = Date.now();
  const res = await fetch(`${TOKEN_FACTORY_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens ?? 800,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Token Factory ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  return {
    text,
    usage: {
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
      totalTokens: json.usage?.total_tokens ?? 0,
    },
    model,
    latencyMs: Date.now() - started,
  };
}

/** Convenience wrappers pinning the NVIDIA models for judging transparency. */
export const cosmosScenePass = (scene: string, profile: string) =>
  tokenFactoryChat(MODELS.vlm, [
    {
      role: "system",
      content:
        "You are a physical-AI scene reasoner running on NVIDIA Nemotron. Given a textual description of a work-site camera frame, list concrete hazards as short JSON array items with {label, severity: low|medium|high, where}. Be specific and grounded. No chatter.",
    },
    { role: "user", content: `Site profile: ${profile}\nFrame: ${scene}` },
  ]);

export const nemotronTriage = (hazardsJson: string) =>
  tokenFactoryChat(
    MODELS.fast,
    [
      {
        role: "system",
        content:
          "You are Nemotron-Nano, a fast safety triage model. Rank hazards by severity, drop duplicates, keep max 6, output JSON array only.",
      },
      { role: "user", content: hazardsJson },
    ],
    { maxTokens: 500 },
  );

export const nemotronReport = (args: {
  profile: string;
  hazardsJson: string;
  regulationNotes: string;
}) =>
  tokenFactoryChat(
    MODELS.reasoner,
    [
      {
        role: "system",
        content:
          "You are Nemotron-Ultra, a careful safety engineer. Write a 60-second site safety report: summary, top 3 fixes ordered by risk, each with one regulation-grounded sentence. Plain language for a non-technical manager. Under 220 words.",
      },
      {
        role: "user",
        content: `Profile: ${args.profile}\nHazards: ${args.hazardsJson}\nRegulations: ${args.regulationNotes}`,
      },
    ],
    { maxTokens: 900 },
  );

export const inferenceMode = () => (hasTokenFactoryKey() ? "live" : "demo");
