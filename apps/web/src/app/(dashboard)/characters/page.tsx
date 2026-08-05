import type { Metadata } from "next";
import { IconUsersGroup } from "@tabler/icons-react";
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

import { CharacterCard } from "@/components/characters/character-card";
import { DeletedCharacterList } from "@/components/characters/deleted-character-list";
import { api } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Characters | Tablekeep",
  description: "The characters you own and the campaigns they play in.",
};

export default async function CharactersPage() {
  const characters = await api.character.list({ status: "all" });
  const active = characters.items.filter(
    (character) => character.deletedAt === null,
  );
  const deleted = characters.items.filter(
    (character) => character.deletedAt !== null,
  );

  return (
    <main className="relative mx-auto flex w-full max-w-[92rem] flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] text-tk-ember uppercase tracking-[0.18em]">
            Character folio
          </p>
          <h1 className="mt-3 font-semibold text-3xl tracking-[-0.04em]">
            Characters
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Your characters live here. Each campaign keeps its own sheet, so the
            same character can play at more than one table.
          </p>
        </div>

        <Button asChild className="min-h-11 self-start sm:self-auto">
          <Link href="/characters/new">Create a character</Link>
        </Button>
      </header>

      <section aria-labelledby="active-characters" className="mt-9">
        <div className="flex items-center gap-2">
          <h2
            id="active-characters"
            className="font-medium text-xl tracking-[-0.03em]"
          >
            Active
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
            {active.length}
          </span>
        </div>

        <div className="mt-5">
          {active.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconUsersGroup />
                </EmptyMedia>
                <EmptyTitle>No characters yet</EmptyTitle>
                <EmptyDescription>
                  Start with a name and a short bio. You can attach the
                  character to a campaign right after.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/characters/new">Create a character</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/campaigns">Browse campaigns</Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {active.map((character) => (
                <li key={character.id}>
                  <CharacterCard character={character} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {deleted.length > 0 ? (
        <section aria-labelledby="deleted-characters" className="mt-12 pb-12">
          <h2
            id="deleted-characters"
            className="font-medium text-xl tracking-[-0.03em]"
          >
            Recently deleted
          </h2>
          <p className="mt-1 max-w-xl text-muted-foreground text-sm">
            Deleted characters keep their campaign history. Restore one to use
            it again.
          </p>
          <div className="mt-5">
            <DeletedCharacterList
              characters={deleted.map((character) => ({
                id: character.id,
                name: character.name,
                deletedAt: character.deletedAt,
              }))}
            />
          </div>
        </section>
      ) : (
        <div className="pb-12" />
      )}
    </main>
  );
}
