import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import {
  addEncounterEffect,
  advanceEncounterTurn,
  beginEncounter,
  completeEncounter,
  removeEncounterEffect,
  setEncounterCombatantHealth,
} from "./encounter";

const dialect = new PgDialect();
const campaignId = "00000000-0000-4000-8000-000000000001";
const combatantId = "00000000-0000-4000-8000-000000000002";
const effectId = "00000000-0000-4000-8000-000000000003";

function compile(query: Parameters<PgDialect["sqlToQuery"]>[0]) {
  const compiled = dialect.sqlToQuery(query);
  return {
    ...compiled,
    sql: compiled.sql.replaceAll(/\s+/g, " ").trim(),
  };
}

function executeDb(rows: unknown[] = []) {
  const execute = vi.fn().mockResolvedValue({ rows });
  return { db: { execute }, execute };
}

describe("encounter commands", () => {
  it("starts an encounter with one campaign lock and deterministic initiative ordering", async () => {
    const mock = executeDb();

    await expect(
      beginEncounter(mock.db as never, {
        campaignId,
        actorId: "dm-1",
        name: "Bridge ambush",
        initiativeMode: "auto",
        combatants: [
          {
            sheetId: null,
            name: "Goblin",
            initiativeModifier: 2,
            initiativeTotal: null,
            currentHp: 7,
            maxHp: 7,
            visibility: "players",
          },
        ],
      }),
    ).resolves.toBeNull();

    const statement = compile(mock.execute.mock.calls[0]?.[0]);
    expect(statement.sql).toContain("pg_advisory_xact_lock");
    expect(statement.sql).toContain("jsonb_to_recordset");
    expect(statement.sql).toContain("sheet.campaign_id =");
    expect(statement.sql).toContain("floor(random() * 20)");
    expect(statement.sql).toContain(
      "order by scored.initiative_total desc, scored.initiative_modifier desc, scored.input_order",
    );
    expect(statement.sql).toContain(
      "not exists ( select 1 from encounters active",
    );
    expect(statement.sql).toContain("insert into encounter_combatants");
    expect(statement.sql).toContain("insert into encounter_events");
    expect(statement.params).toContain(campaignId);
  });

  it("advances a turn only at the expected revision and wraps the round", async () => {
    const mock = executeDb();

    await advanceEncounterTurn(mock.db as never, {
      campaignId,
      actorId: "dm-1",
      expectedRevision: 8,
      direction: "next",
    });

    const statement = compile(mock.execute.mock.calls[0]?.[0]);
    expect(statement.sql).toContain("encounter.revision =");
    expect(statement.sql).toContain("then target.round + 1");
    expect(statement.sql).toContain("revision = encounter.revision + 1");
    expect(statement.sql).toContain("insert into encounter_events");
    expect(statement.params).toContain(8);
  });

  it("scopes health changes to a combatant in the active campaign encounter", async () => {
    const mock = executeDb();

    await setEncounterCombatantHealth(mock.db as never, {
      campaignId,
      actorId: "dm-1",
      expectedRevision: 3,
      combatantId,
      currentHp: 4,
      tempHp: 1,
    });

    const statement = compile(mock.execute.mock.calls[0]?.[0]);
    expect(statement.sql).toContain("combatant.encounter_id = encounter.id");
    expect(statement.sql).toContain("encounter.campaign_id =");
    expect(statement.sql).toContain("combatant.id =");
    expect(statement.sql).toContain("revision = encounter.revision + 1");
  });

  it("adds and removes effects through revision-checked encounter scope", async () => {
    const add = executeDb();
    await addEncounterEffect(add.db as never, {
      campaignId,
      actorId: "dm-1",
      expectedRevision: 2,
      combatantId,
      name: "Blinded",
      description: null,
      remainingTurns: 1,
      tick: "turn_end",
      visibility: "players",
    });
    const addStatement = compile(add.execute.mock.calls[0]?.[0]);
    expect(addStatement.sql).toContain("insert into encounter_effects");
    expect(addStatement.sql).toContain("encounter.revision =");

    const remove = executeDb();
    await removeEncounterEffect(remove.db as never, {
      campaignId,
      actorId: "dm-1",
      expectedRevision: 3,
      effectId,
    });
    const removeStatement = compile(remove.execute.mock.calls[0]?.[0]);
    expect(removeStatement.sql).toContain(
      "effect.combatant_id = combatant.id and effect.removed_at is null",
    );
    expect(removeStatement.sql).toContain("removed_at = now()");
    expect(removeStatement.sql).toContain("revision = encounter.revision + 1");
  });

  it("completes only the active encounter at the expected revision", async () => {
    const mock = executeDb();

    await completeEncounter(mock.db as never, {
      campaignId,
      actorId: "dm-1",
      expectedRevision: 5,
    });

    const statement = compile(mock.execute.mock.calls[0]?.[0]);
    expect(statement.sql).toContain("status = 'completed'");
    expect(statement.sql).toContain("active_position = null");
    expect(statement.sql).toContain("encounter.status = 'active'");
    expect(statement.sql).toContain("encounter.revision =");
  });
});
