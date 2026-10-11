"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { updateProfile } from "@/features/auth/actions";
import type { UserProfile } from "@/features/auth/queries";
import type { ActionResult } from "@/types/actions";

type ProfileFormProps = {
  profile: UserProfile;
  onboarding?: boolean;
};

export function ProfileForm({ profile, onboarding = false }: ProfileFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<UserProfile> | null>(null);
  const fieldErrors =
    result && !result.success ? result.error.fieldErrors : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input = {
      displayName: formData.get("displayName"),
      phone: formData.get("phone"),
      avatarUrl: formData.get("avatarUrl"),
    };

    setResult(null);
    startTransition(async () => {
      const actionResult = await updateProfile(input);
      setResult(actionResult);

      if (actionResult.success && onboarding) {
        router.replace("/dashboard");
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
        <label
          htmlFor="displayName"
          className="block text-label text-foreground"
        >
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          minLength={2}
          maxLength={50}
          required
          defaultValue={profile.display_name}
          aria-invalid={Boolean(fieldErrors?.displayName)}
          aria-describedby={
            fieldErrors?.displayName ? "displayName-error" : undefined
          }
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary"
        />
        {fieldErrors?.displayName?.map((message) => (
          <p
            id="displayName-error"
            key={message}
            className="text-body-sm text-destructive"
          >
            {message}
          </p>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="block text-label text-foreground">
          Phone number <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          defaultValue={profile.phone ?? ""}
          aria-invalid={Boolean(fieldErrors?.phone)}
          aria-describedby={fieldErrors?.phone ? "phone-error" : undefined}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary"
        />
        {fieldErrors?.phone?.map((message) => (
          <p
            id="phone-error"
            key={message}
            className="text-body-sm text-destructive"
          >
            {message}
          </p>
        ))}
        <p className="text-body-sm text-muted-foreground">
          Use 10 to 15 digits; a leading + is optional.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="avatarUrl"
          className="block text-label text-foreground"
        >
          Avatar image URL{" "}
          <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          inputMode="url"
          autoComplete="url"
          defaultValue={profile.avatar_url ?? ""}
          aria-invalid={Boolean(fieldErrors?.avatarUrl)}
          aria-describedby={
            fieldErrors?.avatarUrl ? "avatarUrl-error" : undefined
          }
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary"
        />
        {fieldErrors?.avatarUrl?.map((message) => (
          <p
            id="avatarUrl-error"
            key={message}
            className="text-body-sm text-destructive"
          >
            {message}
          </p>
        ))}
        <p className="text-body-sm text-muted-foreground">
          Use a publicly accessible HTTP or HTTPS image URL.
        </p>
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
          Profile saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-5 py-3 text-label font-medium text-slate-950 shadow-lg shadow-brand-primary/20 transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
