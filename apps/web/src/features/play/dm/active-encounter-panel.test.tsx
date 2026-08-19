import "@testing-library/jest-dom/vitest";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  type ActiveDmEncounter,
  ActiveEncounterPanel,
  type AddEffectValue,
  type AdvanceTurnValue,
  type CompleteEncounterValue,
  type RemoveEffectValue,
  type SetHealthValue,
} from "./active-encounter-panel";

function combatant(
  overrides: Partial<ActiveDmEncounter["combatants"][number]> & {
    id: string;
    name: string;
    position: number;
  },
): ActiveDmEncounter["combatants"][number] {
  return {
    sheetId: null,
    source: "custom",
    initiativeRoll: null,
    initiativeModifier: 0,
    initiativeTotal: 10,
    currentHp: 20,
    maxHp: 20,
    tempHp: 0,
    visibility: "players",
    dmNotes: null,
    effects: [],
    ...overrides,
  };
}

function encounter(
  overrides: Partial<ActiveDmEncounter> = {},
): ActiveDmEncounter {
  return {
    id: "enc-1",
    name: "Ambush at the bridge",
    status: "active",
    round: 2,
    activePosition: 0,
    revision: 4,
    combatants: [
      combatant({ id: "combatant-1", name: "Vesper Quill", position: 0 }),
      combatant({
        id: "combatant-2",
        name: "Goblin scout",
        position: 1,
        visibility: "dm",
        sheetId: null,
      }),
    ],
    ...overrides,
  };
}

function renderPanel(
  overrides: Partial<{
    encounter: ActiveDmEncounter;
    isPending: boolean;
    errorMessage: string | null;
  }> = {},
) {
  const onAdvanceTurn = vi.fn<(value: AdvanceTurnValue) => void>();
  const onSetHealth = vi.fn<(value: SetHealthValue) => void>();
  const onAddEffect = vi.fn<(value: AddEffectValue) => void>();
  const onRemoveEffect = vi.fn<(value: RemoveEffectValue) => void>();
  const onCompleteEncounter = vi.fn<(value: CompleteEncounterValue) => void>();

  render(
    <ActiveEncounterPanel
      encounter={overrides.encounter ?? encounter()}
      isPending={overrides.isPending ?? false}
      errorMessage={overrides.errorMessage ?? null}
      onAdvanceTurn={onAdvanceTurn}
      onSetHealth={onSetHealth}
      onAddEffect={onAddEffect}
      onRemoveEffect={onRemoveEffect}
      onCompleteEncounter={onCompleteEncounter}
    />,
  );

  return {
    onAdvanceTurn,
    onSetHealth,
    onAddEffect,
    onRemoveEffect,
    onCompleteEncounter,
  };
}

