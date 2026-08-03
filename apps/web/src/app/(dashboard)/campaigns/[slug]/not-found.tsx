import { IconLock } from "@tabler/icons-react";
import Link from "next/link";

import { Button } from "@tablekeep/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tablekeep/ui/components/empty";

export default function CampaignNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconLock />
          </EmptyMedia>
          <EmptyTitle>Campaign not available</EmptyTitle>
          <EmptyDescription>
            This campaign does not exist, or you are no longer a member of it.
            If you were removed, ask the DM for a new invitation.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/campaigns">Back to campaigns</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/join">Enter a code</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
