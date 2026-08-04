import { IconArrowRight, IconBrandGithub } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { APP_NAME } from "@tablekeep/shared";
import { Button } from "@tablekeep/ui/components/button";
import { TablekeepIcon } from "@tablekeep/ui/icons/tablekeep";

import { appUrl, docsRoute, gitConfig } from "@/lib/shared";

const repoUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
const BANNER_ART = "/banner.png";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Character sheets", href: docsRoute },
      { label: "Encounters", href: docsRoute },
      { label: "Spellbooks", href: docsRoute },
      { label: "Shops", href: docsRoute },
    ],
  },
  {
    title: "Documentation",
    links: [
      { label: "Getting started", href: docsRoute },
      { label: "Components", href: `${docsRoute}/test` },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Source", href: repoUrl },
      { label: "Issues", href: `${repoUrl}/issues` },
      { label: "Roadmap", href: docsRoute },
    ],
  },
] as const;

export function Closing() {
  return (
    <>
      <section className="px-6 pb-24 sm:pb-32">
        <div className="tk-grain relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl ring-1 ring-foreground/10">
          <Image
            src={BANNER_ART}
            alt=""
            fill
            sizes="(min-width: 1024px) 72rem, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-tk-keep/95 via-tk-keep/75 to-tk-keep/20"
          />
          <div className="relative max-w-lg px-8 py-16 sm:px-12 sm:py-20">
            <h2 className="font-semibold text-[clamp(2rem,4vw,3rem)] text-white leading-[1.05] tracking-tight">
              Bring it to the next session.
            </h2>
            <p className="mt-5 text-white/70 leading-relaxed">
              Sit down, roll initiative, and let the tracking take care of
              itself.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href={appUrl}>
                  Enter the keep
                  <IconArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                asChild
              >
                <Link href={repoUrl}>
                  <IconBrandGithub data-icon="inline-start" />
                  View the source
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-border/60 border-t px-6 py-14">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div>
              <span className="inline-flex items-center gap-2">
                <TablekeepIcon className="h-6 w-[17px] text-foreground" />
                <span className="text-xl tracking-tight">{APP_NAME}</span>
              </span>
              <p className="mt-4 max-w-xs text-muted-foreground text-sm leading-relaxed">
                A companion for campaigns played together, in person.
              </p>
            </div>

            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="font-mono text-[11px] text-tk-ember uppercase tracking-[0.18em]">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 border-border/60 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-lg text-muted-foreground/80 text-xs leading-relaxed">
              {APP_NAME} is an independent project and is not affiliated with or
              endorsed by Wizards of the Coast. &ldquo;Dungeons &amp;
              Dragons&rdquo; is used descriptively.
            </p>
            <Link
              href={repoUrl}
              className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              <IconBrandGithub className="size-4" aria-hidden />
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
