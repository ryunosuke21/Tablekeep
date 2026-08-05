import type { Metadata } from "next";
import { IconArrowUpRight, IconBook2 } from "@tabler/icons-react";
import Link from "next/link";

import { WikiArtwork } from "@/components/wiki/wiki-artwork";
import { WIKI_CATEGORIES, WIKI_CATEGORY_META } from "@/lib/wiki/catalog";

export const metadata: Metadata = {
  title: "Wiki",
  description: "Rules and reference material for the table.",
};

export default function WikiPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-[92rem] flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <header>
        <p className="font-mono text-[10px] text-tk-ember uppercase tracking-[0.18em]">
          Rules field guide
        </p>
        <h1 className="mt-3 font-semibold text-3xl tracking-[-0.04em] sm:text-4xl">
          Wiki
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pick what you need. Each section is made for quick checks during play
          and quiet reading between sessions.
        </p>
      </header>
      <section aria-labelledby="browse-wiki" className="mt-9 pb-14">
        <div className="flex items-center gap-2">
          <IconBook2 className="size-5 text-tk-ember" />
          <h2
            id="browse-wiki"
            className="font-semibold text-xl tracking-[-0.03em]"
          >
            Browse the guide
          </h2>
        </div>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {WIKI_CATEGORIES.map((category, index) => {
            const meta = WIKI_CATEGORY_META[category];
            return (
              <li key={category}>
                <Link
                  href={`/wiki/${category}`}
                  className="group block overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <WikiArtwork
                    category={category}
                    priority={index < 3}
                    className="aspect-[2/1]"
                  />
                  <div className="flex items-start justify-between gap-4 p-5">
                    <div>
                      <h2 className="font-semibold text-xl tracking-[-0.03em]">
                        {meta.title}
                      </h2>
                      <p className="mt-1 text-muted-foreground text-sm leading-6">
                        {meta.description}
                      </p>
                    </div>
                    <IconArrowUpRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
