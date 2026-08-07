import type { ReactNode } from "react";
import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@tablekeep/ui/components/badge";

import {
  WIKI_CATEGORY_META,
  type WikiCategory,
  type WikiDetail,
  wikiAccentStyle,
} from "@/lib/wiki/catalog";
import { formatChallengeRating, titleCase } from "@/lib/wiki/facets";
import type {
  WikiBackground,
  WikiClass,
  WikiCreature,
  WikiFeat,
  WikiItem,
  WikiMagicItem,
  WikiRule,
  WikiSpecies,
  WikiSpell,
} from "@/types/wiki";

import { DiceRoll } from "./dice-roll";
import { WikiProse } from "./dice-text";
import { WikiImage } from "./wiki-image";

type Fact = { label: string; value: ReactNode };
type Section = { id: string; title: string; body: ReactNode };

function sectionId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** One named rule inside a section: run-in heading, then its text. */
function Entry({
  title,
  badges,
  children,
}: {
  title: string;
  badges?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="border-border/70 border-b py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display font-semibold text-base">{title}</h3>
        {badges}
      </div>
      <div className="mt-2">{children}</div>
    </article>
  );
}

function FactList({
  facts,
}: {
  facts: Array<{ label: string; value: string }>;
}) {
  const shown = facts.filter((fact) => fact.value);
  if (!shown.length) return null;
  return (
    <dl className="mt-4 space-y-1.5 text-sm">
      {shown.map((fact) => (
        <div key={fact.label} className="flex gap-2">
          <dt className="shrink-0 text-muted-foreground">{fact.label}</dt>
          <dd className="min-w-0">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The portrait and reference table, in the shape of an encyclopedia infobox. */
function Infobox({
  category,
  detail,
  facts,
}: {
  category: WikiCategory;
  detail: WikiDetail;
  facts: Fact[];
}) {
  const source = detail.source;
  const shown = facts.filter(
    (fact) =>
      fact.value !== null && fact.value !== "" && fact.value !== undefined,
  );

  return (
    <section
      aria-label="At a glance"
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <span aria-hidden className="block h-1 bg-[var(--wiki-accent)]" />
      <WikiImage
        category={category}
        name={detail.name}
        eager
        className="aspect-square max-h-56 w-full border-b lg:max-h-none"
      />
      {shown.length ? (
        <dl className="divide-y text-sm">
          {shown.map((fact) => (
            <div
              key={fact.label}
              className="flex items-baseline gap-3 px-4 py-2.5"
            >
              <dt className="w-24 shrink-0 font-mono text-[0.6rem] text-muted-foreground uppercase leading-5 tracking-[0.12em]">
                {fact.label}
              </dt>
              <dd className="min-w-0 flex-1 font-medium tabular-nums">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <footer className="border-t bg-muted/40 px-4 py-3 text-muted-foreground text-xs leading-5">
        <p>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em]">
            Source
          </span>
          <br />
          <span className="text-foreground">{source.displayName}</span>
          <br />
          {source.publisher.name} · {source.gameSystem.name}
        </p>
        <a
          href={source.permalink}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 hover:text-foreground"
        >
          Publisher site
          <IconExternalLink className="size-3.5" />
        </a>
      </footer>
    </section>
  );
}

function Contents({ sections }: { sections: Section[] }) {
  if (sections.length < 3) return null;
  return (
    <nav
      aria-label="Contents"
      className="rounded-2xl border bg-card p-4 shadow-xs"
    >
      <p className="font-mono text-[0.6rem] text-muted-foreground uppercase tracking-[0.14em]">
        Contents
      </p>
      <ol className="mt-2 space-y-1 text-sm">
        {sections.map((section, index) => (
          <li key={section.id} className="flex gap-2">
            <span className="font-mono text-muted-foreground text-xs tabular-nums">
              {index + 1}
            </span>
            <a
              href={`#${section.id}`}
              className="text-muted-foreground hover:text-[var(--wiki-accent)] hover:underline"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function WikiDetailPage({
  category,
  detail,
}: {
  category: WikiCategory;
  detail: WikiDetail;
}) {
  const meta = WIKI_CATEGORY_META[category];
  const chips = identityOf(category, detail);
  const sections = sectionsFor(category, detail);
  const lede = ledeOf(detail);

  return (
    <main
      className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6 lg:px-10"
      style={wikiAccentStyle(category)}
    >
      <Link
        href={`/wiki/${category}`}
        className="inline-flex min-h-11 items-center gap-2 text-muted-foreground text-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <IconArrowLeft className="size-4" />
        All {meta.title.toLowerCase()}
      </Link>

      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <header className="lg:col-span-2">
          <p className="font-mono text-[0.65rem] text-[var(--wiki-accent)] uppercase tracking-[0.2em]">
            {meta.singular}
          </p>
          <h1 className="mt-2 font-display font-semibold text-[2.5rem] leading-[1.02] tracking-[-0.025em] sm:text-6xl">
            {detail.name}
          </h1>
          {chips.length ? (
            <ul className="mt-4 flex flex-wrap items-center gap-1.5">
              {chips.map((chip) => (
                <li key={chip}>
                  <Badge
                    variant="outline"
                    className="border-[color-mix(in_oklab,var(--wiki-accent)_30%,var(--border))] bg-[color-mix(in_oklab,var(--wiki-accent)_8%,transparent)] font-normal text-foreground text-xs"
                  >
                    {chip}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
          <span
            aria-hidden
            className="mt-6 block h-px bg-gradient-to-r from-[var(--wiki-accent)] via-border to-transparent"
          />
        </header>

        <aside className="space-y-4 lg:col-start-2 lg:row-start-2 lg:self-start">
          <div className="lg:sticky lg:top-20 lg:space-y-4">
            <Infobox
              category={category}
              detail={detail}
              facts={infoboxFacts(category, detail)}
            />
            <div className="hidden lg:block">
              <Contents sections={sections} />
            </div>
          </div>
        </aside>

        <article className="min-w-0 lg:col-start-1 lg:row-start-2">
          {lede ? (
            <div className="text-[1.05rem] leading-8 [&_p:first-of-type]:text-foreground">
              <WikiProse text={lede} />
            </div>
          ) : null}

          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-20 pt-9 first:pt-6"
            >
              <div className="flex items-baseline gap-3">
                <h2 className="font-display font-semibold text-xl tracking-[-0.01em]">
                  {section.title}
                </h2>
                <span aria-hidden className="h-px flex-1 bg-border" />
              </div>
              <div className="mt-4">{section.body}</div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}

function ledeOf(detail: WikiDetail) {
  return "description" in detail ? detail.description : "";
}

/** What the entry is, in a few words. Numbers live in the infobox instead. */
function identityOf(category: WikiCategory, detail: WikiDetail): string[] {
  switch (category) {
    case "creatures": {
      const value = detail as WikiCreature;
      return [
        value.size.name,
        titleCase(value.type.name),
        titleCase(value.alignment),
        `CR ${formatChallengeRating(value.challengeRating)}`,
      ];
    }
    case "spells": {
      const value = detail as WikiSpell;
      return [
        value.level === 0 ? "Cantrip" : `Level ${value.level}`,
        value.school.name,
        ...(value.concentration ? ["Concentration"] : []),
        ...(value.ritual ? ["Ritual"] : []),
        ...(value.classes.length
          ? [value.classes.map((entry) => entry.name).join(", ")]
          : []),
      ];
    }
    case "classes": {
      const value = detail as WikiClass;
      return [
        value.parentClass ? `Subclass of ${value.parentClass.name}` : "Class",
        ...(value.casterType && value.casterType.toLowerCase() !== "none"
          ? [`${titleCase(value.casterType)} caster`]
          : []),
      ];
    }
    case "species": {
      const value = detail as WikiSpecies;
      return [
        value.parentSpecies
          ? `Subspecies of ${value.parentSpecies.name}`
          : "Playable species",
      ];
    }
    case "items": {
      const value = detail as WikiMagicItem;
      return [
        value.rarity ? "Magic item" : "Everyday gear",
        value.category.name,
        ...(value.rarity ? [value.rarity.name] : []),
        ...(value.requiresAttunement ? ["Attunement"] : []),
      ];
    }
    case "feats": {
      const value = detail as WikiFeat;
      return [
        `${titleCase(value.type, "General")} feat`,
        ...(value.hasPrerequisite
          ? ["Has a prerequisite"]
          : ["Open to anyone"]),
      ];
    }
    case "rules":
      return [
        titleCase(
          (detail as WikiRule).ruleset
            .replace(/^srd[-_]?/i, "")
            .replaceAll("-", " "),
        ),
      ];
    default:
      return ["Character background"];
  }
}

/** Reference numbers and details. Nothing here repeats an identity chip. */
function infoboxFacts(category: WikiCategory, detail: WikiDetail): Fact[] {
  switch (category) {
    case "classes": {
      const value = detail as WikiClass;
      return [
        ...(value.hitDice
          ? [
              {
                label: "Hit die",
                value: <DiceRoll expression={value.hitDice} compact />,
              },
            ]
          : []),
        ...(value.savingThrows.length
          ? [{ label: "Saves", value: value.savingThrows.join(", ") }]
          : []),
        { label: "Features", value: value.features.length },
      ];
    }
    case "creatures": {
      const value = detail as WikiCreature;
      return [
        {
          label: "Armor class",
          value: `${value.armorClass}${value.armorDetail ? ` (${value.armorDetail})` : ""}`,
        },
        {
          label: "Hit points",
          value: (
            <>
              {value.hitPoints}
              {value.hitDice ? (
                <span className="text-muted-foreground">
                  {" "}
                  ({value.hitDice})
                </span>
              ) : null}
            </>
          ),
        },
        { label: "Speed", value: formatSpeed(value.speed) },
        { label: "Perception", value: value.passivePerception },
        { label: "Experience", value: value.experiencePoints.toLocaleString() },
      ];
    }
    case "spells": {
      const value = detail as WikiSpell;
      return [
        { label: "Casting", value: titleCase(value.castingTime) },
        { label: "Range", value: value.rangeText },
        { label: "Duration", value: value.duration },
        { label: "Components", value: value.components.join(", ") || "None" },
        ...(value.savingThrowAbility
          ? [{ label: "Save", value: titleCase(value.savingThrowAbility) }]
          : []),
      ];
    }
    case "items": {
      const value = detail as WikiItem | WikiMagicItem;
      const cost = trimMeasure(value.cost);
      const weight = trimMeasure(value.weight);
      return [
        ...(cost ? [{ label: "Cost", value: cost }] : []),
        ...(weight
          ? [
              {
                label: "Weight",
                value: `${weight} ${value.weightUnit ?? ""}`.trim(),
              },
            ]
          : []),
        ...(value.weapon
          ? [{ label: "Weapon", value: value.weapon.name }]
          : []),
        ...(value.armor
          ? [
              {
                label: "Armor",
                value: `${value.armor.name}${value.armor.armorClass ? ` · AC ${value.armor.armorClass}` : ""}`,
              },
            ]
          : []),
        ...(value.size ? [{ label: "Size", value: value.size.name }] : []),
      ];
    }
    case "species": {
      const value = detail as WikiSpecies;
      const size = speciesTrait(value, "SIZE");
      const speed = speciesTrait(value, "SPEED");
      return [
        ...(size
          ? [{ label: "Size", value: firstLine(size.description) }]
          : []),
        ...(speed
          ? [{ label: "Speed", value: firstLine(speed.description) }]
          : []),
        { label: "Traits", value: value.traits.length },
      ];
    }
    case "feats": {
      const value = detail as WikiFeat;
      return [
        ...(value.hasPrerequisite
          ? [
              {
                label: "Requires",
                value: value.prerequisite || "A prerequisite",
              },
            ]
          : []),
        { label: "Benefits", value: value.benefits.length },
      ];
    }
    case "rules": {
      const value = detail as WikiRule;
      return [{ label: "Section", value: value.index }];
    }
    default:
      return [
        {
          label: "Benefits",
          value: (detail as WikiBackground).benefits.length,
        },
      ];
  }
}

/**
 * Size and speed read as reference numbers rather than prose, so they are shown
 * in the infobox and dropped from the trait list instead of appearing twice.
 */
function speciesTrait(value: WikiSpecies, kind: "SIZE" | "SPEED") {
  return value.traits.find(
    (trait) =>
      trait.type === kind || trait.name.toLowerCase() === kind.toLowerCase(),
  );
}

/** Upstream sends measures as padded decimals: "20.000" reads better as "20". */
function trimMeasure(value: string | null) {
  const parsed = Number(value);
  if (!value || !Number.isFinite(parsed) || parsed === 0) return null;
  return String(parsed);
}

function firstLine(text: string) {
  return text.split("\n")[0]?.trim() ?? "";
}

function sectionsFor(category: WikiCategory, detail: WikiDetail): Section[] {
  const sections: Section[] = [];
  const add = (title: string, body: ReactNode) =>
    sections.push({ id: sectionId(title), title, body });

  if (category === "classes") {
    const value = detail as WikiClass;
    if (value.hitPoints) {
      add(
        "Hit points",
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Hit dice", value: value.hitPoints.name },
            { label: "At level 1", value: value.hitPoints.atFirstLevel },
            { label: "On level up", value: value.hitPoints.atHigherLevels },
          ].map((fact) => (
            <div key={fact.label} className="rounded-lg border bg-card p-3">
              <dt className="font-mono text-[0.6rem] text-muted-foreground uppercase tracking-[0.14em]">
                {fact.label}
              </dt>
              <dd className="mt-1 text-sm">{fact.value}</dd>
            </div>
          ))}
        </dl>,
      );
    }
    if (value.features.length) {
      add(
        "Features",
        <div>
          {value.features.map((feature) => (
            <Entry
              key={feature.key}
              title={feature.name}
              badges={[...feature.gainedAt]
                .sort((left, right) => left.level - right.level)
                .map((level) => (
                  <Badge
                    key={`${level.level}-${level.detail}`}
                    variant="outline"
                    className="border-[color-mix(in_oklab,var(--wiki-accent)_35%,var(--border))] font-mono text-[0.65rem]"
                  >
                    Level {level.level}
                    {level.detail ? ` · ${level.detail}` : ""}
                  </Badge>
                ))}
            >
              <WikiProse text={feature.description} />
            </Entry>
          ))}
        </div>,
      );
    }
    return sections;
  }

  if (category === "creatures") {
    const value = detail as WikiCreature;
    add(
      "Ability scores",
      <>
        <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Object.entries(value.abilityScores).map(([name, score]) => (
            <div
              key={name}
              className="rounded-lg border bg-card py-2 text-center"
            >
              <dt className="font-mono text-[0.6rem] text-muted-foreground uppercase tracking-[0.1em]">
                {name.slice(0, 3)}
              </dt>
              <dd className="font-display font-semibold text-xl tabular-nums">
                {score}
                <span className="ml-1 align-middle font-mono text-[0.65rem] text-muted-foreground">
                  {abilityModifier(score)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <FactList
          facts={[
            { label: "Saving throws", value: bonusList(value.savingThrows) },
            { label: "Skills", value: bonusList(value.skillBonuses) },
            { label: "Languages", value: value.languages || "None" },
          ]}
        />
      </>,
    );
    if (value.traits.length) {
      add(
        "Traits",
        <div>
          {value.traits.map((trait) => (
            <Entry key={trait.name} title={trait.name}>
              <WikiProse text={trait.description} />
            </Entry>
          ))}
        </div>,
      );
    }
    if (value.actions.length) {
      add(
        "Actions",
        <div>
          {value.actions.map((action) => (
            <Entry
              key={`${action.name}-${action.type}`}
              title={action.name}
              badges={
                action.legendaryActionCost ? (
                  <Badge
                    variant="secondary"
                    className="font-mono text-[0.65rem]"
                  >
                    Costs {action.legendaryActionCost}
                  </Badge>
                ) : null
              }
            >
              <WikiProse text={action.description} />
            </Entry>
          ))}
        </div>,
      );
    }
    return sections;
  }

  if (category === "spells") {
    const value = detail as WikiSpell;
    if (value.damageRoll) {
      add(
        "Damage",
        <div className="flex flex-wrap items-center gap-3">
          <DiceRoll expression={value.damageRoll} className="text-base" />
          {value.damageTypes.length ? (
            <span className="text-muted-foreground text-sm">
              {value.damageTypes.join(", ")}
            </span>
          ) : null}
        </div>,
      );
    }
    if (value.material) add("Materials", <WikiProse text={value.material} />);
    if (value.higherLevel)
      add("At higher levels", <WikiProse text={value.higherLevel} />);
    if (value.castingOptions.length) {
      add(
        "Casting options",
        <div>
          {value.castingOptions.map((option) => (
            <Entry
              key={`${option.type}-${option.description ?? option.damageRoll ?? option.duration ?? "option"}`}
              title={titleCase(option.type)}
            >
              {option.damageRoll ? (
                <DiceRoll expression={option.damageRoll} />
              ) : null}
              {option.description ? (
                <WikiProse text={option.description} />
              ) : null}
            </Entry>
          ))}
        </div>,
      );
    }
    return sections;
  }

  if (category === "species") {
    const value = detail as WikiSpecies;
    const shown = [...value.traits]
      .filter(
        (trait) =>
          trait !== speciesTrait(value, "SIZE") &&
          trait !== speciesTrait(value, "SPEED"),
      )
      .sort((left, right) => left.order - right.order);
    if (shown.length) {
      add(
        "Traits",
        <div>
          {shown.map((trait) => (
            <Entry
              key={`${trait.order}-${trait.name}`}
              title={trait.name}
              badges={
                trait.type ? (
                  <Badge
                    variant="secondary"
                    className="font-mono text-[0.65rem]"
                  >
                    {titleCase(trait.type)}
                  </Badge>
                ) : undefined
              }
            >
              <WikiProse text={trait.description} />
            </Entry>
          ))}
        </div>,
      );
    }
    return sections;
  }

  if (category === "backgrounds") {
    const value = detail as WikiBackground;
    if (value.benefits.length) {
      add(
        "Benefits",
        <div>
          {value.benefits.map((benefit, index) => (
            <Entry
              key={`${benefit.name ?? benefit.type ?? "benefit"}-${benefit.description}`}
              title={
                benefit.name ??
                titleCase(benefit.type ?? "", `Benefit ${index + 1}`)
              }
            >
              <WikiProse text={benefit.description} />
            </Entry>
          ))}
        </div>,
      );
    }
    return sections;
  }

  if (category === "feats") {
    const value = detail as WikiFeat;
    if (value.benefits.length) {
      add(
        "Benefits",
        <div className="divide-y">
          {value.benefits.map((benefit) => (
            <div
              key={benefit.description}
              className="py-4 first:pt-0 last:pb-0"
            >
              <WikiProse text={benefit.description} />
            </div>
          ))}
        </div>,
      );
    }
    return sections;
  }

  if (category === "items") {
    const value = detail as WikiItem | WikiMagicItem;
    if ("attunementDetail" in value && value.attunementDetail) {
      add("Attunement", <WikiProse text={value.attunementDetail} />);
    }
    return sections;
  }

  return sections;
}

/** Speeds arrive as a mixed record: a unit, distances, and hover as a flag. */
function formatSpeed(speed: WikiCreature["speed"]) {
  const rawUnit = typeof speed.unit === "string" ? speed.unit : "feet";
  const unit = rawUnit === "feet" ? "ft." : rawUnit;
  const parts: string[] = [];

  for (const [kind, distance] of Object.entries(speed)) {
    if (kind === "unit") continue;
    if (distance === true) {
      parts.push(kind);
      continue;
    }
    if (typeof distance !== "number" || distance <= 0) continue;
    parts.push(
      kind === "walk" ? `${distance} ${unit}` : `${kind} ${distance} ${unit}`,
    );
  }

  return parts.join(", ");
}

function abilityModifier(score: number) {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : String(modifier);
}

function bonusList(bonuses: Record<string, number>) {
  return Object.entries(bonuses)
    .map(
      ([name, bonus]) => `${titleCase(name)} ${bonus >= 0 ? "+" : ""}${bonus}`,
    )
    .join(", ");
}
