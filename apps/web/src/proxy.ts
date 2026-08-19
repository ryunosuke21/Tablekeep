import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getProfileRedirect } from "@/lib/profile-redirect";
import {
  readDestination,
  safeDestination,
  withDestination,
} from "@/lib/redirect-destination";
import { auth } from "@/server/better-auth";

export function isPlayRoute(pathname: string) {
  return pathname === "/play" || pathname.startsWith("/play/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The play route owns its signed-out, incomplete-profile, and denied states.
  // Let it render them in place instead of applying the dashboard redirects.
  if (isPlayRoute(pathname)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });
  const requestedPath = safeDestination(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  const destination =
    readDestination(request.nextUrl.searchParams) ?? requestedPath;
  const redirect = getProfileRedirect(pathname, session?.user, destination);

  return redirect
    ? NextResponse.redirect(
        new URL(
          withDestination(redirect.pathname, redirect.destination),
          request.url,
        ),
      )
    : NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
