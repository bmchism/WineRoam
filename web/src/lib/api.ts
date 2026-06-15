import { generateClient } from "aws-amplify/api";
import type { Bottle, Review, TastingSession, Participant, Rating } from "../types";
import { isApiConfigured } from "./config";
import { bottles as seedBottles, bottleById as seedById } from "../data/bottles";

// Amplify GraphQL client over AppSync. Public reads use the API key; account
// and live-session calls pass authMode 'userPool'. Reads fall back to local
// seed so the app works whether or not the backend is reachable.

const client = () => generateClient();

const BOTTLE_FIELDS = `
  id brand name nom expression abv proof agaveRegion
  aging aromas flavors tastingNotes story accent verified additiveFree imageKeys
`;

async function run<T>(query: string, variables: Record<string, unknown> = {}, authMode: "apiKey" | "userPool" = "apiKey"): Promise<T> {
  const res: any = await client().graphql({ query, variables, authMode });
  if (res.errors?.length) throw new Error(res.errors[0].message);
  return res.data as T;
}

// ---- Catalog (public) ----
export async function listBottles(): Promise<{ bottles: Bottle[]; live: boolean }> {
  if (!isApiConfigured) return { bottles: seedBottles, live: false };
  try {
    const data = await run<{ listBottles: Bottle[] }>(`query { listBottles { ${BOTTLE_FIELDS} } }`);
    // Filter out null entries (AppSync returns null for items that fail non-nullable checks)
    const list = (data.listBottles ?? []).filter((b): b is Bottle => b != null && !!b.id);
    return list.length ? { bottles: list, live: true } : { bottles: seedBottles, live: false };
  } catch {
    return { bottles: seedBottles, live: false };
  }
}

export async function bottlePopularity(): Promise<Map<string, number>> {
  if (!isApiConfigured) return new Map();
  try {
    const data = await run<{ bottlePopularity: { bottleId: string; count: number }[] }>(
      `query { bottlePopularity { bottleId count } }`
    );
    return new Map((data.bottlePopularity ?? []).map((p) => [p.bottleId, p.count]));
  } catch {
    return new Map();
  }
}

export async function getBottle(id: string): Promise<Bottle | undefined> {
  if (!isApiConfigured) return seedById(id);
  try {
    const data = await run<{ getBottle: Bottle | null }>(
      `query($id: ID!) { getBottle(id: $id) { ${BOTTLE_FIELDS} } }`,
      { id }
    );
    return data.getBottle ?? seedById(id);
  } catch {
    return seedById(id);
  }
}

// ---- Photo upload (cached: S3 -> CloudFront /media, URL saved on the bottle) ----
export async function uploadBottlePhoto(bottleId: string, file: File): Promise<string> {
  const presign = await run<{ presignUpload: { uploadUrl: string; key: string; publicUrl: string } }>(
    `mutation($b: ID!, $c: String!) { presignUpload(bottleId: $b, contentType: $c) { uploadUrl key publicUrl } }`,
    { b: bottleId, c: file.type || "image/jpeg" },
    "userPool"
  );
  const { uploadUrl, publicUrl } = presign.presignUpload;
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });
  if (!put.ok) throw new Error("upload failed");
  await run(
    `mutation($b: ID!, $u: String!) { setBottleImage(bottleId: $b, imageUrl: $u) { id } }`,
    { b: bottleId, u: publicUrl },
    "userPool"
  );
  return publicUrl;
}

// ---- Bottle scan (camera -> S3 -> recognize pipeline -> cached bottle) ----
// Uploads a label photo, kicks off the recognize Step Function, and returns the
// S3 key the pipeline writes its result against. Requires a signed-in user
// (presign + pipeline are gated to control Claude spend).
export async function scanBottlePhoto(file: File): Promise<string> {
  const presign = await run<{ presignUpload: { uploadUrl: string; key: string } }>(
    `mutation($b: ID!, $c: String!) { presignUpload(bottleId: $b, contentType: $c) { uploadUrl key } }`,
    { b: "scan", c: file.type || "image/jpeg" },
    "userPool"
  );
  const { uploadUrl, key } = presign.presignUpload;
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });
  if (!put.ok) throw new Error("upload failed");
  await run(`mutation($k: String!) { recognizeBottle(imageKey: $k) { id } }`, { k: key }, "userPool");
  return key;
}

