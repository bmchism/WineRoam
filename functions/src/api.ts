import { randomUUID, createHash } from "node:crypto";
import {
  SFNClient,
  StartExecutionCommand,
} from "@aws-sdk/client-sfn";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import webpush from "web-push";
import type {
  Bottle,
  Participant,
  Rating,
  Review,
  TastingSession,
  LeaderboardEntry,
  Flight,
} from "@agave/shared";
import {
  getItem,
  putItem,
  deleteItem,
  queryGsi1,
  queryPartition,
  scanByType,
  doc,
  UpdateCommand,
} from "./lib/ddb.js";
import { keys, TABLE } from "./lib/keys.js";
import { aggregateLeaderboard } from "./lib/leaderboard.js";

// Single AppSync Lambda resolver. Switches on the GraphQL field name. Direct
// DynamoDB access patterns; the bottle pipeline is kicked off via Step Functions.

const sfn = new SFNClient({});
const s3 = new S3Client({});
const cw = new CloudWatchClient({});
const smc = new SecretsManagerClient({});
let vapidReady = false;
async function ensureVapid(): Promise<boolean> {
  if (vapidReady) return true;
  const arn = process.env.VAPID_SECRET_ARN;
  if (!arn) return false;
  try {
    const out = await smc.send(new GetSecretValueCommand({ SecretId: arn }));
    const v = JSON.parse(out.SecretString || "{}");
    if (!v.publicKey || !v.privateKey) return false;
    webpush.setVapidDetails(v.subject || "mailto:admin@roamthrough.com", v.publicKey, v.privateKey);
    vapidReady = true;
    return true;
  } catch {
    return false;
  }
}
async function sendTestPush(uid: string): Promise<boolean> {
  if (!(await ensureVapid())) return false;
  const subs = await queryPartition<any>(`USER#${uid}`, "PUSHSUB#");
  if (!subs.length) return false;
  const payload = JSON.stringify({ title: "🌿 Tequila Roam", body: "Push notifications are working — salud!", url: "/home" });
  let ok = false;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      ok = true;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await deleteItem({ PK: s.PK, SK: s.SK });
    }
  }
  return ok;
}

interface AppSyncEvent {
  info: { fieldName: string };
  arguments: Record<string, any>;
  identity?: { sub?: string; username?: string; groups?: string[]; claims?: Record<string, unknown> };
}

function isAdmin(event: AppSyncEvent): boolean {
  const groups =
    event.identity?.groups ??
    (event.identity?.claims?.["cognito:groups"] as string[] | undefined) ??
    [];
  return Array.isArray(groups) && groups.includes("admins");
}

