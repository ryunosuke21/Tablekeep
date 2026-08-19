import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CampaignProfileHeader } from "./campaign-profile-header";

const campaign = {
  id: "3f9c2b8e-4a3d-4b1a-9c2e-8f6a1d0b5c7a",
  name: "The Sunken Vault",
  description: null,
  logo: null,
  bannerImage: null,
  colors: "lilac" as const,
  status: "active" as const,
};

describe("CampaignProfileHeader", () => {
  it("links the Launch control to the campaign's play route by id", () => {
    render(
      <CampaignProfileHeader
        {...{ campaign, role: "dm" as const, memberCount: 3 }}
      />,
    );

    expect(screen.getByRole("link", { name: /launch/i })).toHaveAttribute(
      "href",
      `/play/${campaign.id}`,
    );
  });
});
