import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getProfileRedirect } from "@/lib/profile-redirect";
import { auth } from "@/server/better-auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/sign-in") {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });
  const destination = getProfileRedirect(pathname, session?.user);

  return destination
    ? NextResponse.redirect(new URL(destination, request.url))
    : NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
