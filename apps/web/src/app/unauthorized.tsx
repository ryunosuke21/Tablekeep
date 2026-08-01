import type { Metadata } from "next";
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

import { BackButton } from "@/components/ui/back-button";

export const metadata: Metadata = {
  title: "Unauthorized | Tablekeep",
  description: "Sign in to view this Tablekeep page.",
};

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-2">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconLock className="size-10 text-tk-keep" />
          </EmptyMedia>
          <EmptyTitle>Unauthorized</EmptyTitle>
          <EmptyDescription>
            You are not authorized to view this page. Please sign in to
            continue.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <BackButton variant="secondary">Go Back</BackButton>
        </EmptyContent>
      </Empty>
    </main>
  );
}
