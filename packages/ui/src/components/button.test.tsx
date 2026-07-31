import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@tablekeep/ui/components/button";

describe("Button", () => {
  it("renders an accessible button and preserves consumer attributes", () => {
    render(
      <Button
        className="campaign-action"
        name="save-campaign"
        variant="outline"
      >
        Save campaign
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save campaign" });
    expect(button).toHaveAttribute("name", "save-campaign");
    expect(button).toHaveAttribute("data-variant", "outline");
    expect(button).toHaveClass("campaign-action");
  });

  it("does not invoke handlers when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Delete encounter
      </Button>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Delete encounter" }),
    );

    expect(onClick).not.toHaveBeenCalled();
  });

  it("preserves link semantics when rendered as a child", () => {
    render(
      <Button asChild>
        <a href="/campaigns">View campaigns</a>
      </Button>,
    );

    expect(
      screen.getByRole("link", { name: "View campaigns" }),
    ).toHaveAttribute("href", "/campaigns");
  });
});
