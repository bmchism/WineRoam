"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// functions/src/invite.ts
var invite_exports = {};
__export(invite_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(invite_exports);

// functions/src/lib/secrets.ts
var import_client_secrets_manager = require("@aws-sdk/client-secrets-manager");
var sm = new import_client_secrets_manager.SecretsManagerClient({});
var TTL_MS = 6e4;
var cache = /* @__PURE__ */ new Map();
async function getSecretJson(arn) {
  if (!arn) return {};
  const hit = cache.get(arn);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  try {
    const out = await sm.send(new import_client_secrets_manager.GetSecretValueCommand({ SecretId: arn }));
    const raw = out.SecretString ?? "{}";
    const parsed = raw.trim().startsWith("{") ? JSON.parse(raw) : { value: raw };
    cache.set(arn, { value: parsed, at: Date.now() });
    return parsed;
  } catch {
    return {};
  }
}

// functions/src/lib/notify.ts
async function sendEmail(opts) {
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
        text: opts.text
      })
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
async function sendSms(opts) {
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
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      }
    );
    if (!res.ok) return { ok: false, error: `Twilio ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// functions/src/invite.ts
var handler = async (event) => {
  if (event.info.fieldName === "sendRecap") return sendRecap(event.arguments);
  return sendInvite(event.arguments);
};
async function sendInvite(a) {
  const origin = process.env.APP_ORIGIN || "https://wine.roamthrough.com";
  const url = `${origin}/join/${a.joinCode}`;
  const jobs = [];
  if (a.email) {
    jobs.push(
      sendEmail({
        to: a.email,
        subject: "You're invited to a wine tasting \u{1F33F}",
        html: `<div style="font-family:sans-serif;line-height:1.5">
          <h2 style="font-family:Georgia,serif">A tasting awaits</h2>
          <p>You've been invited to join a live wine tasting on Wine Roam.</p>
          <p><a href="${url}" style="background:#B5651D;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block">Join the tasting \u2192</a></p>
          <p style="color:#897a63;font-size:13px">Or use code <b>${a.joinCode}</b> at ${origin}</p>
        </div>`,
        text: `You're invited to a wine tasting. Join: ${url} (code ${a.joinCode})`
      })
    );
  }
  if (a.phone) jobs.push(sendSms({ to: a.phone, body: `\u{1F33F} Join the wine tasting: ${url} (code ${a.joinCode})` }));
  if (jobs.length === 0) return false;
  return (await Promise.all(jobs)).some((r) => r.ok);
}
async function sendRecap(a) {
  const jobs = [];
  if (a.email && a.html) {
    jobs.push(sendEmail({ to: a.email, subject: a.subject || "Your wine tasting recap \u{1F33F}", html: a.html, text: a.text }));
  }
  if (a.phone && a.text) jobs.push(sendSms({ to: a.phone, body: String(a.text).slice(0, 600) }));
  if (jobs.length === 0) return false;
  return (await Promise.all(jobs)).some((r) => r.ok);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
