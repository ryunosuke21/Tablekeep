import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createTrpcMock } from "@/test/trpc-mock";

const trpc = createTrpcMock();

vi.mock("@/trpc/react", () => ({ api: trpc.api }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@tablekeep/ui/components/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const { DeletedCharacterList } = await import("./deleted-character-list");

describe("DeletedCharacterList", () => {
  it("restores a deleted character through the existing mutation", async () => {
    const restore = trpc.mutation("character.restore");
    restore.mutate.mockClear();
    render(
      <DeletedCharacterList
        characters={[
          {
            id: "char-9",
            name: "Orin Ash",
            deletedAt: new Date("2026-07-30T10:00:00.000Z"),
          },
        ]}
      />,
    );

    expect(screen.getByText(/deleted jul 30, 2026/i)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /restore orin ash/i }),
    );

    expect(restore.mutate).toHaveBeenCalledWith({ charId: "char-9" });
  });
});
