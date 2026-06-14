import { randomUUID } from "node:crypto";
import type { Bottle, Quiz, QuizQuestion } from "@agave/shared";
import { callTiered, extractJson } from "./lib/anthropic.js";
import { getItem, putItem } from "./lib/ddb.js";
import { keys } from "./lib/keys.js";

// quiz-generate: build an MCQ bank from a tasting's bottles via Claude, once,
// then cache on the tasting (no per-run cost). Host can add custom questions.

interface GenEvent {
  tastingId: string;
  bottleIds: string[];
}

const SYSTEM = `You write fun, fair multiple-choice tasting-quiz questions about specific wines.
Return ONLY JSON: {"questions":[{"text":string,"options":[string,string,string,string],"correctIndex":number,"explanation":string}]}
Base every question on the provided bottle facts. 4 options each, exactly one correct. 5 questions.`;

export const handler = async (event: GenEvent): Promise<Quiz> => {
  const bottles: Bottle[] = [];
  for (const id of event.bottleIds) {
    const b = await getItem<Bottle>(keys.bottle(id));
    if (b) bottles.push(b);
  }

  const facts = bottles
    .map(
      (b) =>
        `- ${b.name}: ${b.expression}, NOM ${b.nom}, ${b.abv}%, ${b.grapeRegion}` +
        (b.crushing ? `, crush: ${b.crushing}` : "") +
        (b.aging ? `, aging: ${b.aging}` : "") +
        (b.additiveFree ? ", additive-free" : "")
    )
    .join("\n");

  const { text } = await callTiered(
    { system: SYSTEM, userText: `Bottles:\n${facts}\n\nReturn the quiz JSON.`, maxTokens: 1400 },
    (t) => {
      const j = extractJson<{ questions?: unknown[] }>(t);
      return Boolean(j?.questions && j.questions.length >= 3);
    },
    ["haiku", "sonnet"]
  );

  const parsed = extractJson<{ questions: Omit<QuizQuestion, "quizId" | "questionId" | "source">[] }>(text);
  const quizId = randomUUID();
  const questions: QuizQuestion[] = (parsed?.questions ?? []).slice(0, 5).map((q) => ({
    quizId,
    questionId: randomUUID(),
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    source: "auto" as const,
  }));

  const quiz: Quiz = { quizId, tastingId: event.tastingId, questions };
  await putItem({
    PK: `QUIZ#${quizId}`,
    SK: "#META",
    ...quiz,
    type: "Quiz",
  });
  return quiz;
};
