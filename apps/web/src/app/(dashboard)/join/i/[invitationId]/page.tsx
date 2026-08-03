import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@tablekeep/ui/components/button";

import { JoinInviteCard } from "@/components/campaigns/join-invite-card";
import { JoinInviteNotice } from "@/components/campaigns/join-invite-notice";
import { SwitchAccountButton } from "@/components/campaigns/switch-account-button";

import { previewInvite } from "../../_lib/preview";

export const metadata: Metadata = {
  title: "Campaign invitation | Tablekeep",
  description: "Review a campaign invitation sent to your email address.",
};

export default async function JoinByInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;
  const result = await previewInvite({ invitationId });

  if (!result.ok) {
    // FORBIDDEN is the plugin's wrong-recipient answer: this invitation belongs
    // to another address, so switching accounts is the real recovery path.
    const wrongRecipient = result.code === "FORBIDDEN";

    return (
      <Layout>
        <JoinInviteNotice
          title={
            wrongRecipient
              ? "This invitation is for a different account"
              : "That invitation is not valid"
          }
          description={
            wrongRecipient
              ? "Email invitations only work for the address they were sent to. Sign in with that address, then open the link again."
              : result.message ||
                "The invitation may have expired or been revoked. Ask the DM to send a new one."
          }
          action={
            wrongRecipient ? (
              <SwitchAccountButton
                destination={`/join/i/${encodeURIComponent(invitationId)}`}
              />
            ) : undefined
          }
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <JoinInviteCard preview={result.preview} reference={{ invitationId }} />
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
