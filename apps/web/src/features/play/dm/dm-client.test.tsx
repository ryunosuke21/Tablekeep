import "@testing-library/jest-dom/vitest";

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const party = [
  {
    sheetId: "sheet-1",
    ownerId: "user-1",
    name: "Vesper Quill",
    ancestry: "Elf",
    ownerName: "Ana",
    ownerImage: null,
    totalLevel: 3,
    classes: [{ name: "Wizard", subclass: null, level: 3 }],
  },
  {
    sheetId: "sheet-2",
    ownerId: "user-2",
    name: "Brannor Stonehand",
    ancestry: "Dwarf",
    ownerName: "Bo",
    ownerImage: null,
    totalLevel: 2,
    classes: [],
  },
];

const note = { content: "", updatedAt: null };

const activeEncounter = {
  id: "enc-1",
  name: "Ambush at the bridge",
  status: "active" as const,
  round: 2,
  activePosition: 0,
  revision: 4,
  combatants: [
    {
      id: "combatant-1",
      name: "Vesper Quill",
      position: 0,
      sheetId: "sheet-1",
      source: "sheet" as const,
      initiativeRoll: null,
      initiativeModifier: 2,
      initiativeTotal: 14,
      currentHp: 20,
      maxHp: 20,
      tempHp: 0,
      visibility: "players" as const,
      dmNotes: null,
      effects: [],
    },
  ],
};

function bootstrap(overrides: Record<string, unknown> = {}) {
  return {
    campaign,
    role: "dm",
    party,
    note,
    encounter: null,
    ...overrides,
  };
}

const bootstrapUseQuery = vi.fn();
const characterSheetUseQuery = vi.fn();
const playerBootstrapUseQuery = vi.fn();
const dmBootstrapInvalidate = vi.fn();
const realtimeTokenQuery = vi.fn();
const noteUpdateMutate = vi.fn();

const beginEncounterMutate = vi.fn();
const advanceTurnMutate = vi.fn();
const setHealthMutate = vi.fn();
const addEffectMutate = vi.fn();
const removeEffectMutate = vi.fn();
const completeEncounterMutate = vi.fn();

let bootstrapState: {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  error: { message: string } | null;
};

let sheetQueryState: {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  error: { message: string } | null;
};

function setBootstrapState(overrides: Partial<typeof bootstrapState> = {}) {
  bootstrapState = {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    ...overrides,
  };
}

function setSheetQueryState(overrides: Partial<typeof sheetQueryState> = {}) {
  sheetQueryState = {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    ...overrides,
  };
}

function mutationFactory(mutateSpy: (input: unknown) => void) {
  return (options?: { onSuccess?: (data: unknown) => void }) => ({
    mutate: (input: unknown) => {
      mutateSpy(input);
      options?.onSuccess?.({});
    },
    isPending: false,
    error: null,
  });
}

