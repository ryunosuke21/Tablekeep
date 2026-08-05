import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTrpcMock } from "@/test/trpc-mock";
import type { RouterOutputs } from "@/trpc/react";

const trpc = createTrpcMock();

vi.mock("@/trpc/react", () => ({ api: trpc.api }));

const { SheetInventory } = await import("./sheet-inventory");

type SheetItem = RouterOutputs["character"]["sheet"]["get"]["items"][number];

const campaignId = "33333333-3333-3333-3333-333333333333";
const sheetId = "22222222-2222-2222-2222-222222222222";

function item(overrides: Partial<SheetItem> & { id: string }): SheetItem {
  return {
    sheetId,
    name: "Rope, 50 ft.",
    qty: 1,
    equipped: false,
    notes: null,
    createdBy: null,
    updatedBy: null,
    removedAt: null,
    removedBy: null,
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    updatedAt: new Date("2026-07-01T10:00:00.000Z"),
    ...overrides,
  };
}

function renderInventory(items: SheetItem[], disabled = false) {
  return render(
    <SheetInventory
      campaignId={campaignId}
      sheetId={sheetId}
      items={items}
      disabled={disabled}
    />,
  );
}

describe("SheetInventory", () => {
  beforeEach(() => {
    // The checkbox primitive measures itself; jsdom has no ResizeObserver.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("only removes an item after the consequence is confirmed", async () => {
    const remove = trpc.mutation("character.sheet.item.remove");
    remove.mutate.mockClear();
    renderInventory([item({ id: "item-1", name: "Lantern", qty: 2 })]);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(remove.mutate).not.toHaveBeenCalled();
    expect(
      screen.getByText(/stays listed under removed gear/i),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /remove item/i }));
    expect(remove.mutate).toHaveBeenCalledWith({
      campaignId,
      sheetId,
      itemId: "item-1",
    });
  });

  it("restores a removed item from the removed gear list", async () => {
    const restore = trpc.mutation("character.sheet.item.restore");
    restore.mutate.mockClear();
    renderInventory([
      item({
        id: "item-2",
        name: "Signet ring",
        removedAt: new Date("2026-07-20T10:00:00.000Z"),
      }),
    ]);

    expect(screen.getByText("Removed gear")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /put signet ring back/i }),
    );

    expect(restore.mutate).toHaveBeenCalledWith({
      campaignId,
      sheetId,
      itemId: "item-2",
    });
  });

  it("saves quantity and notes together for one item", async () => {
    const update = trpc.mutation("character.sheet.item.update");
    update.mutate.mockClear();
    renderInventory([item({ id: "item-3", name: "Torch", qty: 3 })]);

    const quantity = screen.getByLabelText("Quantity");
    await userEvent.clear(quantity);
    await userEvent.type(quantity, "5");
    await userEvent.type(screen.getByLabelText("Notes"), "Two are damp");
    await userEvent.click(screen.getByRole("button", { name: /save item/i }));

    expect(update.mutate).toHaveBeenCalledWith({
      campaignId,
      sheetId,
      itemId: "item-3",
      name: "Torch",
      qty: 5,
      notes: "Two are damp",
    });
  });

  it("toggles equipped state without a separate save", async () => {
    const update = trpc.mutation("character.sheet.item.update");
    update.mutate.mockClear();
    renderInventory([item({ id: "item-4", name: "Shield" })]);

    await userEvent.click(screen.getByRole("checkbox", { name: "Equipped" }));

    expect(update.mutate).toHaveBeenCalledWith({
      campaignId,
      sheetId,
      itemId: "item-4",
      equipped: true,
    });
  });

  it("locks every control while the sheet cannot be edited", () => {
    renderInventory([item({ id: "item-5", name: "Spellbook" })], true);

    expect(screen.getByRole("button", { name: /save item/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
    expect(screen.getByLabelText("Quantity")).toBeDisabled();
  });
});
