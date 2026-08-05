import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createTrpcMock } from "@/test/trpc-mock";

const trpc = createTrpcMock();
const push = vi.fn();
const refresh = vi.fn();

vi.mock("@/trpc/react", () => ({ api: trpc.api }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, replace: vi.fn() }),
}));
vi.mock("@tablekeep/ui/components/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const { AttachCharacterForm } = await import("./attach-character-form");

const campaignId = "33333333-3333-3333-3333-333333333333";

describe("AttachCharacterForm", () => {
  it("starts a sheet for the character the player picks", async () => {
    const create = trpc.mutation("character.sheet.create");
    create.mutate.mockClear();
    render(
      <AttachCharacterForm
        campaignId={campaignId}
        campaignSlug="the-hollow-crown"
        characters={[
          { id: "char-1", name: "Vesper Quill" },
          { id: "char-2", name: "Rowan Vale" },
        ]}
      />,
    );

    await userEvent.selectOptions(
      screen.getByLabelText("Your character"),
      "char-2",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /bring them to the table/i }),
    );

    expect(create.mutate).toHaveBeenCalledWith({
      campaignId,
      charId: "char-2",
    });
  });

  it("guides a player with no free character to create one", () => {
    render(
      <AttachCharacterForm
        campaignId={campaignId}
        campaignSlug="the-hollow-crown"
        characters={[]}
      />,
    );

    expect(
      screen.getByRole("link", { name: /create a character/i }),
    ).toHaveAttribute("href", "/characters/new");
    expect(
      screen.queryByRole("button", { name: /bring them to the table/i }),
    ).not.toBeInTheDocument();
  });
});
