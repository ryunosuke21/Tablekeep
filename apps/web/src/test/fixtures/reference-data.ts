import type { Class, PrerequisiteChoice } from "@/types/classes";
import type { Skill, SkillListItem } from "@/types/skills";
import type { Spell, SpellListItem } from "@/types/spells";

export const reference = (index: string, name = index) => ({ index, name });

export const skillFixture = (overrides: Partial<Skill> = {}): Skill => ({
  index: "arcana",
  name: "Arcana",
  desc: ["Recall lore about magic."],
  ability_score: reference("int", "Intelligence"),
  ...overrides,
});

export const skillListItemFixture = (
  overrides: Partial<SkillListItem> = {},
): SkillListItem => {
  const skill = skillFixture();
  return {
    index: skill.index,
    name: skill.name,
    ability_score: skill.ability_score,
    ...overrides,
  };
};

export const prerequisiteChoiceFixture = (): PrerequisiteChoice => ({
  choose: 1,
  type: "ability",
  desc: "Choose one prerequisite.",
  from: {
    option_set_type: "options_array",
    options: [
      {
        option_type: "score_prerequisite",
        ability_score: reference("str", "Strength"),
        minimum_score: 13,
      },
    ],
  },
});

export const classFixture = (overrides: Partial<Class> = {}): Class => ({
  index: "guardian",
  name: "Guardian",
  hit_die: 10,
  proficiencies: null,
  proficiency_choices: [],
  saving_throws: null,
  starting_equipment: null,
  starting_equipment_options: null,
  spellcasting: null,
  spells: [],
  subclasses: null,
  class_levels: [],
  multi_classing: null,
  ...overrides,
});

export const spellFixture = (overrides: Partial<Spell> = {}): Spell => ({
  index: "ember-spark",
  name: "Ember Spark",
  desc: ["A small magical spark."],
  higher_level: null,
  level: 0,
  school: reference("evocation", "Evocation"),
  casting_time: "1 action",
  range: "30 feet",
  duration: "Instantaneous",
  concentration: false,
  ritual: false,
  components: ["V", "S"],
  material: null,
  attack_type: "ranged",
  area_of_effect: null,
  damage: {
    damage_type: reference("fire", "Fire"),
    damage_at_character_level: [{ level: 1, value: "1d6" }],
  },
  heal_at_slot_level: null,
  dc: null,
  classes: null,
  subclasses: null,
  ...overrides,
});

export const spellListItemFixture = (
  overrides: Partial<SpellListItem> = {},
): SpellListItem => {
  const spell = spellFixture();
  return {
    index: spell.index,
    name: spell.name,
    level: spell.level,
    school: spell.school,
    casting_time: spell.casting_time,
    range: spell.range,
    duration: spell.duration,
    concentration: spell.concentration,
    ritual: spell.ritual,
    components: spell.components,
    attack_type: spell.attack_type,
    ...overrides,
  };
};
