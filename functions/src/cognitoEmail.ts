import {
  buildClient,
  CommitmentPolicy,
  KmsKeyringNode,
} from "@aws-crypto/client-node";
import { sendEmail } from "./lib/notify.js";

// Cognito CustomEmailSender trigger: Cognito hands us the verification code
// KMS-encrypted; we decrypt it and send a branded email via Resend.
//
// IMPORTANT: enabling this trigger disables Cognito's built-in emails. The
// Resend secret MUST be populated or sign-up/reset emails won't be delivered.

const { decrypt } = buildClient(CommitmentPolicy.FORBID_ENCRYPT_ALLOW_DECRYPT);

interface CustomEmailEvent {
  triggerSource: string;
  request: {
    code?: string;
    type?: string;
    userAttributes: Record<string, string>;
  };
}

async function decryptCode(code: string): Promise<string> {
  const keyring = new KmsKeyringNode({ keyIds: [process.env.KMS_KEY_ARN!] });
  const { plaintext } = await decrypt(keyring, Buffer.from(code, "base64"));
  return plaintext.toString("utf-8");
}

function copyFor(trigger: string, code: string) {
  const isReset = trigger.includes("ForgotPassword");
  const heading = isReset ? "Reset your password" : "Confirm your email";
  const line = isReset
    ? "Use this code to reset your Wine Roam password:"
    : "Welcome to Wine Roam! Use this code to confirm your email:";
  return {
    subject: isReset ? "Reset your Wine Roam password" : "Confirm your Wine Roam account",
    html: `<div style="font-family:sans-serif;line-height:1.5">
      <h2 style="font-family:Georgia,serif">${heading}</h2>
      <p>${line}</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#B5651D">${code}</p>
      <p style="color:#897a63;font-size:13px">If you didn't request this, you can ignore this email.</p>
    </div>`,
    text: `${line} ${code}`,
  };
}

export const handler = async (event: CustomEmailEvent): Promise<CustomEmailEvent> => {
  try {
    if (!event.request.code) return event;
    const email = event.request.userAttributes.email;
    if (!email) return event;
    const code = await decryptCode(event.request.code);
    const { subject, html, text } = copyFor(event.triggerSource, code);
    await sendEmail({ to: email, subject, html, text });
  } catch (err) {
    // Don't throw — a thrown trigger blocks the Cognito flow entirely.
    console.error("CustomEmailSender failed:", (err as Error).message);
  }
  return event;
};
