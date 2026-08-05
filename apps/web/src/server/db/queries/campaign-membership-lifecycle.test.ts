import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { leaveCampaign, removeCampaignMember } from "./campaign";

const dialect = new PgDialect();

function compile(query: Parameters<PgDialect["sqlToQuery"]>[0]) {
  const compiled = dialect.sqlToQuery(query);
  return {
    ...compiled,
    sql: compiled.sql.replaceAll(/\s+/g, " ").trim(),
  };
}

describe("campaign membership persistence lifecycle", () => {
  it("retires only the removed member's active sheet after deletion succeeds", async () => {
    const execute = vi.fn().mockResolvedValue({ rows: [] });

    await expect(
      removeCampaignMember({ execute } as never, {
        campaignId: "campaign-1",
        memberId: "member-1",
        actorId: "dm-1",
      }),
    ).resolves.toBeNull();

    const statement = compile(execute.mock.calls[0]?.[0]);
    expect(statement.sql).toContain(
      "deleted_member as ( delete from campaign_members",
    );
    expect(statement.sql).toContain(
      "retired_sheets as ( update character_sheets sheet",
    );
    expect(statement.sql).toContain("from deleted_member");
    expect(statement.sql).toContain(
      "sheet.campaign_id = deleted_member.campaign_id and sheet.owner_id = deleted_member.user_id",
    );
    expect(statement.sql).toContain("sheet.retired_at is null");
    expect(statement.params).toContain("dm-1");
  });

  it("uses the leaving player as the retirement actor", async () => {
    const execute = vi.fn().mockResolvedValue({ rows: [] });

    await expect(
      leaveCampaign({ execute } as never, {
        campaignId: "campaign-1",
        userId: "player-1",
      }),
    ).resolves.toBeNull();

    const statement = compile(execute.mock.calls[0]?.[0]);
    expect(statement.sql).toContain("retired_by =");
    expect(statement.sql).toContain("updated_by =");
    expect(
      statement.params.filter((value) => value === "player-1").length,
    ).toBeGreaterThan(2);
  });
});
