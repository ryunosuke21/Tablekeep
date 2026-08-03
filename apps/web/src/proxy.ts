import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getProfileRedirect } from "@/lib/profile-redirect";
import {
  readDestination,
  safeDestination,
  withDestination,
} from "@/lib/redirect-destination";
import { auth } from "@/server/better-auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
