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
  it("excludes removed items from the primary view", () => {
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

    expect(
      screen.getByRole("button", { name: "Moonsteel shield" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Lost blade/ })).toBeNull();
  });

  it("splits equipped items into a labeled equipment rack while listing all active items in the grid", () => {
    render(
      <PlayerInventoryPanel
        items={[
          makeItem({ id: "item-1", name: "Moonsteel shield", equipped: true }),
          makeItem({ id: "item-2", name: "Old lantern", equipped: false }),
        ]}
        currencies={[]}
        onManageInventory={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Equipment rack" }),
    ).toBeInTheDocument();

    const equippedButtons = screen.getAllByRole("button", {
      name: "Moonsteel shield (equipped)",
    });
    expect(equippedButtons).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Old lantern" }),
    ).toBeInTheDocument();
  });

  it("renders generic item cells with accessible names covering quantity and equipped state", () => {
    render(
      <PlayerInventoryPanel
        items={[
          makeItem({
            id: "item-1",
            name: "Healing potion",
            qty: 3,
            equipped: false,
          }),
        ]}
        currencies={[]}
        onManageInventory={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Healing potion ×3" }),
    ).toBeInTheDocument();
  });

  it("selects an item on click and shows its details", async () => {
    render(
      <PlayerInventoryPanel
        items={[
          makeItem({
            id: "item-1",
            name: "Moonsteel shield",
            qty: 1,
            equipped: true,
            notes: "Dented from the last brawl.",
          }),
        ]}
        currencies={[]}
        onManageInventory={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Select an item to see its details."),
    ).toBeInTheDocument();

    const [rackButton] = screen.getAllByRole("button", {
      name: "Moonsteel shield (equipped)",
    });
    await userEvent.click(rackButton as HTMLElement);

    expect(screen.getByText("Dented from the last brawl.")).toBeInTheDocument();
    expect(screen.getByText("Equipped")).toBeInTheDocument();
    expect(screen.getByText("Quantity 1")).toBeInTheDocument();
  });

  it("filters the inventory grid by name and notes, including an empty result", async () => {
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

    expect(
      screen.getByRole("button", { name: "Old lantern" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Moonsteel shield" }),
    ).toBeNull();

    await userEvent.clear(search);
    await userEvent.type(search, "nonexistent item");

    expect(
      screen.getByText('No items match "nonexistent item".'),
    ).toBeInTheDocument();
  });

  it("keeps a filtered-out selection from showing stale details", async () => {
    render(
      <PlayerInventoryPanel
        items={[
          makeItem({ id: "item-1", name: "Moonsteel shield" }),
          makeItem({ id: "item-2", name: "Old lantern" }),
        ]}
        currencies={[]}
        onManageInventory={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Moonsteel shield" }),
    );
    expect(screen.getByText("Quantity 1")).toBeInTheDocument();

    const search = screen.getByLabelText("Search inventory");
    await userEvent.type(search, "lantern");

    expect(
      screen.getByText("Select an item to see its details."),
    ).toBeInTheDocument();
  });

  it("shows active currency totals and excludes removed currencies", () => {
    render(
      <PlayerInventoryPanel
        items={[]}
        currencies={[
          makeCurrency({ id: "currency-1", name: "Gold", amount: 12 }),
          makeCurrency({
            id: "currency-2",
            name: "Old scrip",
            amount: 5,
            removedAt: new Date("2026-08-01T00:00:00.000Z"),
          }),
        ]}
        onManageInventory={vi.fn()}
      />,
    );

    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.queryByText("Old scrip")).toBeNull();
  });

  it("shows meaningful empty states for no equipment and no active inventory", () => {
    render(
      <PlayerInventoryPanel
        items={[]}
        currencies={[]}
        onManageInventory={vi.fn()}
      />,
    );

    expect(screen.getByText("Nothing equipped.")).toBeInTheDocument();
    expect(screen.getByText("Your pack is empty.")).toBeInTheDocument();
  });

  it("calls onManageInventory when the manage button is clicked", async () => {
    const onManageInventory = vi.fn();
    render(
      <PlayerInventoryPanel
        items={[]}
        currencies={[]}
        onManageInventory={onManageInventory}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Manage inventory" }),
    );
    expect(onManageInventory).toHaveBeenCalledOnce();
  });
});
