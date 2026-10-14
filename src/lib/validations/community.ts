import { z } from "zod";

const communityFields = {
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  activityTypeId: z.string().uuid(),
};

export const createCommunitySchema = z.object(communityFields).strict();

export const updateCommunitySchema = z.object({
  id: z.string().uuid(),
  ...communityFields,
}).strict();

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
