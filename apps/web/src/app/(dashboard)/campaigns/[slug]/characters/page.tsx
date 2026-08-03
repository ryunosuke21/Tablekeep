import { IconShieldHalfFilled } from "@tabler/icons-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tablekeep/ui/components/empty";

export default function CampaignCharactersPage() {
  return (
    <Empty className="min-h-80 border bg-muted/15 px-6 py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-11 rounded-full">
          <IconShieldHalfFilled className="size-5" />
        </EmptyMedia>
        <EmptyTitle>No characters here yet</EmptyTitle>
        <EmptyDescription>
          Characters linked to this campaign will have a home here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
