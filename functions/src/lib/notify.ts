import { getSecretJson } from "./secrets.js";

// Resend (email) + Twilio (SMS) senders. Both pull creds + from-address/number
// from Secrets Manager so the provider account is swappable without a redeploy.

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { apiKey, fromEmail } = await getSecretJson(process.env.RESEND_SECRET_ARN);
  if (!apiKey || !fromEmail) return { ok: false, error: "Resend not configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function sendSms(opts: { to: string; body: string }): Promise<{ ok: boolean; error?: string }> {
  const { accountSid, authToken, fromNumber } = await getSecretJson(process.env.TWILIO_SECRET_ARN);
  if (!accountSid || !authToken || !fromNumber) return { ok: false, error: "Twilio not configured" };
  try {
    const body = new URLSearchParams({ To: opts.to, From: fromNumber, Body: opts.body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );
    if (!res.ok) return { ok: false, error: `Twilio ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
