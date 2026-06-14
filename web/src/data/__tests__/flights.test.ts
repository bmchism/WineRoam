import { describe, it, expect } from "vitest";
import { curatedFlights, bottlesForFlight, flightById } from "../flights";
import { bottleById } from "../bottles";

describe("curated flights", () => {
  it("every curated flight references only real bottle ids", () => {
    for (const f of curatedFlights) {
      for (const id of f.bottleIds) {
        expect(bottleById(id), `missing bottle: ${id} in ${f.id}`).toBeDefined();
      }
    }
  });

  it("bottlesForFlight resolves the full ordered lineup", () => {
    for (const f of curatedFlights) {
      const bs = bottlesForFlight(f);
      expect(bs).toHaveLength(f.bottleIds.length);
      expect(bs.map((b) => b.id)).toEqual(f.bottleIds);
    }
  });

  it("flightById finds curated flights and misses unknown ones", () => {
    expect(flightById(curatedFlights[0].id)).toBeDefined();
    expect(flightById("nope")).toBeUndefined();
  });
});
