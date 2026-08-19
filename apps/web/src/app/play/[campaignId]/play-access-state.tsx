import Link from "next/link";

import { Button } from "@tablekeep/ui/components/button";

import { withDestination } from "@/lib/redirect-destination";
import type { PlayAccessState as PlayAccessStateValue } from "@/server/play/get-play-route-access";

const TURN_ORDER_POSITIONS = ["a", "b", "c", "d", "e"] as const;
const ACTIVE_POSITION = "c";

function TurnOrderTrace() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center gap-3 sm:gap-4"
    >
      {TURN_ORDER_POSITIONS.map((position) => (
        <span
          key={position}
          className={
            position === ACTIVE_POSITION
              ? "size-3 rounded-full border-2 border-tk-ember border-dashed sm:size-3.5"
              : "size-2 rounded-full bg-border sm:size-2.5"
          }
        />
      ))}
    </div>
  );
}

function PlayAccessLayout({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <TurnOrderTrace />
        <div className="flex flex-col gap-2">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
            {eyebrow}
          </p>
          <h1 className="text-balance font-heading font-semibold text-foreground text-xl">
            {title}
          </h1>
          <p className="text-balance text-muted-foreground text-sm/relaxed">
            {description}
          </p>
        </div>
        {action}
      </div>
    </main>
  );
}

export function PlayAccessState({
  state,
  campaignId,
}: {
  state: PlayAccessStateValue;
  campaignId: string;
}) {
  const playDestination = `/play/${campaignId}`;

  switch (state.kind) {
    case "signed-out":
      return (
        <PlayAccessLayout
          eyebrow="Play"
          title="Sign in to join this session"
          description="You need to sign in before you can take a seat at this campaign's table."
          action={
            <Button asChild>
              <Link href={withDestination("/sign-in", playDestination)}>
                Sign in
              </Link>
            </Button>
          }
        />
      );

    case "profile-required":
      return (
        <PlayAccessLayout
          eyebrow="Play"
          title="Finish your profile to join"
          description="Complete your profile before you take a seat at this campaign's table."
          action={
            <Button asChild>
              <Link href={withDestination("/new-profile", playDestination)}>
                Finish profile
              </Link>
            </Button>
          }
        />
      );

    case "unavailable":
      return (
        <PlayAccessLayout
          eyebrow="Play"
          title="Campaign unavailable"
          description="This campaign is unavailable. It may not exist, or you may not be a member of its table."
          action={
            <Button asChild variant="outline">
              <Link href="/campaigns">Back to campaigns</Link>
            </Button>
          }
        />
      );

    case "archived":
      return (
        <PlayAccessLayout
          eyebrow="Play"
          title={`${state.campaignName} is archived`}
          description="Active play is unavailable while this campaign is archived."
          action={
            <Button asChild variant="outline">
              <Link href="/campaigns">Back to campaigns</Link>
            </Button>
          }
        />
      );

    default: {
      const exhaustiveCheck: never = state;
      throw new Error(
        `Unhandled play access state: ${JSON.stringify(exhaustiveCheck)}`,
      );
    }
  }
}
