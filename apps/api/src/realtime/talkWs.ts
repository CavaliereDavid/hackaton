import type { Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { getTalkSession } from "../db/talk.js";
import { pushPendingGreeting, sendTalkMessage } from "../services/talk.js";

const sockets = new Map<string, Set<WebSocket>>();

export function broadcastTalk(talkSessionId: string, payload: unknown) {
  const set = sockets.get(talkSessionId);
  if (!set) return;
  const raw = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) ws.send(raw);
  }
}

export function attachTalkWs(server: Server) {
  const wss = new WebSocketServer({ server, path: "/v1/talk/ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const talkSessionId = url.searchParams.get("talkSessionId");
    if (!talkSessionId || !getTalkSession(talkSessionId)) {
      ws.send(JSON.stringify({ type: "error", code: "not_found", message: "Invalid talkSessionId" }));
      ws.close();
      return;
    }
    if (!sockets.has(talkSessionId)) sockets.set(talkSessionId, new Set());
    sockets.get(talkSessionId)!.add(ws);
    // Deliver the opening person message after the socket is live.
    pushPendingGreeting(talkSessionId);

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(String(data)) as { type?: string; body?: string };
        if (msg.type === "talk.send" && typeof msg.body === "string" && msg.body.trim()) {
          sendTalkMessage(talkSessionId, msg.body.trim());
        } else {
          ws.send(JSON.stringify({ type: "error", code: "validation", message: "Invalid payload" }));
        }
      } catch {
        ws.send(JSON.stringify({ type: "error", code: "validation", message: "Invalid JSON" }));
      }
    });

    ws.on("close", () => {
      sockets.get(talkSessionId)?.delete(ws);
    });
  });
}
