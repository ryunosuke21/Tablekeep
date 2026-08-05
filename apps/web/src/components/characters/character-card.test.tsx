import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CharacterCard, type CharacterListItem } from "./character-card";

const character: CharacterListItem = {
  id: "11111111-1111-1111-1111-111111111111",
  ownerId: "usr_mara",
  slug: "vesper-quill",
  name: "Vesper Quill",
  bio: "Keeps a ledger of every favour owed.",
  deletedAt: null,
  createdAt: new Date("2026-07-01T10:00:00.000Z"),
  updatedAt: new Date("2026-07-29T10:00:00.000Z"),
  sheets: [
    {
      id: "22222222-2222-2222-2222-222222222222",
      campaignId: "33333333-3333-3333-3333-333333333333",
      campaignName: "The Hollow Crown",
      campaignSlug: "the-hollow-crown",
      name: "The Quill",
      ancestry: "Tiefling",
      maxHp: 52,
      totalLevel: 7,
    },
  ],
};

describe("CharacterCard", () => {
  it("shows the global name with the campaign sheet summary", () => {
    render(<CharacterCard character={character} />);

    expect(
      screen.getByRole("link", { name: /open vesper quill/i }),
    ).toHaveAttribute("href", "/characters/vesper-quill");
    expect(screen.getByText("Vesper Quill")).toBeInTheDocument();
    expect(screen.getByText("The Hollow Crown")).toBeInTheDocument();
    expect(screen.getByLabelText("Level 7")).toBeInTheDocument();
    expect(screen.getByText(/tiefling/i)).toBeInTheDocument();
    expect(screen.getByText(/plays as the quill/i)).toBeInTheDocument();
  });

  it("reports max HP only, never a current value", () => {
    render(<CharacterCard character={character} />);

    expect(screen.getByText("52 max HP")).toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*\/\s*\d+/)).not.toBeInTheDocument();
  });

  it("invites the owner to attach a character that has no sheet", () => {
    render(<CharacterCard character={{ ...character, sheets: [] }} />);

    expect(screen.getByText(/not in a campaign yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/attach this character to a campaign/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/max hp/i)).not.toBeInTheDocument();
  });
});
