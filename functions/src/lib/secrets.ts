import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

// Generic Secrets Manager JSON reader with a short-TTL per-ARN cache. The TTL
// lets us swap the underlying provider account (Resend, Twilio) by updating the
// secret value and have warm Lambda containers pick it up within TTL_MS — no
// code change or redeploy. (Without a TTL, a warm container would serve the
// first-fetched value forever, defeating the swap.)

const sm = new SecretsManagerClient({});
const TTL_MS = 60_000;
const cache = new Map<string, { value: Record<string, string>; at: number }>();

export async function getSecretJson(arn: string | undefined): Promise<Record<string, string>> {
  if (!arn) return {};
  const hit = cache.get(arn);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  try {
    const out = await sm.send(new GetSecretValueCommand({ SecretId: arn }));
    const raw = out.SecretString ?? "{}";
    const parsed = raw.trim().startsWith("{") ? JSON.parse(raw) : { value: raw };
    cache.set(arn, { value: parsed, at: Date.now() });
    return parsed;
  } catch {
    return {};
  }
}
