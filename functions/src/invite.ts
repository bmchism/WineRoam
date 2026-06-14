import { sendEmail, sendSms } from "./lib/notify.js";

// Resolver for invite + recap delivery. Dispatches on the GraphQL field name.
// Either channel (email/phone) is optional; returns true if at least one sent.

interface AppSyncEvent {
  info: { fieldName: string };
  arguments: Record<string, any>;
}

export const handler = async (event: AppSyncEvent): Promise<boolean> => {
  if (event.info.fieldName === "sendRecap") return sendRecap(event.arguments);
  return sendInvite(event.arguments);
};

async function sendInvite(a: any): Promise<boolean> {
  const origin = process.env.APP_ORIGIN || "https://wine.roamthrough.com";
  const url = `${origin}/join/${a.joinCode}`;
  const jobs: Promise<{ ok: boolean }>[] = [];
  if (a.email) {
    jobs.push(
      sendEmail({
        to: a.email,
        subject: "You're invited to a wine tasting 🌿",
        html: `<div style="font-family:sans-serif;line-height:1.5">
          <h2 style="font-family:Georgia,serif">A tasting awaits</h2>
          <p>You've been invited to join a live wine tasting on Wine Roam.</p>
          <p><a href="${url}" style="background:#B5651D;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block">Join the tasting →</a></p>
          <p style="color:#897a63;font-size:13px">Or use code <b>${a.joinCode}</b> at ${origin}</p>
        </div>`,
        text: `You're invited to a wine tasting. Join: ${url} (code ${a.joinCode})`,
      })
    );
  }
  if (a.phone) jobs.push(sendSms({ to: a.phone, body: `🌿 Join the wine tasting: ${url} (code ${a.joinCode})` }));
  if (jobs.length === 0) return false;
  return (await Promise.all(jobs)).some((r) => r.ok);
}

async function sendRecap(a: any): Promise<boolean> {
  const jobs: Promise<{ ok: boolean }>[] = [];
  if (a.email && a.html) {
    jobs.push(sendEmail({ to: a.email, subject: a.subject || "Your wine tasting recap 🌿", html: a.html, text: a.text }));
  }
  if (a.phone && a.text) jobs.push(sendSms({ to: a.phone, body: String(a.text).slice(0, 600) }));
  if (jobs.length === 0) return false;
  return (await Promise.all(jobs)).some((r) => r.ok);
}
