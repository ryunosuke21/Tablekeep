import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@tablekeep/ui/components/button";

import { JoinInviteCard } from "@/components/campaigns/join-invite-card";
import { JoinInviteNotice } from "@/components/campaigns/join-invite-notice";
import { inviteCodeEntrySchema } from "@/lib/validation/campaign";

import { previewInvite } from "../_lib/preview";

export const metadata: Metadata = {
  title: "Campaign invitation",
  description: "Review a campaign invitation before joining.",
};

export default async function JoinWithCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  // Next has already decoded the segment; decoding again would throw on a
  // malformed escape. The schema normalizes separators and rejects the rest.
  const { code } = await params;
  const parsed = inviteCodeEntrySchema.safeParse({ code });

  if (!parsed.success) {
    return (
      <Layout>
        <JoinInviteNotice
          title="That code is not valid"
          description="Invitation codes are 10 letters and numbers. Check the code your DM shared and try again."
        />
      </Layout>
    );
  }

  const result = await previewInvite({ code: parsed.data.code });

  if (!result.ok) {
    return (
      <Layout>
        <JoinInviteNotice
          title={
            result.code === "NOT_FOUND"
              ? "That invitation is not valid"
              : "You cannot join with this code"
          }
          description={
            result.code === "NOT_FOUND"
              ? "The code may have been mistyped, or the DM has since revoked it. Ask for a fresh code."
              : result.message
          }
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <JoinInviteCard
        preview={result.preview}
        reference={{ code: parsed.data.code }}
      />
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      {children}
      <div className="mt-6">
        <Button asChild variant="ghost">
          <Link href="/campaigns">Back to campaigns</Link>
        </Button>
      </div>
    </main>
  );
}
