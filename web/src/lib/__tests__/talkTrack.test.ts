import { describe, it, expect } from "vitest";
import { hostScript, ritualSteps } from "../talkTrack";
import { bottles } from "../../data/bottles";

const b = bottles[0];

describe("hostScript", () => {
  it("opens with the pour position and bottle identity", () => {
    const lines = hostScript(b, 2, 5);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toContain("Pour 2 of 5");
    expect(lines[0]).toContain(b.name);
  });

  it("always closes with the pour instruction", () => {
    const lines = hostScript(b, 1, 3);
    expect(lines[lines.length - 1].toLowerCase()).toContain("pour about an ounce");
  });

  it("never emits empty lines", () => {
    for (const line of hostScript(b, 1, 4)) {
      expect(line.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("ritualSteps", () => {
  it("returns the five sensory stages in order", () => {
    const steps = ritualSteps(b);
    expect(steps.map((s) => s.key)).toEqual(["look", "swirl", "smell", "sip", "finish"]);
  });

  it("pulls hunt chips from the bottle's aromas and flavors", () => {
    const steps = ritualSteps(b);
    const smell = steps.find((s) => s.key === "smell")!;
    const sip = steps.find((s) => s.key === "sip")!;
    expect(smell.hunt).toEqual(b.aromas.slice(0, 5));
    expect(sip.hunt).toEqual(b.flavors.slice(0, 5));
  });

  it("gives every step a title and a spoken line", () => {
    for (const s of ritualSteps(b)) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.say.length).toBeGreaterThan(0);
    }
  });
});
