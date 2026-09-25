import { useCallback, useEffect, useRef, useState } from "react";
import { api, wsUrl } from "../lib/api";

export type TalkMessage = {
  id: string;
  talkSessionId: string;
  sender: "user" | "person" | "system";
  body: string;
  createdAt: string;
};

export function useTalk() {
  const [talkSessionId, setTalkSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TalkMessage[]>([]);
  const [state, setState] = useState<"active" | "paused" | "closed" | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const start = useCallback(async (personId: string, agentSessionId?: string | null) => {
    disconnect();
    const session = await api<{ id: string; state: "active" | "paused" | "closed" }>("/v1/talk/sessions", {
      method: "POST",
      body: JSON.stringify({ personId, agentSessionId: agentSessionId ?? undefined }),
    });
    setTalkSessionId(session.id);
    setState(session.state);
    const detail = await api<{ messages: TalkMessage[] }>(`/v1/talk/sessions/${session.id}`);
    setMessages(detail.messages ?? []);
    const ws = new WebSocket(wsUrl(`/v1/talk/ws?talkSessionId=${session.id}`));
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data) as
        | { type: "talk.message"; message: TalkMessage }
        | { type: "talk.state"; state: "active" | "paused" | "closed" };
      if (data.type === "talk.message") {
        setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      } else if (data.type === "talk.state") {
        setState(data.state);
      }
    };
    wsRef.current = ws;
    return session.id;
  }, [disconnect]);

  const send = useCallback((body: string) => {
    wsRef.current?.send(JSON.stringify({ type: "talk.send", body }));
  }, []);

  const pause = useCallback(async () => {
    if (!talkSessionId) return;
    await api(`/v1/talk/sessions/${talkSessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "paused" }),
    });
    setState("paused");
  }, [talkSessionId]);

  const close = useCallback(async () => {
    if (!talkSessionId) return;
    await api(`/v1/talk/sessions/${talkSessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "closed" }),
    });
    setState("closed");
    disconnect();
  }, [disconnect, talkSessionId]);

  useEffect(() => () => disconnect(), [disconnect]);

  return { talkSessionId, messages, state, start, send, pause, close };
}
