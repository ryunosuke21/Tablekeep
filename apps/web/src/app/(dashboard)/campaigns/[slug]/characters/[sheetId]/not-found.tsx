"use client";

import { IconUserQuestion } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tablekeep/ui/components/empty";

/**
 * Scopes a missing or private sheet to the sheet itself. Without this boundary
 * the campaign one answers instead, telling a member of a healthy campaign that
 * the whole campaign is gone. The copy stays non-disclosing: a sheet owned by
 * another player must read the same as a sheet that does not exist.
 */
export default function CampaignSheetNotFound() {
  const params = useParams<{ slug?: string }>();
  const charactersHref = params?.slug
    ? `/campaigns/${params.slug}/characters`
    : "/campaigns";

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconUserQuestion />
        </EmptyMedia>
        <EmptyTitle>This sheet is not available</EmptyTitle>
        <EmptyDescription>
          It may have been removed, or it belongs to another player. Players see
          their own sheets; DMs see every sheet at the table.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href={charactersHref}>Back to characters</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
