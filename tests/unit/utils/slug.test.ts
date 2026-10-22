import { describe, expect, it } from "vitest";

import { generateCommunitySlug } from "../../../src/lib/utils/slug";

describe("generateCommunitySlug", () => {
  it("normalizes punctuation and whitespace", () => {
    expect(generateCommunitySlug("  São Paulo / Pickleball  ")).toBe(
      "sao-paulo-pickleball",
    );
  });

  it("collapses repeated separators", () => {
    expect(generateCommunitySlug("Badminton---Night!!")).toBe("badminton-night");
  });
});
