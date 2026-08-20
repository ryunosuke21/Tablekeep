import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PlayerSheet } from "./player-character-panel";
import { PlayerInventoryPanel } from "./player-inventory-panel";

type SheetItem = PlayerSheet["items"][number];
type SheetCurrency = PlayerSheet["currencies"][number];

function makeItem(overrides: Partial<SheetItem> = {}): SheetItem {
  return {
    id: "item-1",
    sheetId: "sheet-1",
    name: "Moonsteel shield",
    qty: 1,
    equipped: false,
    notes: null,
    createdBy: null,
    updatedBy: null,
    removedAt: null,
    removedBy: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...overrides,
  } as SheetItem;
}

function makeCurrency(overrides: Partial<SheetCurrency> = {}): SheetCurrency {
  return {
    id: "currency-1",
    sheetId: "sheet-1",
    name: "Gold",
    amount: 12,
    createdBy: null,
    updatedBy: null,
    removedAt: null,
    removedBy: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...overrides,
  } as SheetCurrency;
}

describe("PlayerInventoryPanel", () => {
  it("excludes removed items from the carried list", () => {
    render(
      <PlayerInventoryPanel
        items={[
          makeItem({ id: "item-1", name: "Moonsteel shield" }),
          makeItem({
            id: "item-2",
            name: "Lost blade",
            removedAt: new Date("2026-08-01T00:00:00.000Z"),
          }),
        ]}
        currencies={[]}
        onManageInventory={vi.fn()}
      />,
    );

    expect(screen.getByText("Moonsteel shield")).toBeInTheDocument();
    expect(screen.queryByText("Lost blade")).toBeNull();
  });

  it("lists equipped gear first and marks it", () => {
    render(
      <PlayerInventoryPanel
        items={[
          makeItem({ id: "item-1", name: "Old lantern", equipped: false }),
          makeItem({ id: "item-2", name: "Moonsteel shield", equipped: true }),
        ]}
        currencies={[]}
        onManageInventory={vi.fn()}
      />,
    );

    const names = screen
      .getAllByRole("listitem")
      .map((node) => node.textContent ?? "");
    const shieldIndex = names.findIndex((text) =>
      text.includes("Moonsteel shield"),
    );
    const lanternIndex = names.findIndex((text) =>
      text.includes("Old lantern"),
    );

    expect(shieldIndex).toBeGreaterThanOrEqual(0);
    expect(shieldIndex).toBeLessThan(lanternIndex);
    expect(screen.getByText("Equipped")).toBeInTheDocument();
  });

  it("shows quantity and notes inline without a separate detail panel", () => {
    render(
      <PlayerInventoryPanel
        items={[
          makeItem({
            id: "item-1",
            name: "Healing potion",
            qty: 3,
            notes: "Smells of mint.",
          }),
        ]}
        currencies={[]}
        onManageInventory={vi.fn()}
      />,
    );

    expect(screen.getByText("Healing potion")).toBeInTheDocument();
    expect(screen.getByText("×3")).toBeInTheDocument();
    expect(screen.getByText("Smells of mint.")).toBeInTheDocument();
  });

  it("shows currencies in the purse", () => {
    render(
      <PlayerInventoryPanel
        items={[]}
        currencies={[makeCurrency({ name: "Gold", amount: 12 })]}
        onManageInventory={vi.fn()}
      />,
    );

    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("filters the carried list by name and notes, including an empty result", async () => {
    render(
      <PlayerInventoryPanel
        items={[
          makeItem({ id: "item-1", name: "Moonsteel shield", notes: null }),
          makeItem({
            id: "item-2",
            name: "Old lantern",
            notes: "Smells of oil",
          }),
        ]}
        currencies={[]}
        onManageInventory={vi.fn()}
      />,
    );

    const search = screen.getByLabelText("Search inventory");
    await userEvent.type(search, "oil");

    expect(screen.getByText("Old lantern")).toBeInTheDocument();
    expect(screen.queryByText("Moonsteel shield")).toBeNull();

    await userEvent.clear(search);
    await userEvent.type(search, "nonexistent item");

    expect(
      screen.getByText('No items match "nonexistent item".'),
    ).toBeInTheDocument();
  });

  it("invites the manager and reports an empty pack", async () => {
    const onManageInventory = vi.fn();
    render(
      <PlayerInventoryPanel
        items={[]}
        currencies={[]}
        onManageInventory={onManageInventory}
      />,
    );

    expect(screen.getByText("Your pack is empty.")).toBeInTheDocument();
    expect(screen.getByText("No currency tracked.")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Manage inventory" }),
    );
    expect(onManageInventory).toHaveBeenCalledTimes(1);
  });
});