// Poll for the identified bottle. Returns the Bottle once the pipeline finishes,
// or null while still running. Caller polls with a timeout.
export async function getScanResult(imageKey: string): Promise<Bottle | null> {
  const data = await run<{ getScanResult: Bottle | null }>(
    `query($k: String!) { getScanResult(imageKey: $k) { ${BOTTLE_FIELDS} } }`,
    { k: imageKey }
  );
  return data.getScanResult ?? null;
}

// Set a bottle photo from an external URL (sourced by the user/admin).
export async function setBottleImageUrl(bottleId: string, imageUrl: string): Promise<void> {
  await run(
    `mutation($b: ID!, $u: String!) { setBottleImage(bottleId: $b, imageUrl: $u) { id } }`,
    { b: bottleId, u: imageUrl },
    "userPool"
  );
}

// ---- Reviews ----
const REVIEW_FIELDS = `bottleId userId displayName body score aroma palate finish published moderation createdAt`;

export async function listReviews(bottleId: string): Promise<Review[]> {
  if (!isApiConfigured) return [];
  try {
    const data = await run<{ listReviews: Review[] }>(
      `query($id: ID!) { listReviews(bottleId: $id) { ${REVIEW_FIELDS} } }`,
      { id: bottleId }
    );
    return data.listReviews ?? [];
  } catch {
    return [];
  }
}

export async function upsertReview(input: {
  bottleId: string;
  body: string;
  score?: number;
  aroma?: number;
  palate?: number;
  finish?: number;
  published: boolean;
}): Promise<Review> {
  // Account-scoped — requires a signed-in Cognito user.
  const data = await run<{ upsertReview: Review }>(
    `mutation($input: ReviewInput!) { upsertReview(input: $input) { ${REVIEW_FIELDS} } }`,
    { input },
    "userPool"
  );
  return data.upsertReview;
}

// ---- Moderation (admin) ----
export async function listPendingReviews(): Promise<Review[]> {
  const data = await run<{ listPendingReviews: Review[] }>(
    `query { listPendingReviews { ${REVIEW_FIELDS} } }`,
    {},
    "userPool"
  );
  return data.listPendingReviews ?? [];
}
export async function moderateReview(bottleId: string, userId: string): Promise<{ verdict: string; reason: string }> {
  const data = await run<{ moderateReview: { verdict: string; reason: string } }>(
    `mutation($b: ID!, $u: ID!) { moderateReview(bottleId: $b, userId: $u) { verdict reason } }`,
    { b: bottleId, u: userId },
    "userPool"
  );
  return data.moderateReview;
}
export async function setReviewModerationApi(bottleId: string, userId: string, decision: "approve" | "block"): Promise<void> {
  await run(
    `mutation($b: ID!, $u: ID!, $d: String!) { setReviewModeration(bottleId: $b, userId: $u, decision: $d) { bottleId } }`,
    { b: bottleId, u: userId, d: decision },
    "userPool"
  );
}

// ---- Live tasting sessions (guests use the API key, no account) ----
const SESSION_FIELDS = `sessionId tastingId hostId joinCode status pacing visibility currentStep createdAt`;

export async function startSession(tastingId: string, pacing: string, visibility: string): Promise<TastingSession> {
  const data = await run<{ startSession: TastingSession }>(
    `mutation($t: ID!, $p: String!, $v: String!) { startSession(tastingId: $t, pacing: $p, visibility: $v) { ${SESSION_FIELDS} } }`,
    { t: tastingId, p: pacing, v: visibility }
  );
  return data.startSession;
}

export async function advanceSession(sessionId: string, step: number, status?: string): Promise<TastingSession> {
  const data = await run<{ advanceSession: TastingSession }>(
    `mutation($s: ID!, $step: Int!, $st: String) { advanceSession(sessionId: $s, step: $step, status: $st) { ${SESSION_FIELDS} } }`,
    { s: sessionId, step, st: status ?? null }
  );
  return data.advanceSession;
}

