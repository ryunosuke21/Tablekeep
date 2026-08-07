import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DiceRoll, parseDiceExpression } from "./dice-roll";
import { DiceText } from "./dice-text";

describe("dice notation", () => {
  it("parses supported dice and modifiers", () => {
    expect(parseDiceExpression("d4")).toEqual({
      count: 1,
      sides: 4,
      modifier: 0,
    });
    expect(parseDiceExpression("2D20 + 5")).toEqual({
      count: 2,
      sides: 20,
      modifier: 5,
    });
    expect(parseDiceExpression("3d8-2")).toEqual({
      count: 3,
      sides: 8,
      modifier: -2,
    });
  });

  it("rejects unsupported and unreasonable expressions", () => {
    expect(parseDiceExpression("1d3")).toBeNull();
    expect(parseDiceExpression("101d6")).toBeNull();
    expect(parseDiceExpression("damage1d6")).toBeNull();
  });

  it("keeps notation visible and gives the die an accessible name", () => {
    render(<DiceRoll expression="1d4" />);
    expect(screen.getByLabelText("Dice roll 1d4")).toBeInTheDocument();
    expect(screen.getByText("1d4")).toBeInTheDocument();
  });

  it("enhances bounded notation without changing nearby prose", () => {
    render(
      <p>
        <DiceText text="Heal 1d4 + 2 now; leave word1d4 alone." />
      </p>,
    );
    expect(screen.getByLabelText("Dice roll 1d4 + 2")).toBeInTheDocument();
    expect(screen.getByText(/word1d4 alone/)).toBeInTheDocument();
  });
});
