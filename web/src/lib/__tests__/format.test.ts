import { describe, it, expect } from "vitest";
import { cleanNom } from "../format";

describe("cleanNom", () => {
  it("leaves a bare NOM number untouched", () => {
    expect(cleanNom("1619")).toBe("1619");
  });

  it("strips a 'NOM-' prefix", () => {
    expect(cleanNom("NOM-1619")).toBe("1619");
  });

  it("strips a 'NOM ' prefix case-insensitively", () => {
    expect(cleanNom("nom 1234")).toBe("1234");
  });

  it("trims surrounding whitespace", () => {
    expect(cleanNom("  1142 ")).toBe("1142");
  });
});