const api: unknown = {
  character: {
    sheet: {
      get: {
        useQuery: (input: unknown, options: { enabled?: boolean }) => {
          characterSheetUseQuery(input, options);
          return sheetQueryState;
        },
      },
    },
  },
  play: {
    dm: {
      bootstrap: {
        useQuery: (input: unknown) => {
          bootstrapUseQuery(input);
          return bootstrapState;
        },
      },
      beginEncounter: { useMutation: mutationFactory(beginEncounterMutate) },
      advanceTurn: { useMutation: mutationFactory(advanceTurnMutate) },
      setHealth: { useMutation: mutationFactory(setHealthMutate) },
      addEffect: { useMutation: mutationFactory(addEffectMutate) },
      removeEffect: { useMutation: mutationFactory(removeEffectMutate) },
      completeEncounter: {
        useMutation: mutationFactory(completeEncounterMutate),
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
    player: {
      bootstrap: {
        useQuery: (input: unknown) => {
          playerBootstrapUseQuery(input);
          throw new Error("DmClient must not use the player bootstrap");
        },
      },
    },
    realtime: {
      token: {
        query: realtimeTokenQuery,
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
      dm: {
        bootstrap: {
          invalidate: dmBootstrapInvalidate,
        },
      },
    },
  }),
};

vi.mock("@/trpc/react", () => ({ api }));

vi.mock("@/env/client", () => ({
  env: { NEXT_PUBLIC_PARTYKIT_HOST: "party.example.test" },
}));

const navState = vi.hoisted(() => ({
  params: new URLSearchParams(),
  listeners: new Set<() => void>(),
}));

function applyNavUrl(url: string) {
  const query = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
  navState.params = new URLSearchParams(query);
  for (const listener of navState.listeners) listener();
}

vi.mock("next/navigation", async () => {
  const { useEffect, useReducer } = await import("react");
  return {
    usePathname: () => "/play/campaign-1",
    useSearchParams: () => {
      const [, force] = useReducer((count: number) => count + 1, 0);
      useEffect(() => {
        navState.listeners.add(force);
        return () => {
          navState.listeners.delete(force);
        };
      }, []);
      return navState.params;
    },
    useRouter: () => ({
      push: applyNavUrl,
      replace: applyNavUrl,
      back: () => {},
      forward: () => {},
      refresh: () => {},
      prefetch: () => {},
    }),
  };
});

vi.mock("@/components/characters/character-sheet", () => ({
  CharacterSheet: ({
    initialSheet,
  }: {
    initialSheet: { charName: string };
  }) => <div data-testid="character-sheet">{initialSheet.charName}</div>,
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

const { DmClient } = await import("./dm-client");

describe("DmClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navState.params = new URLSearchParams();
    partyKitState.options.length = 0;
    partyKitState.listeners.clear();
    setBootstrapState();
    setSheetQueryState();
    realtimeTokenQuery.mockResolvedValue({
      token: "signed-token",
      expiresAt: new Date(),
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("shows a loading state without redirecting", () => {
    setBootstrapState({ isPending: true });
    render(<DmClient campaignId={campaignId} />);

    expect(screen.getByText(/loading the table/i)).toBeInTheDocument();
  });

  it("shows a query error state without redirecting", () => {
    setBootstrapState({
      isError: true,
      error: { message: "Bootstrap failed" },
    });
    render(<DmClient campaignId={campaignId} />);

    expect(
      screen.getByText(/this dm view could not be loaded/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/bootstrap failed/i)).toBeInTheDocument();
  });

  it("renders EncounterSetup when no encounter is active", () => {
    setBootstrapState({ data: bootstrap() });
    render(<DmClient campaignId={campaignId} />);

    expect(
      screen.getByRole("form", { name: "Begin encounter" }),
    ).toBeInTheDocument();
    expect(bootstrapUseQuery).toHaveBeenCalledWith({ campaignId });
  });

  it("renders ActiveEncounterPanel when an encounter is active", () => {
    setBootstrapState({
      data: bootstrap({ encounter: activeEncounter }),
    });
    render(<DmClient campaignId={campaignId} />);

    expect(screen.getByText("Ambush at the bridge")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next turn" }),
    ).toBeInTheDocument();
  });

  it("sends beginEncounter with the campaign id and invalidates the DM bootstrap", async () => {
    setBootstrapState({ data: bootstrap() });
    render(<DmClient campaignId={campaignId} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Begin encounter" }),
    );

    expect(beginEncounterMutate).toHaveBeenCalledTimes(1);
    const [input] = beginEncounterMutate.mock.calls.at(0) ?? [];
    expect(input).toMatchObject({ campaignId });
    expect(dmBootstrapInvalidate).toHaveBeenCalledWith({ campaignId });
  });

  it("sends advanceTurn with the campaign id and invalidates the DM bootstrap", async () => {
    setBootstrapState({
      data: bootstrap({ encounter: activeEncounter }),
    });
    render(<DmClient campaignId={campaignId} />);

    await userEvent.click(screen.getByRole("button", { name: "Next turn" }));

    expect(advanceTurnMutate).toHaveBeenCalledWith({
      campaignId,
      expectedRevision: 4,
      direction: "next",
    });
    expect(dmBootstrapInvalidate).toHaveBeenCalledWith({ campaignId });
  });

  it("loads a party member's sheet only after it is selected", async () => {
    setBootstrapState({ data: bootstrap() });
    render(<DmClient campaignId={campaignId} />);

    await userEvent.click(screen.getByRole("button", { name: "Party" }));

    expect(characterSheetUseQuery).toHaveBeenCalledWith(
      { campaignId, sheetId: campaignId },
      expect.objectContaining({ enabled: false }),
    );
    expect(screen.queryByTestId("character-sheet")).not.toBeInTheDocument();

    setSheetQueryState({ data: { charName: "Vesper Quill" } });
    await userEvent.click(
      screen.getByRole("button", { name: /vesper quill/i }),
    );

    expect(characterSheetUseQuery).toHaveBeenCalledWith(
      { campaignId, sheetId: "sheet-1" },
      expect.objectContaining({ enabled: true }),
    );
    expect(screen.getByTestId("character-sheet")).toHaveTextContent(
      "Vesper Quill",
    );
  });

  it("saves the DM's private note and invalidates the DM bootstrap", async () => {
    setBootstrapState({
      data: bootstrap({ note: { content: "Old note", updatedAt: null } }),
    });
    render(<DmClient campaignId={campaignId} />);

    await userEvent.click(screen.getByRole("button", { name: "Notes" }));

    const textbox = screen.getByLabelText("Private campaign note");
    await userEvent.clear(textbox);
    await userEvent.type(textbox, "Secret plot");
    await userEvent.click(screen.getByRole("button", { name: /save notes/i }));

    expect(noteUpdateMutate).toHaveBeenCalledWith({
      campaignId,
      content: "Secret plot",
    });
    expect(dmBootstrapInvalidate).toHaveBeenCalledWith({ campaignId });
  });

  it("fetches a realtime token lazily through the tRPC client", async () => {
    setBootstrapState({ data: bootstrap() });
    render(<DmClient campaignId={campaignId} />);

    expect(realtimeTokenQuery).not.toHaveBeenCalled();

    const provider = partyKitState.options.at(-1);
    expect(provider).toBeDefined();
    await expect(provider?.getToken()).resolves.toBe("signed-token");
    expect(realtimeTokenQuery).toHaveBeenCalledWith({ campaignId });
    expect(provider?.host).toBe("party.example.test");
    expect(provider?.room).toBe(campaignId);
  });

  it("invalidates the DM bootstrap on a matching encounter.changed message", () => {
    setBootstrapState({ data: bootstrap() });
    render(<DmClient campaignId={campaignId} />);

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

    expect(dmBootstrapInvalidate).toHaveBeenCalledWith({ campaignId });
  });

  it("ignores unrelated and malformed realtime messages", () => {
    setBootstrapState({ data: bootstrap() });
    render(<DmClient campaignId={campaignId} />);

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

    expect(dmBootstrapInvalidate).not.toHaveBeenCalled();
  });

  it("never uses player-only procedures while navigating every section", async () => {
    setSheetQueryState({ data: { charName: "Vesper Quill" } });
    setBootstrapState({
      data: bootstrap({ encounter: activeEncounter }),
    });
    render(<DmClient campaignId={campaignId} />);

    await userEvent.click(screen.getByRole("button", { name: "Party" }));
    await userEvent.click(
      screen.getByRole("button", { name: /vesper quill/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Notes" }));
    await userEvent.click(screen.getByRole("button", { name: "Table" }));

    expect(playerBootstrapUseQuery).not.toHaveBeenCalled();
  });
});
