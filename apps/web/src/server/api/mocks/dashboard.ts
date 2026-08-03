export type CharacterSummary = {
  id: string;
  slug: string;
  name: string;
  ancestry: string;
  classes: Array<{
    name: string;
    level: number;
  }>;
  totalLevel: number;
  campaign: {
    id: string;
    name: string;
  } | null;
  artworkUrl: string | null;
  hitPoints: {
    current: number;
    maximum: number;
  } | null;
  updatedAt: string;
};

/**
 * Temporary character fixtures for the dashboard API contract.
 *
 * Replace these with membership-scoped database queries when character
 * persistence is implemented. The replacement procedures must be protected and
 * authorize every campaign-owned record server-side. Campaigns are already
 * persisted and served by the `campaign` router.
 */
export const characterFixtures = [
  {
    id: "chr_vesper_quill",
    slug: "vesper-quill",
    name: "Vesper Quill",
    ancestry: "Tiefling",
    classes: [{ name: "Bard", level: 7 }],
    totalLevel: 7,
    campaign: { id: "cmp_hollow_crown", name: "The Hollow Crown" },
    artworkUrl: "/party.jpg",
    hitPoints: { current: 41, maximum: 52 },
    updatedAt: "2026-07-29T02:12:00.000Z",
  },
  {
    id: "chr_rowan_vale",
    slug: "rowan-vale",
    name: "Rowan Vale",
    ancestry: "Human",
    classes: [{ name: "Ranger", level: 6 }],
    totalLevel: 6,
    campaign: { id: "cmp_frostline", name: "Beyond the Frostline" },
    artworkUrl: "/party.jpg",
    hitPoints: { current: 48, maximum: 48 },
    updatedAt: "2026-07-25T18:45:00.000Z",
  },
  {
    id: "chr_bramble",
    slug: "bramble-underbough",
    name: "Bramble Underbough",
    ancestry: "Halfling",
    classes: [
      { name: "Rogue", level: 4 },
      { name: "Fighter", level: 2 },
    ],
    totalLevel: 6,
    campaign: { id: "cmp_ember_coast", name: "The Ember Coast" },
    artworkUrl: "/party.jpg",
    hitPoints: { current: 33, maximum: 44 },
    updatedAt: "2026-07-23T12:20:00.000Z",
  },
  {
    id: "chr_sister_calder",
    slug: "sister-calder",
    name: "Sister Calder",
    ancestry: "Dwarf",
    classes: [{ name: "Cleric", level: 5 }],
    totalLevel: 5,
    campaign: { id: "cmp_brass_lantern", name: "The Brass Lantern" },
    artworkUrl: "/party.jpg",
    hitPoints: null,
    updatedAt: "2026-07-17T09:10:00.000Z",
  },
  {
    id: "chr_orin_ash",
    slug: "orin-ash",
    name: "Orin Ash",
    ancestry: "Half-elf",
    classes: [{ name: "Wizard", level: 3 }],
    totalLevel: 3,
    campaign: null,
    artworkUrl: "/party.jpg",
    hitPoints: { current: 17, maximum: 22 },
    updatedAt: "2026-07-10T20:55:00.000Z",
  },
  {
    id: "chr_tamsin_rook",
    slug: "tamsin-rook",
    name: "Tamsin Rook",
    ancestry: "Dragonborn",
    classes: [{ name: "Paladin", level: 8 }],
    totalLevel: 8,
    campaign: { id: "cmp_sable_moon", name: "Under a Sable Moon" },
    artworkUrl: "/party.jpg",
    hitPoints: { current: 66, maximum: 71 },
    updatedAt: "2026-07-03T15:35:00.000Z",
  },
] satisfies CharacterSummary[];
