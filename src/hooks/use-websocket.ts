"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type WsMessage = {
  type: "transcript_line" | "meeting_status" | "speaker_change" | "error" | "ping" | "pong";
  meetingId?: string;
  payload?: unknown;
};

type ConnectionStatus = "connecting" | "connected" | "disconnected";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

export function useWebSocket(meetingId?: string) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const connect = useCallback(() => {
    if (!meetingId || wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const ws = new WebSocket(`${WS_URL}?meetingId=${meetingId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      pingRef.current = setInterval(() => {
        ws.send(JSON.stringify({ type: "ping" }));
      }, 30000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as WsMessage;
      setLastMessage(msg);
    };

    ws.onclose = () => {
      setStatus("disconnected");
      clearInterval(pingRef.current);
    };

    ws.onerror = () => {
      setStatus("disconnected");
      clearInterval(pingRef.current);
    };
  }, [meetingId]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    clearInterval(pingRef.current);
    setStatus("disconnected");
  }, []);

  const send = useCallback((message: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { status, lastMessage, connect, disconnect, send };
}
