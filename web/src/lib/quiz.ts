import type { Bottle } from "../types";

export interface LocalQuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Deterministic pseudo-random so quizzes are stable per flight.
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// Generate a small MCQ set from the flight's bottles. Mirrors what the backend
// quiz-generate Lambda will do with Claude — here it's rule-based and offline.
export function buildQuiz(bottles: Bottle[]): LocalQuizQuestion[] {
  const qs: LocalQuizQuestion[] = [];
  if (bottles.length < 2) return qs;

  // Q1: which wine type is represented in the flight?
  const types = [...new Set(bottles.map((b) => b.wineType))];
  if (types.length > 1) {
    const target = pick(bottles, 0);
    qs.push({
      id: "q-type",
      text: `What type of wine is ${target.name}?`,
      options: shuffle(["Red", "White", "Rosé", "Sparkling", "Dessert"], 0).slice(0, 4),
      correctIndex: -1,
      explanation: `${target.name} is a ${target.wineType} wine.`,
    });
    fixIndex(qs[qs.length - 1], target.wineType);
  }

  // Q2: Region/country match for a specific bottle
  const regionBottle = pick(bottles, 1);
  qs.push({
    id: "q-region",
    text: `Which region is ${regionBottle.name} from?`,
    options: dedupe([
      regionBottle.region,
      ...bottles.filter((b) => b.region !== regionBottle.region).map((b) => b.region),
      "Napa Valley, California",
      "Bordeaux, France",
      "Barossa Valley, Australia",
    ]).slice(0, 4),
    correctIndex: -1,
    explanation: `${regionBottle.name} comes from ${regionBottle.region}.`,
  });
  fixIndex(qs[qs.length - 1], regionBottle.region);

  // Q3: grape variety
  const grapeBottle = bottles.find((b) => b.grapes && b.grapes.length > 0) ?? pick(bottles, 2);
  if (grapeBottle.grapes && grapeBottle.grapes.length > 0) {
    const mainGrape = grapeBottle.grapes[0];
    qs.push({
      id: "q-grape",
      text: `What is the primary grape in ${grapeBottle.name}?`,
      options: dedupe([
        mainGrape,
        "Cabernet Sauvignon", "Pinot Noir", "Chardonnay", "Riesling",
        "Merlot", "Syrah", "Nebbiolo", "Sangiovese",
      ].filter((g) => g !== mainGrape)).slice(0, 3).concat(mainGrape),
      correctIndex: -1,
      explanation: `${grapeBottle.name} is made from ${grapeBottle.grapes.join(", ")}.`,
    });
    fixIndex(qs[qs.length - 1], mainGrape);
  }

  // Q4: organic/biodynamic/natural wine spotting
  const organic = bottles.find((b) => b.organic || b.biodynamic || b.naturalWine);
  if (organic) {
    const label = organic.biodynamic ? "biodynamic" : organic.organic ? "organic" : "natural";
    qs.push({
      id: "q-organic",
      text: `Which of these wines is certified ${label}?`,
      options: shuffle(bottles.map((b) => b.name), 5),
      correctIndex: -1,
      explanation: `${organic.name} is a ${label} wine.`,
    });
    fixIndex(qs[qs.length - 1], organic.name);
  }

  // Q5: ABV of the flight's strongest
  const strongest = [...bottles].sort((a, b) => b.abv - a.abv)[0];
  qs.push({
    id: "q-abv",
    text: `Which pour has the highest alcohol (${strongest.abv}%)?`,
    options: shuffle(bottles.map((b) => b.name), 2),
    correctIndex: -1,
    explanation: `${strongest.name} is ${strongest.abv}% ABV.`,
  });
  fixIndex(qs[qs.length - 1], strongest.name);

  return qs.slice(0, 5);
}

function shuffle(arr: string[], seed: number): string[] {
  const a = dedupe(arr).slice(0, 4);
  const rot = seed % a.length;
  return [...a.slice(rot), ...a.slice(0, rot)];
}
function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}
function fixIndex(q: LocalQuizQuestion, answer: string) {
  const i = q.options.indexOf(answer);
  q.correctIndex = i === -1 ? 0 : i;
  if (i === -1) q.options[0] = answer;
}
