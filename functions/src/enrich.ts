import type { Bottle, Expression } from "@agave/shared";
import { callTiered, extractJson, type Tier } from "./lib/anthropic.js";
import { putItem, getItem } from "./lib/ddb.js";
import { keys, cacheKeyFor } from "./lib/keys.js";

// bottle-enrich: turn a hint (brand/NOM, or a label photo) into a structured,
// additive-aware Bottle profile via tiered Claude, then persist + cache it.
// Invoked by the Step Functions pipeline (recognize) and the pre-warm batch.

export interface EnrichEvent {
  hint?: { brand: string; expression?: Expression; nom?: string };
  imageBase64?: string;
  imageMediaType?: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  imageKey?: string;
}

const SYSTEM = `You are a wine expert building structured catalog entries.
Given a label photo and/or a brand hint, return ONLY a JSON object for the bottle.
Be accurate and conservative: if you are unsure of a field, omit it rather than guess.
Never invent a NOM. Mark additiveFree true ONLY if the brand is well-documented as additive-free; otherwise omit it.
JSON shape:
{
  "brand": string, "name": string, "nom": string, "expression": "Blanco"|"High Proof Blanco"|"Reposado"|"Añejo"|"Extra Añejo"|"Cristalino",
  "abv": number, "grapeRegion": string, "waterSource"?: string, "fermentation"?: string,
  "stillType"?: string, "crushing"?: string, "distillation"?: string, "cooking"?: string, "aging"?: string,
  "aromas": string[], "flavors": string[], "tastingNotes"?: string, "story"?: string,
  "additiveFree"?: boolean, "confidence": number
}`;

const ACCENTS: Record<Expression, string> = {
  Blanco: "#7FA15A",
  "High Proof Blanco": "#5E8C4E",
  Reposado: "#C28A3D",
  "Añejo": "#A66A33",
  "Extra Añejo": "#8C4A2F",
  Cristalino: "#9AA7B2",
};

interface RawBottle extends Partial<Bottle> {
  confidence?: number;
}

export const handler = async (event: EnrichEvent): Promise<Bottle> => {
  const userText = buildUserText(event);

  // Confidence gate drives tier escalation: accept Haiku only if it returns
  // valid JSON with the required fields and confidence >= 0.7.
  const accept = (text: string) => {
    const j = extractJson<RawBottle>(text);
    return Boolean(j && j.brand && j.nom && j.expression && (j.confidence ?? 0) >= 0.7);
  };

  // Photos are harder — start one tier up so we don't waste a Haiku pass.
  const ladder: Tier[] = event.imageBase64
    ? ["sonnet", "opus"]
    : ["haiku", "sonnet", "opus"];

  const { text, tier } = await callTiered(
    {
      system: SYSTEM,
      userText,
      imageBase64: event.imageBase64,
      imageMediaType: event.imageMediaType,
      maxTokens: 1200,
    },
    accept,
    ladder
  );

  const raw = extractJson<RawBottle>(text);
  if (!raw || !raw.brand || !raw.nom || !raw.expression) {
    throw new Error(`enrich: could not parse a bottle (tier ${tier})`);
  }

  const nom = normalizeNom(raw.nom);
  const id = slug(`${raw.brand}-${raw.expression}-${nom}`);
  const now = new Date().toISOString();
  const bottle: Bottle = {
    id,
    brand: raw.brand,
    name: raw.name ?? `${raw.brand} ${raw.expression}`,
    nom,
    expression: raw.expression,
    abv: raw.abv ?? 40,
    proof: Math.round((raw.abv ?? 40) * 2),
    grapeRegion: raw.grapeRegion ?? "Jalisco",
    waterSource: raw.waterSource,
    fermentation: raw.fermentation,
    stillType: raw.stillType,
    crushing: raw.crushing,
    distillation: raw.distillation,
    cooking: raw.cooking,
    aging: raw.aging,
    aromas: raw.aromas ?? [],
    flavors: raw.flavors ?? [],
    tastingNotes: raw.tastingNotes,
    story: raw.story,
    accent: ACCENTS[raw.expression],
    additiveFree: raw.additiveFree,
    verified: false, // generated — awaits admin review
    imageKeys: event.imageKey ? [event.imageKey] : undefined,
    createdAt: now,
    updatedAt: now,
  };

  // Persist the bottle and a permanent cache pointer so it never re-hits Claude.
  await putItem({
    ...keys.bottle(bottle.id),
    ...bottle,
    type: "Bottle",
    gsi1pk: "BOTTLE",
    gsi1sk: bottle.name,
    enrichTier: tier,
  });
  const ck = cacheKeyFor(bottle.nom, bottle.brand);
  await putItem({ ...keys.cache(ck), bottleId: bottle.id, type: "CachePtr" });

  // When this enrich came from a label scan, drop a pointer keyed by the image
  // so the client can poll for the identified bottle (the pipeline is async).
  if (event.imageKey) {
    await putItem({ ...keys.scan(event.imageKey), bottleId: bottle.id, type: "ScanPtr" });
  }

  return bottle;
};

function buildUserText(e: EnrichEvent): string {
  if (e.hint) {
    const { brand, expression, nom } = e.hint;
    return `Build the catalog entry for: ${brand}${expression ? " " + expression : ""}${
      nom ? ` (NOM ${nom})` : ""
    }. Return only JSON.`;
  }
  return "Identify the wine in this label photo and return only the JSON catalog entry.";
}

// Check the cache before enriching (used by recognize/prewarm to skip work).
// Canonicalize a NOM string so the same winery never splits across format
// variants ("NOM 1414", "NOM-1414", "1414" -> "1414"). Strips a leading "NOM"
// token, all non-digits, and leading zeros. Falls back to the digit string if
// stripping leaves it empty.
export function normalizeNom(nom: string): string {
  const digits = nom.replace(/^nom/i, "").replace(/\D/g, "");
  return digits.replace(/^0+/, "") || digits || nom;
}

export async function cachedBottle(nom: string, brand: string): Promise<Bottle | null> {
  const ptr = await getItem<{ bottleId: string }>(keys.cache(cacheKeyFor(nom, brand)));
  if (!ptr?.bottleId) return null;
  const b = await getItem<Bottle>(keys.bottle(ptr.bottleId));
  return b ?? null;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics (e.g. Añejo)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
