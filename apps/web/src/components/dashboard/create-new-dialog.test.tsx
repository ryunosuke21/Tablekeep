import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "@tablekeep/ui/components/sidebar";
import { TooltipProvider } from "@tablekeep/ui/components/tooltip";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const { CreateNewDialog } = await import("./create-new-dialog");

describe("CreateNewDialog", () => {
  it("keeps the collapsed create control icon-sized and opens the dialog", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    render(
      <TooltipProvider>
        <SidebarProvider defaultOpen={false}>
          <CreateNewDialog />
        </SidebarProvider>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Create new" });

    expect(trigger).toHaveAttribute("data-sidebar", "menu-button");
    expect(trigger).toHaveAttribute("data-state", "closed");
    expect(trigger).toHaveClass("group-data-[collapsible=icon]:p-2!");

    await userEvent.click(trigger);

    expect(
      screen.getByRole("heading", { name: "Create something new" }),
    ).toBeInTheDocument();
  });
});
