import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { getItem, putItem } from "./lib/ddb.js";

// cost-api: month-to-date AWS spend (Cost Explorer, grouped by service) +
// Anthropic spend broken out per model (org usage_report tokens × a price map),
// with the org cost_report total kept as a ground-truth check. Results are
// cached in DynamoDB (PK="COST") for 6h so the dashboard never hammers the
// Cost Explorer ($0.01/call) or Anthropic APIs on every load; ?refresh bypasses.

const ce = new CostExplorerClient({ region: "us-east-1" });
const sm = new SecretsManagerClient({});

const CACHE_KEY = { PK: "COST", SK: "MTD" };
const CACHE_MS = 6 * 3600 * 1000;

interface AppSyncEvent {
  arguments?: { refresh?: boolean };
  identity?: { groups?: string[]; claims?: Record<string, unknown> };
}

// ---------------------------------------------------- pricing (pure, testable)
// Per-million-token list prices. Override the whole table via the
// ANTHROPIC_PRICES env var (JSON keyed by opus/sonnet/haiku) if prices drift.
export interface ModelPrice {
  input: number;
  output: number;
  cacheReadMult: number;
  cacheWriteMult: number;
}
const DEFAULT_PRICES: Record<string, ModelPrice> = {
  opus: { input: 15, output: 75, cacheReadMult: 0.1, cacheWriteMult: 1.25 },
  sonnet: { input: 3, output: 15, cacheReadMult: 0.1, cacheWriteMult: 1.25 },
  haiku: { input: 1, output: 5, cacheReadMult: 0.1, cacheWriteMult: 1.25 },
};

// Web search is a flat server-tool charge ($10 per 1,000 requests), not a
// token cost — folded into the owning model's row so per-model totals reconcile.
const WEB_SEARCH_USD_PER_REQUEST = 10 / 1000;

