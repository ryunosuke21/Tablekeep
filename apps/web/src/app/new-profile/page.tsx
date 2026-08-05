import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NewProfileForm } from "@/components/profile/new-profile-form";
import { readDestination, withDestination } from "@/lib/redirect-destination";
import { getSession } from "@/server/better-auth/server";

export const metadata: Metadata = {
  title: "Build your profile",
  description: "Choose how the people at your table will recognize you.",
};

export default async function NewProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  // Validated here as well as in the proxy: it is used for a redirect.
  const destination = readDestination(await searchParams);

  if (!session?.user) {
    redirect(withDestination("/sign-in", destination));
  }

  if (session.user.name?.trim()) {
    redirect(destination ?? "/");
  }

  return (
    <NewProfileForm
      email={session.user.email}
      initialImage={session.user.image}
      destination={destination}
    />
  );
}
