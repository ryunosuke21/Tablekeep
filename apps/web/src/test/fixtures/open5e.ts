export const open5eDocument = (key = "srd-2024") => ({
  key,
  name: "System Reference Document 5.2",
  display_name: "5e 2024 Rules",
  type: "SOURCE",
  publisher: { key: "wizards-of-the-coast", name: "Wizards of the Coast" },
  gamesystem: { key: "5e-2024", name: "5th Edition 2024" },
  permalink: "https://example.test/srd-2024",
});

export const backgroundFixture = () => ({
  key: "srd-2024_sage",
  name: "Sage",
  desc: "A learned background.",
  benefits: [
    { name: "Ability Scores", desc: "Choose scores.", type: "ability_scores" },
  ],
  document: open5eDocument(),
});

export const featFixture = () => ({
  key: "srd-2024_alert",
  name: "Alert",
  desc: "Remain ready.",
  type: "ORIGIN",
  has_prerequisite: false,
  prerequisite: "",
  benefits: [{ desc: "Act quickly." }],
  document: open5eDocument(),
});

export const speciesFixture = () => ({
  key: "srd-2024_human",
  name: "Human",
  desc: "A versatile species.",
  is_subspecies: false,
  subspecies_of: null,
  traits: [
    {
      name: "Resourceful",
      desc: "Gain inspiration.",
      type: null,
      order: 1,
    },
  ],
  document: open5eDocument(),
});

export const ruleFixture = () => ({
  key: "srd-2024_d20-tests",
  name: "D20 Tests",
  desc: "Resolve uncertain outcomes.",
  index: 1,
  initialHeaderLevel: 1,
  document: "srd-2024",
  ruleset: "core",
});

export const classFixture = () => ({
  key: "srd-2024_fighter",
  name: "Fighter",
  desc: "A martial class.",
  hit_dice: "D10",
  caster_type: "NONE",
  subclass_of: null,
  saving_throws: [{ name: "Strength" }, { name: "Constitution" }],
  hit_points: {
    hit_dice: "D10",
    hit_dice_name: "1D10 per Fighter level",
    hit_points_at_1st_level: "10 + Constitution modifier",
    hit_points_at_higher_levels: "1D10 + Constitution modifier",
  },
  features: [
    {
      key: "srd-2024_fighter_second-wind",
      name: "Second Wind",
      desc: "Recover stamina.",
      feature_type: "CLASS_LEVEL_FEATURE",
      gained_at: [{ level: 1, detail: null }],
      data_for_class_table: [{ level: 1, column_value: "2" }],
    },
  ],
  document: open5eDocument(),
});

export const itemFixture = () => ({
  key: "srd-2024_rope",
  name: "Rope",
  desc: "Useful adventuring gear.",
  category: { key: "gear", name: "Adventuring Gear" },
  size: null,
  weight: "10.00",
  weight_unit: "lb",
  cost: "1.00",
  weapon: null,
  armor: null,
  document: open5eDocument(),
});

export const magicItemFixture = () => ({
  ...itemFixture(),
  key: "srd-2024_magic-rope",
  name: "Magic Rope",
  rarity: { key: "uncommon", name: "Uncommon", rank: 2 },
  requires_attunement: true,
  attunement_detail: "By an adventurer",
});

export const creatureFixture = () => ({
  key: "srd-2024_test-creature",
  name: "Test Creature",
  type: { key: "humanoid", name: "Humanoid" },
  size: { key: "medium", name: "Medium" },
  challenge_rating: 1,
  speed_all: { walk: 30, unit: "feet", hover: false },
  category: "Humanoid",
  subcategory: null,
  alignment: "Neutral",
  armor_class: 14,
  armor_detail: "Natural Armor",
  hit_points: 20,
  hit_dice: "4d8+2",
  experience_points: 200,
  ability_scores: { strength: 12, dexterity: 14 },
  saving_throws: { dexterity: 4 },
  skill_bonuses: { perception: 3 },
  passive_perception: 13,
  languages: { as_string: "Common" },
  actions: [
    {
      name: "Strike",
      desc: "Makes an attack.",
      action_type: "ACTION",
      legendary_action_cost: 0,
    },
  ],
  traits: [{ name: "Keen Senses", desc: "Perceives danger." }],
  document: open5eDocument(),
});

export const spellFixture = () => ({
  key: "srd-2024_test-spark",
  name: "Test Spark",
  desc: "A small spark.",
  higher_level: "Damage increases.",
  level: 1,
  school: { key: "evocation", name: "Evocation" },
  classes: [{ key: "srd-2024_wizard", name: "Wizard" }],
  casting_time: "action",
  reaction_condition: null,
  range: 30,
  range_text: "30 feet",
  range_unit: "feet",
  duration: "instantaneous",
  concentration: false,
  ritual: false,
  verbal: true,
  somatic: true,
  material: false,
  material_specified: null,
  material_cost: null,
  material_consumed: false,
  target_type: "creature",
  target_count: 1,
  saving_throw_ability: "dexterity",
  attack_roll: false,
  damage_roll: "2d6",
  damage_types: ["fire"],
  shape_type: null,
  shape_size: null,
  shape_size_unit: null,
  casting_options: [
    {
      type: "slot_level_2",
      damage_roll: "3d6",
      target_count: null,
      duration: null,
      range: null,
      concentration: null,
      shape_size: null,
      desc: null,
    },
  ],
  document: open5eDocument(),
});

export const pageFixture = <T>(...results: T[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});
