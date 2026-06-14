import Anthropic from "@anthropic-ai/sdk";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { doc } from "./ddb.js";
import { TABLE } from "./keys.js";

// Tiered Claude wrapper: Haiku first, escalate to Sonnet/Opus on low confidence
// or hard labels. Uses prompt caching on the shared system block to cut cost.
// The API key lives in Secrets Manager — never in env/source.

const MODELS = {
  haiku: "claude-haiku-4-5",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-8",
} as const;
export type Tier = keyof typeof MODELS;

const sm = new SecretsManagerClient({});
let cachedKey: string | null = null;

async function apiKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  const id = process.env.ANTHROPIC_SECRET_ARN;
  if (!id) throw new Error("ANTHROPIC_SECRET_ARN not set");
  const out = await sm.send(new GetSecretValueCommand({ SecretId: id }));
  const raw = out.SecretString ?? "{}";
  // Secret may be a raw key or JSON {"apiKey":"..."}.
  cachedKey = raw.startsWith("{") ? JSON.parse(raw).apiKey : raw;
  return cachedKey!;
}

// Per-feature token usage logging. AI_FEATURE is set per Lambda (enrich, chat,
// quiz, moderate, prewarm); aggregated into a daily DynamoDB row so the admin
// cost page can attribute Anthropic spend to app features. Best-effort.
function family(model: string): string {
  return model.includes("opus") ? "opus" : model.includes("haiku") ? "haiku" : "sonnet";
}
async function logUsage(model: string, usage: any) {
  const feature = process.env.AI_FEATURE;
  if (!feature || !usage) return;
  const day = new Date().toISOString().slice(0, 10);
  const p = `${feature}#${family(model)}`;
  try {
    await doc.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: "AICOST", SK: day },
      UpdateExpression: "SET #t = :t ADD #in :in, #out :out, #cr :cr, #cw :cw, #n :one",
      ExpressionAttributeNames: { "#t": "type", "#in": `${p}_in`, "#out": `${p}_out`, "#cr": `${p}_cr`, "#cw": `${p}_cw`, "#n": `${p}_n` },
      ExpressionAttributeValues: {
        ":t": "AICost",
        ":in": usage.input_tokens || 0,
        ":out": usage.output_tokens || 0,
        ":cr": usage.cache_read_input_tokens || 0,
        ":cw": usage.cache_creation_input_tokens || 0,
        ":one": 1,
      },
    }));
  } catch { /* never block a Claude call on metering */ }
}

let client: Anthropic | null = null;
async function getClient(): Promise<Anthropic> {
  if (client) return client;
  client = new Anthropic({ apiKey: await apiKey() });
  return client;
}

export interface VisionInput {
  system: string;
  userText: string;
  imageBase64?: string;
  imageMediaType?: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  maxTokens?: number;
}

export interface TierResult {
  text: string;
  tier: Tier;
}

// Call a single tier. System block is marked cacheable for prompt caching.
async function callOnce(tier: Tier, input: VisionInput): Promise<string> {
  const anthropic = await getClient();
  const content: Anthropic.MessageParam["content"] = [];
  if (input.imageBase64) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: input.imageMediaType ?? "image/jpeg",
        data: input.imageBase64,
      },
    });
  }
  content.push({ type: "text", text: input.userText });

  const msg = await anthropic.messages.create({
    model: MODELS[tier],
    max_tokens: input.maxTokens ?? 1024,
    // cache_control marks the shared system block cacheable (prompt caching).
    // Cast: not yet in this SDK version's TextBlockParam type, but honored at runtime.
    system: [
      { type: "text", text: input.system, cache_control: { type: "ephemeral" } },
    ] as unknown as Anthropic.MessageCreateParams["system"],
    messages: [{ role: "user", content }],
  });
  void logUsage(MODELS[tier], (msg as { usage?: unknown }).usage);
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

// Tiered call: start at Haiku, escalate when the result fails the confidence
// check (caller-supplied). Returns the first acceptable result + the tier used.
export async function callTiered(
  input: VisionInput,
  accept: (text: string) => boolean,
  ladder: Tier[] = ["haiku", "sonnet", "opus"]
): Promise<TierResult> {
  let last = "";
  for (const tier of ladder) {
    last = await callOnce(tier, input);
    if (accept(last)) return { text: last, tier };
  }
  return { text: last, tier: ladder[ladder.length - 1] };
}

// Multi-turn chat completion (used by the tequila assistant). System block is
// cached; messages carry the conversation. Returns the assistant's text.
export async function chat(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
  tier: Tier = "sonnet",
  maxTokens = 600
): Promise<string> {
  const anthropic = await getClient();
  const msg = await anthropic.messages.create({
    model: MODELS[tier],
    max_tokens: maxTokens,
    system: [
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
    ] as unknown as Anthropic.MessageCreateParams["system"],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  void logUsage(MODELS[tier], (msg as { usage?: unknown }).usage);
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

// Parse a JSON object out of a model response (handles ```json fences).
export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