export async function getSession(sessionId: string): Promise<TastingSession | null> {
  const data = await run<{ getSession: TastingSession | null }>(
    `query($s: ID!) { getSession(sessionId: $s) { ${SESSION_FIELDS} } }`,
    { s: sessionId }
  );
  return data.getSession;
}

export async function joinSession(joinCode: string, displayName: string): Promise<Participant> {
  const data = await run<{ joinSession: Participant }>(
    `mutation($c: String!, $n: String!) { joinSession(joinCode: $c, displayName: $n) { sessionId participantId displayName joinedAt } }`,
    { c: joinCode, n: displayName }
  );
  return data.joinSession;
}

export async function submitRatingApi(input: {
  sessionId: string;
  participantId: string;
  bottleId: string;
  overall?: number;
  note?: string;
}): Promise<Rating> {
  const data = await run<{ submitRating: Rating }>(
    `mutation($i: RatingInput!) { submitRating(input: $i) { sessionId participantId bottleId overall note syncedAt } }`,
    { i: input }
  );
  return data.submitRating;
}

// ---- Cloud sync: profile + flights (account-scoped) ----
export interface CloudProfile { displayName: string; phone: string; notify: boolean; favorite: string }
export interface CloudFlight { id: string; title: string; subtitle: string; bottleIds: string[]; curated: boolean }

export async function getMyProfile(): Promise<CloudProfile> {
  const data = await run<{ getMyProfile: CloudProfile }>(
    `query { getMyProfile { displayName phone notify favorite } }`, {}, "userPool");
  return data.getMyProfile;
}
export async function saveMyProfileApi(input: CloudProfile): Promise<void> {
  await run(`mutation($i: ProfileInput!) { saveMyProfile(input: $i) { displayName } }`, { i: input }, "userPool");
}
export async function listMyFlightsApi(): Promise<CloudFlight[]> {
  const data = await run<{ listMyFlights: CloudFlight[] }>(
    `query { listMyFlights { id title subtitle bottleIds curated } }`, {}, "userPool");
  return data.listMyFlights ?? [];
}
export async function saveMyFlightApi(f: { id: string; title: string; subtitle: string; bottleIds: string[] }): Promise<void> {
  await run(`mutation($i: FlightInput!) { saveMyFlight(input: $i) { id } }`, { i: f }, "userPool");
}
// ---- Tasting history (account-synced) ----
export interface CloudTasting {
  id: string;
  flightId: string;
  title: string;
  bottleCount: number;
  avgScore: number;
  quizCorrect: number | null;
  quizTotal: number | null;
  mode: string;
  createdAt: string;
}
const TASTING_FIELDS = "id flightId title bottleCount avgScore quizCorrect quizTotal mode createdAt";
export async function listMyHistoryApi(): Promise<CloudTasting[]> {
  const data = await run<{ listMyHistory: CloudTasting[] }>(
    `query { listMyHistory { ${TASTING_FIELDS} } }`, {}, "userPool");
  return data.listMyHistory ?? [];
}
export async function saveMyTastingApi(t: CloudTasting): Promise<void> {
  await run(`mutation($i: TastingEntryInput!) { saveMyTasting(input: $i) { id } }`, { i: t }, "userPool");
}
export async function deleteMyTastingApi(id: string): Promise<void> {
  await run(`mutation($id: String!) { deleteMyTasting(id: $id) }`, { id }, "userPool");
}

// ---- Reminders (account-synced, delivered by the sweep Lambda) ----
export interface CloudReminder {
  id: string;
  title: string;
  message: string;
  when: string;
  channel: string; // "email" | "sms" | "both"
  email: string | null;
  phone: string | null;
}
const REMINDER_FIELDS = "id title message when channel email phone";
export async function listMyRemindersApi(): Promise<CloudReminder[]> {
  const data = await run<{ listMyReminders: CloudReminder[] }>(
    `query { listMyReminders { ${REMINDER_FIELDS} } }`, {}, "userPool");
  return data.listMyReminders ?? [];
}
export async function saveMyReminderApi(r: CloudReminder): Promise<void> {
  await run(`mutation($i: ReminderInput!) { saveMyReminder(input: $i) { id } }`, { i: r }, "userPool");
}
export async function deleteMyReminderApi(id: string): Promise<void> {
  await run(`mutation($id: String!) { deleteMyReminder(id: $id) }`, { id }, "userPool");
}

