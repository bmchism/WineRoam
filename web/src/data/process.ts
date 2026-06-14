// Full end-to-end winemaking process. Each stage drives an
// animated original illustration in the interactive journey.

export type SceneId =
  | "vineyard"
  | "harvest"
  | "crush"
  | "ferment"
  | "press"
  | "age"
  | "blend"
  | "bottle";

export interface ProcessStage {
  id: SceneId;
  n: number;
  title: string;
  tagline: string;
  body: string;
  facts: string[];
  accent: string;
  photo?: string;
  credit?: string;
}

const WM = (file: string, width = 800) =>
  `https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=${width}&q=80&auto=format`;

export const PHOTOS = {
  vineyard: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80&auto=format",
  harvest: "https://images.unsplash.com/photo-1596142813892-193da6b3d34c?w=800&q=80&auto=format",
  barrels: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=800&q=80&auto=format",
};

export const stages: ProcessStage[] = [
  {
    id: "vineyard",
    n: 1,
    title: "The Vineyard",
    tagline: "Terroir: where climate, soil, and vine converge",
    body: "Everything starts in the vineyard. The concept of 'terroir' — the unique combination of soil, climate, altitude, and aspect — shapes the character of the wine before the winemaker even touches the grapes. Limestone gives minerality, clay adds richness, sand produces finesse. Cool climates preserve acidity; warm ones build ripeness and body.",
    facts: ["Terroir = soil + climate + aspect", "Vine age matters (old vines = concentrated)", "Pruning controls yield and quality"],
    accent: "#5c7a5a",
    photo: PHOTOS.vineyard,
    credit: "Photo: Wikimedia Commons (CC)",
  },
  {
    id: "harvest",
    n: 2,
    title: "Harvest (Vendange)",
    tagline: "Picking at peak ripeness — timing is everything",
    body: "The harvest decision is the most critical of the year. Grapes must balance sugar (which becomes alcohol), acidity (which gives freshness), and phenolic ripeness (tannin and flavor maturity). Hand-picking allows selection; machine harvesting is faster but less selective. In Champagne and for premium wines, hand-picking is mandatory.",
    facts: ["Hand vs. machine harvest", "Sugar/acid balance is key", "Night harvest preserves freshness (warm climates)"],
    accent: "#8FA24A",
  },
  {
    id: "crush",
    n: 3,
    title: "Crushing & Destemming",
    tagline: "Breaking skins to release juice and flavor",
    body: "Grapes are destemmed (stems add green tannin) and gently crushed to break skins. For white wines, grapes go straight to the press with minimal skin contact. For reds, the crushed grapes (must) ferment with their skins — this maceration extracts color, tannin, and flavor compounds. Some winemakers keep whole clusters (stems included) for added complexity and spice.",
    facts: ["White: press immediately", "Red: ferment with skins (maceration)", "Whole-cluster = spice + structure"],
    accent: "#722F37",
  },
  {
    id: "ferment",
    n: 4,
    title: "Fermentation",
    tagline: "Yeast converts sugar to alcohol",
    body: "Yeast (wild/ambient or cultured) converts grape sugar into alcohol and CO₂ over 1–4 weeks. Temperature control is critical: cool fermentation (whites) preserves fruit and aromatics; warmer fermentation (reds) extracts more color and tannin. Stainless steel keeps things clean and fruity; oak barrels add complexity during fermentation.",
    facts: ["1–4 weeks for primary ferment", "Wild yeast = more complex, less predictable", "Temperature shapes the style"],
    accent: "#6FA67C",
  },
  {
    id: "press",
    n: 5,
    title: "Pressing",
    tagline: "Separating juice from skins and solids",
    body: "After fermentation (for reds) or before (for whites), the wine is separated from the grape skins. Free-run juice (gravity-drained) is the most delicate; pressed juice adds structure and tannin. The winemaker decides how much press wine to include in the final blend. Gentle pneumatic presses are standard for quality wine.",
    facts: ["Free-run = gentle, elegant", "Press wine = structured, tannic", "Pneumatic press = modern standard"],
    accent: "#C0823B",
  },
  {
    id: "age",
    n: 6,
    title: "Aging (Élevage)",
    tagline: "Time transforms — in oak, steel, concrete, or amphora",
    body: "Élevage ('raising') is where the winemaker shapes the final wine. Oak barrels add vanilla, toast, and spice while allowing micro-oxygenation that softens tannins. New oak imparts more flavor; older/neutral oak contributes texture without flavor. Stainless steel preserves fruit purity. Concrete and amphora offer gentle oxygenation without oak flavor. Duration ranges from months (fresh whites) to years (Barolo, Rioja Gran Reserva).",
    facts: ["New oak = vanilla, toast, spice", "Neutral oak = texture, no flavor", "Stainless = pure fruit preservation"],
    accent: "#A66A33",
  },
  {
    id: "blend",
    n: 7,
    title: "Blending (Assemblage)",
    tagline: "The art of combining lots into a whole",
    body: "Most great wines are blends — of grape varieties (Bordeaux blends Cabernet, Merlot, and more), of vineyard parcels (Burgundy blends plots within an appellation), of barrel types, or of vintages (Champagne Grande Cuvée). Blending adds complexity, balance, and consistency. Even 'single-varietal' wines often blend parcels or barrel lots.",
    facts: ["Bordeaux: multi-grape blend", "Burgundy: multi-parcel blend", "Champagne: multi-vintage blend"],
    accent: "#8C4A2F",
  },
  {
    id: "bottle",
    n: 8,
    title: "Bottling & Aging",
    tagline: "Into the bottle, and the patient wait",
    body: "The wine is fined (clarified) and often filtered before bottling, though many premium producers skip both for fuller texture. Once bottled, the wine continues to evolve: tannins polymerize and soften, fruit character shifts from fresh to dried, and tertiary aromas (leather, earth, mushroom) develop. Some wines are best young; others reward decades of cellaring.",
    facts: ["Unfined/unfiltered = fuller texture", "Tannins soften with bottle age", "Cork allows slow micro-oxygenation"],
    accent: "#9AA7B2",
  },
];
