import { IconUserQuestion } from "@tabler/icons-react";
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

export default function CharacterNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconUserQuestion />
          </EmptyMedia>
          <EmptyTitle>This character is not here</EmptyTitle>
          <EmptyDescription>
            It may have been deleted, or it belongs to another player. Deleted
            characters can be restored from your characters list.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/characters">Back to characters</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
