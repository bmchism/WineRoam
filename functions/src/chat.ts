import { chat } from "./lib/anthropic.js";
import { getItem, putItem } from "./lib/ddb.js";

// Cache single-turn (history-free) answers keyed by the normalized question, so
// repeated FAQs ("what's a cristalino?") never re-hit Claude.
function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ").replace(/[?.!]+$/, "");
}
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}
const cacheKey = (msg: string) => ({ PK: `CHAT#${hash(normalize(msg))}`, SK: "#R" });

// askChat resolver: the floating wine assistant. Stays on-topic (wine /
// wines / tasting), concise, friendly. History is passed as a JSON
// string of prior turns to keep the GraphQL schema simple.

const SYSTEM = `You are Wine Roam's in-app wine guide — warm, knowledgeable, and concise.
Answer questions about wine and wines: how it's made, brands, NOMs, expressions
(blanco, reposado, añejo, extra añejo, cristalino, high-proof), additive-free vs additives,
regions, tasting, cocktails, food pairings, and hosting tastings.
Rules:
- Keep replies under ~120 words unless asked for more. Be specific and practical.
- If a question is clearly unrelated to wine/wines or drinking culture, politely
  decline in one short sentence and offer to help with wine instead.
- Never give medical advice or encourage overconsumption; promote responsible drinking if relevant.
- If unsure of a precise fact (e.g., an exact NOM), say so rather than inventing it.`;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface AppSyncEvent {
  arguments: { message: string; history?: string };
}

export const handler = async (event: AppSyncEvent): Promise<string> => {
  const message = (event.arguments.message ?? "").slice(0, 2000).trim();
  if (!message) return "Ask me anything about wine — how it's made, a brand, an expression, a cocktail…";

  let history: ChatTurn[] = [];
  try {
    const parsed = JSON.parse(event.arguments.history ?? "[]");
    if (Array.isArray(parsed)) {
      history = parsed
        .filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
        .slice(-8) // cap context to the last few turns
        .map((t) => ({ role: t.role, content: String(t.content).slice(0, 2000) }));
    }
  } catch {
    /* ignore malformed history */
  }

  // Serve from cache for fresh (history-free) questions.
  const cacheable = history.length === 0;
  if (cacheable) {
    const hit = await getItem<{ reply: string }>(cacheKey(message));
    if (hit?.reply) return hit.reply;
  }

  const messages: ChatTurn[] = [...history, { role: "user", content: message }];
  try {
    const reply = await chat(SYSTEM, messages, "haiku", 600);
    const out = reply || "Sorry — I didn't catch that. Try asking another way.";
    if (cacheable && reply) {
      await putItem({ ...cacheKey(message), reply: out, type: "ChatCache", createdAt: new Date().toISOString() });
    }
    return out;
  } catch {
    return "I'm having trouble reaching my notes right now. Try again in a moment.";
  }
};
