type ProfileUser = {
  name?: string | null;
};

export type AuthRedirect = {
  pathname: string;
  destination: string | null;
};

export function getProfileRedirect(
  pathname: string,
  user: ProfileUser | null | undefined,
  destination: string | null = null,
): AuthRedirect | null {
  if (pathname === "/sign-in") {
    if (!user) {
      return null;
    }

    return user.name?.trim()
      ? { pathname: destination ?? "/", destination: null }
      : { pathname: "/new-profile", destination };
  }

  if (!user) {
    return { pathname: "/sign-in", destination };
  }

  const hasName = Boolean(user.name?.trim());

  if (pathname === "/new-profile") {
    return hasName ? { pathname: destination ?? "/", destination: null } : null;
  }

  return hasName ? null : { pathname: "/new-profile", destination };
}
