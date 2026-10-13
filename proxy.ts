import { NextResponse, type NextRequest } from "next/server";

import { getAuth0Client, isAuth0Configured } from "@/lib/auth0";
import { safeReturnTo } from "@/lib/auth/safe-return-to";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (!isAuth0Configured()) {
    if (isProtected) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "auth_not_configured");
      loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  const auth0 = getAuth0Client();
  const response = await auth0.middleware(request);

  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  if (isProtected) {
    const session = await auth0.getSession(request);

    if (!session) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set(
        "returnTo",
        safeReturnTo(`${pathname}${request.nextUrl.search}`),
      );
      return NextResponse.redirect(loginUrl);
    }

    await auth0.getAccessToken(request, response);
  }

  if (pathname === "/login") {
    const session = await auth0.getSession(request);

    if (session) {
      const destination = safeReturnTo(request.nextUrl.searchParams.get("next"));
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
