import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PlayShell, type PlayShellSection } from "./play-shell";

const sections: PlayShellSection[] = [
  { value: "character", label: "Character", icon: <span>C</span> },
  { value: "inventory", label: "Inventory", icon: <span>I</span> },
];

describe("PlayShell", () => {
  it("renders the campaign name and view label", () => {
    render(
      <PlayShell
        campaignName="The Sunken Keep"
        campaignHref="/campaigns/sunken-keep"
        viewLabel="Player view"
        sections={sections}
        activeSection="character"
        onSectionChange={vi.fn()}
      >
        <p>Sheet content</p>
      </PlayShell>,
    );

    expect(screen.getByText("The Sunken Keep")).toBeInTheDocument();
    expect(screen.getByText("Player view")).toBeInTheDocument();
  });

  it("links Leave table back to the campaign href", () => {
    render(
      <PlayShell
        campaignName="The Sunken Keep"
        campaignHref="/campaigns/sunken-keep"
        viewLabel="Player view"
        sections={sections}
        activeSection="character"
        onSectionChange={vi.fn()}
      >
        <p>Sheet content</p>
      </PlayShell>,
    );

    expect(screen.getByRole("link", { name: "Leave table" })).toHaveAttribute(
      "href",
      "/campaigns/sunken-keep",
    );
  });

  it("marks only the active section with aria-current and calls back on change", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(
      <PlayShell
        campaignName="The Sunken Keep"
        campaignHref="/campaigns/sunken-keep"
        viewLabel="Player view"
        sections={sections}
        activeSection="character"
        onSectionChange={onSectionChange}
      >
        <p>Sheet content</p>
      </PlayShell>,
    );

    const characterTab = screen.getByRole("button", { name: /Character/i });
    const inventoryTab = screen.getByRole("button", { name: /Inventory/i });

    expect(characterTab).toHaveAttribute("aria-current", "page");
    expect(inventoryTab).not.toHaveAttribute("aria-current");

    await user.click(inventoryTab);
    expect(onSectionChange).toHaveBeenCalledWith("inventory");
  });

  it("renders arbitrary children in the content stage", () => {
    render(
      <PlayShell
        campaignName="The Sunken Keep"
        campaignHref="/campaigns/sunken-keep"
        viewLabel="Player view"
        sections={sections}
        activeSection="character"
        onSectionChange={vi.fn()}
      >
        <p>Unique sheet marker</p>
      </PlayShell>,
    );

    expect(screen.getByText("Unique sheet marker")).toBeInTheDocument();
  });

  it("renders an optional turn rail between the masthead and content", () => {
    render(
      <PlayShell
        campaignName="The Sunken Keep"
        campaignHref="/campaigns/sunken-keep"
        viewLabel="Player view"
        sections={sections}
        activeSection="character"
        onSectionChange={vi.fn()}
        turnRail={<div>Round 3</div>}
      >
        <p>Sheet content</p>
      </PlayShell>,
    );

    expect(screen.getByText("Round 3")).toBeInTheDocument();
  });

  it("omits the turn rail entirely when none is provided", () => {
    render(
      <PlayShell
        campaignName="The Sunken Keep"
        campaignHref="/campaigns/sunken-keep"
        viewLabel="Player view"
        sections={sections}
        activeSection="character"
        onSectionChange={vi.fn()}
      >
        <p>Sheet content</p>
      </PlayShell>,
    );

    expect(screen.queryByText("Round 3")).toBeNull();
  });
});
