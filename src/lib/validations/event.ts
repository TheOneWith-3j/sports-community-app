import { z } from "zod";

const eventFields = {
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  capacity: z.number().int().min(1).max(500),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  activityTypeId: z.string().uuid(),
};

const eventTiming = {
  message: "End time must be after start time.",
  path: ["endsAt"],
};

export const createEventSchema = z
  .object({
    communityId: z.string().uuid(),
    ...eventFields,
    status: z.enum(["draft", "published"]),
  })
  .strict()
  .refine(
    (event) => new Date(event.endsAt) > new Date(event.startsAt),
    eventTiming,
  )
  .refine((event) => new Date(event.startsAt) > new Date(), {
    message: "Start time must be in the future.",
    path: ["startsAt"],
  });

export const updateEventSchema = z
  .object({
    id: z.string().uuid(),
    ...eventFields,
  })
  .strict()
  .refine(
    (event) => new Date(event.endsAt) > new Date(event.startsAt),
    eventTiming,
  )
  .refine((event) => new Date(event.startsAt) > new Date(), {
    message: "Start time must be in the future.",
    path: ["startsAt"],
  });

export const eventIdSchema = z.object({ eventId: z.string().uuid() }).strict();
export const eventShareSlugSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{8}$/);

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
