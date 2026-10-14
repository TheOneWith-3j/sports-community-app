import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentProfile } from "@/features/auth/queries";
import { EventHeader } from "@/features/events/components/event-header";
import { getEventBySlug } from "@/features/events/queries";
import { getUserParticipation } from "@/features/participants/queries";
import { isAuth0Configured } from "@/lib/auth0";
import { eventShareSlugSchema } from "@/lib/validations/event";

export const instant = false;

type PublicEventPageProps = PageProps<"/e/[slug]">;

export async function generateMetadata({
  params,
}: PublicEventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsedSlug = eventShareSlugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { title: "Event not found | RallyNook" };
  }

  const result = await getEventBySlug(parsedSlug.data);
  if ("error" in result || !result.data) {
    return { title: "Event not found | RallyNook" };
  }

  return {
    title: `${result.data.title} | RallyNook`,
    description:
      result.data.description?.slice(0, 160) ||
      `Event details and participant capacity for ${result.data.title}.`,
  };
}

export default async function PublicEventPage({
  params,
}: PublicEventPageProps) {
  const { slug } = await params;
  const parsedSlug = eventShareSlugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    notFound();
  }

  const result = await getEventBySlug(parsedSlug.data);
  if ("error" in result) {
    return (
      <p role="alert" className="text-body-md text-destructive">
        Event details could not be loaded. Please refresh and try again.
      </p>
    );
  }
  if (!result.data) {
    notFound();
  }

  let isAuthenticated = false;
  let onboardingRequired = false;
  let participation = null;
  let participationError = false;

  if (isAuth0Configured()) {
    const current = await getCurrentProfile();
    if (current && "error" in current) {
      participationError = true;
    } else if (current) {
      isAuthenticated = true;
      onboardingRequired = !current.profile.onboarding_completed;
      if (!onboardingRequired) {
        const participationResult = await getUserParticipation(
          result.data.id,
          current.profile.id,
        );
        if ("error" in participationResult) {
          participationError = true;
        } else {
          participation = participationResult.data;
        }
      }
    }
  }

  return (
    <EventHeader
      event={result.data}
      isAuthenticated={isAuthenticated}
      onboardingRequired={onboardingRequired}
      participation={participation}
      participationError={participationError}
    />
  );
}
