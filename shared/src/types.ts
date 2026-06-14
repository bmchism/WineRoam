// ============================================================================
// Wine Roam — shared domain model. Single source of truth for web + backend.
// Frontend (web/) and Lambdas (functions/) both import these from @agave/shared.
// ============================================================================

export type WineType = "Red" | "White" | "Rosé" | "Sparkling" | "Dessert" | "Orange";

// Keep Expression as alias for backward compat
export type Expression = WineType;

export const EXPRESSIONS: WineType[] = [
  "Red",
  "White",
  "Rosé",
  "Sparkling",
  "Dessert",
  "Orange",
];

// ---------- Catalog ----------

export interface Distillery {
  nom: string;
  name: string;
  location: string;
  masterDistiller?: string;
  altitude?: string;
  otherBrands?: string[];
  notes?: string;
  website?: string;
}

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

export interface SourceLink {
  label: string;
  url: string;
}

export interface Bottle {
  id: string;
  brand: string;
  name: string;
  nom: string;
  expression: Expression;
  abv: number;
  proof: number;
  agaveRegion: string;
  // Wine-specific fields
  producer?: string;
  wineryId?: string;
  wineType?: WineType;
  vintage?: number;
  region?: string;
  appellation?: string;
  country?: string;
  grapes?: string[];
  vinification?: string;
  soil?: string;
  climate?: string;
  organic?: boolean;
  biodynamic?: boolean;
  naturalWine?: boolean;
  // Shared fields
  waterSource?: string;
  fermentation?: string;
  stillType?: string;
  crushing?: string;
  distillation?: string;
  cooking?: string;
  aging?: string;
  aromas: string[];
  flavors: string[];
  tastingNotes?: string;
  story?: string;
  accent: string;
  verified?: boolean;
  additiveFree?: boolean;
  imageUrl?: string;
  imageKeys?: string[];
  sources?: SourceLink[];
  createdAt?: string;
  updatedAt?: string;
}

// ---------- Learn ----------

export interface LearnSection {
  heading: string;
  body: string;
}

export interface LearnArticle {
  slug: string;
  title: string;
  subtitle: string;
  kicker: string;
  sections: LearnSection[];
}

export interface ProcessStep {
  step: number;
  title: string;
  detail: string;
}

// ---------- Tastings ----------

export type Pacing = "host" | "self";
export type Visibility = "social" | "private";

export interface Flight {
  id: string;
  title: string;
  subtitle: string;
  bottleIds: string[];
  curated: boolean;
}

export interface Tasting {
  id: string;
  ownerId: string;
  title: string;
  bottleIds: string[];
  talkTrack?: string;
  defaultPacing: Pacing;
  defaultVisibility: Visibility;
  quizId?: string;
  createdAt: string;
}

export type SessionStatus = "lobby" | "live" | "quiz" | "complete";

export interface TastingSession {
  sessionId: string;
  tastingId: string;
  hostId: string;
  joinCode: string;
  status: SessionStatus;
  pacing: Pacing;
  visibility: Visibility;
  currentStep: number;
  createdAt: string;
}

export interface Participant {
  sessionId: string;
  participantId: string;
  displayName: string;
  accountId?: string | null;
  joinedAt: string;
}

export interface Rating {
  sessionId: string;
  participantId: string;
  bottleId: string;
  color?: number;
  aroma?: number;
  flavor?: number;
  finish?: number;
  overall?: number;
  note?: string;
  syncedAt: string;
}

// ---------- Reviews & notes (account-scoped) ----------

export interface Review {
  bottleId: string;
  userId: string;
  displayName: string;
  body: string;
  score?: number;
  aroma?: number;
  palate?: number;
  finish?: number;
  published: boolean;
  moderation?: "approved" | "flagged" | "pending" | "blocked";
  createdAt: string;
}

export interface Note {
  userId: string;
  bottleId: string;
  body: string;
  updatedAt: string;
}

// ---------- Quiz ----------

export type QuizSource = "auto" | "host";

export interface QuizQuestion {
  quizId: string;
  questionId: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  source: QuizSource;
}

export interface Quiz {
  quizId: string;
  tastingId: string;
  questions: QuizQuestion[];
}

export interface QuizResponse {
  sessionId: string;
  participantId: string;
  questionId: string;
  choiceIndex: number;
  correct: boolean;
  ms: number;
}

export interface LeaderboardEntry {
  participantId: string;
  displayName: string;
  correct: number;
  total: number;
  avgMs: number;
}

// ---------- Bottle recognition / enrichment (backend) ----------

export interface EnrichmentResult {
  bottle: Bottle;
  confidence: number;
  modelUsed: "haiku" | "sonnet" | "opus";
  sources: SourceLink[];
}
