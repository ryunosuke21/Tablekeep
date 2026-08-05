import type { ReactNode } from "react";
import {
  IconArrowLeft,
  IconBolt,
  IconBook2,
  IconCards,
  IconClock,
  IconFlame,
  IconHeart,
  IconListDetails,
  IconShield,
  IconSparkles,
  IconSword,
  IconTable,
  IconWand,
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

type Fact = { label: string; value: ReactNode; icon?: ReactNode };

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
  const icon = sectionIcon(title);
  return (
    <section className="rounded-2xl border bg-background/55 p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <h2 className="font-semibold text-xl tracking-[-0.03em]">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function sectionIcon(title: string) {
  const name = title.toLowerCase();
  if (name.includes("action")) return <IconSword className="size-5" />;
  if (name.includes("spell") || name.includes("cast"))
    return <IconWand className="size-5" />;
  if (name.includes("trait") || name.includes("feature"))
    return <IconSparkles className="size-5" />;
  if (name.includes("hit") || name.includes("damage"))
    return <IconHeart className="size-5" />;
  if (name.includes("abilit")) return <IconCards className="size-5" />;
  if (name.includes("material") || name.includes("item"))
    return <IconListDetails className="size-5" />;
  return <IconBook2 className="size-5" />;
}

function RuleCard({
  title,
  badge,
  icon = <IconSparkles className="size-4" />,
  children,
}: {
  title: string;
  badge?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-tk-ember">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            {badge}
          </div>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Intro({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5 sm:p-6">
      <div className="flex gap-3">
        <IconBook2 className="mt-1 size-5 shrink-0 text-primary" />
        <WikiProse text={text} />
      </div>
    </div>
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
            <dt className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.14em] [&_svg]:size-3.5 [&_svg]:text-tk-ember">
              {fact.icon}
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
    <footer className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-muted-foreground text-xs">
      <IconBook2 className="size-4 text-tk-ember" />
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
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <div className="min-w-0 space-y-5">
              <DetailBody category={category} detail={detail} />
              <Source detail={detail} />
            </div>
            <aside className="order-first rounded-2xl border bg-muted/40 p-5 shadow-xs lg:sticky lg:top-20 lg:order-last">
              <p className="mb-5 flex items-center gap-2 font-mono text-[10px] text-tk-ember uppercase tracking-[0.14em]">
                <IconListDetails className="size-4" />
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
        {
          label: "Hit die",
          value: <DiceRoll expression={value.hitDice} />,
          icon: <IconHeart />,
        },
        {
          label: "Magic",
          value: readableValue(value.casterType),
          icon: <IconWand />,
        },
        {
          label: "Saving throws",
          value: value.savingThrows.join(", "),
          icon: <IconShield />,
        },
      ];
    }
    case "creatures": {
      const value = detail as WikiCreature;
      return [
        {
          label: "Challenge",
          value: value.challengeRating,
          icon: <IconBolt />,
        },
        {
          label: "Armor class",
          value: value.armorClass,
          icon: <IconShield />,
        },
        {
          label: "Hit points",
          value: value.hitPoints,
          icon: <IconHeart />,
        },
        {
          label: "Hit dice",
          value: <DiceRoll expression={value.hitDice} />,
          icon: <IconHeart />,
        },
        { label: "Size", value: value.size.name, icon: <IconListDetails /> },
        { label: "Type", value: value.type.name, icon: <IconSparkles /> },
      ];
    }
    case "spells": {
      const value = detail as WikiSpell;
      return [
        {
          label: "Level",
          value: value.level === 0 ? "Cantrip" : value.level,
          icon: <IconSparkles />,
        },
        { label: "School", value: value.school.name, icon: <IconWand /> },
        {
          label: "Casting time",
          value: value.castingTime,
          icon: <IconClock />,
        },
        { label: "Range", value: value.rangeText, icon: <IconBolt /> },
        { label: "Duration", value: value.duration, icon: <IconClock /> },
        {
          label: "Components",
          value: value.components.join(", ") || "None",
          icon: <IconListDetails />,
        },
      ];
    }
    case "species": {
      const value = detail as WikiSpecies;
      return [
        {
          label: "Kind",
          value: value.isSubspecies ? "Subspecies" : "Species",
          icon: <IconSparkles />,
        },
        {
          label: "Parent",
          value: value.parentSpecies?.name ?? "—",
          icon: <IconBook2 />,
        },
        {
          label: "Traits",
          value: value.traits.length,
          icon: <IconListDetails />,
        },
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
        <Intro text={value.description} />
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
          <div className="grid gap-4">
            {value.features.map((feature) => (
              <RuleCard
                key={feature.key}
                title={feature.name}
                icon={<IconSparkles className="size-4" />}
                badge={feature.gainedAt.map((level) => (
                  <Badge
                    key={`${level.level}-${level.detail}`}
                    variant="secondary"
                  >
                    Level {level.level}
                    {level.detail ? ` · ${level.detail}` : ""}
                  </Badge>
                ))}
              >
                <WikiProse text={feature.description} />
              </RuleCard>
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
            <div className="grid gap-4">
              {value.traits.map((trait) => (
                <RuleCard key={trait.name} title={trait.name}>
                  <WikiProse text={trait.description} />
                </RuleCard>
              ))}
            </div>
          </DetailSection>
        ) : null}
        <DetailSection title="Actions">
          <div className="grid gap-4">
            {value.actions.map((action) => (
              <RuleCard
                key={`${action.name}-${action.type}`}
                title={action.name}
                icon={<IconSword className="size-4" />}
                badge={
                  action.legendaryActionCost ? (
                    <Badge variant="secondary">
                      Costs {action.legendaryActionCost}
                    </Badge>
                  ) : null
                }
              >
                <WikiProse text={action.description} />
              </RuleCard>
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
        <Intro text={value.description} />
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
        <Intro text={value.description} />
        <DetailSection title="Traits">
          <div className="grid gap-4">
            {[...value.traits]
              .sort((a, b) => a.order - b.order)
              .map((trait) => (
                <RuleCard
                  key={`${trait.order}-${trait.name}`}
                  title={trait.name}
                  icon={
                    trait.name.toLowerCase().includes("breath") ? (
                      <IconFlame className="size-4" />
                    ) : trait.description.includes("|---") ? (
                      <IconTable className="size-4" />
                    ) : (
                      <IconSparkles className="size-4" />
                    )
                  }
                  badge={
                    trait.type ? (
                      <Badge variant="secondary">
                        {readableValue(trait.type)}
                      </Badge>
                    ) : undefined
                  }
                >
                  <WikiProse text={trait.description} />
                </RuleCard>
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
        <Intro text={value.description} />
        <DetailSection title="Benefits">
          <div className="grid gap-4">
            {value.benefits.map((benefit, index) => (
              <RuleCard
                key={`${benefit.name ?? benefit.type ?? "benefit"}-${benefit.description}`}
                title={benefit.name ?? benefit.type ?? `Benefit ${index + 1}`}
              >
                <WikiProse text={benefit.description} />
              </RuleCard>
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
        <Intro text={value.description} />
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
        <Intro text={value.description} />
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
  return <Intro text={value.description} />;
}
