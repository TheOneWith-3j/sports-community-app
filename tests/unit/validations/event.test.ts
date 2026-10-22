import { describe, expect, it } from "vitest";

import {
  createEventSchema,
  eventIdSchema,
  eventShareSlugSchema,
} from "../../../src/lib/validations/event";

const validEvent = {
  communityId: "00000000-0000-4000-8000-000000000001",
  title: "Tuesday Badminton",
  description: "",
  startsAt: "2099-07-01T18:00:00Z",
  endsAt: "2099-07-01T19:00:00Z",
  capacity: 16,
  location: "",
  activityTypeId: "00000000-0000-4000-8000-000000000002",
  status: "published" as const,
};

describe("createEventSchema", () => {
  it("accepts a future event", () => {
    expect(createEventSchema.safeParse(validEvent).success).toBe(true);
  });

  it("rejects an end time before the start time", () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      endsAt: "2099-07-01T17:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive capacity", () => {
    expect(
      createEventSchema.safeParse({ ...validEvent, capacity: 0 }).success,
    ).toBe(false);
  });

  it("rejects an event with extra fields", () => {
    expect(
      createEventSchema.safeParse({ ...validEvent, unexpected: true }).success,
    ).toBe(false);
  });
});

describe("event identifiers", () => {
  it("accepts UUID event identifiers", () => {
    expect(eventIdSchema.safeParse({ eventId: validEvent.communityId }).success).toBe(
      true,
    );
  });

  it("accepts only eight-character share slugs", () => {
    expect(eventShareSlugSchema.safeParse("Ab12_cd-").success).toBe(true);
    expect(eventShareSlugSchema.safeParse("short").success).toBe(false);
  });
});
