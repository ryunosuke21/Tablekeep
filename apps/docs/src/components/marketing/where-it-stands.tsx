import { Badge } from "@tablekeep/ui/components/badge";
import Link from "next/link";
import { docsRoute } from "@/lib/shared";
import { Eyebrow } from "./primitives";

/**
 * AGENTS.md requires implemented and planned work to stay distinguishable.
 * That applies to the marketing page too, so this says plainly where the
 * product actually is.
 */
const STATE = [
  { label: "Accounts and sign-in", built: true },
  { label: "Database and shared UI system", built: true },
  { label: "Marketing site and documentation", built: true },
  { label: "Campaigns, invitations, and membership", built: false },
  { label: "Character sheets and spellbooks", built: false },
  { label: "Encounters and initiative", built: false },
  { label: "Shops and creature reference", built: false },
] as const;

export function WhereItStands() {
  return (
    <section className="px-6 pb-24 sm:pb-32">
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow>Where it stands</Eyebrow>
          <h2 className="mt-4 font-semibold text-[clamp(2rem,3.6vw,2.75rem)] leading-[1.05] tracking-tight">
            Being built in the open.
          </h2>
          <p className="mt-5 max-w-md text-muted-foreground leading-relaxed">
            The foundation is in place; the game-facing features are not
            finished yet. The first release will be an invitation-only closed
            beta. Here is the honest state of it.
          </p>
          <p className="mt-6 text-sm">
            <Link
              href={docsRoute}
              className="text-tk-ember underline-offset-4 hover:underline"
            >
              Read the full sequence
            </Link>
          </p>
        </div>

        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card/60 px-6 ring-1 ring-foreground/10 backdrop-blur-sm">
          {STATE.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-4 py-4"
            >
              <span
                className={
                  item.built
                    ? "text-foreground text-sm"
                    : "text-muted-foreground text-sm"
                }
              >
                {item.label}
              </span>
              <Badge variant={item.built ? "secondary" : "outline"}>
                {item.built ? "Built" : "Planned"}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
