import webpush from "web-push";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { queryGsi1, queryPartition, deleteItem } from "./lib/ddb.js";
import { keys } from "./lib/keys.js";
import { sendEmail, sendSms } from "./lib/notify.js";
import { dueReminders } from "./lib/reminders.js";

const sm = new SecretsManagerClient({});
let vapidReady = false;
async function ensureVapid(): Promise<boolean> {
  if (vapidReady) return true;
  const arn = process.env.VAPID_SECRET_ARN;
  if (!arn) return false;
  try {
    const out = await sm.send(new GetSecretValueCommand({ SecretId: arn }));
    const v = JSON.parse(out.SecretString || "{}");
    if (!v.publicKey || !v.privateKey) return false;
    webpush.setVapidDetails(v.subject || "mailto:admin@roamthrough.com", v.publicKey, v.privateKey);
    vapidReady = true;
    return true;
  } catch {
    return false;
  }
}

interface PushRow { PK: string; SK: string; endpoint: string; p256dh: string; auth: string }
async function sendPush(userId: string, title: string, body: string, url: string): Promise<boolean> {
  const subs = await queryPartition<PushRow>(`USER#${userId}`, "PUSHSUB#");
  if (!subs.length || !(await ensureVapid())) return false;
  const payload = JSON.stringify({ title, body, url });
  let ok = false;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      ok = true;
    } catch (e: any) {
      // Expired/invalid subscription — prune it.
      if (e?.statusCode === 404 || e?.statusCode === 410) await deleteItem({ PK: s.PK, SK: s.SK });
    }
  }
  return ok;
}

// Runs on an EventBridge schedule (every 15 min). Finds reminders whose fire
// time has passed, delivers them via the configured channel (Resend/Twilio),
// and removes them so they fire exactly once. Small-scale by design — friends &
// family — so a single grouped query is plenty.

interface Reminder {
  id: string;
  userId: string;
  title: string;
  message: string;
  when: string;
  channel: string;
  email?: string | null;
  phone?: string | null;
}

const APP_ORIGIN = process.env.APP_ORIGIN || "https://wine.roamthrough.com";

export const handler = async (): Promise<{ sent: number }> => {
  const now = new Date().toISOString();
  const all = await queryGsi1<Reminder>("REMINDER");
  const due = dueReminders(all, now);

  let sent = 0;
  for (const r of due) {
    const wantEmail = r.channel === "email" || r.channel === "both";
    const wantSms = r.channel === "sms" || r.channel === "both";
    const jobs: Promise<{ ok: boolean }>[] = [];
    if (wantEmail && r.email) {
      jobs.push(
        sendEmail({
          to: r.email,
          subject: `🌿 ${r.title}`,
          html: `<div style="font-family:sans-serif;line-height:1.5">
            <h2 style="font-family:Georgia,serif">${escapeHtml(r.title)}</h2>
            <p>${escapeHtml(r.message)}</p>
            <p><a href="${APP_ORIGIN}/tastings" style="background:#B5651D;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block">Open Wine Roam →</a></p>
          </div>`,
          text: `${r.title}\n\n${r.message}\n\n${APP_ORIGIN}/tastings`,
        })
      );
    }
    if (wantSms && r.phone) {
      jobs.push(sendSms({ to: r.phone, body: `🌿 ${r.title}: ${r.message} — ${APP_ORIGIN}/tastings` }));
    }

    let delivered = false;
    if (jobs.length) {
      const results = await Promise.all(jobs);
      if (results.some((x) => x.ok)) delivered = true;
      else console.error("reminder send failed", r.id, r.channel, JSON.stringify(results));
    }
    // Web Push (in addition to email/SMS) to any browsers the user subscribed.
    if (await sendPush(r.userId, r.title, r.message, `${APP_ORIGIN}/tastings`)) delivered = true;
    if (delivered) sent += 1;
    // Remove whether or not delivery succeeded — avoids retry storms if a
    // provider is misconfigured. (Friends-and-family tolerance.)
    await deleteItem(keys.reminder(r.userId, r.id));
  }
  return { sent };
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}
