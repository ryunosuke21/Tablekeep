import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlayAccessState } from "./play-access-state";

const campaignId = "11111111-1111-1111-1111-111111111111";

describe("PlayAccessState", () => {
  it("sends a signed-out visitor to sign in with the play route preserved", () => {
    render(
      <PlayAccessState
        state={{ kind: "signed-out" }}
        campaignId={campaignId}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /sign in to join this session/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      `/sign-in?next=%2Fplay%2F${campaignId}`,
    );
  });

  it("sends a member without a profile to finish it before joining", () => {
    render(
      <PlayAccessState
        state={{ kind: "profile-required" }}
        campaignId={campaignId}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /finish your profile to join/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /finish profile/i }),
    ).toHaveAttribute("href", `/new-profile?next=%2Fplay%2F${campaignId}`);
  });

  it("does not reveal whether an unavailable campaign is missing or private", () => {
    render(
      <PlayAccessState
        state={{ kind: "unavailable" }}
        campaignId={campaignId}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /campaign unavailable/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/does not exist/i)).toBeNull();
    expect(
      screen.getByRole("link", { name: /back to campaigns/i }),
    ).toHaveAttribute("href", "/campaigns");
  });

  it("names the campaign and explains that archived play is unavailable", () => {
    render(
      <PlayAccessState
        state={{ kind: "archived", campaignName: "The Ember Coast" }}
        campaignId={campaignId}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /the ember coast is archived/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to campaigns/i }),
    ).toHaveAttribute("href", "/campaigns");
  });
});