// ---- My Shelf (owned / wishlist / tasted) ----
export type ShelfStatus = "owned" | "wishlist" | "tasted";
export interface ShelfItem { bottleId: string; status: ShelfStatus; addedAt: string }
export async function listMyShelf(): Promise<ShelfItem[]> {
  const data = await run<{ listMyShelf: ShelfItem[] }>(`query { listMyShelf { bottleId status addedAt } }`, {}, "userPool");
  return data.listMyShelf ?? [];
}
export async function setShelf(bottleId: string, status: ShelfStatus | null): Promise<void> {
  await run(`mutation($b: ID!, $s: String) { setShelf(bottleId: $b, status: $s) }`, { b: bottleId, s: status }, "userPool");
}

// ---- Web Push subscriptions ----
export async function savePushSub(subscription: string): Promise<void> {
  await run(`mutation($s: String!) { savePushSub(subscription: $s) }`, { s: subscription }, "userPool");
}
export async function removePushSub(endpoint: string): Promise<void> {
  await run(`mutation($e: String!) { removePushSub(endpoint: $e) }`, { e: endpoint }, "userPool");
}
export async function adminTestPush(): Promise<boolean> {
  const data = await run<{ adminTestPush: boolean }>(`mutation { adminTestPush }`, {}, "userPool");
  return data.adminTestPush;
}

// ---- Favorites (account-synced) ----
export async function listMyFavoritesApi(): Promise<string[]> {
  const data = await run<{ listMyFavorites: string[] }>(`query { listMyFavorites }`, {}, "userPool");
  return data.listMyFavorites ?? [];
}
export async function setFavoriteApi(bottleId: string, on: boolean): Promise<void> {
  await run(`mutation($b: String!, $f: Boolean!) { setFavorite(bottleId: $b, favorited: $f) }`, { b: bottleId, f: on }, "userPool");
}

// ---- Admin user management (admins group only) ----
export interface AdminUserRow {
  username: string;
  email: string;
  status: string;
  enabled: boolean;
  createdAt: string;
  lastModified?: string | null;
  emailVerified?: boolean | null;
  isAdmin?: boolean | null;
}
export interface AdminUserPage {
  users: AdminUserRow[];
  nextToken: string | null;
}
export interface AdminUserDetail extends AdminUserRow {
  mfaEnabled: boolean;
  preferredMfa?: string | null;
  lastLogin?: string | null;
  loginCount?: number | null;
  isAdmin: boolean;
}
export type AdminUserActionName =
  | "resetPassword"
  | "disableUser"
  | "enableUser"
  | "deleteUser"
  | "addAdmin"
  | "removeAdmin"
  | "resendInvite"
  | "setTempPassword";

export async function adminListUsers(search?: string, nextToken?: string): Promise<AdminUserPage> {
  const data = await run<{ adminListUsers: AdminUserPage }>(
    `query($s: String, $t: String) { adminListUsers(search: $s, nextToken: $t) { users { username email status enabled createdAt lastModified emailVerified isAdmin } nextToken } }`,
    { s: search || null, t: nextToken || null },
    "userPool"
  );
  return data.adminListUsers ?? { users: [], nextToken: null };
}
export async function adminGetUser(username: string): Promise<AdminUserDetail> {
  const data = await run<{ adminGetUser: AdminUserDetail }>(
    `query($u: ID!) { adminGetUser(username: $u) { username email status enabled createdAt lastModified emailVerified mfaEnabled preferredMfa lastLogin loginCount isAdmin } }`,
    { u: username },
    "userPool"
  );
  return data.adminGetUser;
}
export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}
export async function adminAuditLog(limit = 100): Promise<AuditEntry[]> {
  const data = await run<{ adminAuditLog: AuditEntry[] }>(
    `query($l: Int) { adminAuditLog(limit: $l) { at actor action target detail } }`,
    { l: limit },
    "userPool"
  );
  return data.adminAuditLog ?? [];
}

