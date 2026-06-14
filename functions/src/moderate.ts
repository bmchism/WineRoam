import type { Review } from "@agave/shared";
import { chat, extractJson } from "./lib/anthropic.js";
import { getItem } from "./lib/ddb.js";
import { keys } from "./lib/keys.js";

// moderateReview resolver: Claude reviews a community review and recommends
// keep/flag for the human moderator. Read-only — it never changes state.

const SYSTEM = `You moderate community reviews for a wine tasting app.
Classify the review text. Return ONLY JSON: {"verdict":"ok"|"flag","reason":"short reason"}.
Flag if the text is vulgar/profane, hateful, harassing, sexual, threatening, spam/advertising,
or otherwise inappropriate for a public, all-ages product review. Otherwise "ok".
Keep reason under 15 words.`;

interface AppSyncEvent {
  arguments: { bottleId: string; userId: string };
}

export const handler = async (event: AppSyncEvent): Promise<{ verdict: string; reason: string }> => {
  const { bottleId, userId } = event.arguments;
  const review = await getItem<Review>(keys.review(bottleId, userId));
  if (!review?.body) return { verdict: "ok", reason: "No review text." };

  try {
    const out = await chat(SYSTEM, [{ role: "user", content: review.body.slice(0, 1500) }], "haiku", 120);
    const j = extractJson<{ verdict?: string; reason?: string }>(out);
    const verdict = j?.verdict === "flag" ? "flag" : "ok";
    return { verdict, reason: j?.reason || (verdict === "flag" ? "Flagged by AI." : "Looks clean.") };
  } catch {
    return { verdict: "ok", reason: "Moderation unavailable — review manually." };
  }
};
