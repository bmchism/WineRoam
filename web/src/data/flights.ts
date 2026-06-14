import type { Bottle } from "../types";
import { bottleById } from "./bottles";

// A Flight = an ordered set of bottles for a tasting. Curated flights ship with
// the app; users can build, customize, and save their own.
export interface Flight {
  id: string;
  title: string;
  subtitle: string;
  bottleIds: string[];
  curated: boolean;
}

export const curatedFlights: Flight[] = [
  {
    id: "around-the-world-reds",
    title: "Around the World in Reds",
    subtitle: "Benchmark reds from France, Italy, USA, Spain, Argentina, and Australia.",
    bottleIds: ["margaux-2015", "opus-one-2019", "penfolds-grange-2018", "tignanello-2019", "catena-malbec-2020"],
    curated: true,
  },
  {
    id: "bordeaux-first-growths",
    title: "Bordeaux First Growth Experience",
    subtitle: "The pinnacle of Cabernet-dominant blends — Left Bank majesty.",
    bottleIds: ["margaux-2015", "opus-one-2019", "ridge-monte-bello-2019"],
    curated: true,
  },
  {
    id: "great-whites",
    title: "Great White Wines",
    subtitle: "From Burgundy Chardonnay to Alsatian Riesling to NZ Sauvignon Blanc.",
    bottleIds: ["leflaive-chevalier-2020", "trimbach-clos-ste-hune-2017", "cloudy-bay-sb-2023"],
    curated: true,
  },
  {
    id: "bubbles-celebration",
    title: "Champagne Celebration",
    subtitle: "Prestige cuvées — the art of blending and time on lees.",
    bottleIds: ["dom-perignon-2013", "krug-grande-cuvee"],
    curated: true,
  },
  {
    id: "italian-masters",
    title: "Italian Masters",
    subtitle: "From Barolo to Super Tuscan — the diversity of Italian terroir.",
    bottleIds: ["conterno-monfortino-2015", "tignanello-2019"],
    curated: true,
  },
  {
    id: "sweet-endings",
    title: "Sweet Endings",
    subtitle: "Dessert wines and Port — golden Sauternes meets Douro power.",
    bottleIds: ["yquem-2015", "taylor-vintage-port-2017"],
    curated: true,
  },
  {
    id: "new-world-showdown",
    title: "New World Showdown",
    subtitle: "Napa vs. Barossa vs. Mendoza — New World power and finesse.",
    bottleIds: ["opus-one-2019", "penfolds-grange-2018", "catena-malbec-2020", "ridge-monte-bello-2019"],
    curated: true,
  },
  {
    id: "all-types-intro",
    title: "Intro to Wine Styles",
    subtitle: "One of each — red, white, rosé, sparkling, and dessert.",
    bottleIds: ["margaux-2015", "cloudy-bay-sb-2023", "whispering-angel-2023", "dom-perignon-2013", "yquem-2015"],
    curated: true,
  },
];

export const bottlesForFlight = (f: Flight): Bottle[] =>
  f.bottleIds.map((id) => bottleById(id)).filter((b): b is Bottle => Boolean(b));

// ----- The active build (builder -> setup -> runner) -----
const CURRENT = "wine.customFlight";
export function saveCustomFlight(f: Flight) {
  localStorage.setItem(CURRENT, JSON.stringify(f));
}
export function loadCustomFlight(): Flight | null {
  try {
    const raw = localStorage.getItem(CURRENT);
    return raw ? (JSON.parse(raw) as Flight) : null;
  } catch {
    return null;
  }
}

// ----- Saved flight library (the user's stored flights) -----
const LIB = "wine.flightLibrary";
export function loadLibrary(): Flight[] {
  try {
    return JSON.parse(localStorage.getItem(LIB) || "[]");
  } catch {
    return [];
  }
}
export function saveToLibrary(f: Flight) {
  const lib = loadLibrary().filter((x) => x.id !== f.id);
  lib.unshift(f);
  localStorage.setItem(LIB, JSON.stringify(lib));
}
// Resolve a flight by id across curated, the saved library, and the active build.
export const flightById = (id: string): Flight | undefined =>
  curatedFlights.find((f) => f.id === id) ||
  loadLibrary().find((f) => f.id === id) ||
  (id === "custom" ? loadCustomFlight() ?? undefined : undefined);
