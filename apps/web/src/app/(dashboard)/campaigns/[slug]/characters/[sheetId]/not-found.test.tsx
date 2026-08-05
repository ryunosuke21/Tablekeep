import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "test-campaign" }),
}));

const CampaignSheetNotFound = (await import("./not-found")).default;

describe("CampaignSheetNotFound", () => {
  it("keeps a missing sheet from reading as a missing campaign", async () => {
    render(<CampaignSheetNotFound />);

    expect(
      screen.getByText(/this sheet is not available/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/campaign not available/i)).toBeNull();
    expect(
      screen.getByRole("link", { name: /back to characters/i }),
    ).toHaveAttribute("href", "/campaigns/test-campaign/characters");
  });
});
