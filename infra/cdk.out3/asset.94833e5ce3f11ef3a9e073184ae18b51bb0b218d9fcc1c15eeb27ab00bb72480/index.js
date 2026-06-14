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

// functions/src/costApi.ts
var costApi_exports = {};
__export(costApi_exports, {
  handler: () => handler,
  loadPrices: () => loadPrices,
  modelCost: () => modelCost,
  parseAwsByService: () => parseAwsByService,
  parseAwsDaily: () => parseAwsDaily,
  parseUsageReport: () => parseUsageReport,
  priceFor: () => priceFor
});
module.exports = __toCommonJS(costApi_exports);
var import_client_cost_explorer = require("@aws-sdk/client-cost-explorer");
var import_client_secrets_manager = require("@aws-sdk/client-secrets-manager");

// functions/src/lib/ddb.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");

// functions/src/lib/keys.ts
var TABLE = process.env.TABLE_NAME ?? "AgaveTable";

// functions/src/lib/ddb.ts
var base = new import_client_dynamodb.DynamoDBClient({});
var doc = import_lib_dynamodb.DynamoDBDocumentClient.from(base, {
  marshallOptions: { removeUndefinedValues: true }
});
async function getItem(key) {
  const out = await doc.send(new import_lib_dynamodb.GetCommand({ TableName: TABLE, Key: key }));
  return out.Item;
}
async function putItem(item) {
  await doc.send(new import_lib_dynamodb.PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

// functions/src/costApi.ts
var ce = new import_client_cost_explorer.CostExplorerClient({ region: "us-east-1" });
var sm = new import_client_secrets_manager.SecretsManagerClient({});
var CACHE_KEY = { PK: "COST", SK: "MTD" };
var CACHE_MS = 6 * 3600 * 1e3;
var DEFAULT_PRICES = {
  opus: { input: 15, output: 75, cacheReadMult: 0.1, cacheWriteMult: 1.25 },
  sonnet: { input: 3, output: 15, cacheReadMult: 0.1, cacheWriteMult: 1.25 },
  haiku: { input: 1, output: 5, cacheReadMult: 0.1, cacheWriteMult: 1.25 }
};
var WEB_SEARCH_USD_PER_REQUEST = 10 / 1e3;
function loadPrices() {
  const raw = process.env.ANTHROPIC_PRICES;
  if (!raw) return DEFAULT_PRICES;
  try {
    return { ...DEFAULT_PRICES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRICES;
  }
}
function priceFor(model, table = loadPrices()) {
  const m = (model || "").toLowerCase();
  if (m.includes("opus")) return table.opus;
  if (m.includes("haiku")) return table.haiku;
  return table.sonnet;
}
function modelCost(t, table = loadPrices()) {
  const p = priceFor(t.model, table);
  const c = t.inputTokens / 1e6 * p.input + t.outputTokens / 1e6 * p.output + t.cacheReadTokens / 1e6 * p.input * p.cacheReadMult + t.cacheWriteTokens / 1e6 * p.input * p.cacheWriteMult + (t.webSearches ?? 0) * WEB_SEARCH_USD_PER_REQUEST;
  return Math.round(c * 1e4) / 1e4;
}
function pick(r, keys) {
  for (const k of keys) {
    const v = r?.[k];
    if (typeof v === "number") return v;
  }
  return 0;
}
function parseUsageReport(json) {
  const acc = {};
  const buckets = json?.data ?? [];
  for (const b of buckets) {
    const rows = b?.results ?? (Array.isArray(b) ? b : [b]);
    for (const r of rows) {
      const model = r?.model ?? r?.group?.model ?? "unknown";
      const a = acc[model] ??= {
        model,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        webSearches: 0
      };
      a.inputTokens += pick(r, ["uncached_input_tokens", "input_tokens"]);
      a.outputTokens += pick(r, ["output_tokens"]);
      a.cacheReadTokens += pick(r, ["cache_read_input_tokens"]);
      const cc = r?.cache_creation;
      a.cacheWriteTokens += cc && typeof cc === "object" ? pick(cc, ["ephemeral_5m_input_tokens"]) + pick(cc, ["ephemeral_1h_input_tokens"]) : pick(r, ["cache_creation_input_tokens"]);
      a.webSearches += pick(r?.server_tool_use ?? {}, ["web_search_requests"]);
    }
  }
  return Object.values(acc).filter(
    (m) => m.inputTokens || m.outputTokens || m.cacheReadTokens || m.cacheWriteTokens || m.webSearches
  );
}
var round2 = (n) => Math.round(n * 100) / 100;
function parseAwsByService(out) {
  const groups = out?.ResultsByTime?.[0]?.Groups ?? [];
  return groups.map((g) => ({
    name: g?.Keys?.[0] ?? "Unknown",
    amount: round2(parseFloat(g?.Metrics?.UnblendedCost?.Amount ?? "0"))
  })).filter((x) => x.amount > 0).sort((a, b) => b.amount - a.amount);
}
function parseAwsDaily(out) {
  const r = out?.ResultsByTime ?? [];
  return r.map((d) => ({
    name: d?.TimePeriod?.Start ?? "",
    amount: round2(parseFloat(d?.Total?.UnblendedCost?.Amount ?? "0"))
  }));
}
var handler = async (event) => {
  const groups = event?.identity?.groups ?? event?.identity?.claims?.["cognito:groups"] ?? [];
  if (!groups.includes("admins")) throw new Error("admins only");
  const refresh = !!event?.arguments?.refresh;
  if (!refresh) {
    const cached = await getItem(CACHE_KEY).catch(() => void 0);
    if (cached?.payload && cached.freshUntil > Date.now()) {
      return { ...cached.payload, cached: true };
    }
  }
  const range = monthRange();
  const [byService, daily, models, anthropicTotal] = await Promise.all([
    awsByService(range),
    awsDaily(range),
    anthropicByModel(range),
    anthropicTotalCost(range)
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
    asOf: (/* @__PURE__ */ new Date()).toISOString(),
    cached: false,
    awsByService: byService,
    awsDaily: daily,
    anthropicByModel: models
  };
  await putItem({
    ...CACHE_KEY,
    type: "CostCache",
    payload,
    freshUntil: Date.now() + CACHE_MS
  }).catch(() => {
  });
  return payload;
};
function monthRange() {
  const now = /* @__PURE__ */ new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const fmt = (d) => d.toISOString().slice(0, 10);
  const end = new Date(now.getTime() + 24 * 3600 * 1e3);
  return { Start: fmt(start), End: fmt(end) };
}
async function awsByService(range) {
  const out = await ce.send(
    new import_client_cost_explorer.GetCostAndUsageCommand({
      TimePeriod: range,
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
      GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }]
    })
  );
  return parseAwsByService(out);
}
async function awsDaily(range) {
  const out = await ce.send(
    new import_client_cost_explorer.GetCostAndUsageCommand({
      TimePeriod: range,
      Granularity: "DAILY",
      Metrics: ["UnblendedCost"]
    })
  );
  return parseAwsDaily(out);
}
async function adminKey() {
  const arn = process.env.ANTHROPIC_ADMIN_SECRET_ARN;
  if (!arn) return null;
  const sec = await sm.send(new import_client_secrets_manager.GetSecretValueCommand({ SecretId: arn }));
  const raw = sec.SecretString ?? "";
  const key = raw.startsWith("{") ? JSON.parse(raw).adminKey : raw;
  return key || null;
}
function anthHeaders(key) {
  return { "x-api-key": key, "anthropic-version": "2023-06-01" };
}
async function anthFetchAll(baseUrl, key) {
  const data = [];
  let page;
  for (let i = 0; i < 12; i++) {
    const url = page ? `${baseUrl}&page=${encodeURIComponent(page)}` : baseUrl;
    const res = await fetch(url, { headers: anthHeaders(key) });
    if (!res.ok) break;
    const json = await res.json();
    if (Array.isArray(json?.data)) data.push(...json.data);
    if (!json?.has_more || !json?.next_page) break;
    page = json.next_page;
  }
  return data;
}
var WORKSPACE_ID = process.env.ANTHROPIC_WORKSPACE_ID || "";
async function anthropicByModel(range) {
  const key = await adminKey();
  if (!key) return [];
  try {
    const ws = WORKSPACE_ID ? `&workspace_ids[]=${encodeURIComponent(WORKSPACE_ID)}` : "";
    const base2 = `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${range.Start}T00:00:00Z&group_by[]=model${ws}`;
    const data = await anthFetchAll(base2, key);
    const prices = loadPrices();
    return parseUsageReport({ data }).map((t) => ({ ...t, cost: modelCost(t, prices) })).sort((a, b) => b.cost - a.cost);
  } catch {
    return [];
  }
}
async function anthropicTotalCost(range) {
  const key = await adminKey();
  if (!key) return 0;
  try {
    const grp = WORKSPACE_ID ? `&group_by[]=workspace_id` : "";
    const base2 = `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${range.Start}T00:00:00Z${grp}`;
    const data = await anthFetchAll(base2, key);
    const total = data.reduce((s, b) => {
      const rows = b?.results ?? [b];
      return s + rows.reduce(
        (rs, r) => WORKSPACE_ID && r?.workspace_id !== WORKSPACE_ID ? rs : rs + Number(r?.amount ?? r?.cost?.amount ?? 0),
        0
      );
    }, 0);
    return round2(total);
  } catch {
    return 0;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler,
  loadPrices,
  modelCost,
  parseAwsByService,
  parseAwsDaily,
  parseUsageReport,
  priceFor
});
