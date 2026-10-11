"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile, type UserProfile } from "@/features/auth/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/types/actions";

export async function updateProfile(
  input: unknown,
): Promise<ActionResult<UserProfile>> {
  const parsed = updateProfileSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") {
        fieldErrors[field] ??= [];
        fieldErrors[field].push(issue.message);
      }
    }

    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Review the highlighted fields and try again.",
        fieldErrors,
      },
    };
  }

  const current = await getCurrentProfile();
  if (!current) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Sign in to update your profile." },
    };
  }

  if ("error" in current) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Your profile could not be loaded. Please try again.",
      },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      phone: parsed.data.phone,
      avatar_url: parsed.data.avatarUrl,
      onboarding_completed: true,
    })
    .eq("id", current.profile.id)
    .select(
      "id, display_name, avatar_url, phone, onboarding_completed, created_at, updated_at",
    )
    .single();

  if (error) {
    console.error("Supabase profile update failed.", {
      code: error.code,
      message: error.message,
    });

    return {
      success: false,
      error: {
        code: error.code === "42501" ? "FORBIDDEN" : "INTERNAL_ERROR",
        message:
          error.code === "42501"
            ? "You are not allowed to update this profile."
            : "Your profile could not be saved. Please try again.",
      },
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/onboarding");

  return { success: true, data };
}