export const handler = async (event: AppSyncEvent): Promise<unknown> => {
  const { fieldName } = event.info;
  const a = event.arguments;
  switch (fieldName) {
    // ---- Queries ----
    case "listBottles":
      return stripKeys(await queryGsi1<Bottle>("BOTTLE"));
    case "bottlePopularity": {
      // Live favorite counts per bottle, tallied across all users — recomputed
      // each call so the ranking auto-reflects new favorites.
      const favs = await scanByType<{ bottleId?: string }>("Favorite");
      const counts = new Map<string, number>();
      for (const f of favs) {
        if (f.bottleId) counts.set(f.bottleId, (counts.get(f.bottleId) ?? 0) + 1);
      }
      return [...counts.entries()].map(([bottleId, count]) => ({ bottleId, count }));
    }
    case "getBottle":
      return stripOne(await getItem<Bottle>(keys.bottle(a.id)));
    case "getScanResult": {
      const ptr = await getItem<{ bottleId: string }>(keys.scan(a.imageKey));
      if (!ptr?.bottleId) return null;
      return stripOne(await getItem<Bottle>(keys.bottle(ptr.bottleId)));
    }
    case "listFlights":
      return queryGsi1("FLIGHT");
    case "getSession":
      return stripOne(await getItem<TastingSession>(keys.session(a.sessionId)));
    case "listParticipants":
      return stripKeys(await queryPartition<Participant>(`SESSION#${a.sessionId}`, "PART#"));
    case "listRatings":
      return stripKeys(
        await queryPartition<Rating>(`SESSION#${a.sessionId}`, `RATING#${a.bottleId}#`)
      );
    case "listReviews": {
      const all = await queryPartition<Review>(`BOTTLE#${a.bottleId}`, "REVIEW#");
      // Public only sees approved (or legacy un-moderated) reviews — pending/
      // flagged/blocked are held for the human moderator.
      return stripKeys(
        all.filter((r) => r.published && (r.moderation === "approved" || r.moderation == null))
      );
    }
    case "leaderboard":
      return leaderboard(a.sessionId);
    case "getMyProfile":
      return getMyProfile(requireUser(event));
    case "listMyFlights":
      return stripKeys(await queryPartition(`USER#${requireUser(event)}`, "FLIGHT#"));
    case "listMyHistory": {
      const rows = stripKeys(await queryPartition<any>(`USER#${requireUser(event)}`, "HIST#"));
      return rows.sort((x, y) => (y.createdAt || "").localeCompare(x.createdAt || ""));
    }
    case "listMyFavorites":
      return stripKeys(await queryPartition(`USER#${requireUser(event)}`, "FAV#")).map((f: any) => f.bottleId);
    case "listMyShelf":
      return stripKeys(await queryPartition<any>(`USER#${requireUser(event)}`, "SHELF#"))
        .map((s: any) => ({ bottleId: s.bottleId, status: s.status ?? "owned", addedAt: s.addedAt ?? "" }));
    case "listMyReminders": {
      const rows = stripKeys(await queryPartition<any>(`USER#${requireUser(event)}`, "REMIND#"));
      return rows.sort((x, y) => (x.when || "").localeCompare(y.when || ""));
    }
    case "adminAnalytics":
      if (!isAdmin(event)) throw new Error("admins only");
      return adminAnalytics(a.days ?? 14);
    case "adminPageViews":
      if (!isAdmin(event)) throw new Error("admins only");
      return adminPageViews();
    case "adminAiUsage": {
      if (!isAdmin(event)) throw new Error("admins only");
      const days = a.days ?? 30;
      const rows = (await queryPartition<any>("AICOST"))
        .sort((x, y) => (y.SK || "").localeCompare(x.SK || ""))
        .slice(0, days);
      const PRICE: Record<string, { in: number; out: number }> = {
        opus: { in: 15, out: 75 }, sonnet: { in: 3, out: 15 }, haiku: { in: 1, out: 5 },
      };
      const agg: Record<string, any> = {};
      for (const r of rows) {
        for (const [k, v] of Object.entries(r)) {
          const m = k.match(/^(.+)#(opus|sonnet|haiku)_(in|out|cr|cw|n)$/);
          if (!m || typeof v !== "number") continue;
          const key = `${m[1]}#${m[2]}`;
          const x = (agg[key] ??= { feature: m[1], model: m[2], inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, calls: 0 });
          if (m[3] === "in") x.inputTokens += v;
          else if (m[3] === "out") x.outputTokens += v;
          else if (m[3] === "cr") x.cacheReadTokens += v;
          else if (m[3] === "cw") x.cacheWriteTokens += v;
          else x.calls += v;
        }
      }
      return Object.values(agg).map((x: any) => {
        const p = PRICE[x.model];
        const cost = (x.inputTokens / 1e6) * p.in + (x.outputTokens / 1e6) * p.out +
          (x.cacheReadTokens / 1e6) * p.in * 0.1 + (x.cacheWriteTokens / 1e6) * p.in * 1.25;
        return { ...x, cost: Math.round(cost * 10000) / 10000 };
      }).sort((m: any, n: any) => n.cost - m.cost);
    }
    case "adminAlarms": {
      if (!isAdmin(event)) throw new Error("admins only");
      // Only this app's alarms (the AWS account is shared with other projects).
      const out = await cw.send(
        new DescribeAlarmsCommand({ AlarmTypes: ["MetricAlarm"], AlarmNamePrefix: "agave-", MaxRecords: 100 })
      );
      return (out.MetricAlarms ?? [])
        .map((al) => ({
          name: al.AlarmName ?? "",
          state: al.StateValue ?? "INSUFFICIENT_DATA",
          reason: al.StateReason ?? "",
          metric: [al.Namespace, al.MetricName].filter(Boolean).join(" / "),
          updated: al.StateUpdatedTimestamp?.toISOString() ?? "",
        }))
        .sort((x, y) => {
          const rank = (s: string) => (s === "ALARM" ? 0 : s === "INSUFFICIENT_DATA" ? 1 : 2);
          return rank(x.state) - rank(y.state) || x.name.localeCompare(y.name);
        });
    }
    case "listPendingReviews":
      if (!isAdmin(event)) throw new Error("admins only");
      return stripKeys(
        await scanByType<Review>("Review", {
          expr: "moderation = :p OR moderation = :f",
          values: { ":p": "pending", ":f": "flagged" },
        })
      );

    // ---- Mutations ----
    case "startSession":
      return startSession(a, event);
    case "advanceSession":
      return advanceSession(a);
    case "joinSession":
      return joinSession(a);
    case "submitRating":
      return submitRating(a.input);
    case "answerQuiz":
      return answerQuiz(a);
    case "track":
      return track(a.name, a.path);
    case "upsertReview":
      return upsertReview(a.input, event);
    case "setReviewModeration":
      if (!isAdmin(event)) throw new Error("admins only");
      return setReviewModeration(a.bottleId, a.userId, a.decision);
    case "adminPatchBottle":
      if (!isAdmin(event)) throw new Error("admins only");
      return adminPatchBottle(a.id, a.patch);
    case "adminDeleteBottle":
      if (!isAdmin(event)) throw new Error("admins only");
      await deleteItem(keys.bottle(a.id));
      return true;
    case "recognizeBottle":
      return recognizeBottle(a.imageKey);
    case "saveMyProfile":
      return saveMyProfile(requireUser(event), a.input);
    case "saveMyFlight":
      return saveMyFlight(requireUser(event), a.input);
    case "deleteMyFlight":
      return deleteMyFlight(requireUser(event), a.id);
    case "saveMyTasting":
      return saveMyTasting(requireUser(event), a.input);
    case "deleteMyTasting":
      await deleteItem(keys.userHistory(requireUser(event), a.id));
      return true;
    case "setFavorite":
      return setFavorite(requireUser(event), a.bottleId, a.favorited);
    case "setShelf":
      return setShelf(requireUser(event), a.bottleId, a.status);
    case "adminTestPush":
      if (!isAdmin(event)) throw new Error("admins only");
      return sendTestPush(requireUser(event));
    case "savePushSub":
      return savePushSub(requireUser(event), a.subscription);
    case "removePushSub":
      return removePushSub(requireUser(event), a.endpoint);
    case "saveMyReminder":
      return saveMyReminder(requireUser(event), a.input);
    case "deleteMyReminder":
      await deleteItem(keys.reminder(requireUser(event), a.id));
      return true;
    case "presignUpload":
      return presignUpload(a.bottleId, a.contentType);
    case "setBottleImage":
      return setBottleImage(a.bottleId, a.imageUrl);
    case "submitFeedback":
      return submitFeedback(a);

    default:
      throw new Error(`Unknown field: ${fieldName}`);
  }
};

// User feedback from the in-app pill. Public (API key) so guests and signed-out
// visitors can submit too; email is optional and supplied by the client. Stored
// under PK="FEEDBACK", SK="<iso>#<uuid>" so the admin reads newest-first.
async function submitFeedback(a: any): Promise<boolean> {
  const message = String(a.message ?? "").trim().slice(0, 4000);
  if (!message) throw new Error("message required");
  const at = new Date().toISOString();
  await putItem({
    PK: "FEEDBACK",
    SK: `${at}#${randomUUID()}`,
    type: "Feedback",
    category: String(a.category ?? "Other").slice(0, 40),
    message,
    email: a.email ? String(a.email).trim().slice(0, 200) : null,
    path: a.path ? String(a.path).slice(0, 200) : null,
    at,
  });
  return true;
}

async function startSession(a: any, event: AppSyncEvent): Promise<TastingSession> {
  const sessionId = randomUUID();
  const joinCode = randomUUID().slice(0, 4).toUpperCase();
  const now = new Date().toISOString();
  const session: TastingSession = {
    sessionId,
    tastingId: a.tastingId,
    hostId: event.identity?.sub ?? "host",
    joinCode,
    status: "lobby",
    pacing: a.pacing,
    visibility: a.visibility,
    currentStep: 0,
    createdAt: now,
  };
  await putItem({
    ...keys.session(sessionId),
    ...session,
    type: "Session",
    gsi1pk: `JOIN#${joinCode}`,
    gsi1sk: sessionId,
  });
  return session;
}

async function advanceSession(a: any): Promise<TastingSession> {
  const existing = await getItem<TastingSession>(keys.session(a.sessionId));
  if (!existing) throw new Error("session not found");
  const updated: TastingSession = {
    ...existing,
    currentStep: a.step,
    status: a.status ?? existing.status,
  };
  await putItem({
    ...keys.session(a.sessionId),
    ...updated,
    type: "Session",
    gsi1pk: `JOIN#${existing.joinCode}`,
    gsi1sk: a.sessionId,
  });
  return updated; // @aws_subscribe pushes this to onSessionAdvanced
}

async function joinSession(a: any): Promise<Participant> {
  const [found] = await queryGsi1<TastingSession>(`JOIN#${a.joinCode}`);
  if (!found) throw new Error("invalid join code");
  const participant: Participant = {
    sessionId: found.sessionId,
    participantId: randomUUID(),
    displayName: a.displayName,
    accountId: null,
    joinedAt: new Date().toISOString(),
  };
  await putItem({
    ...keys.participant(found.sessionId, participant.participantId),
    ...participant,
    type: "Participant",
  });
  return participant;
}

async function submitRating(input: any): Promise<Rating> {
  const rating: Rating = { ...input, syncedAt: new Date().toISOString() };
  await putItem({
    ...keys.rating(input.sessionId, input.bottleId, input.participantId),
    ...rating,
    type: "Rating",
  });
  return rating;
}

async function answerQuiz(a: any): Promise<boolean> {
  await putItem({
    ...keys.quizResponse(a.sessionId, a.participantId, a.questionId),
    sessionId: a.sessionId,
    participantId: a.participantId,
    questionId: a.questionId,
    choiceIndex: a.choiceIndex,
    correct: a.correct ?? false,
    ms: a.ms,
    type: "QuizResponse",
  });
  return true;
}

// Privacy-respecting analytics: increments an anonymous per-day counter for the
// named event. No user id, IP, or PII is stored — just totals (e.g. evt_page_view).
const ANALYTICS_EVENTS = new Set([
  "page_view",
  "tasting_started",
  "scan",
  "quiz_answer",
  "review_published",
  "live_hosted",
]);
// Allowlisted normalized route patterns for per-page view counts. The client
// sends an already-normalized key (ids stripped → "/bottle/:id"); we accept only
// these to keep the partition bounded and store no per-user browsing path.
const PAGE_KEYS = new Set([
  "/", "/home", "/learn", "/learn/process", "/learn/distilleries", "/learn/:slug",
  "/distillery/:nom", "/catalog", "/bottle/:id", "/scan", "/tastings",
  "/tastings/build", "/flight/:id", "/taste/:id/setup", "/taste/:id",
  "/taste/:id/quiz", "/taste/:id/recap", "/host/:id", "/join/:code", "/shared",
  "/profile", "/admin", "/about", "/faq", "/privacy", "/terms", "/responsible",
  "/contact", "/other",
]);

async function track(name: string, path?: string): Promise<boolean> {
  if (!ANALYTICS_EVENTS.has(name)) return false;
  const day = new Date().toISOString().slice(0, 10);
  await doc.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: keys.analytics(day),
      UpdateExpression: "ADD #c :one SET #t = :t, #d = :day",
      ExpressionAttributeNames: { "#c": `evt_${name}`, "#t": "type", "#d": "day" },
      ExpressionAttributeValues: { ":one": 1, ":t": "Analytics", ":day": day },
    })
  );
  // Aggregate (anonymous) per-page view counts — page_view only, allowlisted key.
  if (name === "page_view" && path && PAGE_KEYS.has(path)) {
    await doc
      .send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { PK: "PAGEVIEWS", SK: path },
          UpdateExpression: "ADD #c :one SET #t = :t",
          ExpressionAttributeNames: { "#c": "count", "#t": "type" },
          ExpressionAttributeValues: { ":one": 1, ":t": "PageView" },
        })
      )
      .catch(() => {});
  }
  return true;
}

