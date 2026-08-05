import { IconBookOff } from "@tabler/icons-react";
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

export default function WikiRecordNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-10">
      <Empty className="w-full border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconBookOff />
          </EmptyMedia>
          <EmptyTitle>Record not found</EmptyTitle>
          <EmptyDescription>
            This entry may have moved or may not be part of the 2024 reference.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/wiki">Browse the wiki</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
