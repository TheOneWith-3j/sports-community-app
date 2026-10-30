"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { createEvent, updateEvent } from "@/features/events/actions";
import type { Event } from "@/features/events/queries";
import type { ActivityType } from "@/features/communities/queries";
import { toDateTimeLocal, toIsoDateTime } from "@/lib/utils/event";
import type { ActionResult } from "@/types/actions";

type EventFormProps = {
  activityTypes: ActivityType[];
  communityId: string;
  event?: Event;
};

export function EventForm({
  activityTypes,
  communityId,
  event,
}: EventFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<Event> | null>(null);
  const fieldErrors =
    result && !result.success ? result.error.fieldErrors : undefined;

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formData = new FormData(formEvent.currentTarget);
    const startsAt = formData.get("startsAt");
    const endsAt = formData.get("endsAt");
    const input = {
      title: formData.get("title"),
      description: formData.get("description"),
      startsAt:
        typeof startsAt === "string" ? toIsoDateTime(startsAt) : startsAt,
      endsAt: typeof endsAt === "string" ? toIsoDateTime(endsAt) : endsAt,
      capacity: Number(formData.get("capacity")),
      location: formData.get("location"),
      activityTypeId: formData.get("activityTypeId"),
    };

    setResult(null);
    startTransition(async () => {
      const actionResult = event
        ? await updateEvent({ ...input, id: event.id })
        : await createEvent({
            ...input,
            communityId,
            status: formData.get("status"),
          });
      setResult(actionResult);

      if (actionResult.success) {
        router.replace(`/events/${actionResult.data.id}`);
        router.refresh();
      }
    });
  }

  return (
    <form
      className="space-y-8"
      onSubmit={handleSubmit}
      aria-busy={pending}
      noValidate
    >
      <div className="space-y-2">
        <label htmlFor="event-title" className="block text-label text-foreground">
          Event title
        </label>
        <input
          id="event-title"
          name="title"
          type="text"
          minLength={3}
          maxLength={100}
          required
          defaultValue={event?.title ?? ""}
          aria-invalid={Boolean(fieldErrors?.title)}
          aria-describedby={fieldErrors?.title ? "event-title-error" : undefined}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition placeholder:text-muted-foreground focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
        {fieldErrors?.title?.map((message) => (
          <p id="event-title-error" key={message} className="text-body-sm text-destructive">
            {message}
          </p>
        ))}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="event-description"
          className="block text-label text-foreground"
        >
          Details <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="event-description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={event?.description ?? ""}
          aria-invalid={Boolean(fieldErrors?.description)}
          aria-describedby={
            fieldErrors?.description ? "event-description-error" : undefined
          }
          className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition placeholder:text-muted-foreground focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
        {fieldErrors?.description?.map((message) => (
          <p
            id="event-description-error"
            key={message}
            className="text-body-sm text-destructive"
          >
            {message}
          </p>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="event-starts-at" className="block text-label text-foreground">
            Starts
          </label>
          <input
            id="event-starts-at"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={event ? toDateTimeLocal(event.starts_at) : ""}
            aria-invalid={Boolean(fieldErrors?.startsAt)}
            aria-describedby={
              fieldErrors?.startsAt ? "event-starts-at-error" : undefined
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
          {fieldErrors?.startsAt?.map((message) => (
            <p
              id="event-starts-at-error"
              key={message}
              className="text-body-sm text-destructive"
            >
              {message}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="event-ends-at" className="block text-label text-foreground">
            Ends
          </label>
          <input
            id="event-ends-at"
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={event ? toDateTimeLocal(event.ends_at) : ""}
            aria-invalid={Boolean(fieldErrors?.endsAt)}
            aria-describedby={
              fieldErrors?.endsAt ? "event-ends-at-error" : undefined
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
          {fieldErrors?.endsAt?.map((message) => (
            <p
              id="event-ends-at-error"
              key={message}
              className="text-body-sm text-destructive"
            >
              {message}
            </p>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="event-capacity"
            className="block text-label text-foreground"
          >
            Maximum participants
          </label>
          <input
            id="event-capacity"
            name="capacity"
            type="number"
            min={1}
            max={500}
            step={1}
            required
            defaultValue={event?.capacity ?? 16}
            aria-invalid={Boolean(fieldErrors?.capacity)}
            aria-describedby={
              fieldErrors?.capacity ? "event-capacity-error" : undefined
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
          {fieldErrors?.capacity?.map((message) => (
            <p
              id="event-capacity-error"
              key={message}
              className="text-body-sm text-destructive"
            >
              {message}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="event-activity-type"
            className="block text-label text-foreground"
          >
            Activity
          </label>
          <select
            id="event-activity-type"
            name="activityTypeId"
            required
            defaultValue={event?.activity_type_id ?? activityTypes[0]?.id ?? ""}
            aria-invalid={Boolean(fieldErrors?.activityTypeId)}
            aria-describedby={
              fieldErrors?.activityTypeId
                ? "event-activity-type-error"
                : undefined
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          >
            {activityTypes.map((activityType) => (
              <option key={activityType.id} value={activityType.id}>
                {activityType.name}
              </option>
            ))}
          </select>
          {fieldErrors?.activityTypeId?.map((message) => (
            <p
              id="event-activity-type-error"
              key={message}
              className="text-body-sm text-destructive"
            >
              {message}
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="event-location"
          className="block text-label text-foreground"
        >
          Location <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="event-location"
          name="location"
          type="text"
          maxLength={200}
          defaultValue={event?.location ?? ""}
          aria-invalid={Boolean(fieldErrors?.location)}
          aria-describedby={
            fieldErrors?.location ? "event-location-error" : undefined
          }
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition placeholder:text-muted-foreground focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
        {fieldErrors?.location?.map((message) => (
          <p id="event-location-error" key={message} className="text-body-sm text-destructive">
            {message}
          </p>
        ))}
      </div>

      {!event ? (
        <div className="space-y-2">
          <label
            htmlFor="event-status"
            className="block text-label text-foreground"
          >
            Save as
          </label>
          <select
            id="event-status"
            name="status"
            defaultValue="draft"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-md text-foreground outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      ) : null}

      {result && !result.success ? (
        <p
          role="alert"
          className="rounded-lg border border-border bg-muted/50 p-4 text-body-sm text-muted-foreground"
        >
          {result.error.message}
        </p>
      ) : null}

      {activityTypes.length === 0 ? (
        <p role="alert" className="text-body-sm text-destructive">
          No activity types are available. Please try again later.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || activityTypes.length === 0}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to px-5 py-3 text-label font-medium text-slate-950 shadow-lg shadow-brand-primary/20 transition-transform hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : event ? "Save changes" : "Create event"}
      </button>
    </form>
  );
}
