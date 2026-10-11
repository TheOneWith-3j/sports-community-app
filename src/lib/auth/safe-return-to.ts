const LOCAL_ORIGIN = "http://app.local";

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }

  try {
    const parsed = new URL(value, LOCAL_ORIGIN);
    if (parsed.origin !== LOCAL_ORIGIN) {
      return "/dashboard";
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return "/dashboard";
  }
}
