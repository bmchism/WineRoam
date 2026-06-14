import { describe, it, expect } from "vitest";
import { buildQuiz } from "../quiz";
import { bottles } from "../../data/bottles";

const flight = bottles.slice(0, 4); // mixed expressions

describe("buildQuiz", () => {
  it("returns no questions for fewer than 2 bottles", () => {
    expect(buildQuiz(bottles.slice(0, 1))).toHaveLength(0);
  });

  it("generates up to 5 questions for a real flight", () => {
    const q = buildQuiz(flight);
    expect(q.length).toBeGreaterThan(0);
    expect(q.length).toBeLessThanOrEqual(5);
  });

  it("every question has 4 distinct options and a valid correct index", () => {
    for (const q of buildQuiz(flight)) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size).toBe(q.options.length); // distinct
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
    }
  });

  it("the correct option is always present in options", () => {
    for (const q of buildQuiz(flight)) {
      expect(q.options[q.correctIndex]).toBeDefined();
    }
  });

  it("is deterministic for the same input", () => {
    expect(buildQuiz(flight)).toEqual(buildQuiz(flight));
  });
});
