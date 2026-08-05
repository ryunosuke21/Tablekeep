import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import {
  createCharacter,
  createSheetItem,
  getCharacterForOwnerBySlug,
  getSheetAccess,
  listCharactersForOwner,
} from "./character";

const dialect = new PgDialect();

function compile(query: Parameters<PgDialect["sqlToQuery"]>[0]) {
  const compiled = dialect.sqlToQuery(query);
  return {
    ...compiled,
    sql: compiled.sql.replaceAll(/\s+/g, " ").trim(),
  };
}

function selectDb(result: unknown[] = []) {
  const limit = vi.fn().mockResolvedValue(result);
  const where = vi.fn().mockReturnValue({ limit });
  const innerJoin = vi.fn();
  const fromResult = { innerJoin, where };
  innerJoin.mockReturnValue(fromResult);
  const from = vi.fn().mockReturnValue(fromResult);
  const select = vi.fn().mockReturnValue({ from });

  return { db: { select }, from, innerJoin, limit, select, where };
}

describe("character persistence", () => {
  it("supports an owner-scoped deleted list for restore discovery", async () => {
    const orderBy = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });

    await expect(
      listCharactersForOwner({ select } as never, "owner-1", "deleted"),
    ).resolves.toEqual([]);

    const predicate = compile(where.mock.calls[0]?.[0]);
    expect(predicate.sql).toContain('"characters"."owner_id" = $1');
    expect(predicate.sql).toContain('"characters"."deleted_at" is not null');
    expect(predicate.params).toEqual(["owner-1"]);
  });

  it("scopes slug reads to the owner and excludes deleted characters", async () => {
    const mock = selectDb([{ id: "char-1" }]);

    await expect(
      getCharacterForOwnerBySlug(
        mock.db as never,
        "owner-1",
        "the-ranger-abc123",
      ),
    ).resolves.toEqual({ id: "char-1" });

    const predicate = compile(mock.where.mock.calls[0]?.[0]);
    expect(predicate.sql).toContain('"characters"."owner_id" = $1');
    expect(predicate.sql).toContain('"characters"."slug" = $2');
    expect(predicate.sql).toContain('"characters"."deleted_at" is null');
    expect(predicate.params).toEqual(["owner-1", "the-ranger-abc123"]);
  });

  it("constrains sheet access by both sheet and campaign", async () => {
    const mock = selectDb([]);

    await expect(
      getSheetAccess(mock.db as never, "campaign-1", "sheet-1"),
    ).resolves.toBeNull();

    const predicate = compile(mock.where.mock.calls[0]?.[0]);
    expect(predicate.sql).toContain('"character_sheets"."id" = $1');
    expect(predicate.sql).toContain('"character_sheets"."campaign_id" = $2');
    expect(predicate.params).toEqual(["sheet-1", "campaign-1"]);
  });

  it("serializes character creation and counts only active owner rows", async () => {
    const execute = vi.fn().mockResolvedValue({ rows: [] });

    await expect(
      createCharacter({ execute } as never, {
        ownerId: "owner-1",
        name: "The Ranger",
      }),
    ).resolves.toBeNull();

    const statement = compile(execute.mock.calls[0]?.[0]);
    expect(statement.sql).toContain("pg_advisory_xact_lock");
    expect(statement.sql).toContain("owned.owner_id =");
    expect(statement.sql).toContain("owned.deleted_at is null");
    expect(statement.sql).toContain("insert into characters");
    expect(statement.params).toContain("owner-1");
  });

  it("does not add nested rows when the sheet is inactive", async () => {
    const where = vi.fn().mockResolvedValue([{ value: 0, sheetActive: false }]);
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    const insert = vi.fn();

    await expect(
      createSheetItem({ insert, select } as never, {
        sheetId: "sheet-1",
        name: "Rope",
        qty: 1,
        equipped: false,
        actorId: "player-1",
      }),
    ).resolves.toBeNull();

    expect(insert).not.toHaveBeenCalled();
  });
});
