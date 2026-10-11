import { z } from "zod";

export const googleAuthSchema = z.object({
  redirectTo: z
    .string()
    .trim()
    .optional()
    .default("/dashboard")
    .transform((value) =>
      value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard",
    ),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
