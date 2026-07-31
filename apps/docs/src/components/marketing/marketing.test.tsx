import "@testing-library/jest-dom/vitest";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "@/components/marketing/hero";
import { WhereItStands } from "@/components/marketing/where-it-stands";

describe("marketing content", () => {
  it("renders the primary message and navigation", () => {
    render(<Hero />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /keep the table\s*moving/i,
    );
    expect(
      screen.getByRole("img", { name: /red dragon perched/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /enter the keep/i }),
    ).toHaveAttribute("href", "http://localhost:3000");
    expect(
      screen.getByRole("link", { name: /read the docs/i }),
    ).toHaveAttribute("href", "/docs");
  });

  it("keeps implemented and planned capabilities explicit", () => {
    render(<WhereItStands />);

    const list = screen.getByRole("list");
    expect(within(list).getAllByText("Built")).toHaveLength(3);
    expect(within(list).getAllByText("Planned")).toHaveLength(4);
    expect(within(list).getByText("Accounts and sign-in")).toBeInTheDocument();
    expect(
      within(list).getByText("Campaigns, invitations, and membership"),
    ).toBeInTheDocument();
  });
});
