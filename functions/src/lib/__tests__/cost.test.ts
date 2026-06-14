import { describe, it, expect } from "vitest";
import {
  priceFor,
  modelCost,
  parseUsageReport,
  parseAwsByService,
  parseAwsDaily,
  loadPrices,
  type ModelTokens,
} from "../../costApi.js";

describe("priceFor", () => {
  const t = loadPrices();
  it("matches model family by substring", () => {
    expect(priceFor("claude-opus-4-8", t).output).toBe(75);
    expect(priceFor("claude-haiku-4-5", t).input).toBe(1);
    expect(priceFor("claude-sonnet-4-6", t).input).toBe(3);
  });
  it("falls back to sonnet for unknown labels", () => {
    expect(priceFor("mystery-model", t)).toEqual(t.sonnet);
  });
});

describe("modelCost", () => {
  it("prices input/output/cache tiers per million tokens", () => {
    const t: ModelTokens = {
      model: "claude-sonnet-4-6",
      inputTokens: 1_000_000, // 1M × $3
      outputTokens: 1_000_000, // 1M × $15
      cacheReadTokens: 1_000_000, // 1M × $3 × 0.1
      cacheWriteTokens: 1_000_000, // 1M × $3 × 1.25
    };
    // 3 + 15 + 0.3 + 3.75 = 22.05
    expect(modelCost(t)).toBeCloseTo(22.05, 4);
  });
  it("adds web search at $10 per 1,000 requests", () => {
    const t: ModelTokens = {
      model: "claude-haiku-4-5",
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      webSearches: 100, // 100 × $0.01 = $1
    };
    expect(modelCost(t)).toBeCloseTo(1, 4);
  });
  it("is zero for an empty model", () => {
    expect(
      modelCost({
        model: "claude-haiku-4-5",
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      })
    ).toBe(0);
  });
});

describe("parseUsageReport", () => {
  it("accumulates tokens per model across buckets, tolerant of field names", () => {
    const json = {
      data: [
        {
          results: [
            {
              model: "claude-haiku-4-5",
              uncached_input_tokens: 100,
              output_tokens: 50,
              cache_read_input_tokens: 10,
              cache_creation_input_tokens: 5,
            },
          ],
        },
        {
          results: [
            { model: "claude-haiku-4-5", uncached_input_tokens: 100, output_tokens: 50 },
            { model: "claude-opus-4-8", input_tokens: 200, output_tokens: 80 },
          ],
        },
      ],
    };
    const out = parseUsageReport(json).sort((a, b) => a.model.localeCompare(b.model));
    expect(out).toHaveLength(2);
    const haiku = out.find((m) => m.model.includes("haiku"))!;
    expect(haiku.inputTokens).toBe(200);
    expect(haiku.outputTokens).toBe(100);
    expect(haiku.cacheReadTokens).toBe(10);
    expect(haiku.cacheWriteTokens).toBe(5);
    const opus = out.find((m) => m.model.includes("opus"))!;
    expect(opus.inputTokens).toBe(200);
  });
  it("reads nested cache_creation and server_tool_use.web_search_requests", () => {
    const json = {
      data: [
        {
          results: [
            {
              model: "claude-sonnet-4-6",
              uncached_input_tokens: 100,
              output_tokens: 50,
              cache_read_input_tokens: 10,
              cache_creation: {
                ephemeral_5m_input_tokens: 1000,
                ephemeral_1h_input_tokens: 200,
              },
              server_tool_use: { web_search_requests: 7 },
            },
          ],
        },
      ],
    };
    const m = parseUsageReport(json)[0];
    expect(m.cacheWriteTokens).toBe(1200); // 1000 + 200, nested summed
    expect(m.webSearches).toBe(7);
  });
  it("keeps a web-search-only row (not dropped as empty)", () => {
    const json = {
      data: [{ results: [{ model: "claude-haiku-4-5", server_tool_use: { web_search_requests: 3 } }] }],
    };
    expect(parseUsageReport(json)).toHaveLength(1);
  });
  it("returns empty for no data", () => {
    expect(parseUsageReport({})).toEqual([]);
  });
});

describe("parseAwsByService", () => {
  it("maps groups, drops zero-cost, sorts descending", () => {
    const out = {
      ResultsByTime: [
        {
          Groups: [
            { Keys: ["AWS Lambda"], Metrics: { UnblendedCost: { Amount: "1.50" } } },
            { Keys: ["Amazon DynamoDB"], Metrics: { UnblendedCost: { Amount: "4.20" } } },
            { Keys: ["Free Thing"], Metrics: { UnblendedCost: { Amount: "0" } } },
          ],
        },
      ],
    };
    const lines = parseAwsByService(out);
    expect(lines).toEqual([
      { name: "Amazon DynamoDB", amount: 4.2 },
      { name: "AWS Lambda", amount: 1.5 },
    ]);
  });
});

describe("parseAwsDaily", () => {
  it("maps each day's total", () => {
    const out = {
      ResultsByTime: [
        { TimePeriod: { Start: "2026-06-01" }, Total: { UnblendedCost: { Amount: "0.30" } } },
        { TimePeriod: { Start: "2026-06-02" }, Total: { UnblendedCost: { Amount: "0.55" } } },
      ],
    };
    expect(parseAwsDaily(out)).toEqual([
      { name: "2026-06-01", amount: 0.3 },
      { name: "2026-06-02", amount: 0.55 },
    ]);
  });
});
