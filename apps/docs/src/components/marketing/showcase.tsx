import Image from "next/image";

import { InitiativeRail } from "./initiative-rail";
import { Eyebrow } from "./primitives";

const PARTY_ART = "/party.jpg";

export function Showcase() {
  return (
    <>
      {/* Text left, the live rail right. */}
      <section className="px-6 pb-24 sm:pb-32">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>At the table</Eyebrow>
            <h2 className="mt-4 font-semibold text-[clamp(2rem,3.6vw,2.75rem)] leading-[1.05] tracking-tight">
              Run the fight, not the spreadsheet.
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground leading-relaxed">
              Initiative, hit points, and conditions in one order everyone can
              see. Advance the turn and the table follows — no one asking whose
              go it is.
            </p>
            <p className="mt-6 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
              Try it — press next turn
            </p>
          </div>
          <InitiativeRail />
        </div>
      </section>

      {/* Art left, text right — the players/DM boundary. */}
      <section className="px-6 pb-24 sm:pb-32">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="tk-grain relative order-last aspect-[5/4] overflow-hidden rounded-2xl ring-1 ring-foreground/10 lg:order-first">
            <Image
              src={PARTY_ART}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-tr from-tk-arcane/30 to-transparent"
            />
          </div>
          <div>
            <Eyebrow>Two sides of the screen</Eyebrow>
            <h2 className="mt-4 font-semibold text-[clamp(2rem,3.6vw,2.75rem)] leading-[1.05] tracking-tight">
              Everyone sees what they should, and nothing they shouldn&rsquo;t.
            </h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="font-mono text-[11px] text-tk-ember uppercase tracking-[0.18em]">
                  Players
                </h3>
                <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                  Own your sheet, your spells, and your inventory. Update them
                  as they change, from a phone at the table.
                </p>
              </div>
              <div>
                <h3 className="font-mono text-[11px] text-tk-ember uppercase tracking-[0.18em]">
                  Dungeon Master
                </h3>
                <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                  Campaigns, invitations, the party overview, and the encounter
                  everyone is looking at.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