export function loadPrices(): Record<string, ModelPrice> {
  const raw = process.env.ANTHROPIC_PRICES;
  if (!raw) return DEFAULT_PRICES;
  try {
    return { ...DEFAULT_PRICES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRICES;
  }
}

export function priceFor(model: string, table = loadPrices()): ModelPrice {
  const m = (model || "").toLowerCase();
  if (m.includes("opus")) return table.opus;
  if (m.includes("haiku")) return table.haiku;
  // sonnet is the safe mid-range default for unknown/blended labels.
  return table.sonnet;
}

export interface ModelTokens {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  webSearches?: number;
}
export interface ModelCost extends ModelTokens {
  cost: number;
}

export function modelCost(t: ModelTokens, table = loadPrices()): number {
  const p = priceFor(t.model, table);
  const c =
    (t.inputTokens / 1e6) * p.input +
    (t.outputTokens / 1e6) * p.output +
    (t.cacheReadTokens / 1e6) * p.input * p.cacheReadMult +
    (t.cacheWriteTokens / 1e6) * p.input * p.cacheWriteMult +
    (t.webSearches ?? 0) * WEB_SEARCH_USD_PER_REQUEST;
  return Math.round(c * 10000) / 10000;
}

function pick(r: any, keys: string[]): number {
  for (const k of keys) {
    const v = r?.[k];
    if (typeof v === "number") return v;
  }
  return 0;
}

// Tolerant parse of the Anthropic usage_report (shape evolves): accumulate
// tokens per model across every result row in every time bucket.
export function parseUsageReport(json: any): ModelTokens[] {
  const acc: Record<string, ModelTokens> = {};
  const buckets: any[] = json?.data ?? [];
  for (const b of buckets) {
    const rows: any[] = b?.results ?? (Array.isArray(b) ? b : [b]);
    for (const r of rows) {
      const model = r?.model ?? r?.group?.model ?? "unknown";
      const a = (acc[model] ??= {
        model,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        webSearches: 0,
      });
      a.inputTokens += pick(r, ["uncached_input_tokens", "input_tokens"]);
      a.outputTokens += pick(r, ["output_tokens"]);
      a.cacheReadTokens += pick(r, ["cache_read_input_tokens"]);
      // cache_creation is a nested object in the current usage_report shape
      // ({ephemeral_5m_input_tokens, ephemeral_1h_input_tokens}); older shapes
      // exposed a flat cache_creation_input_tokens. Sum whichever is present.
      const cc = r?.cache_creation;
      a.cacheWriteTokens +=
        cc && typeof cc === "object"
          ? pick(cc, ["ephemeral_5m_input_tokens"]) +
            pick(cc, ["ephemeral_1h_input_tokens"])
          : pick(r, ["cache_creation_input_tokens"]);
      a.webSearches! += pick(r?.server_tool_use ?? {}, ["web_search_requests"]);
    }
  }
  return Object.values(acc).filter(
    (m) =>
      m.inputTokens ||
      m.outputTokens ||
      m.cacheReadTokens ||
      m.cacheWriteTokens ||
      m.webSearches
  );
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function parseAwsByService(out: any): { name: string; amount: number }[] {
  const groups = out?.ResultsByTime?.[0]?.Groups ?? [];
  return groups
    .map((g: any) => ({
      name: g?.Keys?.[0] ?? "Unknown",
      amount: round2(parseFloat(g?.Metrics?.UnblendedCost?.Amount ?? "0")),
    }))
    .filter((x: any) => x.amount > 0)
    .sort((a: any, b: any) => b.amount - a.amount);
}

export function parseAwsDaily(out: any): { name: string; amount: number }[] {
  const r = out?.ResultsByTime ?? [];
  return r.map((d: any) => ({
    name: d?.TimePeriod?.Start ?? "",
    amount: round2(parseFloat(d?.Total?.UnblendedCost?.Amount ?? "0")),
  }));
}

// ---------------------------------------------------- handler
export const handler = async (event: AppSyncEvent) => {
  const groups =
    event?.identity?.groups ??
    (event?.identity?.claims?.["cognito:groups"] as string[] | undefined) ??
    [];
  if (!groups.includes("admins")) throw new Error("admins only");

  const refresh = !!event?.arguments?.refresh;
  if (!refresh) {
    const cached = await getItem<any>(CACHE_KEY).catch(() => undefined);
    if (cached?.payload && cached.freshUntil > Date.now()) {
      return { ...cached.payload, cached: true };
    }
  }

  const range = monthRange();
  const [byService, daily, models, anthropicTotal] = await Promise.all([
    awsByService(range),
    awsDaily(range),
    anthropicByModel(range),
    anthropicTotalCost(range),
  ]);

  const awsMonth = round2(byService.reduce((s, x) => s + x.amount, 0));
  const anthropicEstimate = round2(models.reduce((s, m) => s + m.cost, 0));
  const payload = {
    awsMonth,
    // Prefer the org cost_report (authoritative) when present; fall back to the
    // per-model estimate so the budget bar is never blank.
    anthropicMonth: anthropicTotal || anthropicEstimate,
    anthropicEstimate,
    budget: Number(process.env.MONTHLY_BUDGET ?? 30),
    asOf: new Date().toISOString(),
    cached: false,
    awsByService: byService,
    awsDaily: daily,
    anthropicByModel: models,
  };

  await putItem({
    ...CACHE_KEY,
    type: "CostCache",
    payload,
    freshUntil: Date.now() + CACHE_MS,
  }).catch(() => {});

  return payload;
};

function monthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  // Cost Explorer End is exclusive; use tomorrow to include today.
  const end = new Date(now.getTime() + 24 * 3600 * 1000);
  return { Start: fmt(start), End: fmt(end) };
}

async function awsByService(range: { Start: string; End: string }) {
  const out = await ce.send(
    new GetCostAndUsageCommand({
      TimePeriod: range,
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
      GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
    })
  );
  return parseAwsByService(out);
}

async function awsDaily(range: { Start: string; End: string }) {
  const out = await ce.send(
    new GetCostAndUsageCommand({
      TimePeriod: range,
      Granularity: "DAILY",
      Metrics: ["UnblendedCost"],
    })
  );
  return parseAwsDaily(out);
}

async function adminKey(): Promise<string | null> {
  const arn = process.env.ANTHROPIC_ADMIN_SECRET_ARN;
  if (!arn) return null;
  const sec = await sm.send(new GetSecretValueCommand({ SecretId: arn }));
  const raw = sec.SecretString ?? "";
  const key = raw.startsWith("{") ? JSON.parse(raw).adminKey : raw;
  return key || null;
}

function anthHeaders(key: string) {
  return { "x-api-key": key, "anthropic-version": "2023-06-01" };
}

// Follow Anthropic cursor pagination, concatenating every page's `data` array.
async function anthFetchAll(baseUrl: string, key: string): Promise<any[]> {
  const data: any[] = [];
  let page: string | undefined;
  for (let i = 0; i < 12; i++) {
    const url = page
      ? `${baseUrl}&page=${encodeURIComponent(page)}`
      : baseUrl;
    const res = await fetch(url, { headers: anthHeaders(key) });
    if (!res.ok) break;
    const json: any = await res.json();
    if (Array.isArray(json?.data)) data.push(...json.data);
    if (!json?.has_more || !json?.next_page) break;
    page = json.next_page;
  }
  return data;
}

// When ANTHROPIC_WORKSPACE_ID is set, both Anthropic queries are scoped to that
// workspace so the dashboard reflects THIS app only — not the shared org. Unset
// = org-wide (legacy) behavior. cost_report has no workspace filter param, so it
// is grouped by workspace_id and we sum only the matching rows (see below).
const WORKSPACE_ID = process.env.ANTHROPIC_WORKSPACE_ID || "";

async function anthropicByModel(range: {
  Start: string;
}): Promise<ModelCost[]> {
  const key = await adminKey();
  if (!key) return [];
  try {
    const ws = WORKSPACE_ID
      ? `&workspace_ids[]=${encodeURIComponent(WORKSPACE_ID)}`
      : "";
    const base = `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${range.Start}T00:00:00Z&group_by[]=model${ws}`;
    const data = await anthFetchAll(base, key);
    const prices = loadPrices();
    return parseUsageReport({ data })
      .map((t) => ({ ...t, cost: modelCost(t, prices) }))
      .sort((a, b) => b.cost - a.cost);
  } catch {
    return [];
  }
}

async function anthropicTotalCost(range: { Start: string }): Promise<number> {
  const key = await adminKey();
  if (!key) return 0;
  try {
    // cost_report takes no workspace filter — group by workspace_id and keep
    // only our workspace's rows when scoping is enabled.
    const grp = WORKSPACE_ID ? `&group_by[]=workspace_id` : "";
    const base = `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${range.Start}T00:00:00Z${grp}`;
    const data = await anthFetchAll(base, key);
    const total = data.reduce((s, b: any) => {
      // Buckets may carry a flat amount or a nested results array.
      const rows: any[] = b?.results ?? [b];
      return (
        s +
        rows.reduce(
          (rs, r: any) =>
            WORKSPACE_ID && r?.workspace_id !== WORKSPACE_ID
              ? rs
              : rs + Number(r?.amount ?? r?.cost?.amount ?? 0),
          0
        )
      );
    }, 0);
    return round2(total);
  } catch {
    return 0;
  }
}
