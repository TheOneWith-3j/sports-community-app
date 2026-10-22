import { describe, expect, it } from "vitest";

import { updateProfileSchema } from "../../../src/lib/validations/profile";

const validProfile = {
  displayName: "Alex Player",
  phone: "+14155552671",
  avatarUrl: "",
};

describe("updateProfileSchema", () => {
  it("accepts valid profile data", () => {
    expect(updateProfileSchema.safeParse(validProfile).success).toBe(true);
  });

  it("rejects the default display name", () => {
    expect(
      updateProfileSchema.safeParse({
        ...validProfile,
        displayName: "New member",
      }).success,
    ).toBe(false);
  });

  it("normalizes empty optional fields to null", () => {
    const result = updateProfileSchema.safeParse({
      ...validProfile,
      phone: "",
      avatarUrl: "",
    });
    expect(result.success && result.data).toMatchObject({
      phone: null,
      avatarUrl: null,
    });
  });

  it("rejects malformed phone numbers", () => {
    expect(
      updateProfileSchema.safeParse({ ...validProfile, phone: "555-123" }).success,
    ).toBe(false);
  });
});
