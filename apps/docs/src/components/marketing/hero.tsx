import { Button } from "@tablekeep/ui/components/button";
import { IconArrowRight, IconBook } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { appUrl, docsRoute } from "@/lib/shared";

export function Hero() {
  // `overflow-hidden`: the diamond's glow is meant to bleed off-canvas, and
  // without clipping it widens the page on desktop.
  return (
    <section className="relative overflow-hidden px-6 pt-14 pb-20 sm:pt-20 lg:pb-28">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div>
          <div className="tk-rise" style={{ "--tk-step": 0 } as never}>
            <h1 className="font-semibold text-[clamp(3rem,6.4vw,5.25rem)] leading-[0.95] tracking-[-0.035em]">
              Keep the table
              <br />
              {/* Inter carries emphasis through weight, not a second face. */}
              <em className="text-tk-ember not-italic">moving</em>.
            </h1>
          </div>

          <p
            className="tk-rise mt-7 max-w-lg text-base text-muted-foreground leading-relaxed sm:text-lg"
            style={{ "--tk-step": 1 } as never}
          >
            Tablekeep holds the parts of a session that change — hit points,
            spell slots, initiative, loot — so your group keeps its own dice,
            books, and pace.
          </p>

          <div
            className="tk-rise mt-9 flex flex-wrap items-center gap-3"
            style={{ "--tk-step": 2 } as never}
          >
            <Button size="lg" asChild>
              <Link href={appUrl}>
                Enter the keep
                <IconArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href={docsRoute}>
                <IconBook data-icon="inline-start" />
                Read the docs
              </Link>
            </Button>
          </div>
        </div>

        {/* The artwork is set in a rotated frame so it reads as an object on
            the table rather than a screenshot pasted onto the page. */}
        <div
          className="tk-rise relative mx-auto aspect-square w-full max-w-md lg:max-w-none"
          style={{ "--tk-step": 3 } as never}
        >
          <div
            aria-hidden
            className="absolute inset-6 rotate-45 rounded-[2.5rem] bg-tk-ember/25 blur-3xl"
          />
          <div className="absolute inset-8 rotate-45 overflow-hidden rounded-[2rem] ring-1 ring-foreground/15 sm:inset-10">
            <div className="relative size-full -rotate-45 scale-150">
              <Image
                src="/hero.png"
                alt="A red dragon perched on a rocky peak beneath storm clouds"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
