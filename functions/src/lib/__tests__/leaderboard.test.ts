import { describe, it, expect } from "vitest";
import { aggregateLeaderboard, type QuizResponseRow } from "../leaderboard.js";

const names = new Map([
  ["p1", "Ana"],
  ["p2", "Beto"],
]);

describe("aggregateLeaderboard", () => {
  it("tallies correct/total and averages latency per participant", () => {
    const rows: QuizResponseRow[] = [
      { participantId: "p1", correct: true, ms: 1000 },
      { participantId: "p1", correct: false, ms: 2000 },
      { participantId: "p2", correct: true, ms: 500 },
    ];
    const out = aggregateLeaderboard(rows, names);
    const ana = out.find((e) => e.participantId === "p1")!;
    const beto = out.find((e) => e.participantId === "p2")!;
    expect(ana).toMatchObject({ displayName: "Ana", correct: 1, total: 2, avgMs: 1500 });
    expect(beto).toMatchObject({ displayName: "Beto", correct: 1, total: 1, avgMs: 500 });
  });

  it("ranks by correct count descending", () => {
    const rows: QuizResponseRow[] = [
      { participantId: "p2", correct: true },
      { participantId: "p2", correct: true },
      { participantId: "p1", correct: true },
    ];
    const out = aggregateLeaderboard(rows, names);
    expect(out.map((e) => e.participantId)).toEqual(["p2", "p1"]);
  });

  it("falls back to 'Guest' for unknown participants", () => {
    const out = aggregateLeaderboard([{ participantId: "ghost", correct: true }], names);
    expect(out[0].displayName).toBe("Guest");
  });

  it("treats missing ms/correct as 0 and avoids divide-by-zero", () => {
    const out = aggregateLeaderboard([{ participantId: "p1" }], names);
    expect(out[0]).toMatchObject({ correct: 0, total: 1, avgMs: 0 });
  });

  it("returns an empty array for no responses", () => {
    expect(aggregateLeaderboard([], names)).toEqual([]);
  });
});
