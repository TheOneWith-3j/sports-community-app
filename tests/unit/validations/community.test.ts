import { describe, expect, it } from "vitest";

import { createCommunitySchema } from "../../../src/lib/validations/community";

const validCommunity = {
  name: "Downtown Shuttlers",
  slug: "downtown-shuttlers",
  description: "A friendly weekly group.",
  activityTypeId: "00000000-0000-4000-8000-000000000001",
};

describe("createCommunitySchema", () => {
  it("accepts a valid community", () => {
    expect(createCommunitySchema.safeParse(validCommunity).success).toBe(true);
  });

  it("rejects uppercase and spaced slugs", () => {
    expect(
      createCommunitySchema.safeParse({
        ...validCommunity,
        slug: "Downtown Shuttlers",
      }).success,
    ).toBe(false);
  });

  it("rejects names shorter than two characters", () => {
    expect(
      createCommunitySchema.safeParse({ ...validCommunity, name: "X" }).success,
    ).toBe(false);
  });
});
