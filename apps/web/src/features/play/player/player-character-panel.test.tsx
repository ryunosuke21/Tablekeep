import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  PlayerCharacterPanel,
  type PlayerSheet,
} from "./player-character-panel";

function makeSheet(overrides: Partial<PlayerSheet> = {}): PlayerSheet {
  return {
    id: "sheet-1",
    charName: "Vesper Quill",
    name: "The Lantern",
    ancestry: "Human",
    alignment: "Unbound",
    maxHp: 24,
    totalLevel: 4,
    classes: [
      {
        id: "class-1",
        name: "Warden",
        subclass: "Ash Keeper",
        level: 4,
      },
    ],
    backgrounds: [{ id: "background-1", name: "Cartographer" }],
    stats: [
      { id: "stat-2", name: "Resolve", value: 9 },
      { id: "stat-1", name: "Grace", value: 14 },
    ],
    conditions: [],
    items: [],
    spells: [],
    resources: [],
    ...overrides,
  } as PlayerSheet;
}

describe("PlayerCharacterPanel", () => {
  it("renders the recorded identity and arbitrary stats in stored order", () => {
    render(
      <PlayerCharacterPanel sheet={makeSheet()} onOpenFullSheet={vi.fn()} />,
    );

    expect(
      screen.getByRole("heading", { name: "The Lantern" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Warden, Ash Keeper 4")).toBeInTheDocument();
    expect(screen.getByText("Human")).toBeInTheDocument();
    expect(screen.getByText("Cartographer")).toBeInTheDocument();

    const statNames = screen
      .getAllByText(/Resolve|Grace/)
      .map((element) => element.textContent);
    expect(statNames).toEqual(["Resolve", "Grace"]);
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("shows encounter health, effects, resources, and active equipped items", () => {
    render(
      <PlayerCharacterPanel
        sheet={makeSheet({
          conditions: [
            {
              id: "condition-1",
              sheetId: "sheet-1",
              name: "Shaken",
              createdBy: null,
              removedAt: null,
              removedBy: null,
              createdAt: new Date("2026-08-01T00:00:00.000Z"),
              updatedAt: new Date("2026-08-01T00:00:00.000Z"),
            },
          ],
          items: [
            {
              id: "item-1",
              sheetId: "sheet-1",
              name: "Moonsteel shield",
              qty: 1,
              equipped: true,
              notes: null,
              createdBy: null,
              updatedBy: null,
              removedAt: null,
              removedBy: null,
              createdAt: new Date("2026-08-01T00:00:00.000Z"),
              updatedAt: new Date("2026-08-01T00:00:00.000Z"),
            },
            {
              id: "item-2",
              sheetId: "sheet-1",
              name: "Old lantern",
              qty: 1,
              equipped: false,
              notes: null,
              createdBy: null,
              updatedBy: null,
              removedAt: null,
              removedBy: null,
              createdAt: new Date("2026-08-01T00:00:00.000Z"),
              updatedAt: new Date("2026-08-01T00:00:00.000Z"),
            },
            {
              id: "item-3",
              sheetId: "sheet-1",
              name: "Lost blade",
              qty: 1,
              equipped: true,
              notes: null,
              createdBy: null,
              updatedBy: null,
              removedAt: new Date("2026-08-01T00:00:00.000Z"),
              removedBy: null,
              createdAt: new Date("2026-08-01T00:00:00.000Z"),
              updatedAt: new Date("2026-08-01T00:00:00.000Z"),
            },
          ],
          spells: [
            {
              id: "spell-1",
              sheetId: "sheet-1",
              name: "Ward",
              level: 1,
              prepared: true,
              notes: null,
              source: "custom",
              ref: null,
              sort: 0,
              createdBy: null,
              updatedBy: null,
              createdAt: new Date("2026-08-01T00:00:00.000Z"),
              updatedAt: new Date("2026-08-01T00:00:00.000Z"),
            },
            {
              id: "spell-2",
              sheetId: "sheet-1",
              name: "Beacon",
              level: 2,
              prepared: false,
              notes: null,
              source: "custom",
              ref: null,
              sort: 1,
              createdBy: null,
              updatedBy: null,
              createdAt: new Date("2026-08-01T00:00:00.000Z"),
              updatedAt: new Date("2026-08-01T00:00:00.000Z"),
            },
          ],
          resources: [
            {
              id: "resource-1",
              name: "Focus",
              currentValue: 2,
              maxValue: 4,
              sort: 0,
              updatedAt: new Date("2026-08-01T00:00:00.000Z"),
            },
          ],
        })}
        currentHp={17}
        tempHp={3}
        encounterEffects={[{ id: "effect-1", name: "Marked" }]}
        onOpenFullSheet={vi.fn()}
      />,
    );

    expect(screen.getByText("17/24")).toBeInTheDocument();
    expect(screen.getByText("+3 temporary")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Hit points" }),
    ).toHaveAttribute("aria-valuenow", "17");
    expect(screen.getByText("Shaken")).toBeInTheDocument();
    expect(screen.getByText("Marked")).toBeInTheDocument();
    expect(screen.getByText("Focus")).toBeInTheDocument();
    expect(screen.getByText("2/4")).toBeInTheDocument();
    expect(screen.getByText("Moonsteel shield")).toBeInTheDocument();
    expect(screen.queryByText("Old lantern")).toBeNull();
    expect(screen.queryByText("Lost blade")).toBeNull();
  });

  it("does not invent current health and explains empty equipment and effects", () => {
    render(
      <PlayerCharacterPanel
        sheet={makeSheet({ name: "  ", stats: [] })}
        onOpenFullSheet={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Vesper Quill" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Max 24")).toBeInTheDocument();
    expect(screen.getByText("Nothing equipped.")).toBeInTheDocument();
    expect(screen.getByText("No effects.")).toBeInTheDocument();
    expect(screen.getByText("No stats recorded.")).toBeInTheDocument();
  });

  it("opens the full editable sheet on request", async () => {
    const onOpenFullSheet = vi.fn();
    render(
      <PlayerCharacterPanel
        sheet={makeSheet()}
        onOpenFullSheet={onOpenFullSheet}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Open full sheet" }),
    );
    expect(onOpenFullSheet).toHaveBeenCalledOnce();
  });
});
