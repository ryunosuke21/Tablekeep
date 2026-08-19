import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePartyKitConnection } from "./use-partykit-connection";

type MockSocket = EventTarget & {
  close: ReturnType<typeof vi.fn>;
  id: string;
  readyState: number;
  send: ReturnType<typeof vi.fn>;
};

const socketState = vi.hoisted(() => ({
  instances: [] as MockSocket[],
  options: [] as Array<{
    host: string;
    query: () => Promise<{ token: string }>;
    room: string;
  }>,
}));

vi.mock("partysocket", () => ({
  default: class MockPartySocket extends EventTarget {
    close = vi.fn();
    id = "test-connection-id";
    readyState = 0;
    send = vi.fn();

    constructor(options: (typeof socketState.options)[number]) {
      super();
      socketState.instances.push(this);
      socketState.options.push(options);
    }
  },
}));

describe("usePartyKitConnection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    socketState.instances.length = 0;
    socketState.options.length = 0;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("keeps one socket through rerenders and closes it on unmount", () => {
    const getToken = vi.fn().mockResolvedValue("token-1");
    const { rerender, result, unmount } = renderHook(() =>
      usePartyKitConnection({
        getToken,
        host: "localhost:1999",
        room: "test-room",
      }),
    );

    expect(socketState.instances).toHaveLength(1);
    rerender();
    expect(socketState.instances).toHaveLength(1);

    const socket = socketState.instances[0];
    expect(socket).toBeDefined();

    act(() => {
      if (!socket) {
        return;
      }

      socket.readyState = 1;
      socket.dispatchEvent(new Event("open"));
    });

    expect(result.current.status).toBe("connected");
    expect(result.current.connectionId).toBe("test-connection-id");
    expect(result.current.send("ping 1")).toBe(true);
    expect(socket?.send).toHaveBeenCalledWith("ping 1");

    unmount();
    expect(socket?.close).not.toHaveBeenCalled();
    vi.runOnlyPendingTimers();
    expect(socket?.close).toHaveBeenCalledWith(
      1000,
      "PartyKit connection released",
    );
  });

  it("shares an established connection between hook consumers", () => {
    const getToken = vi.fn().mockResolvedValue("token-1");
    const first = renderHook(() =>
      usePartyKitConnection({
        getToken,
        host: "localhost:1999",
        room: "test-room",
      }),
    );
    const socket = socketState.instances[0];

    act(() => {
      if (!socket) {
        return;
      }

      socket.readyState = 1;
      socket.dispatchEvent(new Event("open"));
    });

    const second = renderHook(() =>
      usePartyKitConnection({
        getToken,
        host: "localhost:1999",
        room: "test-room",
      }),
    );

    expect(socketState.instances).toHaveLength(1);
    expect(second.result.current.status).toBe("connected");

    first.unmount();
    vi.runOnlyPendingTimers();
    expect(socket?.close).not.toHaveBeenCalled();

    second.unmount();
    vi.runOnlyPendingTimers();
    expect(socket?.close).toHaveBeenCalledOnce();
  });

  it("fetches a token lazily for each connection attempt", async () => {
    const getToken = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("token-1")
      .mockResolvedValueOnce("token-2");
    const hook = renderHook(() =>
      usePartyKitConnection({
        getToken,
        host: "localhost:1999",
        room: "test-room",
      }),
    );

    const query = socketState.options[0]?.query;
    expect(query).toBeDefined();
    await expect(query?.()).resolves.toEqual({ token: "token-1" });
    await expect(query?.()).resolves.toEqual({ token: "token-2" });
    expect(getToken).toHaveBeenCalledTimes(2);

    hook.unmount();
  });

  it("uses the latest token provider without replacing the room socket", async () => {
    const firstProvider = vi.fn().mockResolvedValue("token-1");
    const secondProvider = vi.fn().mockResolvedValue("token-2");
    const hook = renderHook(
      ({ getToken }: { getToken: () => Promise<string> }) =>
        usePartyKitConnection({
          getToken,
          host: "localhost:1999",
          room: "test-room",
        }),
      { initialProps: { getToken: firstProvider } },
    );
    const query = socketState.options[0]?.query;

    hook.rerender({ getToken: secondProvider });

    expect(socketState.instances).toHaveLength(1);
    await expect(query?.()).resolves.toEqual({ token: "token-2" });
    expect(firstProvider).not.toHaveBeenCalled();
    expect(secondProvider).toHaveBeenCalledOnce();

    hook.unmount();
  });
});
