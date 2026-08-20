import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PlayerSheet } from "./player-character-panel";
import { PlayerSpellbookPanel } from "./player-spellbook-panel";

type SheetSpell = PlayerSheet["spells"][number];

function spell(overrides: Partial<SheetSpell> = {}): SheetSpell {
  return {
    id: "spell-1",
    sheetId: "sheet-1",
    name: "Ash Ward",
    level: 1,
    prepared: false,
    notes: null,
    source: "custom",
    ref: null,
    sort: 0,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("PlayerSpellbookPanel", () => {
  it("separates prepared spells while keeping all spells grouped by level", () => {
    render(
      <PlayerSpellbookPanel
        spells={[
          spell({ id: "spell-1", name: "Ash Ward", level: 1, prepared: true }),
          spell({ id: "spell-2", name: "Far Beacon", level: 3 }),
        ]}
        onManageSpells={vi.fn()}
      />,
    );

    expect(screen.getByText("Prepared 1 of 2")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Level 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Level 3" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Ash Ward, level 1, prepared" }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Far Beacon, level 3" }),
    ).toBeInTheDocument();
  });

  it("selects a spell and displays its recorded notes", async () => {
    render(
      <PlayerSpellbookPanel
        spells={[spell({ notes: "Absorbs one blow before dawn." })]}
        onManageSpells={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Ash Ward, level 1" }),
    );

    expect(
      screen.getByText("Absorbs one blow before dawn."),
    ).toBeInTheDocument();
    expect(screen.getByText("Learned")).toBeInTheDocument();
  });

  it("filters by names and notes and reports an empty result", async () => {
    render(
      <PlayerSpellbookPanel
        spells={[
          spell({ id: "spell-1", name: "Ash Ward" }),
          spell({ id: "spell-2", name: "Far Beacon", notes: "Signals allies" }),
        ]}
        onManageSpells={vi.fn()}
      />,
    );

    const search = screen.getByLabelText("Search spellbook");
    await userEvent.type(search, "allies");
    expect(
      screen.getByRole("button", { name: "Far Beacon, level 1" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ash Ward, level 1" }),
    ).toBeNull();

    await userEvent.clear(search);
    await userEvent.type(search, "missing");
    expect(screen.getByText('No spells match "missing".')).toBeInTheDocument();
  });

  it("shows honest empty states and opens the spell manager", async () => {
    const onManageSpells = vi.fn();
    render(
      <PlayerSpellbookPanel spells={[]} onManageSpells={onManageSpells} />,
    );

    expect(screen.getByText("No spells prepared.")).toBeInTheDocument();
    expect(screen.getByText("No spells recorded.")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Manage spellbook" }),
    );
    expect(onManageSpells).toHaveBeenCalledOnce();
  });
});
