import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { TablekeepIcon } from "@tablekeep/ui/icons/tablekeep";

import { SignInForm } from "@/components/auth/sign-in-form";
import { readDestination } from "@/lib/redirect-destination";

export const metadata: Metadata = {
  title: "Sign in | Tablekeep",
  description: "Sign in to your Tablekeep account.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The destination is attacker-supplied, so it is validated again here even
  // though the proxy already validated the value it forwarded.
  const destination = readDestination(await searchParams);

  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-2">
      <section className="flex min-h-svh flex-col p-6 sm:p-8 lg:p-10">
        <Link
          href="/"
          className="flex w-fit items-center gap-2.5 font-semibold tracking-tight"
          aria-label="Tablekeep home"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-tk-keep text-white shadow-sm">
            <TablekeepIcon className="h-5 w-auto" />
          </span>
          <span>Tablekeep</span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">
            <SignInForm destination={destination} />
          </div>
        </div>

        <p className="text-center text-muted-foreground text-xs lg:text-left">
          Built for the table, not instead of it.
        </p>
      </section>

      <aside className="relative hidden min-h-svh overflow-hidden bg-tk-keep lg:block">
        <Image
          src="/party.jpg"
          alt="A party of adventurers deciding which path to take"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,24,48,0.04)_35%,rgba(18,24,48,0.82)_100%)]"
          aria-hidden="true"
        />
        <blockquote className="absolute right-10 bottom-10 left-10 max-w-xl text-white">
          <p className="font-semibold text-3xl leading-tight tracking-[-0.03em] xl:text-4xl">
            Keep the story moving.
          </p>
          <footer className="mt-3 max-w-md text-sm text-white/75 leading-relaxed">
            Your campaigns, characters, and table notes—ready when the next
            session begins.
          </footer>
        </blockquote>
      </aside>
    </main>
  );
}
