import { z } from "zod";

export const DEFAULT_PROFILE_DISPLAY_NAME = "New member";

export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Display name must be at least 2 characters.")
      .max(50, "Display name must be 50 characters or fewer.")
      .refine(
        (value) => value !== DEFAULT_PROFILE_DISPLAY_NAME,
        "Choose a display name other than the default.",
      ),
    phone: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^\+?[0-9]{10,15}$/.test(value),
        "Enter a phone number with 10 to 15 digits, optionally starting with +.",
      )
      .transform((value) => value || null),
    avatarUrl: z
      .string()
      .trim()
      .pipe(
        z.union([
          z.literal(""),
          z.url({ protocol: /^https?$/ }),
        ]),
      )
      .transform((value) => value || null),
  })
  .strict();

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
export type UpdateProfileData = z.output<typeof updateProfileSchema>;
