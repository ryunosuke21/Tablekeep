import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPlayRouteAccessMock } = vi.hoisted(() => ({
  getPlayRouteAccessMock: vi.fn(),
}));

vi.mock("@/server/play/get-play-route-access", () => ({
  getPlayRouteAccess: getPlayRouteAccessMock,
}));

vi.mock("@/features/play/dm/dm-client", () => ({
  DmClient: ({ campaignId }: { campaignId: string }) => (
    <div data-testid="dm-client">DM {campaignId}</div>
  ),
}));

vi.mock("@/features/play/player/player-client", () => ({
  PlayerClient: ({ campaignId }: { campaignId: string }) => (
    <div data-testid="player-client">Player {campaignId}</div>
  ),
}));

vi.mock("./play-access-state", () => ({
  PlayAccessState: ({
    state,
    campaignId,
  }: {
    state: { kind: string };
    campaignId: string;
  }) => <div data-testid="access-state">{`${state.kind} ${campaignId}`}</div>,
}));

const { default: PlayPage } = await import("./page");

const campaignId = "00000000-0000-4000-8000-000000000001";

async function renderPage() {
  render(await PlayPage({ params: Promise.resolve({ campaignId }) }));
}

describe("play page", () => {
  beforeEach(() => {
    getPlayRouteAccessMock.mockReset();
  });

  it("renders only PlayerClient for a player", async () => {
    getPlayRouteAccessMock.mockResolvedValue({ ok: true, role: "player" });

    await renderPage();

    expect(screen.getByTestId("player-client")).toHaveTextContent(campaignId);
    expect(screen.queryByTestId("dm-client")).not.toBeInTheDocument();
    expect(getPlayRouteAccessMock).toHaveBeenCalledWith(campaignId);
  });

  it("renders only DmClient for a DM", async () => {
    getPlayRouteAccessMock.mockResolvedValue({ ok: true, role: "dm" });

    await renderPage();

    expect(screen.getByTestId("dm-client")).toHaveTextContent(campaignId);
    expect(screen.queryByTestId("player-client")).not.toBeInTheDocument();
  });

  it("renders the inline access state without either client", async () => {
    getPlayRouteAccessMock.mockResolvedValue({
      ok: false,
      state: { kind: "unavailable" },
    });

    await renderPage();

    expect(screen.getByTestId("access-state")).toHaveTextContent(
      `unavailable ${campaignId}`,
    );
    expect(screen.queryByTestId("player-client")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dm-client")).not.toBeInTheDocument();
  });
});
