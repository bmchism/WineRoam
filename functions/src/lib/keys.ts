// Single-table key helpers. One DynamoDB table, many entity types, keyed by
// PK/SK with a GSI1 for list/lookup access patterns.

export const TABLE = process.env.TABLE_NAME ?? "AgaveTable";

export const keys = {
  bottle: (id: string) => ({ PK: `BOTTLE#${id}`, SK: "#META" }),
  bottleList: () => ({ gsi1pk: "BOTTLE" }),
  // Cache pointer: normalized "NOM#brand" (or label hash) -> bottleId. Permanent.
  cache: (cacheKey: string) => ({ PK: `CACHE#${cacheKey}`, SK: "#PTR" }),

  session: (sessionId: string) => ({ PK: `SESSION#${sessionId}`, SK: "#META" }),
  joinLookup: (code: string) => ({ gsi1pk: `JOIN#${code}` }),
  participant: (sessionId: string, participantId: string) => ({
    PK: `SESSION#${sessionId}`,
    SK: `PART#${participantId}`,
  }),
  rating: (sessionId: string, bottleId: string, participantId: string) => ({
    PK: `SESSION#${sessionId}`,
    SK: `RATING#${bottleId}#${participantId}`,
  }),
  quizResponse: (sessionId: string, participantId: string, questionId: string) => ({
    PK: `SESSION#${sessionId}`,
    SK: `QRESP#${participantId}#${questionId}`,
  }),

  review: (bottleId: string, userId: string) => ({
    PK: `BOTTLE#${bottleId}`,
    SK: `REVIEW#${userId}`,
  }),
  note: (userId: string, bottleId: string) => ({
    PK: `USER#${userId}`,
    SK: `NOTE#${bottleId}`,
  }),
  profile: (userId: string) => ({ PK: `USER#${userId}`, SK: "#PROFILE" }),
  userLogin: (userId: string) => ({ PK: `USER#${userId}`, SK: "#LOGIN" }),
  userFlight: (userId: string, flightId: string) => ({
    PK: `USER#${userId}`,
    SK: `FLIGHT#${flightId}`,
  }),
  userHistory: (userId: string, entryId: string) => ({
    PK: `USER#${userId}`,
    SK: `HIST#${entryId}`,
  }),
  favorite: (userId: string, bottleId: string) => ({
    PK: `USER#${userId}`,
    SK: `FAV#${bottleId}`,
  }),
  shelf: (userId: string, bottleId: string) => ({
    PK: `USER#${userId}`,
    SK: `SHELF#${bottleId}`,
  }),
  pushSub: (userId: string, hash: string) => ({
    PK: `USER#${userId}`,
    SK: `PUSHSUB#${hash}`,
  }),
  scan: (imageKey: string) => ({ PK: `SCAN#${imageKey}`, SK: "#SCAN" }),
  reminder: (userId: string, id: string) => ({
    PK: `USER#${userId}`,
    SK: `REMIND#${id}`,
  }),
  analytics: (day: string) => ({ PK: "ANALYTICS", SK: day }),
};

// Normalize a brand/NOM pair into a stable cache key.
export function cacheKeyFor(nom: string, brand: string): string {
  return `${nom}#${brand}`.toLowerCase().replace(/\s+/g, "-");
}
