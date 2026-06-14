import type { LeaderboardEntry } from "@agave/shared";

// Pure quiz-leaderboard aggregation, split out from the api resolver so it can
// be unit-tested without DynamoDB. Given raw quiz responses + a participantId→
// name map, tally correct/total/avg-latency per participant and rank by score.

export interface QuizResponseRow {
  participantId: string;
  correct?: boolean;
  ms?: number;
}

export function aggregateLeaderboard(
  responses: QuizResponseRow[],
  names: Map<string, string>,
): LeaderboardEntry[] {
  const agg = new Map<string, { correct: number; total: number; ms: number }>();
  for (const r of responses) {
    const e = agg.get(r.participantId) ?? { correct: 0, total: 0, ms: 0 };
    e.total += 1;
    e.ms += r.ms ?? 0;
    if (r.correct) e.correct += 1;
    agg.set(r.participantId, e);
  }
  return [...agg.entries()]
    .map(([participantId, v]) => ({
      participantId,
      displayName: names.get(participantId) ?? "Guest",
      correct: v.correct,
      total: v.total,
      avgMs: v.total ? Math.round(v.ms / v.total) : 0,
    }))
    .sort((a, b) => b.correct - a.correct);
}
