import "@testing-library/jest-dom/vitest";

import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const bootstrapUseQuery = vi.fn();
const characterSheetUseQuery = vi.fn();
const dmBootstrapUseQuery = vi.fn();
const noteUpdateMutate = vi.fn();
const bootstrapInvalidate = vi.fn();
const realtimeTokenQuery = vi.fn();

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
    client: {
      play: {
        realtime: {
          token: { query: realtimeTokenQuery },
        },
      },
    },
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

vi.mock("@/env/client", () => ({
  env: { NEXT_PUBLIC_PARTYKIT_HOST: "party.example.test" },
}));

const partyKitState = vi.hoisted(() => ({
  options: [] as Array<{
    getToken: () => Promise<string>;
    host: string;
    room: string;
  }>,
  listeners: new Set<(message: string) => void>(),
}));

function pushPartyKitMessage(message: string) {
  for (const listener of partyKitState.listeners) listener(message);
}

vi.mock("@/hooks/use-partykit-connection", async () => {
  const { useEffect, useState } = await import("react");
  return {
    usePartyKitConnection: (options: {
      getToken: () => Promise<string>;
      host: string;
      room: string;
    }) => {
      partyKitState.options.push(options);
      const [lastMessage, setLastMessage] = useState<string | null>(null);
      useEffect(() => {
        partyKitState.listeners.add(setLastMessage);
        return () => {
          partyKitState.listeners.delete(setLastMessage);
        };
      }, []);
      return {
        connectionId: "test-connection",
        lastMessage,
        send: () => false,
        status: "connected" as const,
      };
    },
  };
});

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
vi.mock("./player-character-panel", () => ({
  PlayerCharacterPanel: ({
    sheet,
    onOpenFullSheet,
  }: {
    sheet: { charName: string };
    onOpenFullSheet: () => void;
  }) => (
    <div data-testid="player-character-panel">
      {sheet.charName}
      <button type="button" onClick={onOpenFullSheet}>
        Open full sheet
      </button>
    </div>
  ),
}));
vi.mock("./player-inventory-panel", () => ({
  PlayerInventoryPanel: ({
    onManageInventory,
  }: {
    onManageInventory: () => void;
  }) => (
    <div data-testid="player-inventory-panel">
      <button type="button" onClick={onManageInventory}>
        Manage inventory
      </button>
    </div>
  ),
}));
vi.mock("./player-spellbook-panel", () => ({
  PlayerSpellbookPanel: ({
    onManageSpells,
  }: {
    onManageSpells: () => void;
  }) => (
    <div data-testid="player-spellbook-panel">
      <button type="button" onClick={onManageSpells}>
        Manage spellbook
      </button>
    </div>
  ),
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
  beforeEach(() => {
    partyKitState.options.length = 0;
    partyKitState.listeners.clear();
    realtimeTokenQuery.mockReset();
    realtimeTokenQuery.mockResolvedValue({
      token: "signed-token",
      expiresAt: new Date(),
    });
    bootstrapInvalidate.mockClear();
  });

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

  it("opens the editable sheet from the character overview", async () => {
    setBootstrap(bootstrap());
    render(<PlayerClient campaignId={campaignId} />);

    expect(screen.getByTestId("player-character-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("character-sheet")).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Open full sheet" }),
    );

    expect(screen.getByTestId("character-sheet")).toHaveTextContent(
      "Vesper Quill",
    );
    expect(
      screen.getByRole("button", { name: "Back to overview" }),
    ).toBeInTheDocument();
  });

  it("opens the inventory editor from the game inventory", async () => {
    setBootstrap(bootstrap());
    render(<PlayerClient campaignId={campaignId} />);

    await userEvent.click(screen.getByRole("button", { name: "Inventory" }));
    expect(screen.getByTestId("player-inventory-panel")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Manage inventory" }),
    );

    expect(screen.getByTestId("sheet-inventory")).toBeInTheDocument();
    expect(screen.getByTestId("sheet-currencies")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to inventory" }),
    ).toBeInTheDocument();
  });

  it("opens the spell editor from the game spellbook", async () => {
    setBootstrap(bootstrap());
    render(<PlayerClient campaignId={campaignId} />);

    await userEvent.click(screen.getByRole("button", { name: "Spells" }));
    expect(screen.getByTestId("player-spellbook-panel")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Manage spellbook" }),
    );

    expect(screen.getByTestId("sheet-spells")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to spellbook" }),
    ).toBeInTheDocument();
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

  it("fetches a realtime token lazily through the tRPC client", async () => {
    setBootstrap(bootstrap());
    render(<PlayerClient campaignId={campaignId} />);

    expect(realtimeTokenQuery).not.toHaveBeenCalled();

    const provider = partyKitState.options.at(-1);
    expect(provider).toBeDefined();
    await expect(provider?.getToken()).resolves.toBe("signed-token");
    expect(realtimeTokenQuery).toHaveBeenCalledWith({ campaignId });
    expect(provider?.host).toBe("party.example.test");
    expect(provider?.room).toBe(campaignId);
  });

  it("invalidates the player bootstrap on a matching encounter.changed message", () => {
    setBootstrap(bootstrap());
    render(<PlayerClient campaignId={campaignId} />);

    act(() => {
      pushPartyKitMessage(
        JSON.stringify({
          type: "encounter.changed",
          campaignId,
          encounterId: "enc-1",
          revision: 5,
        }),
      );
    });

    expect(bootstrapInvalidate).toHaveBeenCalledWith({ campaignId });
  });

  it("ignores unrelated and malformed realtime messages", () => {
    setBootstrap(bootstrap());
    render(<PlayerClient campaignId={campaignId} />);

    act(() => {
      pushPartyKitMessage(
        JSON.stringify({
          type: "encounter.changed",
          campaignId: "another-campaign",
          encounterId: "enc-1",
          revision: 5,
        }),
      );
    });
    act(() => {
      pushPartyKitMessage("not json");
    });

    expect(bootstrapInvalidate).not.toHaveBeenCalled();
  });
});
