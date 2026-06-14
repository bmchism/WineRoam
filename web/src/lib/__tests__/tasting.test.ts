import { describe, it, expect } from "vitest";
import { emptyRating } from "../tasting";

describe("emptyRating", () => {
  it("starts every axis at zero for the given bottle", () => {
    const r = emptyRating("b1");
    expect(r).toEqual({ bottleId: "b1", color: 0, aroma: 0, flavor: 0, finish: 0, overall: 0, note: "" });
  });
});
