import { describe, expect, it } from "vitest";

import {
  ANY_EQUIPMENT_BASE,
  EQUIPMENT_BASE,
  onEveryEquipmentType,
  PROFICIENCY_CHOICE,
  REFERENCE,
  STARTING_EQUIPMENT_OPTIONS,
} from "@/server/api/selections";

const equipmentTypes = [
  "Armor",
  "Weapon",
  "Tool",
  "Gear",
  "Pack",
  "Ammunition",
  "Vehicle",
] as const;

describe("GraphQL selection helpers", () => {
  it("emits shared fields once for every equipment union member", () => {
    const selection = onEveryEquipmentType("index name");

    for (const type of equipmentTypes) {
      expect(
        selection.match(new RegExp(`\\.\\.\\. on ${type} \\{`, "g")),
      ).toHaveLength(1);
    }
    expect(selection.match(/index name/g)).toHaveLength(equipmentTypes.length);
  });

  it("keeps the shared equipment schema fields in union selections", () => {
    expect(ANY_EQUIPMENT_BASE).toContain("__typename");
    expect(EQUIPMENT_BASE).toContain(`equipment_category ${REFERENCE}`);
    expect(EQUIPMENT_BASE).toContain("quantity");
    expect(EQUIPMENT_BASE).toContain("weight");
  });

  it("expands recursive proficiency choices to the documented fixed depth", () => {
    expect(
      PROFICIENCY_CHOICE.match(/\.\.\. on ProficiencyChoice/g),
    ).toHaveLength(2);
    expect(PROFICIENCY_CHOICE).toContain("... on Proficiency");
  });

  it("selects both supported starting-equipment option variants", () => {
    expect(STARTING_EQUIPMENT_OPTIONS).toContain("CountedReferenceOption");
    expect(STARTING_EQUIPMENT_OPTIONS).toContain(
      "EquipmentCategoryChoiceOption",
    );
    expect(STARTING_EQUIPMENT_OPTIONS).toContain("MultipleItemsOption");
  });
});
