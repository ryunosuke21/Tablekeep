"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";

const OPEN_READY_STATE = 1;

export type PartyKitConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

type UsePartyKitConnectionOptions = {
  getToken: () => Promise<string>;
  host: string;
  room: string;
};

type ActiveConnection = {
  closeTimer: ReturnType<typeof setTimeout> | null;
  consumers: number;
  key: string;
  socket: PartySocket;
  tokenProvider: { current: () => Promise<string> };
};

let activeConnection: ActiveConnection | null = null;

function acquireConnection(
  host: string,
  room: string,
  getToken: () => Promise<string>,
) {
  const key = `${host}/${room}`;

  if (activeConnection?.key === key) {
    if (activeConnection.closeTimer) {
      clearTimeout(activeConnection.closeTimer);
      activeConnection.closeTimer = null;
    }

    activeConnection.consumers += 1;
    activeConnection.tokenProvider.current = getToken;
    return activeConnection.socket;
  }

  if (activeConnection) {
    if (activeConnection.closeTimer) {
      clearTimeout(activeConnection.closeTimer);
    }
    activeConnection.socket.close(1000, "PartyKit connection replaced");
  }

  const tokenProvider = { current: getToken };
  const socket = new PartySocket({
    host,
    query: async () => ({ token: await tokenProvider.current() }),
    room,
  });
  activeConnection = {
    closeTimer: null,
    consumers: 1,
    key,
    socket,
    tokenProvider,
  };

  return socket;
}

function releaseConnection(socket: PartySocket) {
  if (activeConnection?.socket !== socket) {
    return;
  }

  activeConnection.consumers -= 1;

  if (activeConnection.consumers > 0) {
    return;
  }

  activeConnection.closeTimer = setTimeout(() => {
    if (
      activeConnection?.socket === socket &&
      activeConnection.consumers === 0
    ) {
      socket.close(1000, "PartyKit connection released");
      activeConnection = null;
    }
  }, 0);
}

export function usePartyKitConnection({
  getToken,
  host,
  room,
}: UsePartyKitConnectionOptions) {
  const socketRef = useRef<PartySocket | null>(null);
  const [status, setStatus] = useState<PartyKitConnectionStatus>("connecting");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (socketRef.current) {
      return;
    }

    const socket = acquireConnection(host, room, getToken);
    socketRef.current = socket;

    const handleOpen = () => {
      setConnectionId(socket.id);
      setStatus("connected");
    };
    const handleMessage = (event: MessageEvent) => {
      setLastMessage(String(event.data));
    };
    const handleClose = () => {
      setStatus("disconnected");
    };
    const handleError = () => {
      setStatus("error");
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("error", handleError);

    if (socket.readyState === OPEN_READY_STATE) {
      handleOpen();
    }

    return () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("close", handleClose);
      socket.removeEventListener("error", handleError);

      if (socketRef.current === socket) {
        socketRef.current = null;
        releaseConnection(socket);
      }
    };
  }, [getToken, host, room]);

  const send = useCallback((message: string) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== OPEN_READY_STATE) {
      return false;
    }

    socket.send(message);
    return true;
  }, []);

  return {
    connectionId,
    lastMessage,
    send,
    status,
  };
}
