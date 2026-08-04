import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@tablekeep/ui/components/button";

import { JoinCodeForm } from "@/components/campaigns/join-code-form";

export const metadata: Metadata = {
  title: "Join a campaign",
  description: "Enter the invitation code your DM shared.",
};

export default function JoinPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <p className="text-[10px] text-tk-ember uppercase tracking-[0.18em]">
          Join a table
        </p>
        <h1 className="mt-3 font-semibold text-3xl tracking-[-0.04em]">
          Enter your invitation code
        </h1>
        <p className="mt-2 text-muted-foreground">
          You will see the campaign name and your role before you join anything.
        </p>
      </header>

      <div className="mt-8">
        <JoinCodeForm />
      </div>

      <p className="mt-10 text-muted-foreground text-sm">
        Invited by email instead? Open the link in that message — it only works
        for the address it was sent to.
      </p>

      <div className="mt-6">
        <Button asChild variant="ghost">
          <Link href="/campaigns">Back to campaigns</Link>
        </Button>
      </div>
    </main>
  );
}
