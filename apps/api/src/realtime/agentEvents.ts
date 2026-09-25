import type { AgentSession } from "@hackaton/shared";
import type { Response } from "express";

type SseClient = { res: Response };

const clients = new Map<string, Set<SseClient>>();

export function addSseClient(sessionId: string, res: Response) {
  if (!clients.has(sessionId)) clients.set(sessionId, new Set());
  clients.get(sessionId)!.add({ res });
  res.on("close", () => {
    const set = clients.get(sessionId);
    if (!set) return;
    for (const c of [...set]) {
      if (c.res === res) set.delete(c);
    }
  });
}

export function emitAgentEvent(sessionId: string, event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const set = clients.get(sessionId);
  if (!set) return;
  for (const client of set) {
    client.res.write(payload);
  }
}

/** Replay current session state so late EventSource subscribers still open dead time / see results. */
export function emitSessionSnapshot(session: AgentSession) {
  if (session.state === "thinking") {
    emitAgentEvent(session.id, "thinking_started", {
      sessionId: session.id,
      startedAt: session.thinkingStartedAt ?? new Date().toISOString(),
    });
    return;
  }
  if (session.state === "ready" || session.state === "error" || session.state === "cancelled") {
    emitAgentEvent(session.id, "thinking_stopped", {
      sessionId: session.id,
      stoppedAt: session.thinkingStoppedAt ?? new Date().toISOString(),
      outcome: session.state,
    });
    if (session.state === "ready") {
      emitAgentEvent(session.id, "result_ready", {
        sessionId: session.id,
        resultText: session.resultText,
      });
    } else if (session.state === "error") {
      emitAgentEvent(session.id, "wait_error", {
        sessionId: session.id,
        errorMessage: session.errorMessage ?? "Agent error",
      });
    }
  }
}

export function startHeartbeat(sessionId: string) {
  const timer = setInterval(() => {
    emitAgentEvent(sessionId, "heartbeat", { ts: new Date().toISOString() });
  }, 15000);
  return () => clearInterval(timer);
}
