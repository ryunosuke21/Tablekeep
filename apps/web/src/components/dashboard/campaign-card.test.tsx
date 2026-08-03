import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CampaignCard, type CampaignListItem } from "./campaign-card";

const campaign: CampaignListItem = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "the-ember-coast",
  name: "The Ember Coast",
  description: "A storm-battered port and one very old map.",
  role: "dm",
  memberCount: 6,
  members: [
    { id: "usr_mara", name: "Mara Voss", imageUrl: null },
    { id: "usr_jon", name: "Jon Bell", imageUrl: null },
  ],
  nextSession: {
    startsAt: new Date("2026-08-15T23:00:00.000Z"),
    endsAt: new Date("2026-08-16T03:00:00.000Z"),
    timeZone: "America/Tegucigalpa",
  },
  colors: "rose",
  updatedAt: new Date("2026-07-28T16:40:00.000Z"),
};

describe("CampaignCard", () => {
  it("links to the campaign and stamps the caller's role", () => {
    render(<CampaignCard campaign={campaign} />);

    expect(
      screen.getByRole("link", { name: /open the ember coast/i }),
    ).toHaveAttribute("href", "/campaigns/the-ember-coast");
    expect(screen.getByText("DM")).toBeInTheDocument();
    expect(
      screen.getByText(/a storm-battered port and one very old map\./i),
    ).toBeInTheDocument();
  });

  it("renders the next session in the campaign time zone", () => {
    render(<CampaignCard campaign={campaign} />);

    expect(screen.getByText("Aug 15 · 5:00 PM–9:00 PM")).toBeInTheDocument();
  });

  it("says so when no session is scheduled", () => {
    render(<CampaignCard campaign={{ ...campaign, nextSession: null }} />);

    expect(screen.getByText("Next session not scheduled")).toBeInTheDocument();
  });

  it("counts members that are not shown as avatars", () => {
    render(<CampaignCard campaign={campaign} />);

    expect(screen.getByText("+4")).toBeInTheDocument();
  });
});
