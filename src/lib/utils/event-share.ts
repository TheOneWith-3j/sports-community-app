export function getEventShareUrl(
  shareSlug: string,
  appBaseUrl: string | undefined,
): string | null {
  if (!appBaseUrl) {
    return null;
  }

  try {
    return new URL(`/e/${shareSlug}`, appBaseUrl).toString();
  } catch {
    return null;
  }
}