// ---- Feedback ----
export interface FeedbackEntry {
  id: string;
  at: string;
  category: string;
  message: string;
  email: string | null;
  path: string | null;
}
// Public submit (API key) so guests and signed-out visitors can send feedback.
export async function submitFeedback(input: {
  category: string;
  message: string;
  email?: string;
  path?: string;
}): Promise<void> {
  await run(
    `mutation($c: String!, $m: String!, $e: String, $p: String) {
      submitFeedback(category: $c, message: $m, email: $e, path: $p)
    }`,
    { c: input.category, m: input.message, e: input.email || null, p: input.path || null }
  );
}
export async function adminListFeedback(limit = 200): Promise<FeedbackEntry[]> {
  const data = await run<{ adminListFeedback: FeedbackEntry[] }>(
    `query($l: Int) { adminListFeedback(limit: $l) { id at category message email path } }`,
    { l: limit },
    "userPool"
  );
  return data.adminListFeedback ?? [];
}

// ---- Page views (admin) ----
export interface PageViewRow {
  page: string;
  count: number;
}
export async function adminPageViews(): Promise<PageViewRow[]> {
  const data = await run<{ adminPageViews: PageViewRow[] }>(
    `query { adminPageViews { page count } }`,
    {},
    "userPool"
  );
  return data.adminPageViews ?? [];
}
export async function adminUserAction(username: string, action: AdminUserActionName, value?: string): Promise<void> {
  await run(
    `mutation($u: String!, $a: String!, $v: String) { adminUserAction(username: $u, action: $a, value: $v) }`,
    { u: username, a: action, v: value ?? null },
    "userPool"
  );
}
export async function adminPatchBottle(id: string, patch: { verified?: boolean; nom?: string; abv?: number; expression?: string; additiveFree?: boolean }): Promise<void> {
  await run(`mutation($id: ID!, $p: BottlePatch!) { adminPatchBottle(id: $id, patch: $p) { id } }`, { id, p: patch }, "userPool");
}
export async function adminDeleteBottle(id: string): Promise<void> {
  await run(`mutation($id: ID!) { adminDeleteBottle(id: $id) }`, { id }, "userPool");
}
// ---- Analytics (anonymous; backend keeps per-day totals only) ----
export async function trackApi(name: string, path?: string): Promise<void> {
  await run(`mutation($n: String!, $p: String) { track(name: $n, path: $p) }`, { n: name, p: path ?? null });
}
export interface AnalyticsDay {
  day: string;
  pageView: number;
  tastingStarted: number;
  scan: number;
  quizAnswer: number;
  reviewPublished: number;
  liveHosted: number;
}
export interface AlarmRow {
  name: string;
  state: string;
  reason: string;
  metric: string;
  updated: string;
}
export interface AiFeatureCost {
  feature: string; model: string;
  inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number;
  calls: number; cost: number;
}
export async function adminAiUsage(days = 30): Promise<AiFeatureCost[]> {
  const data = await run<{ adminAiUsage: AiFeatureCost[] }>(
    `query($d: Int) { adminAiUsage(days: $d) { feature model inputTokens outputTokens cacheReadTokens cacheWriteTokens calls cost } }`,
    { d: days }, "userPool"
  );
  return data.adminAiUsage ?? [];
}
export async function adminAlarms(): Promise<AlarmRow[]> {
  const data = await run<{ adminAlarms: AlarmRow[] }>(
    `query { adminAlarms { name state reason metric updated } }`,
    {},
    "userPool"
  );
  return data.adminAlarms ?? [];
}
export async function adminAnalytics(days = 14): Promise<AnalyticsDay[]> {
  const data = await run<{ adminAnalytics: AnalyticsDay[] }>(
    `query($d: Int) { adminAnalytics(days: $d) { day pageView tastingStarted scan quizAnswer reviewPublished liveHosted } }`,
    { d: days },
    "userPool"
  );
  return data.adminAnalytics ?? [];
}

