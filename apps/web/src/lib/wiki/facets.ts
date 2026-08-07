import type {
  WikiCategory,
  WikiItemKind,
  WikiListItem,
} from "@/lib/wiki/catalog";
import type {
  WikiClassListItem,
  WikiCreatureListItem,
  WikiFeatListItem,
  WikiItemListItem,
  WikiMagicItemListItem,
  WikiRuleListItem,
  WikiSource,
  WikiSpeciesListItem,
  WikiSpellListItem,
} from "@/types/wiki";

export type FacetValue = { value: string; label: string };

export type WikiFacet = {
  key: string;
  label: string;
  /** Buckets an entry belongs to. An entry matches a facet if it shares any selected bucket. */
  valuesOf: (item: WikiListItem) => FacetValue[];
  /** Canonical option order. Facets without one are listed by how common they are. */
  order?: readonly string[];
};

export type WikiGroup = {
  key: string;
  /** Full heading above the group. */
  label: string;
  /** One or two characters for the jump rail. */
  short: string;
};

export type WikiSort = {
  key: string;
  label: string;
  compare: (left: WikiListItem, right: WikiListItem) => number;
  groupOf: (item: WikiListItem) => WikiGroup;
};

export type WikiStat = { label: string; value: string };

export type SourceLookup = (key: string) => WikiSource | undefined;

