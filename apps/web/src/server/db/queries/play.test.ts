import { describe, expect, it } from "vitest";

import {
  type ActiveEncounterRecord,
  toDmEncounterState,
  toPlayerEncounterState,
} from "./play";

const now = new Date("2026-08-19T12:00:00Z");

function effect(
  id: string,
  visibility: "players" | "dm",
): ActiveEncounterRecord["combatants"][number]["effects"][number] {
  return {
    id,
    combatantId: "10000000-0000-4000-8000-000000000001",
    name: visibility === "players" ? "Blinded" : "Secret weakness",
    description: "Test effect",
    remainingTurns: 2,
    tick: "turn_end",
    visibility,
    createdBy: "dm-1",
    removedBy: null,
    removedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function combatant(
  id: string,
  position: number,
  visibility: "players" | "name_only" | "dm",
): ActiveEncounterRecord["combatants"][number] {
  return {
    id,
    encounterId: "20000000-0000-4000-8000-000000000001",
    sheetId:
      visibility === "players" ? "30000000-0000-4000-8000-000000000001" : null,
    source: visibility === "players" ? "sheet" : "custom",
    name: `${visibility} combatant`,
    initiativeRoll: 12,
    initiativeModifier: 3,
    initiativeTotal: 15,
    position,
    currentHp: 7,
    maxHp: 12,
    tempHp: 2,
    visibility,
    dmNotes: "Never send this to a player",
    createdBy: "dm-1",
    updatedBy: "dm-1",
    createdAt: now,
    updatedAt: now,
    effects: [
      effect(`${position}0000000-0000-4000-8000-000000000001`, "players"),
      effect(`${position}0000000-0000-4000-8000-000000000002`, "dm"),
    ],
  };
}

function encounter(): ActiveEncounterRecord {
  return {
    id: "20000000-0000-4000-8000-000000000001",
    campaignId: "40000000-0000-4000-8000-000000000001",
    name: "Bridge ambush",
    status: "active",
    round: 2,
    activePosition: 0,
    revision: 4,
    createdBy: "dm-1",
    startedBy: "dm-1",
    startedAt: now,
    completedBy: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    combatants: [
      combatant("10000000-0000-4000-8000-000000000001", 0, "players"),
      combatant("10000000-0000-4000-8000-000000000002", 1, "name_only"),
      combatant("10000000-0000-4000-8000-000000000003", 2, "dm"),
    ],
  };
}

describe("play encounter projections", () => {
  it("omits DM-only combatants, fields, and effects from player state", () => {
    const state = toPlayerEncounterState(encounter());

    expect(state?.combatants).toHaveLength(2);
    expect(state?.combatants.map((entry) => entry.visibility)).toEqual([
      "players",
      "name_only",
    ]);
    expect(state?.combatants[0]).not.toHaveProperty("dmNotes");
    expect(state?.combatants[0]).not.toHaveProperty("initiativeRoll");
    expect(state?.combatants[0]?.effects).toHaveLength(1);
    expect(state?.combatants[0]?.effects[0]?.name).toBe("Blinded");
    expect(state?.combatants[1]).toMatchObject({
      currentHp: null,
      maxHp: null,
      tempHp: null,
    });
  });

  it("keeps private encounter controls in DM state", () => {
    const state = toDmEncounterState(encounter());

    expect(state?.combatants).toHaveLength(3);
    expect(state?.combatants[0]).toMatchObject({
      initiativeRoll: 12,
      dmNotes: "Never send this to a player",
      currentHp: 7,
    });
    expect(state?.combatants[0]?.effects).toHaveLength(2);
  });

  it("returns null when no encounter is active", () => {
    expect(toPlayerEncounterState(null)).toBeNull();
    expect(toDmEncounterState(null)).toBeNull();
  });
});
