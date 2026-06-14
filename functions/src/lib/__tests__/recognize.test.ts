import { describe, it, expect } from "vitest";
import { mediaTypeFor } from "../../recognize.js";

describe("mediaTypeFor", () => {
  it("passes through the Anthropic-supported image types", () => {
    expect(mediaTypeFor("image/jpeg")).toBe("image/jpeg");
    expect(mediaTypeFor("image/png")).toBe("image/png");
    expect(mediaTypeFor("image/gif")).toBe("image/gif");
    expect(mediaTypeFor("image/webp")).toBe("image/webp");
  });

  it("normalizes image/jpg to image/jpeg", () => {
    expect(mediaTypeFor("image/jpg")).toBe("image/jpeg");
  });

  it("ignores charset/params and casing", () => {
    expect(mediaTypeFor("IMAGE/WEBP")).toBe("image/webp");
    expect(mediaTypeFor("image/png; charset=binary")).toBe("image/png");
    expect(mediaTypeFor(" image/gif ")).toBe("image/gif");
  });

  it("falls back to jpeg for unknown or missing types", () => {
    expect(mediaTypeFor("image/heic")).toBe("image/jpeg");
    expect(mediaTypeFor("application/octet-stream")).toBe("image/jpeg");
    expect(mediaTypeFor("")).toBe("image/jpeg");
    expect(mediaTypeFor(undefined)).toBe("image/jpeg");
  });
});