export function titleCase(value: string, fallback = "—") {
  if (!value) return fallback;
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const CHALLENGE_FRACTIONS: Record<string, string> = {
  "0.125": "1/8",
  "0.25": "1/4",
  "0.5": "1/2",
};

export function formatChallengeRating(rating: number) {
  return CHALLENGE_FRACTIONS[String(rating)] ?? String(rating);
}

export function spellLevelLabel(level: number) {
  return level === 0 ? "Cantrip" : `Level ${level}`;
}

function letterGroup(name: string): WikiGroup {
  const letter = name.trim().charAt(0).toUpperCase();
  const isLetter = letter >= "A" && letter <= "Z";
  return isLetter
    ? { key: letter, label: letter, short: letter }
    : { key: "#", label: "Numbers and symbols", short: "#" };
}

function byName(left: WikiListItem, right: WikiListItem) {
  return left.name.localeCompare(right.name, "en", { numeric: true });
}

const alphabetical: WikiSort = {
  key: "name",
  label: "A to Z",
  compare: byName,
  groupOf: (item) => letterGroup(item.name),
};

const UNBOUNDED_BAND = {
  key: "21+",
  label: "CR 21 and up",
  short: "21",
  max: Number.POSITIVE_INFINITY,
};

/** Ordered coarse bands, because "CR 1/8 to 1/2" is how encounters get planned. */
export const CHALLENGE_BANDS = [
  { key: "0", label: "CR 0", short: "0", max: 0 },
  { key: "fraction", label: "CR 1/8 to 1/2", short: "½", max: 0.5 },
  { key: "1-4", label: "CR 1 to 4", short: "1", max: 4 },
  { key: "5-10", label: "CR 5 to 10", short: "5", max: 10 },
  { key: "11-16", label: "CR 11 to 16", short: "11", max: 16 },
  { key: "17-20", label: "CR 17 to 20", short: "17", max: 20 },
  UNBOUNDED_BAND,
];

function challengeBand(rating: number) {
  return CHALLENGE_BANDS.find((band) => rating <= band.max) ?? UNBOUNDED_BAND;
}

/** Always at least one sort, so callers can rely on the first entry. */
export function sortsFor(category: WikiCategory): [WikiSort, ...WikiSort[]] {
  switch (category) {
    case "spells":
      return [
        alphabetical,
        {
          key: "level",
          label: "By level",
          compare: (left, right) => {
            const difference =
              (left as WikiSpellListItem).level -
              (right as WikiSpellListItem).level;
            return difference === 0 ? byName(left, right) : difference;
          },
          groupOf: (item) => {
            const { level } = item as WikiSpellListItem;
            return {
              key: `level-${level}`,
              label: level === 0 ? "Cantrips" : `Level ${level} spells`,
              short: String(level),
            };
          },
        },
      ];
    case "creatures":
      return [
        alphabetical,
        {
          key: "challenge",
          label: "By challenge",
          compare: (left, right) => {
            const difference =
              (left as WikiCreatureListItem).challengeRating -
              (right as WikiCreatureListItem).challengeRating;
            return difference === 0 ? byName(left, right) : difference;
          },
          groupOf: (item) => {
            const band = challengeBand(
              (item as WikiCreatureListItem).challengeRating,
            );
            return { key: band.key, label: band.label, short: band.short };
          },
        },
      ];
    case "items":
      return [
        alphabetical,
        {
          key: "rarity",
          label: "By rarity",
          compare: (left, right) => {
            const difference = rarityRank(left) - rarityRank(right);
            return difference === 0 ? byName(left, right) : difference;
          },
          groupOf: (item) => {
            const rarity = (item as WikiMagicItemListItem).rarity;
            if (!rarity)
              return {
                key: "everyday",
                label: "Everyday gear",
                short: "—",
              };
            return {
              key: rarity.key,
              label: rarity.name,
              short: rarity.name.charAt(0).toUpperCase(),
            };
          },
        },
      ];
    case "classes":
      return [
        alphabetical,
        {
          key: "family",
          label: "By class",
          compare: (left, right) => {
            const difference = classFamily(left).localeCompare(
              classFamily(right),
            );
            if (difference !== 0) return difference;
            const leftIsSubclass = (left as WikiClassListItem).isSubclass;
            const rightIsSubclass = (right as WikiClassListItem).isSubclass;
            if (leftIsSubclass !== rightIsSubclass)
              return leftIsSubclass ? 1 : -1;
            return byName(left, right);
          },
          groupOf: (item) => {
            const family = classFamily(item);
            return {
              key: family,
              label: family,
              short: family.charAt(0).toUpperCase(),
            };
          },
        },
      ];
    case "rules":
      return [
        alphabetical,
        {
          key: "chapter",
          label: "In book order",
          compare: (left, right) => {
            const leftRule = left as WikiRuleListItem;
            const rightRule = right as WikiRuleListItem;
            const difference = chapterName(leftRule).localeCompare(
              chapterName(rightRule),
            );
            return difference === 0
              ? leftRule.index - rightRule.index
              : difference;
          },
          groupOf: (item) => {
            const chapter = chapterName(item as WikiRuleListItem);
            return {
              key: chapter,
              label: chapter,
              short: chapter.charAt(0).toUpperCase(),
            };
          },
        },
      ];
    default:
      return [alphabetical];
  }
}

function rarityRank(item: WikiListItem) {
  const rarity = (item as WikiMagicItemListItem).rarity;
  return rarity ? rarity.rank : -1;
}

function classFamily(item: WikiListItem) {
  const value = item as WikiClassListItem;
  return value.parentClass?.name ?? value.name;
}

function chapterName(item: WikiRuleListItem) {
  return titleCase(item.ruleset.replace(/^srd[-_]?/i, "").replaceAll("-", " "));
}

function one(value: string, label = value): FacetValue[] {
  return [{ value, label }];
}

function sourceFacets(sources: SourceLookup): WikiFacet[] {
  return [
    {
      key: "ruleset",
      label: "Rules set",
      valuesOf: (item) => {
        const system = sources(item.sourceKey)?.gameSystem;
        return system ? one(system.key, system.name) : [];
      },
    },
    {
      key: "source",
      label: "Source book",
      valuesOf: (item) => {
        const source = sources(item.sourceKey);
        return source ? one(source.key, source.displayName) : [];
      },
    },
  ];
}

export function facetsFor(
  category: WikiCategory,
  sources: SourceLookup,
): WikiFacet[] {
  const shared = sourceFacets(sources);

  switch (category) {
    case "classes":
      return [
        {
          key: "kind",
          label: "Kind",
          order: ["class", "subclass"],
          valuesOf: (item) =>
            (item as WikiClassListItem).isSubclass
              ? one("subclass", "Subclasses")
              : one("class", "Classes"),
        },
        {
          key: "casting",
          label: "Spellcasting",
          valuesOf: (item) => {
            const caster = (item as WikiClassListItem).casterType;
            return one(caster || "none", titleCase(caster, "None"));
          },
        },
        ...shared,
      ];
    case "species":
      return [
        {
          key: "kind",
          label: "Kind",
          order: ["species", "subspecies"],
          valuesOf: (item) =>
            (item as WikiSpeciesListItem).isSubspecies
              ? one("subspecies", "Subspecies")
              : one("species", "Species"),
        },
        ...shared,
      ];
    case "spells":
      return [
        {
          key: "level",
          label: "Level",
          order: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
          valuesOf: (item) => {
            const { level } = item as WikiSpellListItem;
            return one(String(level), spellLevelLabel(level));
          },
        },
        {
          key: "school",
          label: "School",
          valuesOf: (item) => {
            const { school } = item as WikiSpellListItem;
            return one(school.key, school.name);
          },
        },
        {
          key: "class",
          label: "Class list",
          valuesOf: (item) =>
            (item as WikiSpellListItem).classes.map((entry) => ({
              value: entry.name.toLowerCase(),
              label: entry.name,
            })),
        },
        {
          key: "casting",
          label: "Casting time",
          valuesOf: (item) => {
            const { castingTime } = item as WikiSpellListItem;
            return one(castingTime.toLowerCase(), titleCase(castingTime));
          },
        },
        {
          key: "tags",
          label: "Needs",
          order: ["concentration", "ritual", "v", "s", "m"],
          valuesOf: (item) => {
            const spell = item as WikiSpellListItem;
            const values: FacetValue[] = [];
            if (spell.concentration)
              values.push({
                value: "concentration",
                label: "Concentration",
              });
            if (spell.ritual) values.push({ value: "ritual", label: "Ritual" });
            for (const component of spell.components)
              values.push({
                value: component.toLowerCase(),
                label: { V: "Verbal", S: "Somatic", M: "Material" }[component],
              });
            return values;
          },
        },
        ...shared,
      ];
    case "creatures":
      return [
        {
          key: "challenge",
          label: "Challenge",
          order: CHALLENGE_BANDS.map((band) => band.key),
          valuesOf: (item) => {
            const band = challengeBand(
              (item as WikiCreatureListItem).challengeRating,
            );
            return one(band.key, band.label);
          },
        },
        {
          key: "type",
          label: "Type",
          valuesOf: (item) => {
            const { type } = item as WikiCreatureListItem;
            return one(type.key, type.name);
          },
        },
        {
          key: "size",
          label: "Size",
          valuesOf: (item) => {
            const { size } = item as WikiCreatureListItem;
            return one(size.key, size.name);
          },
        },
        ...shared,
      ];
    case "items":
      return [
        {
          key: "kind",
          label: "Kind",
          order: ["mundane", "magic"],
          valuesOf: (item) =>
            itemKindOf(item) === "magic"
              ? one("magic", "Magic items")
              : one("mundane", "Everyday gear"),
        },
        {
          key: "category",
          label: "Category",
          valuesOf: (item) => {
            const { category } = item as WikiItemListItem;
            return one(category.key, category.name);
          },
        },
        {
          key: "rarity",
          label: "Rarity",
          order: [
            "common",
            "uncommon",
            "rare",
            "very-rare",
            "legendary",
            "artifact",
          ],
          valuesOf: (item) => {
            const rarity = (item as WikiMagicItemListItem).rarity;
            return rarity ? one(rarity.key, rarity.name) : [];
          },
        },
        {
          key: "attunement",
          label: "Attunement",
          order: ["required", "free"],
          valuesOf: (item) => {
            const value = item as WikiMagicItemListItem;
            if (itemKindOf(item) !== "magic") return [];
            return value.requiresAttunement
              ? one("required", "Needs attunement")
              : one("free", "No attunement");
          },
        },
        ...shared,
      ];
    case "feats":
      return [
        {
          key: "type",
          label: "Type",
          valuesOf: (item) => {
            const { type } = item as WikiFeatListItem;
            return one(type.toLowerCase() || "feat", titleCase(type, "Feat"));
          },
        },
        {
          key: "prerequisite",
          label: "Prerequisite",
          order: ["required", "none"],
          valuesOf: (item) =>
            (item as WikiFeatListItem).hasPrerequisite
              ? one("required", "Has a prerequisite")
              : one("none", "Open to anyone"),
        },
        ...shared,
      ];
    case "rules":
      return [
        {
          key: "chapter",
          label: "Chapter",
          valuesOf: (item) => {
            const chapter = chapterName(item as WikiRuleListItem);
            return one(chapter);
          },
        },
        ...shared,
      ];
    default:
      return shared;
  }
}

/** One line that says what the entry is, shown under its name. */
export function descriptorOf(
  category: WikiCategory,
  item: WikiListItem,
): string {
  switch (category) {
    case "classes": {
      const value = item as WikiClassListItem;
      return value.parentClass
        ? `Subclass of ${value.parentClass.name}`
        : "Base class";
    }
    case "creatures": {
      const value = item as WikiCreatureListItem;
      return `${value.size.name} ${value.type.name.toLowerCase()}`;
    }
    case "spells": {
      const value = item as WikiSpellListItem;
      return `${spellLevelLabel(value.level)} · ${value.school.name}`;
    }
    case "species": {
      const value = item as WikiSpeciesListItem;
      return value.parentSpecies
        ? `Subspecies of ${value.parentSpecies.name}`
        : "Species";
    }
    case "feats":
      return titleCase((item as WikiFeatListItem).type, "Feat");
    case "items": {
      const value = item as WikiMagicItemListItem;
      return itemKindOf(item) === "magic"
        ? `${value.rarity?.name ?? "Magic"} ${value.category.name.toLowerCase()}`
        : value.category.name;
    }
    case "rules":
      return chapterName(item as WikiRuleListItem);
    default:
      return "Background";
  }
}

/** The short stat strip shown beside every row and inside every card. */
export function statsFor(
  category: WikiCategory,
  item: WikiListItem,
): WikiStat[] {
  switch (category) {
    case "classes": {
      const value = item as WikiClassListItem;
      return [
        { label: "Hit die", value: value.hitDice.toLowerCase() || "—" },
        { label: "Casting", value: titleCase(value.casterType, "None") },
      ];
    }
    case "creatures": {
      const value = item as WikiCreatureListItem;
      return [
        { label: "CR", value: formatChallengeRating(value.challengeRating) },
        { label: "AC", value: String(value.armorClass) },
        { label: "HP", value: String(value.hitPoints) },
      ];
    }
    case "spells": {
      const value = item as WikiSpellListItem;
      return [
        { label: "Cast", value: titleCase(value.castingTime) },
        {
          label: "Needs",
          value:
            [
              value.components.join(""),
              value.concentration ? "conc." : "",
              value.ritual ? "ritual" : "",
            ]
              .filter(Boolean)
              .join(" · ") || "—",
        },
      ];
    }
    case "feats":
      return [
        {
          label: "Prerequisite",
          value: (item as WikiFeatListItem).hasPrerequisite ? "Yes" : "None",
        },
      ];
    case "items": {
      const value = item as WikiMagicItemListItem;
      return itemKindOf(item) === "magic"
        ? [
            { label: "Rarity", value: value.rarity?.name ?? "—" },
            {
              label: "Attune",
              value: value.requiresAttunement ? "Yes" : "No",
            },
          ]
        : [{ label: "Category", value: value.category.name }];
    }
    default:
      return [];
  }
}

export function itemKindOf(item: WikiListItem): WikiItemKind | undefined {
  const kind = (item as { kind?: string }).kind;
  return kind === "magic" || kind === "mundane" ? kind : undefined;
}

export function detailHref(category: WikiCategory, item: WikiListItem) {
  const base = `/wiki/${category}/${encodeURIComponent(item.key)}`;
  return itemKindOf(item) === "magic" ? `${base}?kind=magic` : base;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Everything a search term can match on, built once per entry. */
export function searchTextOf(
  category: WikiCategory,
  item: WikiListItem,
  sources: SourceLookup,
) {
  const parts = [
    item.name,
    descriptorOf(category, item),
    sources(item.sourceKey)?.displayName ?? "",
  ];
  for (const stat of statsFor(category, item)) parts.push(stat.value);
  if (category === "spells")
    for (const entry of (item as WikiSpellListItem).classes)
      parts.push(entry.name);
  return normalize(parts.join(" "));
}

export function matchesSearch(haystack: string, terms: string[]) {
  return terms.every((term) => haystack.includes(term));
}

export function searchTerms(query: string) {
  return normalize(query).split(/\s+/).filter(Boolean);
}
