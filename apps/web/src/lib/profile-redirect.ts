type ProfileUser = {
  name?: string | null;
};

export function getProfileRedirect(
  pathname: string,
  user: ProfileUser | null | undefined,
): "/" | "/new-profile" | "/sign-in" | null {
  if (pathname === "/sign-in") {
    return null;
  }

  if (!user) {
    return "/sign-in";
  }

  const hasName = Boolean(user.name?.trim());

  if (pathname === "/new-profile") {
    return hasName ? "/" : null;
  }

  return hasName ? null : "/new-profile";
}
