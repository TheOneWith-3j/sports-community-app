"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import {
  createCommunity,
  updateCommunity,
} from "@/features/communities/actions";
import type { ActivityType, Community } from "@/features/communities/queries";
import { generateCommunitySlug } from "@/lib/utils/slug";
import type { ActionResult } from "@/types/actions";

type CommunityFormProps = {
  activityTypes: ActivityType[];
  community?: Community;
};

export function CommunityForm({
  activityTypes,
  community,
}: CommunityFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(community?.name ?? "");
  const [slug, setSlug] = useState(community?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(community));
  const [result, setResult] = useState<ActionResult<Community> | null>(null);
  const fieldErrors =
    result && !result.success ? result.error.fieldErrors : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      activityTypeId: formData.get("activityTypeId"),
    };

    setResult(null);
    startTransition(async () => {
      const actionResult = community
        ? await updateCommunity({ ...input, id: community.id })
        : await createCommunity(input);
      setResult(actionResult);

      if (actionResult.success) {
        router.replace("/community");
        router.refresh();
      }
    });
  }

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      aria-busy={pending}
      noValidate
    >
      <div className="space-y-2">
        <label htmlFor="community-name" className="block text-label text-foreground">
          Community name
        </label>
        <input
          id="community-name"
          name="name"
          type="text"
          autoComplete="organization"
          minLength={2}
          maxLength={80}
          required
          value={name}
          onChange={(event) => {
            const nextName = event.currentTarget.value;
            setName(nextName);
            if (!slugTouched) {
              setSlug(generateCommunitySlug(nextName));
            }
          }}
          aria-invalid={Boolean(fieldErrors?.name)}
          aria-describedby={fieldErrors?.name ? "community-name-error" : undefined}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary"
        />
        {fieldErrors?.name?.map((message) => (
          <p
            id="community-name-error"
            key={message}
            className="text-body-sm text-destructive"
          >
            {message}
          </p>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="community-slug" className="block text-label text-foreground">
          Community slug
        </label>
        <input
          id="community-slug"
          name="slug"
          type="text"
          autoComplete="off"
          minLength={2}
          maxLength={40}
          required
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.currentTarget.value);
          }}
          aria-invalid={Boolean(fieldErrors?.slug)}
          aria-describedby={fieldErrors?.slug ? "community-slug-error" : undefined}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary"
        />
        {fieldErrors?.slug?.map((message) => (
          <p
            id="community-slug-error"
            key={message}
            className="text-body-sm text-destructive"
          >
            {message}
          </p>
        ))}
        <p className="text-body-sm text-muted-foreground">
          Use lowercase letters, numbers, and hyphens.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="community-description"
          className="block text-label text-foreground"
        >
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="community-description"
          name="description"
          rows={4}
          maxLength={500}
          defaultValue={community?.description ?? ""}
          aria-invalid={Boolean(fieldErrors?.description)}
          aria-describedby={
            fieldErrors?.description ? "community-description-error" : undefined
          }
          className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary"
        />
        {fieldErrors?.description?.map((message) => (
          <p
            id="community-description-error"
            key={message}
            className="text-body-sm text-destructive"
          >
            {message}
          </p>
        ))}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="community-activity-type"
          className="block text-label text-foreground"
        >
          Main activity
        </label>
        <select
          id="community-activity-type"
          name="activityTypeId"
          required
          defaultValue={community?.activity_type_id ?? ""}
          aria-invalid={Boolean(fieldErrors?.activityTypeId)}
          aria-describedby={
            fieldErrors?.activityTypeId ? "community-activity-type-error" : undefined
          }
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary"
        >
          <option value="" disabled>
            Select an activity
          </option>
          {activityTypes.map((activityType) => (
            <option key={activityType.id} value={activityType.id}>
              {activityType.name}
            </option>
          ))}
        </select>
        {fieldErrors?.activityTypeId?.map((message) => (
          <p
            id="community-activity-type-error"
            key={message}
            className="text-body-sm text-destructive"
          >
            {message}
          </p>
        ))}
      </div>

      {result && !result.success ? (
        <p
          role="alert"
          className="rounded-lg border border-border bg-muted/50 p-4 text-body-sm text-muted-foreground"
        >
          {result.error.message}
        </p>
      ) : null}

      {result?.success ? (
        <p role="status" className="text-body-sm text-brand-primary">
          Community saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || activityTypes.length === 0}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-5 py-3 text-label font-medium text-slate-950 shadow-lg shadow-brand-primary/20 transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? "Saving…"
          : community
            ? "Save community"
            : "Create community"}
      </button>
    </form>
  );
}
