// Canonical domain types for Wine Roam.

export type WineType = "Red" | "White" | "Rosé" | "Sparkling" | "Dessert" | "Orange";

// Keep Expression as an alias so existing code (Catalog filters, etc.) still compiles.
export type Expression = WineType;

// The ordered list of wine types (replaces tequila EXPRESSIONS constant).
export const EXPRESSIONS: WineType[] = ["Red", "White", "Rosé", "Sparkling", "Dessert", "Orange"];

export interface Winery {
  id: string;
  name: string;
  region: string;
  appellation?: string;
  country?: string;
  winemaker?: string;
  grapes?: string[];
  notes?: string;
  website?: string;
}

export interface Bottle {
  id: string;
  /** Producer / brand name */
  producer: string;
  /** Full wine name */
  name: string;
  /** Winery ID (replaces NOM) */
  wineryId: string;
  /** Wine type (Red, White, Rosé, etc.) */
  wineType: WineType;
  vintage?: number;
  abv: number;
  /** Wine region */
  region: string;
  appellation?: string;
  country?: string;
  grapes?: string[];
  aging?: string;
  vinification?: string;
  soil?: string;
  climate?: string;
  aromas: string[];
  flavors: string[];
  tastingNotes?: string;
  story?: string;
  accent: string;
  verified?: boolean;
  organic?: boolean;
  biodynamic?: boolean;
  naturalWine?: boolean;
  imageKeys?: string[];
  sources?: { label: string; url: string }[];
  createdAt?: string;
  updatedAt?: string;

  // ---- Backward-compat aliases (mapped from wine fields in data layer) ----
  // These let existing components compile until they're individually updated.
  /** @deprecated use producer */
  brand: string;
  /** @deprecated use wineryId */
  nom: string;
  /** @deprecated use wineType */
  expression: WineType;
  /** @deprecated use region */
  agaveRegion: string;
  /** @deprecated use organic */
  additiveFree?: boolean;
  /** Proof (2x ABV) */
  proof: number;
  // Legacy production fields (mapped to generic values)
  waterSource?: string;
  fermentation?: string;
  stillType?: string;
  crushing?: string;
  distillation?: string;
  cooking?: string;
  /** Runtime image URL (populated from imageKeys or upload) */
  imageUrl?: string;
}

export interface Review {
  bottleId: string;
  userId: string;
  displayName: string;
  body: string;
  score?: number;
  nose?: number;
  palate?: number;
  finish?: number;
  // Backward compat alias
  aroma?: number;
  published: boolean;
  moderation?: string;
  createdAt: string;
}

export interface TastingSession {
  sessionId: string;
  tastingId: string;
  hostId: string;
  joinCode: string;
  status: string;
  pacing: string;
  visibility: string;
  currentStep: number;
  createdAt: string;
}

export interface Participant {
  sessionId: string;
  participantId: string;
  displayName: string;
  accountId?: string;
  joinedAt: string;
}

export interface Rating {
  sessionId: string;
  participantId: string;
  bottleId: string;
  appearance?: number;
  nose?: number;
  palate?: number;
  finish?: number;
  overall?: number;
  note?: string;
  syncedAt: string;
  // Backward compat aliases
  color?: number;
  aroma?: number;
  flavor?: number;
}

export interface LearnArticle {
  slug: string;
  title: string;
  subtitle: string;
  kicker: string;
  sections: { heading: string; body: string }[];
}


// Session pacing + visibility options
export type Pacing = "host" | "self";
export type Visibility = "social" | "private";
