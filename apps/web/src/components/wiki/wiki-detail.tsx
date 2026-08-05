import type { ReactNode } from "react";
import {
  IconArrowLeft,
  IconBolt,
  IconHeart,
  IconShield,
} from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@tablekeep/ui/components/badge";
import { Separator } from "@tablekeep/ui/components/separator";

import {
  WIKI_CATEGORY_META,
  type WikiCategory,
  type WikiDetail,
} from "@/lib/wiki/catalog";
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
import { WikiArtwork } from "./wiki-artwork";

type Fact = { label: string; value: ReactNode };

function readableValue(value: string | null | undefined, fallback = "None") {
  if (!value) return fallback;
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t pt-8">
      <h2 className="font-semibold text-xl tracking-[-0.03em]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FactGrid({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-2">
      {facts
        .filter(
          (fact) =>
            fact.value !== "" &&
            fact.value !== null &&
            fact.value !== undefined,
        )
        .map((fact) => (
          <div key={fact.label}>
            <dt className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
              {fact.label}
            </dt>
            <dd className="mt-1 font-medium text-sm">{fact.value}</dd>
          </div>
        ))}
    </dl>
  );
}

function Source({ detail }: { detail: WikiDetail }) {
  const label =
    "source" in detail ? detail.source.displayName : detail.sourceKey;
  return (
    <footer className="border-t pt-5 text-muted-foreground text-xs">
      Rules source: <span className="font-medium text-foreground">{label}</span>
    </footer>
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
  return (
    <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-10 lg:px-10">
      <Link
        href={`/wiki/${category}`}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg pr-3 text-muted-foreground text-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <IconArrowLeft className="size-4" />
        Back to {meta.title.toLowerCase()}
      </Link>
      <article className="mt-3 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <WikiArtwork
          category={category}
          recordKey={detail.key}
          priority
          className="aspect-[16/7] max-h-80 w-full"
        />
        <div className="p-5 sm:p-8 lg:p-10">
          <header>
            <p className="font-mono text-[10px] text-tk-ember uppercase tracking-[0.18em]">
              {meta.singular}
            </p>
            <h1 className="mt-3 font-semibold text-3xl tracking-[-0.045em] sm:text-5xl">
              {detail.name}
            </h1>
          </header>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
            <div className="min-w-0 space-y-8">
              <DetailBody category={category} detail={detail} />
              <Source detail={detail} />
            </div>
            <aside className="order-first rounded-xl border bg-muted/40 p-5 lg:sticky lg:top-20 lg:order-last">
              <p className="mb-4 font-mono text-[10px] text-tk-ember uppercase tracking-[0.14em]">
                At a glance
              </p>
              <FactGrid facts={detailFacts(category, detail)} />
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
}

function detailFacts(category: WikiCategory, detail: WikiDetail): Fact[] {
  switch (category) {
    case "classes": {
      const value = detail as WikiClass;
      return [
        { label: "Hit die", value: <DiceRoll expression={value.hitDice} /> },
        { label: "Magic", value: readableValue(value.casterType) },
        { label: "Saving throws", value: value.savingThrows.join(", ") },
      ];
    }
    case "creatures": {
      const value = detail as WikiCreature;
      return [
        {
          label: "Challenge",
          value: (
            <span className="inline-flex items-center gap-1">
              <IconBolt className="size-4 text-tk-ember" />
              {value.challengeRating}
            </span>
          ),
        },
        {
          label: "Armor class",
          value: (
            <span className="inline-flex items-center gap-1">
              <IconShield className="size-4 text-tk-ember" />
              {value.armorClass}
            </span>
          ),
        },
        {
          label: "Hit points",
          value: (
            <span className="inline-flex items-center gap-1">
              <IconHeart className="size-4 text-tk-ember" />
              {value.hitPoints}
            </span>
          ),
        },
        { label: "Hit dice", value: <DiceRoll expression={value.hitDice} /> },
        { label: "Size", value: value.size.name },
        { label: "Type", value: value.type.name },
      ];
    }
    case "spells": {
      const value = detail as WikiSpell;
      return [
        { label: "Level", value: value.level === 0 ? "Cantrip" : value.level },
        { label: "School", value: value.school.name },
        { label: "Casting time", value: value.castingTime },
        { label: "Range", value: value.rangeText },
        { label: "Duration", value: value.duration },
        { label: "Components", value: value.components.join(", ") || "None" },
      ];
    }
    case "species": {
      const value = detail as WikiSpecies;
      return [
        { label: "Kind", value: value.isSubspecies ? "Subspecies" : "Species" },
        { label: "Parent", value: value.parentSpecies?.name ?? "—" },
        { label: "Traits", value: value.traits.length },
      ];
    }
    case "feats": {
      const value = detail as WikiFeat;
      return [
        { label: "Type", value: value.type },
        {
          label: "Prerequisite",
          value: value.hasPrerequisite
            ? value.prerequisite || "Required"
            : "None",
        },
        { label: "Benefits", value: value.benefits.length },
      ];
    }
    case "items": {
      const value = detail as WikiItem | WikiMagicItem;
      return [
        { label: "Category", value: value.category.name },
        { label: "Cost", value: value.cost ?? "—" },
        {
          label: "Weight",
          value: value.weight
            ? `${value.weight} ${value.weightUnit ?? ""}`.trim()
            : "—",
        },
        ...("rarity" in value
          ? [
              { label: "Rarity", value: value.rarity?.name ?? "—" },
              {
                label: "Attunement",
                value: value.requiresAttunement ? "Required" : "No",
              },
            ]
          : []),
      ];
    }
    case "rules": {
      const value = detail as WikiRule;
      return [
        { label: "Ruleset", value: value.ruleset },
        { label: "Section", value: value.index },
      ];
    }
    default:
      return [];
  }
}

function DetailBody({
  category,
  detail,
}: {
  category: WikiCategory;
  detail: WikiDetail;
}) {
  if (category === "classes") {
    const value = detail as WikiClass;
    return (
      <>
        <WikiProse text={value.description} />
        <DetailSection title="Hit points">
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="font-medium">
              <DiceRoll expression={value.hitPoints.hitDice} />{" "}
              <span className="ml-2">{value.hitPoints.name}</span>
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6">
              <p>
                <strong>At first level:</strong> {value.hitPoints.atFirstLevel}
              </p>
              <p>
                <strong>At higher levels:</strong>{" "}
                {value.hitPoints.atHigherLevels}
              </p>
            </div>
          </div>
        </DetailSection>
        <DetailSection title="Features">
          <div className="space-y-7">
            {value.features.map((feature) => (
              <section key={feature.key}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-lg">{feature.name}</h3>
                  {feature.gainedAt.map((level) => (
                    <Badge
                      key={`${level.level}-${level.detail}`}
                      variant="secondary"
                    >
                      Level {level.level}
                      {level.detail ? ` · ${level.detail}` : ""}
                    </Badge>
                  ))}
                </div>
                <div className="mt-2">
                  <WikiProse text={feature.description} />
                </div>
              </section>
            ))}
          </div>
        </DetailSection>
      </>
    );
  }
  if (category === "creatures") {
    const value = detail as WikiCreature;
    return (
      <>
        <p className="text-muted-foreground">
          {value.size.name} {value.type.name} · {value.alignment}
        </p>
        <DetailSection title="Ability scores">
          <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Object.entries(value.abilityScores).map(([name, score]) => (
              <div
                key={name}
                className="rounded-lg border bg-muted/30 p-3 text-center"
              >
                <dt className="font-mono text-[10px] uppercase">
                  {name.slice(0, 3)}
                </dt>
                <dd className="mt-1 font-semibold text-lg">{score}</dd>
              </div>
            ))}
          </dl>
        </DetailSection>
        {value.traits.length ? (
          <DetailSection title="Traits">
            <div className="space-y-6">
              {value.traits.map((trait) => (
                <section key={trait.name}>
                  <h3 className="font-semibold">{trait.name}</h3>
                  <div className="mt-2">
                    <WikiProse text={trait.description} />
                  </div>
                </section>
              ))}
            </div>
          </DetailSection>
        ) : null}
        <DetailSection title="Actions">
          <div className="space-y-6">
            {value.actions.map((action) => (
              <section key={`${action.name}-${action.type}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{action.name}</h3>
                  {action.legendaryActionCost ? (
                    <Badge variant="secondary">
                      Costs {action.legendaryActionCost}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-2">
                  <WikiProse text={action.description} />
                </div>
              </section>
            ))}
          </div>
        </DetailSection>
        <DetailSection title="More details">
          <FactGrid
            facts={[
              {
                label: "Speed",
                value: Object.entries(value.speed)
                  .map(([type, speed]) => `${type}: ${speed}`)
                  .join(", "),
              },
              { label: "Passive perception", value: value.passivePerception },
              { label: "Languages", value: value.languages || "None" },
              {
                label: "Experience",
                value: value.experiencePoints.toLocaleString(),
              },
            ]}
          />
        </DetailSection>
      </>
    );
  }
  if (category === "spells") {
    const value = detail as WikiSpell;
    return (
      <>
        <WikiProse text={value.description} />
        {value.damageRoll ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
              Damage
            </p>
            <DiceRoll
              expression={value.damageRoll}
              className="mt-2 text-base"
            />
            {value.damageTypes.length ? (
              <p className="mt-2 text-muted-foreground text-sm">
                {value.damageTypes.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
        {value.material ? (
          <DetailSection title="Materials">
            <WikiProse text={value.material} />
          </DetailSection>
        ) : null}
        {value.higherLevel ? (
          <DetailSection title="At higher levels">
            <WikiProse text={value.higherLevel} />
          </DetailSection>
        ) : null}
        {value.castingOptions.length ? (
          <DetailSection title="Casting options">
            <div className="space-y-4">
              {value.castingOptions.map((option) => (
                <div
                  key={`${option.type}-${option.description ?? option.damageRoll ?? option.duration ?? "option"}`}
                  className="rounded-xl border p-4"
                >
                  <h3 className="font-semibold">{option.type}</h3>
                  {option.damageRoll ? (
                    <DiceRoll expression={option.damageRoll} className="mt-2" />
                  ) : null}
                  {option.description ? (
                    <div className="mt-2">
                      <WikiProse text={option.description} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </DetailSection>
        ) : null}
      </>
    );
  }
  if (category === "species") {
    const value = detail as WikiSpecies;
    return (
      <>
        <WikiProse text={value.description} />
        <DetailSection title="Traits">
          <div className="space-y-7">
            {[...value.traits]
              .sort((a, b) => a.order - b.order)
              .map((trait) => (
                <section key={`${trait.order}-${trait.name}`}>
                  <h3 className="font-semibold text-lg">{trait.name}</h3>
                  <div className="mt-2">
                    <WikiProse text={trait.description} />
                  </div>
                </section>
              ))}
          </div>
        </DetailSection>
      </>
    );
  }
  if (category === "backgrounds") {
    const value = detail as WikiBackground;
    return (
      <>
        <WikiProse text={value.description} />
        <DetailSection title="Benefits">
          <div className="space-y-7">
            {value.benefits.map((benefit, index) => (
              <section
                key={`${benefit.name ?? benefit.type ?? "benefit"}-${benefit.description}`}
              >
                <h3 className="font-semibold text-lg">
                  {benefit.name ?? benefit.type ?? `Benefit ${index + 1}`}
                </h3>
                <div className="mt-2">
                  <WikiProse text={benefit.description} />
                </div>
              </section>
            ))}
          </div>
        </DetailSection>
      </>
    );
  }
  if (category === "feats") {
    const value = detail as WikiFeat;
    return (
      <>
        <WikiProse text={value.description} />
        {value.hasPrerequisite ? (
          <div className="rounded-xl border bg-muted/30 p-4">
            <strong>Prerequisite:</strong> {value.prerequisite}
          </div>
        ) : null}
        <DetailSection title="Benefits">
          <div className="space-y-5">
            {value.benefits.map((benefit, index) => (
              <div key={benefit.description}>
                <WikiProse text={benefit.description} />
                {index < value.benefits.length - 1 ? (
                  <Separator className="mt-5" />
                ) : null}
              </div>
            ))}
          </div>
        </DetailSection>
      </>
    );
  }
  if (category === "items") {
    const value = detail as WikiItem | WikiMagicItem;
    return (
      <>
        <WikiProse text={value.description} />
        {"attunementDetail" in value && value.attunementDetail ? (
          <DetailSection title="Attunement">
            <WikiProse text={value.attunementDetail} />
          </DetailSection>
        ) : null}
        <DetailSection title="Item details">
          <FactGrid
            facts={[
              { label: "Weapon type", value: value.weapon?.name ?? "—" },
              {
                label: "Armor",
                value: value.armor
                  ? `${value.armor.name}${value.armor.armorClass ? ` · AC ${value.armor.armorClass}` : ""}`
                  : "—",
              },
              { label: "Size", value: value.size?.name ?? "—" },
            ]}
          />
        </DetailSection>
      </>
    );
  }
  const value = detail as WikiRule;
  return <WikiProse text={value.description} />;
}
