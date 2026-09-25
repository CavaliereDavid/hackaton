import type { AgentSession } from "@hackaton/shared";
import { config } from "../config.js";
import {
  cancelAllThinkingSessions,
  countThinkingForUser,
  createAgentSession,
  getAgentSession,
  updateAgentSession,
} from "../db/agentSessions.js";
import { nowIso } from "../db/client.js";
import { emitAgentEvent } from "../realtime/agentEvents.js";

export class ConflictError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
  }
}

const autoTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearAutoTimer(sessionId: string) {
  const t = autoTimers.get(sessionId);
  if (t) {
    clearTimeout(t);
    autoTimers.delete(sessionId);
  }
}

/** On boot: clear orphaned thinking so demo starts aren't blocked by 409s. */
export function resetOrphanThinking(): number {
  for (const id of autoTimers.keys()) clearAutoTimer(id);
  return cancelAllThinkingSessions();
}

export function createSession(userId: string, prompt: string): AgentSession {
  return createAgentSession(userId, prompt);
}

export function getSession(id: string): AgentSession | null {
  return getAgentSession(id);
}

export function startThinking(sessionId: string): AgentSession {
  const session = getAgentSession(sessionId);
  if (!session) throw Object.assign(new Error("Not found"), { status: 404 });
  if (session.state !== "idle") {
    throw new ConflictError(`Cannot start thinking from state ${session.state}`);
  }
  if (countThinkingForUser(session.userId) > 0) {
    throw new ConflictError("Another session is already thinking");
  }
  const startedAt = nowIso();
  const updated = updateAgentSession({
    ...session,
    state: "thinking",
    thinkingStartedAt: startedAt,
    updatedAt: startedAt,
  });
  emitAgentEvent(sessionId, "thinking_started", {
    sessionId,
    startedAt,
  });

  clearAutoTimer(sessionId);
  if (config.thinkingAutoMs > 0) {
    autoTimers.set(
      sessionId,
      setTimeout(() => {
        autoTimers.delete(sessionId);
        try {
          stopThinking(sessionId, {
            outcome: "ready",
            resultText: `Here's a focused take on: "${updated.prompt}"`,
          });
        } catch {
          // Session may already have been stopped manually.
        }
      }, config.thinkingAutoMs),
    );
  }

  return updated;
}

export function stopThinking(
  sessionId: string,
  input: { outcome: "ready" | "error" | "cancelled"; resultText?: string; errorMessage?: string },
): AgentSession {
  clearAutoTimer(sessionId);
  const session = getAgentSession(sessionId);
  if (!session) throw Object.assign(new Error("Not found"), { status: 404 });
  if (session.state !== "thinking") {
    throw new ConflictError(`Cannot stop thinking from state ${session.state}`);
  }
  if (input.outcome === "ready" && !input.resultText) {
    throw Object.assign(new Error("resultText required when outcome=ready"), { status: 400 });
  }
  const stoppedAt = nowIso();
  const updated = updateAgentSession({
    ...session,
    state: input.outcome,
    resultText: input.outcome === "ready" ? input.resultText ?? null : session.resultText ?? null,
    errorMessage: input.outcome === "error" ? input.errorMessage ?? "Agent error" : null,
    thinkingStoppedAt: stoppedAt,
    updatedAt: stoppedAt,
  });
  emitAgentEvent(sessionId, "thinking_stopped", {
    sessionId,
    stoppedAt,
    outcome: input.outcome,
  });
  if (input.outcome === "ready") {
    emitAgentEvent(sessionId, "result_ready", {
      sessionId,
      resultText: updated.resultText,
    });
  } else if (input.outcome === "error") {
    emitAgentEvent(sessionId, "wait_error", {
      sessionId,
      errorMessage: updated.errorMessage,
    });
  }
  return updated;
}
