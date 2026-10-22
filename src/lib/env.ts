import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL." }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required."),
});

export type AppEnv = z.infer<typeof envSchema>;

export function isAppEnvConfigured(): boolean {
  return envSchema.safeParse(process.env).success;
}

export function getAppEnv(): AppEnv {
  return envSchema.parse(process.env);
}
