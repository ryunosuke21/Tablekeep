import "@testing-library/jest-dom/vitest";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const bootstrapUseQuery = vi.fn();
const characterSheetUseQuery = vi.fn();
const dmBootstrapUseQuery = vi.fn();
const noteUpdateMutate = vi.fn();
const bootstrapInvalidate = vi.fn();

let currentBootstrap: unknown;

function setBootstrap(data: unknown) {
  currentBootstrap = data;
}

const api: unknown = {
  character: {
    sheet: {
      get: {
        useQuery: (input: unknown, options: { initialData?: unknown }) => {
          characterSheetUseQuery(input, options);
          return { data: options.initialData };
        },
      },
    },
  },
  play: {
    player: {
      bootstrap: {
        useQuery: (input: unknown) => {
          bootstrapUseQuery(input);
          return {
            data: currentBootstrap,
            isPending: false,
            isError: false,
            error: null,
          };
        },
      },
    },
    dm: {
      bootstrap: {
        useQuery: (input: unknown) => {
          dmBootstrapUseQuery(input);
          return {
            data: undefined,
            isPending: true,
            isError: false,
            error: null,
          };
        },
      },
    },
    note: {
      update: {
        useMutation: (options?: {
          onSuccess?: (data: {
            content: string;
            updatedAt: Date | null;
          }) => void;
        }) => ({
          mutate: (input: { campaignId: string; content: string }) => {
            noteUpdateMutate(input);
            options?.onSuccess?.({ content: input.content, updatedAt: null });
          },
          isPending: false,
          isSuccess: false,
          error: null,
        }),
      },
    },
  },
  useUtils: () => ({
    play: {
      player: {
        bootstrap: {
          invalidate: bootstrapInvalidate,
        },
      },
    },
  }),
};

vi.mock("@/trpc/react", () => ({ api }));

vi.mock("@/components/characters/character-sheet", () => ({
  CharacterSheet: ({
    initialSheet,
  }: {
    initialSheet: { charName: string };
  }) => <div data-testid="character-sheet">{initialSheet.charName}</div>,
}));
vi.mock("@/components/characters/sheet-spells", () => ({
  SheetSpells: () => <div data-testid="sheet-spells" />,
}));
vi.mock("@/components/characters/sheet-inventory", () => ({
  SheetInventory: () => <div data-testid="sheet-inventory" />,
}));
vi.mock("@/components/characters/sheet-currencies", () => ({
  SheetCurrencies: () => <div data-testid="sheet-currencies" />,
}));

const { PlayerClient } = await import("./player-client");

const campaignId = "campaign-1";

const campaign = {
  id: campaignId,
  name: "The Hollow Crown",
  slug: "the-hollow-crown",
  description: null,
  colors: null,
  logo: null,
  bannerImage: null,
  status: "active",
};

const sheet = {
  id: "sheet-1",
  charName: "Vesper Quill",
  spells: [],
  items: [],
  currencies: [],
};

function bootstrap(overrides: Record<string, unknown> = {}) {
  return {
    campaign,
    role: "player",
    sheet,
    party: [],
    note: { content: "", updatedAt: null },
    encounter: null,
    ...overrides,
  };
}

describe("PlayerClient", () => {
  it("requests only the player-safe bootstrap for the campaign", () => {
    setBootstrap(bootstrap());
    render(<PlayerClient campaignId={campaignId} />);

    expect(bootstrapUseQuery).toHaveBeenCalledWith({ campaignId });
    expect(characterSheetUseQuery).toHaveBeenCalledWith(
      { campaignId, sheetId: "sheet-1" },
      expect.objectContaining({ enabled: true, initialData: sheet }),
    );
    expect(dmBootstrapUseQuery).not.toHaveBeenCalled();
  });

  it("renders the campaign name and the current turn information", async () => {
    setBootstrap(
      bootstrap({
        encounter: {
          id: "enc-1",
          name: "Ambush",
          status: "active",
          round: 3,
          activePosition: 1,
          revision: 0,
          combatants: [
            {
              id: "c1",
              sheetId: "sheet-1",
              name: "Vesper Quill",
              initiativeTotal: 14,
              position: 0,
              visibility: "players",
              currentHp: 18,
              maxHp: 24,
              tempHp: 0,
              effects: [],
            },
            {
              id: "c2",
              sheetId: null,
              name: "Goblin",
              initiativeTotal: 19,
              position: 1,
              visibility: "players",
              currentHp: null,
              maxHp: null,
              tempHp: null,
              effects: [],
            },
          ],
        },
      }),
    );
    render(<PlayerClient campaignId={campaignId} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "The Hollow Crown" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Round 3")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Turn" }));

    const turnSection = screen.getByRole("region", { name: "Turn" });
    expect(within(turnSection).getByText("Goblin")).toBeInTheDocument();
    expect(within(turnSection).getByText("18 / 24")).toBeInTheDocument();
  });

  it("renders a no-sheet state that links to the campaign's characters page", () => {
    setBootstrap(bootstrap({ sheet: null }));
    render(<PlayerClient campaignId={campaignId} />);

    expect(
      screen.getByText(/no active character is attached/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go to characters/i }),
    ).toHaveAttribute("href", "/campaigns/the-hollow-crown/characters");
  });

  it("does not expose DM-only encounter controls", async () => {
    setBootstrap(
      bootstrap({
        encounter: {
          id: "enc-1",
          name: "Ambush",
          status: "active",
          round: 1,
          activePosition: 0,
          revision: 0,
          combatants: [
            {
              id: "c1",
              sheetId: "sheet-1",
              name: "Vesper Quill",
              initiativeTotal: 12,
              position: 0,
              visibility: "players",
              currentHp: 10,
              maxHp: 10,
              tempHp: 0,
              effects: [],
            },
          ],
        },
      }),
    );
    render(<PlayerClient campaignId={campaignId} />);
    await userEvent.click(screen.getByRole("button", { name: "Turn" }));

    expect(
      screen.queryByRole("button", { name: /advance turn/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /begin encounter/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /set health/i }),
    ).not.toBeInTheDocument();
  });

  it("saves the private campaign note with the campaign id", async () => {
    setBootstrap(
      bootstrap({ note: { content: "Remember the key", updatedAt: null } }),
    );
    render(<PlayerClient campaignId={campaignId} />);
    await userEvent.click(screen.getByRole("button", { name: "Notes" }));

    const textbox = screen.getByLabelText("Private campaign note");
    await userEvent.clear(textbox);
    await userEvent.type(textbox, "New note");
    await userEvent.click(screen.getByRole("button", { name: /save notes/i }));

    expect(noteUpdateMutate).toHaveBeenCalledWith({
      campaignId,
      content: "New note",
    });
    expect(bootstrapInvalidate).toHaveBeenCalled();
  });
});
