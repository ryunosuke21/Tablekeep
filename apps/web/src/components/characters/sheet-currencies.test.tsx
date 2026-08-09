import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createTrpcMock } from "@/test/trpc-mock";
import type { RouterOutputs } from "@/trpc/react";

const trpc = createTrpcMock();

vi.mock("@/trpc/react", () => ({ api: trpc.api }));

const { SheetCurrencies } = await import("./sheet-currencies");

type SheetCurrency =
  RouterOutputs["character"]["sheet"]["get"]["currencies"][number];

const campaignId = "33333333-3333-3333-3333-333333333333";
const sheetId = "22222222-2222-2222-2222-222222222222";

function currency(
  overrides: Partial<SheetCurrency> & { id: string },
): SheetCurrency {
  return {
    sheetId,
    name: "Gold",
    amount: 0,
    createdBy: null,
    updatedBy: null,
    removedAt: null,
    removedBy: null,
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    updatedAt: new Date("2026-07-01T10:00:00.000Z"),
    ...overrides,
  };
}

function renderCurrencies(currencies: SheetCurrency[]) {
  return render(
    <SheetCurrencies
      campaignId={campaignId}
      sheetId={sheetId}
      currencies={currencies}
      disabled={false}
      canEdit
    />,
  );
}

describe("SheetCurrencies", () => {
  it("adds a currency under any name the table uses", async () => {
    const create = trpc.mutation("character.sheet.currency.create");
    create.mutate.mockClear();
    renderCurrencies([]);

    await userEvent.type(screen.getByLabelText("Add a currency"), "Favours");
    const amount = screen.getByLabelText("Starting amount");
    await userEvent.clear(amount);
    await userEvent.type(amount, "3");
    await userEvent.click(
      screen.getByRole("button", { name: /add currency/i }),
    );

    expect(create.mutate).toHaveBeenCalledWith({
      campaignId,
      sheetId,
      name: "Favours",
      amount: 3,
    });
  });

  it("keeps several currencies side by side", () => {
    renderCurrencies([
      currency({ id: "cur-1", name: "Gold", amount: 42 }),
      currency({ id: "cur-2", name: "Salt", amount: 7 }),
    ]);

    expect(screen.getByDisplayValue("Gold")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Salt")).toBeInTheDocument();
    expect(screen.getByDisplayValue("42")).toBeInTheDocument();
  });

  it("confirms removal and offers a restore for removed currencies", async () => {
    const remove = trpc.mutation("character.sheet.currency.remove");
    const restore = trpc.mutation("character.sheet.currency.restore");
    remove.mutate.mockClear();
    restore.mutate.mockClear();
    renderCurrencies([
      currency({ id: "cur-3", name: "Gold", amount: 12 }),
      currency({
        id: "cur-4",
        name: "Trade chits",
        amount: 5,
        removedAt: new Date("2026-07-22T10:00:00.000Z"),
      }),
    ]);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(remove.mutate).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: /remove currency/i }),
    );
    expect(remove.mutate).toHaveBeenCalledWith({
      campaignId,
      sheetId,
      currencyId: "cur-3",
    });

    await userEvent.click(
      screen.getByRole("button", { name: /restore trade chits/i }),
    );
    expect(restore.mutate).toHaveBeenCalledWith({
      campaignId,
      sheetId,
      currencyId: "cur-4",
    });
  });
});
