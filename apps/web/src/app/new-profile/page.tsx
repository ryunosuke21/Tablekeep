import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NewProfileForm } from "@/components/profile/new-profile-form";
import { getSession } from "@/server/better-auth/server";

export const metadata: Metadata = {
  title: "Build your profile | Tablekeep",
  description: "Choose how the people at your table will recognize you.",
};

export default async function NewProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (session.user.name?.trim()) {
    redirect("/");
  }

  return (
    <NewProfileForm
      email={session.user.email}
      initialImage={session.user.image}
    />
  );
}
