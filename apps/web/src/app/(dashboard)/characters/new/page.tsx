import type { Metadata } from "next";
import Link from "next/link";

import { NewCharacterForm } from "@/components/characters/new-character-form";

export const metadata: Metadata = {
  title: "New character | Tablekeep",
  description: "Name a character and write the bio that travels with them.",
};

export default function NewCharacterPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
        <Link href="/characters" className="hover:text-foreground">
          Characters
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">New</span>
      </nav>

      <header className="mt-5">
        <p className="text-[10px] text-tk-ember uppercase tracking-[0.18em]">
          New character
        </p>
        <h1 className="mt-3 font-semibold text-3xl tracking-[-0.04em]">
          Who are you playing?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Name them now. Ancestry, classes, hit points, and gear are recorded on
          each campaign's sheet.
        </p>
      </header>

      <div className="mt-8 rounded-2xl border bg-background p-5 sm:p-7">
        <NewCharacterForm />
      </div>
    </main>
  );
}
