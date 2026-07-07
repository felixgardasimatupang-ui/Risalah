import { WebSocketServer, WebSocket } from "ws";

type WsMessage = {
  type: "transcript_line" | "meeting_status" | "speaker_change" | "error" | "ping" | "pong";
  meetingId?: string;
  payload?: unknown;
};

const clients = new Map<string, Set<WebSocket>>();

let wss: WebSocketServer;

export function startWebSocketServer(port = 3001) {
  if (wss) return wss;

  wss = new WebSocketServer({ port });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", "http://localhost");
    const meetingId = url.searchParams.get("meetingId");

    if (!meetingId) {
      ws.close(4000, "meetingId required");
      return;
    }

    if (!clients.has(meetingId)) clients.set(meetingId, new Set());
    clients.get(meetingId)!.add(ws);

    ws.on("message", (raw) => {
      try {
        const msg: WsMessage = JSON.parse(raw.toString());
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        ws.send(JSON.stringify({ type: "error", payload: "invalid message" }));
      }
    });

    ws.on("close", () => {
      clients.get(meetingId)?.delete(ws);
      if (clients.get(meetingId)?.size === 0) clients.delete(meetingId);
    });

    ws.on("error", () => clients.get(meetingId)?.delete(ws));
  });

  return wss;
}

export function broadcastToMeeting(meetingId: string, message: WsMessage) {
  const members = clients.get(meetingId);
  if (!members) return;
  const data = JSON.stringify(message);
  for (const ws of members) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

export function stopWebSocketServer() {
  wss?.close();
}
