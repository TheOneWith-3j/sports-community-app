import { z } from "zod";

export const joinEventSchema = z
  .object({
    eventId: z.string().uuid(),
  })
  .strict();

export const joinEventResultSchema = z
  .object({
    status: z.enum(["confirmed", "waitlisted"]),
    waitlist_position: z.number().int().positive().nullable(),
  })
  .strict();

export type JoinEventInput = z.infer<typeof joinEventSchema>;
export type JoinEventResult = z.infer<typeof joinEventResultSchema>;
