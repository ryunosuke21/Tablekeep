import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TurnRail, type TurnRailCombatant } from "./turn-rail";

const combatants: TurnRailCombatant[] = [
  { id: "b", name: "Brannor", initiativeTotal: 14, position: 1 },
  { id: "a", name: "Aelith", initiativeTotal: 19, position: 0 },
  {
    id: "c",
    name: "Cinder the Unrelenting Cinderclaw",
    initiativeTotal: null,
    position: 2,
  },
];

describe("TurnRail", () => {
  it("shows a compact status strip and no combatants when no encounter is active", () => {
    render(
      <TurnRail
        combatants={combatants}
        activePosition={0}
        round={1}
        isEncounterActive={false}
      />,
    );

    expect(screen.getByText("No active encounter")).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByText("Aelith")).toBeNull();
  });

  it("renders the round and orders combatants by position without mutating the caller's array", () => {
    const original = [...combatants];

    render(
      <TurnRail
        combatants={combatants}
        activePosition={1}
        round={3}
        isEncounterActive={true}
      />,
    );

    expect(screen.getByText("Round 3")).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Aelith"),
      expect.stringContaining("Brannor"),
      expect.stringContaining("Cinder the Unrelenting Cinderclaw"),
    ]);
    expect(combatants).toEqual(original);
  });

  it("marks the active combatant with aria-current and readable text", () => {
    render(
      <TurnRail
        combatants={combatants}
        activePosition={1}
        round={3}
        isEncounterActive={true}
      />,
    );

    const items = screen.getAllByRole("listitem");
    const active = items.find(
      (item) => item.getAttribute("aria-current") === "step",
    );

    expect(active).toBeDefined();
    expect(active).toHaveTextContent("Brannor");
    expect(active).toHaveTextContent(/current turn/i);

    for (const item of items) {
      if (item !== active) {
        expect(item.getAttribute("aria-current")).toBeNull();
      }
    }
  });

  it("shows initiative totals and an accessible fallback when a total is null", () => {
    render(
      <TurnRail
        combatants={combatants}
        activePosition={null}
        round={1}
        isEncounterActive={true}
      />,
    );

    expect(screen.getByText("Init 19")).toBeInTheDocument();
    expect(screen.getByText("Init 14")).toBeInTheDocument();
    expect(screen.getByText("Initiative not set")).toBeInTheDocument();
  });

  it("labels a missing round without using a decorative placeholder", () => {
    render(
      <TurnRail
        combatants={combatants}
        activePosition={0}
        round={null}
        isEncounterActive={true}
      />,
    );

    expect(screen.getByText("Round not set")).toBeInTheDocument();
  });

  it("explains an empty active encounter instead of crashing", () => {
    render(
      <TurnRail
        combatants={[]}
        activePosition={null}
        round={1}
        isEncounterActive={true}
      />,
    );

    expect(
      screen.getByText("Initiative order has not been set."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });
});
