import { describe, it, expect } from "vitest";
import { dueReminders } from "../reminders.js";

const now = "2026-06-03T12:00:00.000Z";

describe("dueReminders", () => {
  it("includes reminders whose time has passed", () => {
    const r = { id: "a", when: "2026-06-03T11:59:00.000Z" };
    expect(dueReminders([r], now)).toEqual([r]);
  });

  it("includes a reminder due exactly now (inclusive boundary)", () => {
    const r = { id: "a", when: now };
    expect(dueReminders([r], now)).toEqual([r]);
  });

  it("excludes future reminders", () => {
    const r = { id: "a", when: "2026-06-03T12:00:00.001Z" };
    expect(dueReminders([r], now)).toEqual([]);
  });

  it("partitions a mixed batch", () => {
    const all = [
      { id: "past", when: "2026-06-01T00:00:00.000Z" },
      { id: "future", when: "2026-12-31T00:00:00.000Z" },
      { id: "boundary", when: now },
    ];
    expect(dueReminders(all, now).map((r) => r.id)).toEqual(["past", "boundary"]);
  });

  it("returns empty for no reminders", () => {
    expect(dueReminders([], now)).toEqual([]);
  });
});
