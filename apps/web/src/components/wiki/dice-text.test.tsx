import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WikiProse } from "./dice-text";

describe("WikiProse", () => {
  it("renders source markdown tables as accessible tables", () => {
    render(
      <WikiProse
        text={`Table: Draconic Ancestors

| Dragon | Damage Type |
|---|---|
| Black | Acid |
| Blue | Lightning |`}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Draconic Ancestors" }),
    ).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: "Dragon" }),
    ).toBeInTheDocument();
    expect(within(table).getByText("Lightning")).toBeInTheDocument();
  });

  it("keeps dice rendering inside table cells", () => {
    render(
      <WikiProse
        text={`| Level | Damage |
|---|---|
| 5 | 2d10 |`}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Dice roll 2d10" }),
    ).toBeInTheDocument();
  });
});
