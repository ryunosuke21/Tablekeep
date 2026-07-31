export type CampaignTone = "lilac" | "rose" | "sage" | "sky";

export type CampaignMemberSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type CampaignSummary = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  gameSystem: {
    id: string;
    name: string;
  };
  role: "dm" | "player";
  memberCount: number;
  members: CampaignMemberSummary[];
  nextSession: {
    startsAt: string;
    endsAt: string;
    timeZone: string;
  } | null;
  tone: CampaignTone;
  updatedAt: string;
};

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
 * Temporary fixtures for the dashboard API contract.
 *
 * Replace these with membership-scoped database queries when campaign persistence
 * is implemented. The replacement procedures must be protected and authorize
 * every campaign-owned record server-side.
 */
const campaignMemberFixtures = [
  { id: "usr_mara", name: "Mara Voss", imageUrl: null },
  { id: "usr_jon", name: "Jon Bell", imageUrl: null },
  { id: "usr_ada", name: "Ada Thorn", imageUrl: null },
  { id: "usr_sol", name: "Sol Wren", imageUrl: null },
  { id: "usr_kit", name: "Kit Mercer", imageUrl: null },
  { id: "usr_nia", name: "Nia Ash", imageUrl: null },
] satisfies CampaignMemberSummary[];

export const campaignFixtures = [
  {
    id: "cmp_ember_coast",
    slug: "the-ember-coast",
    name: "The Ember Coast",
    summary:
      "A storm-battered port, a missing cartographer, and one very old map.",
    gameSystem: { id: "dnd-5e", name: "D&D 5e" },
    role: "dm",
    memberCount: 6,
    members: campaignMemberFixtures,
    nextSession: {
      startsAt: "2026-08-02T23:00:00.000Z",
      endsAt: "2026-08-03T03:00:00.000Z",
      timeZone: "America/Tegucigalpa",
    },
    tone: "rose",
    updatedAt: "2026-07-28T16:40:00.000Z",
  },
  {
    id: "cmp_hollow_crown",
    slug: "the-hollow-crown",
    name: "The Hollow Crown",
    summary: "Courtly bargains and quiet betrayals beneath a city of bells.",
    gameSystem: { id: "dnd-5e", name: "D&D 5e" },
    role: "player",
    memberCount: 5,
    members: campaignMemberFixtures.slice(0, 5),
    nextSession: {
      startsAt: "2026-08-07T00:30:00.000Z",
      endsAt: "2026-08-07T03:30:00.000Z",
      timeZone: "America/Tegucigalpa",
    },
    tone: "lilac",
    updatedAt: "2026-07-27T21:15:00.000Z",
  },
  {
    id: "cmp_frostline",
    slug: "beyond-the-frostline",
    name: "Beyond the Frostline",
    summary: "A winter expedition following lights no compass can explain.",
    gameSystem: { id: "dnd-5e", name: "D&D 5e" },
    role: "player",
    memberCount: 4,
    members: campaignMemberFixtures.slice(1, 5),
    nextSession: null,
    tone: "sage",
    updatedAt: "2026-07-22T14:05:00.000Z",
  },
  {
    id: "cmp_brass_lantern",
    slug: "the-brass-lantern",
    name: "The Brass Lantern",
    summary: "Small jobs from a roadside inn keep opening much larger doors.",
    gameSystem: { id: "dnd-5e", name: "D&D 5e" },
    role: "dm",
    memberCount: 7,
    members: campaignMemberFixtures,
    nextSession: {
      startsAt: "2026-08-15T22:00:00.000Z",
      endsAt: "2026-08-16T01:00:00.000Z",
      timeZone: "America/Tegucigalpa",
    },
    tone: "sky",
    updatedAt: "2026-07-18T19:25:00.000Z",
  },
  {
    id: "cmp_sable_moon",
    slug: "under-a-sable-moon",
    name: "Under a Sable Moon",
    summary: "An old road returns at midnight, but never to the same place.",
    gameSystem: { id: "dnd-5e", name: "D&D 5e" },
    role: "player",
    memberCount: 5,
    members: campaignMemberFixtures.slice(0, 5),
    nextSession: {
      startsAt: "2026-08-22T01:00:00.000Z",
      endsAt: "2026-08-22T04:00:00.000Z",
      timeZone: "America/Tegucigalpa",
    },
    tone: "lilac",
    updatedAt: "2026-07-12T17:00:00.000Z",
  },
  {
    id: "cmp_first_watch",
    slug: "the-first-watch",
    name: "The First Watch",
    summary: "New guardians learn why the city walls face inward.",
    gameSystem: { id: "dnd-5e", name: "D&D 5e" },
    role: "dm",
    memberCount: 4,
    members: campaignMemberFixtures.slice(2),
    nextSession: null,
    tone: "rose",
    updatedAt: "2026-07-05T11:30:00.000Z",
  },
] satisfies CampaignSummary[];

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
