"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/features/auth/queries";
import type { Community } from "@/features/communities/queries";
import { canManageCommunity } from "@/features/communities/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createCommunitySchema,
  updateCommunitySchema,
} from "@/lib/validations/community";
import type { ActionResult } from "@/types/actions";

function validationFailure(
  issues: { path: PropertyKey[]; message: string }[],
): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of issues) {
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

function profileFailure(
  current: Awaited<ReturnType<typeof getCurrentProfile>>,
): ActionResult<never> | null {
  if (!current) {
    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Sign in to manage a community.",
      },
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

  return null;
}

function mapCommunityError(code: string, message: string): ActionResult<never> {
  if (code === "23505") {
    return {
      success: false,
      error: {
        code: "CONFLICT",
        message: "That community URL is already in use. Choose another.",
      },
    };
  }

  if (code === "P0001" && message === "Community limit reached") {
    return {
      success: false,
      error: {
        code: "CONFLICT",
        message: "Your account already manages a community.",
      },
    };
  }

  if (code === "42501") {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You are not allowed to manage this community.",
      },
    };
  }

  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "The community could not be saved. Please try again.",
    },
  };
}

function revalidateCommunityPaths(): void {
  revalidatePath("/dashboard");
  revalidatePath("/community");
  revalidatePath("/community/setup");
  revalidatePath("/community/settings");
}

export async function createCommunity(
  input: unknown,
): Promise<ActionResult<Community>> {
  const parsed = createCommunitySchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure(parsed.error.issues);
  }

  const current = await getCurrentProfile();
  const authFailure = profileFailure(current);
  if (authFailure) {
    return authFailure;
  }
  if (!current || "error" in current) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Community setup failed." },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: communityId, error: createError } = await supabase.rpc(
    "create_community",
    {
      p_name: parsed.data.name,
      p_slug: parsed.data.slug,
      p_description: parsed.data.description || null,
      p_activity_type_id: parsed.data.activityTypeId,
    },
  );

  if (createError) {
    console.error("[createCommunity]", { code: createError.code });
    return mapCommunityError(createError.code, createError.message);
  }

  if (!communityId) {
    console.error("[createCommunity]", { error: "RPC returned no community ID" });
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "The community could not be saved. Please try again.",
      },
    };
  }

  const { data, error } = await supabase
    .from("communities")
    .select(
      "id, name, slug, description, activity_type_id, owner_id, created_at, updated_at",
    )
    .eq("id", communityId)
    .single();

  if (error) {
    console.error("[createCommunity] created community lookup failed", {
      code: error.code,
    });
    return mapCommunityError(error.code, error.message);
  }

  revalidateCommunityPaths();
  return { success: true, data };
}

export async function updateCommunity(
  input: unknown,
): Promise<ActionResult<Community>> {
  const parsed = updateCommunitySchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure(parsed.error.issues);
  }

  const current = await getCurrentProfile();
  const authFailure = profileFailure(current);
  if (authFailure) {
    return authFailure;
  }
  if (!current || "error" in current) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Community settings failed." },
    };
  }

  const authorization = await canManageCommunity(parsed.data.id);
  if ("error" in authorization) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Community permissions could not be checked. Please try again.",
      },
    };
  }
  if (!authorization.data) {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You are not allowed to manage this community.",
      },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("communities")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      activity_type_id: parsed.data.activityTypeId,
    })
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .select(
      "id, name, slug, description, activity_type_id, owner_id, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    console.error("[updateCommunity]", { code: error.code });
    return mapCommunityError(error.code, error.message);
  }
  if (!data) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "This community could not be found.",
      },
    };
  }

  revalidateCommunityPaths();
  return { success: true, data };
}
