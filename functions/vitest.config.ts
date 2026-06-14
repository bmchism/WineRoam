import { defineConfig } from "vitest/config";

// Unit tests for pure backend helpers (no AWS calls). Run from repo root with
// the hoisted vitest: `npm test -w functions`.
export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
