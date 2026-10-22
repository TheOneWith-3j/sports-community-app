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

export const leaveEventSchema = z
  .object({
    eventId: z.string().uuid(),
  })
  .strict();

export const leaveEventResultSchema = z
  .object({
    status: z.literal("cancelled"),
    promoted_profile_id: z.string().uuid().nullable(),
  })
  .strict();

export type LeaveEventInput = z.infer<typeof leaveEventSchema>;
export type LeaveEventResult = z.infer<typeof leaveEventResultSchema>;

export const removeParticipantSchema = z
  .object({
    participantId: z.string().uuid(),
  })
  .strict();

export type RemoveParticipantInput = z.infer<typeof removeParticipantSchema>;

export const removeParticipantResultSchema = z
  .object({
    status: z.literal("cancelled"),
    promoted_profile_id: z.string().uuid().nullable(),
  })
  .strict();
