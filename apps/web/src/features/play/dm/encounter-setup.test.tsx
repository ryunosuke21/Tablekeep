import "@testing-library/jest-dom/vitest";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EncounterSetup,
  type EncounterSetupPartyMember,
  type EncounterSetupValue,
} from "./encounter-setup";

const party: EncounterSetupPartyMember[] = [
  { sheetId: "sheet-1", name: "Vesper Quill" },
  { sheetId: "sheet-2", name: "Brannor Stonehand" },
];

function renderSetup(
  overrides: Partial<{
    party: EncounterSetupPartyMember[];
    isPending: boolean;
    errorMessage: string | null;
    onBegin: (value: EncounterSetupValue) => void;
  }> = {},
) {
  const onBegin = vi.fn<(value: EncounterSetupValue) => void>();
  render(
    <EncounterSetup
      party={overrides.party ?? party}
      isPending={overrides.isPending ?? false}
      errorMessage={overrides.errorMessage ?? null}
      onBegin={overrides.onBegin ?? onBegin}
    />,
  );
  return { onBegin };
}

async function submit() {
  await userEvent.click(
    screen.getByRole("button", { name: "Begin encounter" }),
  );
}

describe("EncounterSetup", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("starts every party member included", () => {
    renderSetup();

    expect(
      screen.getByRole("checkbox", { name: /include vesper quill/i }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /include brannor stonehand/i }),
    ).toBeChecked();
  });

  it("submits automatic initiative with null totals and the confirmed modifiers", async () => {
    const { onBegin } = renderSetup();

    // Scope to the row so the two "Mod" inputs don't collide.
    const vesperRow = screen
      .getByRole("checkbox", { name: /include vesper quill/i })
      .closest("li");
    if (!vesperRow) throw new Error("expected a party row");
    const modifierInput = within(vesperRow).getByLabelText("Mod");
    await userEvent.clear(modifierInput);
    await userEvent.type(modifierInput, "3");

    await submit();

    expect(onBegin).toHaveBeenCalledTimes(1);
    const [value] = onBegin.mock.calls.at(0) ?? [];
    if (!value) throw new Error("expected a submitted encounter");
    expect(value.initiativeMode).toBe("auto");
    expect(value.combatants).toHaveLength(2);
    const vesper = value.combatants.find((c) => c.sheetId === "sheet-1");
    expect(vesper).toMatchObject({
      name: "Vesper Quill",
      initiativeModifier: 3,
      initiativeTotal: null,
      currentHp: null,
      maxHp: null,
      visibility: "players",
    });
  });

  it("refuses manual initiative with a missing total and submits the entered totals once fixed", async () => {
    const { onBegin } = renderSetup();

    await userEvent.click(
      screen.getByRole("radio", { name: "Manual initiative" }),
    );
    await submit();

    expect(onBegin).not.toHaveBeenCalled();
    expect(
      screen.getAllByText("Enter a whole number from -2000 to 2000.").length,
    ).toBeGreaterThan(0);

    const vesperRow = screen
      .getByRole("checkbox", { name: /include vesper quill/i })
      .closest("li");
    const brannorRow = screen
      .getByRole("checkbox", { name: /include brannor stonehand/i })
      .closest("li");
    if (!vesperRow || !brannorRow) throw new Error("expected party rows");

    await userEvent.type(within(vesperRow).getByLabelText("Total"), "18");
    await userEvent.type(within(brannorRow).getByLabelText("Total"), "12");

    await submit();

    expect(onBegin).toHaveBeenCalledTimes(1);
    const [value] = onBegin.mock.calls.at(0) ?? [];
    if (!value) throw new Error("expected a submitted encounter");
    expect(value.initiativeMode).toBe("manual");
    const vesper = value.combatants.find((c) => c.sheetId === "sheet-1");
    const brannor = value.combatants.find((c) => c.sheetId === "sheet-2");
    expect(vesper?.initiativeTotal).toBe(18);
    expect(brannor?.initiativeTotal).toBe(12);
  });

  it("adds and removes a custom combatant row with stable behavior", async () => {
    renderSetup();

    await userEvent.click(
      screen.getByRole("button", { name: "Add custom combatant" }),
    );

    const nameInput = screen.getByPlaceholderText("Goblin scout");
    await userEvent.type(nameInput, "Goblin scout");
    expect(screen.getByDisplayValue("Goblin scout")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /remove goblin scout/i }),
    );

    expect(
      screen.queryByPlaceholderText("Goblin scout"),
    ).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Goblin scout")).not.toBeInTheDocument();
  });

  it("blocks an empty roster and current HP above maximum HP", async () => {
    const { onBegin } = renderSetup({ party: [] });

    await submit();
    expect(onBegin).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Include at least one party member or add a custom combatant.",
      ),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Add custom combatant" }),
    );
    await userEvent.type(
      screen.getByPlaceholderText("Goblin scout"),
      "Goblin scout",
    );

    const row = screen.getByPlaceholderText("Goblin scout").closest("li");
    if (!row) throw new Error("expected a custom row");
    await userEvent.type(within(row).getByLabelText("Max HP"), "10");
    await userEvent.type(within(row).getByLabelText("Cur HP"), "99");

    await submit();

    expect(onBegin).not.toHaveBeenCalled();
    expect(
      screen.getByText("Current HP cannot exceed maximum HP."),
    ).toBeInTheDocument();
  });

  it("defaults current HP to maximum HP when current is left blank", async () => {
    const { onBegin } = renderSetup({ party: [] });

    await userEvent.click(
      screen.getByRole("button", { name: "Add custom combatant" }),
    );
    await userEvent.type(
      screen.getByPlaceholderText("Goblin scout"),
      "Goblin scout",
    );
    const row = screen.getByPlaceholderText("Goblin scout").closest("li");
    if (!row) throw new Error("expected a custom row");
    await userEvent.type(within(row).getByLabelText("Max HP"), "10");

    await submit();

    expect(onBegin).toHaveBeenCalledTimes(1);
    const [value] = onBegin.mock.calls.at(0) ?? [];
    if (!value) throw new Error("expected a submitted encounter");
    expect(value.combatants[0]).toMatchObject({
      sheetId: null,
      name: "Goblin scout",
      maxHp: 10,
      currentHp: 10,
      visibility: "players",
    });
  });

  it("shows the error message in an alert without replacing the form", () => {
    renderSetup({ errorMessage: "The encounter could not begin." });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The encounter could not begin.",
    );
    expect(
      screen.getByRole("button", { name: "Begin encounter" }),
    ).toBeInTheDocument();
  });
});