describe("ActiveEncounterPanel", () => {
  it("shows the encounter name, round, and every combatant including hidden ones", () => {
    renderPanel();

    expect(screen.getByText("Ambush at the bridge")).toBeInTheDocument();
    expect(screen.getAllByText("Round 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vesper Quill").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Goblin scout").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Hidden from players", {
        selector: "span[data-slot=badge]",
      }),
    ).toBeInTheDocument();
  });

  it("advances turns with the encounter's current revision", async () => {
    const { onAdvanceTurn } = renderPanel();

    await userEvent.click(screen.getByRole("button", { name: "Next turn" }));
    expect(onAdvanceTurn).toHaveBeenCalledWith({
      expectedRevision: 4,
      direction: "next",
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Previous turn" }),
    );
    expect(onAdvanceTurn).toHaveBeenCalledWith({
      expectedRevision: 4,
      direction: "previous",
    });
  });

  it("saves a valid current HP and temp HP edit", async () => {
    const { onSetHealth } = renderPanel();

    const currentHp = screen.getByLabelText("Current HP for Vesper Quill");
    await userEvent.clear(currentHp);
    await userEvent.type(currentHp, "12");

    const tempHp = screen.getByLabelText("Temporary HP for Vesper Quill");
    await userEvent.clear(tempHp);
    await userEvent.type(tempHp, "5");

    await userEvent.click(
      screen.getByLabelText("Save health for Vesper Quill"),
    );

    expect(onSetHealth).toHaveBeenCalledWith({
      expectedRevision: 4,
      combatantId: "combatant-1",
      currentHp: 12,
      tempHp: 5,
    });
  });

  it("preserves a null current HP when saved blank", async () => {
    const { onSetHealth } = renderPanel({
      encounter: encounter({
        combatants: [
          combatant({
            id: "combatant-1",
            name: "Vesper Quill",
            position: 0,
            currentHp: null,
          }),
        ],
      }),
    });

    await userEvent.click(
      screen.getByLabelText("Save health for Vesper Quill"),
    );

    expect(onSetHealth).toHaveBeenCalledWith({
      expectedRevision: 4,
      combatantId: "combatant-1",
      currentHp: null,
      tempHp: 0,
    });
  });

  it("blocks an out-of-range HP edit instead of calling the callback", async () => {
    const { onSetHealth } = renderPanel();

    const currentHp = screen.getByLabelText("Current HP for Vesper Quill");
    await userEvent.clear(currentHp);
    await userEvent.type(currentHp, "9999999");

    await userEvent.click(
      screen.getByLabelText("Save health for Vesper Quill"),
    );

    expect(onSetHealth).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Enter a whole number from -1,000,000 to 1,000,000, or leave it blank.",
      ),
    ).toBeInTheDocument();
  });

  it("adds an effect with the entered fields and sensible defaults", async () => {
    const { onAddEffect } = renderPanel();

    const nameInput = screen.getByLabelText("Effect name for Vesper Quill");
    await userEvent.type(nameInput, "Blessed");

    await userEvent.click(screen.getByLabelText("Add effect to Vesper Quill"));

    expect(onAddEffect).toHaveBeenCalledWith({
      expectedRevision: 4,
      combatantId: "combatant-1",
      name: "Blessed",
      description: null,
      remainingTurns: null,
      tick: "manual",
      visibility: "players",
    });
  });

  it("submits full add-effect details when provided", async () => {
    const { onAddEffect } = renderPanel();

    await userEvent.type(
      screen.getByLabelText("Effect name for Goblin scout"),
      "Poisoned",
    );
    await userEvent.type(
      screen.getByLabelText("Effect description for Goblin scout"),
      "Takes damage each turn.",
    );
    await userEvent.type(
      screen.getByLabelText("Remaining turns for Goblin scout effect"),
      "3",
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Tick for Goblin scout effect"),
      "turn_end",
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Visibility for Goblin scout effect"),
      "dm",
    );

    await userEvent.click(screen.getByLabelText("Add effect to Goblin scout"));

    expect(onAddEffect).toHaveBeenCalledWith({
      expectedRevision: 4,
      combatantId: "combatant-2",
      name: "Poisoned",
      description: "Takes damage each turn.",
      remainingTurns: 3,
      tick: "turn_end",
      visibility: "dm",
    });
  });

  it("blocks an out-of-range remaining turns value on the add-effect form", async () => {
    const { onAddEffect } = renderPanel();

    await userEvent.type(
      screen.getByLabelText("Effect name for Vesper Quill"),
      "Blessed",
    );
    await userEvent.type(
      screen.getByLabelText("Remaining turns for Vesper Quill effect"),
      "999999",
    );

    await userEvent.click(screen.getByLabelText("Add effect to Vesper Quill"));

    expect(onAddEffect).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Enter a whole number from 0 to 100,000, or leave it blank.",
      ),
    ).toBeInTheDocument();
  });

  it("removes a specific effect from a specific combatant", async () => {
    const { onRemoveEffect } = renderPanel({
      encounter: encounter({
        combatants: [
          combatant({
            id: "combatant-1",
            name: "Vesper Quill",
            position: 0,
            effects: [
              {
                id: "effect-1",
                name: "Blessed",
                description: null,
                remainingTurns: null,
                tick: "manual",
                visibility: "players",
              },
            ],
          }),
        ],
      }),
    });

    await userEvent.click(
      screen.getByLabelText("Remove Blessed from Vesper Quill"),
    );

    expect(onRemoveEffect).toHaveBeenCalledWith({
      expectedRevision: 4,
      effectId: "effect-1",
    });
  });

  it("requires confirmation before completing the encounter", async () => {
    const { onCompleteEncounter } = renderPanel();

    await userEvent.click(
      screen.getByRole("button", { name: "Complete encounter" }),
    );
    expect(onCompleteEncounter).not.toHaveBeenCalled();

    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /complete encounter/i }),
    );

    expect(onCompleteEncounter).toHaveBeenCalledWith({ expectedRevision: 4 });
  });

  it("disables mutation controls while a mutation is pending", () => {
    renderPanel({ isPending: true });

    expect(screen.getByRole("button", { name: "Next turn" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Previous turn" }),
    ).toBeDisabled();
    expect(
      screen.getByLabelText("Save health for Vesper Quill"),
    ).toBeDisabled();
    expect(screen.getByLabelText("Add effect to Vesper Quill")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Complete encounter" }),
    ).toBeDisabled();
  });

  it("shows the error message without replacing the work surface", () => {
    renderPanel({ errorMessage: "The revision has moved on." });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The revision has moved on.",
    );
    expect(screen.getByText("Ambush at the bridge")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next turn" }),
    ).toBeInTheDocument();
  });
});