export interface CostLine { name: string; amount: number }
export interface ModelCost {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  cost: number;
}
export interface AdminCosts {
  awsMonth: number;
  anthropicMonth: number;
  anthropicEstimate: number;
  budget: number;
  asOf: string;
  cached: boolean;
  awsByService: CostLine[];
  awsDaily: CostLine[];
  anthropicByModel: ModelCost[];
}
export async function adminCosts(refresh = false): Promise<AdminCosts> {
  const data = await run<{ adminCosts: AdminCosts }>(
    `query($r: Boolean) { adminCosts(refresh: $r) { awsMonth anthropicMonth anthropicEstimate budget asOf cached awsByService { name amount } awsDaily { name amount } anthropicByModel { model inputTokens outputTokens cacheReadTokens cacheWriteTokens cost } } }`,
    { r: refresh },
    "userPool"
  );
  return data.adminCosts;
}

// ---- Invites (email via Resend / SMS via Twilio) ----
export async function sendInvite(
  joinCode: string,
  opts: { email?: string; phone?: string }
): Promise<boolean> {
  const data = await run<{ sendInvite: boolean }>(
    `mutation($c: String!, $e: String, $p: String) { sendInvite(joinCode: $c, email: $e, phone: $p) }`,
    { c: joinCode, e: opts.email || null, p: opts.phone || null },
    "userPool"
  );
  return data.sendInvite;
}

export async function sendRecap(opts: {
  email?: string;
  phone?: string;
  subject?: string;
  html?: string;
  text?: string;
}): Promise<boolean> {
  const data = await run<{ sendRecap: boolean }>(
    `mutation($e: String, $p: String, $s: String, $h: String, $t: String) { sendRecap(email: $e, phone: $p, subject: $s, html: $h, text: $t) }`,
    { e: opts.email || null, p: opts.phone || null, s: opts.subject || null, h: opts.html || null, t: opts.text || null },
    "userPool"
  );
  return data.sendRecap;
}

// ---- Wine assistant ----
export async function askChat(
  message: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const data = await run<{ askChat: string }>(
    `mutation($m: String!, $h: String) { askChat(message: $m, history: $h) }`,
    { m: message, h: JSON.stringify(history.slice(-8)) }
  );
  return data.askChat;
}

export async function answerQuizApi(input: { sessionId: string; participantId: string; questionId: string; choiceIndex: number; correct: boolean; ms: number }): Promise<void> {
  await run(
    `mutation($s: ID!, $p: ID!, $q: ID!, $c: Int!, $ok: Boolean!, $ms: Int!) { answerQuiz(sessionId: $s, participantId: $p, questionId: $q, choiceIndex: $c, correct: $ok, ms: $ms) }`,
    { s: input.sessionId, p: input.participantId, q: input.questionId, c: input.choiceIndex, ok: input.correct, ms: input.ms }
  );
}
export interface LeaderboardRow { participantId: string; displayName: string; correct: number; total: number; avgMs: number }
export async function leaderboardApi(sessionId: string): Promise<LeaderboardRow[]> {
  const data = await run<{ leaderboard: LeaderboardRow[] }>(
    `query($s: ID!) { leaderboard(sessionId: $s) { participantId displayName correct total avgMs } }`,
    { s: sessionId }
  );
  return data.leaderboard ?? [];
}

// Subscriptions (Amplify returns an unsubscribable). Guests subscribe via API key.
export function subscribeSessionAdvanced(sessionId: string, cb: (s: TastingSession) => void) {
  const obs: any = client().graphql({
    query: `subscription($s: ID!) { onSessionAdvanced(sessionId: $s) { ${SESSION_FIELDS} } }`,
    variables: { s: sessionId },
  });
  return obs.subscribe({
    next: (e: any) => e?.data?.onSessionAdvanced && cb(e.data.onSessionAdvanced),
    error: () => {},
  });
}

export function subscribeRating(sessionId: string, cb: (r: Rating) => void) {
  const obs: any = client().graphql({
    query: `subscription($s: ID!) { onRatingSubmitted(sessionId: $s) { sessionId participantId bottleId overall note syncedAt } }`,
    variables: { s: sessionId },
  });
  return obs.subscribe({
    next: (e: any) => e?.data?.onRatingSubmitted && cb(e.data.onRatingSubmitted),
    error: () => {},
  });
}