async function adminPageViews(): Promise<{ page: string; count: number }[]> {
  const rows = await queryPartition<any>("PAGEVIEWS", "");
  return rows
    .map((r) => ({ page: r.SK as string, count: (r.count as number) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

interface AnalyticsDay {
  day: string;
  pageView: number;
  tastingStarted: number;
  scan: number;
  quizAnswer: number;
  reviewPublished: number;
  liveHosted: number;
}
async function adminAnalytics(days: number): Promise<AnalyticsDay[]> {
  const rows = await queryPartition<any>("ANALYTICS", "");
  return rows
    .map((r) => ({
      day: r.day ?? r.SK,
      pageView: r.evt_page_view ?? 0,
      tastingStarted: r.evt_tasting_started ?? 0,
      scan: r.evt_scan ?? 0,
      quizAnswer: r.evt_quiz_answer ?? 0,
      reviewPublished: r.evt_review_published ?? 0,
      liveHosted: r.evt_live_hosted ?? 0,
    }))
    .sort((a, b) => b.day.localeCompare(a.day))
    .slice(0, Math.max(1, Math.min(days, 90)));
}

async function upsertReview(input: any, event: AppSyncEvent): Promise<Review> {
  const userId = event.identity?.sub;
  if (!userId) throw new Error("auth required");
  const review: Review = {
    bottleId: input.bottleId,
    userId,
    displayName: (event.identity?.claims?.["name"] as string) ?? "Member",
    body: input.body,
    score: input.score,
    aroma: input.aroma,
    palate: input.palate,
    finish: input.finish,
    published: input.published,
    moderation: input.published ? "pending" : undefined,
    createdAt: new Date().toISOString(),
  };
  await putItem({ ...keys.review(input.bottleId, userId), ...review, type: "Review" });
  return review;
}

async function recognizeBottle(imageKey: string): Promise<Bottle | null> {
  const arn = process.env.PIPELINE_ARN;
  if (!arn) throw new Error("PIPELINE_ARN not set");
  await sfn.send(
    new StartExecutionCommand({ stateMachineArn: arn, input: JSON.stringify({ imageKey }) })
  );
  // Async: the client subscribes / re-queries once the pipeline writes the bottle.
  return null;
}

// Presign a PUT so the browser can upload a bottle photo straight to S3. Photos
// live under media/ and are served (cached) via CloudFront at APP_ORIGIN/media/...
async function presignUpload(bottleId: string, contentType: string) {
  const bucket = process.env.UPLOAD_BUCKET!;
  const ext = (contentType.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const key = `media/${slugId(bottleId)}/${randomUUID()}.${ext}`;
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );
  const origin = process.env.APP_ORIGIN || "";
  return { uploadUrl, key, publicUrl: `${origin}/${key}` };
}

// Persist a photo URL on the bottle (cached for future views).
async function setBottleImage(bottleId: string, imageUrl: string): Promise<Bottle> {
  const b = await getItem<Bottle>(keys.bottle(bottleId));
  if (!b) throw new Error("bottle not found");
  const updated = { ...b, imageUrl, updatedAt: new Date().toISOString() };
  await putItem({ ...keys.bottle(bottleId), ...updated, type: "Bottle", gsi1pk: "BOTTLE", gsi1sk: b.name });
  return stripOne(updated) as Bottle;
}

function slugId(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "misc";
}

// Human moderator decision: approve (publish) or block (hide) a review.
async function setReviewModeration(bottleId: string, userId: string, decision: string): Promise<Review> {
  const r = await getItem<Review>(keys.review(bottleId, userId));
  if (!r) throw new Error("review not found");
  const approve = decision === "approve";
  const updated: Review = { ...r, moderation: approve ? "approved" : "blocked", published: approve };
  await putItem({ ...keys.review(bottleId, userId), ...updated, type: "Review" });
  return stripOne(updated) as Review;
}

const ACCENTS: Record<string, string> = {
  Blanco: "#7FA15A", "High Proof Blanco": "#5E8C4E", Reposado: "#C28A3D",
  "Añejo": "#A66A33", "Extra Añejo": "#8C4A2F", Cristalino: "#9AA7B2",
};
// Admin edit of an enriched bottle (verify/correct fields).
async function adminPatchBottle(id: string, patch: any): Promise<Bottle> {
  const b = await getItem<Bottle>(keys.bottle(id));
  if (!b) throw new Error("bottle not found");
  const next: Bottle = { ...b };
  if (typeof patch.verified === "boolean") next.verified = patch.verified;
  if (typeof patch.additiveFree === "boolean") next.additiveFree = patch.additiveFree;
  if (patch.nom) next.nom = String(patch.nom);
  if (typeof patch.abv === "number") { next.abv = patch.abv; next.proof = Math.round(patch.abv * 2); }
  if (patch.expression && ACCENTS[patch.expression]) { next.expression = patch.expression; next.accent = ACCENTS[patch.expression]; }
  next.updatedAt = new Date().toISOString();
  await putItem({ ...keys.bottle(id), ...next, type: "Bottle", gsi1pk: "BOTTLE", gsi1sk: next.name });
  return stripOne(next) as Bottle;
}

function requireUser(event: AppSyncEvent): string {
  const sub = event.identity?.sub;
  if (!sub) throw new Error("auth required");
  return sub;
}

interface ProfileData { displayName: string; phone: string; notify: boolean; favorite: string }
async function getMyProfile(uid: string): Promise<ProfileData> {
  const p = await getItem<ProfileData>(keys.profile(uid));
  return { displayName: p?.displayName ?? "", phone: p?.phone ?? "", notify: p?.notify ?? false, favorite: p?.favorite ?? "" };
}
async function saveMyProfile(uid: string, input: Partial<ProfileData>): Promise<ProfileData> {
  const profile: ProfileData = {
    displayName: input.displayName ?? "",
    phone: input.phone ?? "",
    notify: input.notify ?? false,
    favorite: input.favorite ?? "",
  };
  await putItem({ ...keys.profile(uid), ...profile, type: "Profile" });
  return profile;
}
async function saveMyFlight(uid: string, input: { id: string; title: string; subtitle: string; bottleIds: string[] }): Promise<Flight> {
  const flight: Flight = { id: input.id, title: input.title, subtitle: input.subtitle, bottleIds: input.bottleIds, curated: false };
  await putItem({ ...keys.userFlight(uid, input.id), ...flight, type: "UserFlight" });
  return flight;
}
async function deleteMyFlight(uid: string, id: string): Promise<boolean> {
  await deleteItem(keys.userFlight(uid, id));
  return true;
}

interface TastingEntry {
  id: string;
  flightId: string;
  title: string;
  bottleCount: number;
  avgScore: number;
  quizCorrect?: number | null;
  quizTotal?: number | null;
  mode: string;
  createdAt: string;
}
async function saveMyTasting(uid: string, input: TastingEntry): Promise<TastingEntry> {
  const entry: TastingEntry = {
    id: input.id,
    flightId: input.flightId,
    title: input.title,
    bottleCount: input.bottleCount,
    avgScore: input.avgScore,
    quizCorrect: input.quizCorrect ?? null,
    quizTotal: input.quizTotal ?? null,
    mode: input.mode,
    createdAt: input.createdAt,
  };
  await putItem({ ...keys.userHistory(uid, input.id), ...entry, type: "TastingHistory" });
  return entry;
}

async function setFavorite(uid: string, bottleId: string, on: boolean): Promise<boolean> {
  if (on) await putItem({ ...keys.favorite(uid, bottleId), bottleId, type: "Favorite" });
  else await deleteItem(keys.favorite(uid, bottleId));
  return on;
}

// Web Push subscription store (one row per browser endpoint, hashed for the SK).
function endpointHash(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 24);
}
async function savePushSub(uid: string, subscription?: string): Promise<boolean> {
  if (!subscription) return false;
  const sub = JSON.parse(subscription);
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return false;
  await putItem({
    ...keys.pushSub(uid, endpointHash(sub.endpoint)),
    type: "PushSub",
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    createdAt: new Date().toISOString(),
  });
  return true;
}
async function removePushSub(uid: string, endpoint?: string): Promise<boolean> {
  if (!endpoint) return false;
  await deleteItem(keys.pushSub(uid, endpointHash(endpoint)));
  return true;
}

// Shelf status: "owned" | "wishlist" | "tasted" — or empty/null to remove.
async function setShelf(uid: string, bottleId: string, status?: string): Promise<boolean> {
  const valid = ["owned", "wishlist", "tasted"];
  if (status && valid.includes(status)) {
    await putItem({ ...keys.shelf(uid, bottleId), bottleId, status, type: "Shelf", addedAt: new Date().toISOString() });
    return true;
  }
  await deleteItem(keys.shelf(uid, bottleId));
  return false;
}

interface ReminderData {
  id: string;
  title: string;
  message: string;
  when: string; // ISO datetime
  channel: string; // "email" | "sms" | "both"
  email?: string | null;
  phone?: string | null;
}
async function saveMyReminder(uid: string, input: ReminderData): Promise<ReminderData> {
  const r: ReminderData = {
    id: input.id,
    title: input.title,
    message: input.message,
    when: input.when,
    channel: input.channel,
    email: input.email ?? null,
    phone: input.phone ?? null,
  };
  // gsi1pk groups all reminders so the sweep Lambda can find due ones; gsi1sk is
  // the fire time so they sort chronologically. userId lets the sweep delete it.
  await putItem({
    ...keys.reminder(uid, r.id),
    ...r,
    userId: uid,
    type: "Reminder",
    gsi1pk: "REMINDER",
    gsi1sk: r.when,
  });
  return r;
}

async function leaderboard(sessionId: string): Promise<LeaderboardEntry[]> {
  const responses = await queryPartition<any>(`SESSION#${sessionId}`, "QRESP#");
  const parts = await queryPartition<Participant>(`SESSION#${sessionId}`, "PART#");
  const names = new Map(parts.map((p) => [p.participantId, p.displayName]));
  return aggregateLeaderboard(responses, names);
}

// Hide internal PK/SK/gsi attributes from API responses.
function stripKeys<T extends Record<string, any>>(items: T[]): T[] {
  return items.map(stripOne).filter(Boolean) as T[];
}
function stripOne<T extends Record<string, any>>(item: T | undefined): T | undefined {
  if (!item) return undefined;
  const { PK, SK, gsi1pk, gsi1sk, type, ...rest } = item;
  return rest as T;
}
