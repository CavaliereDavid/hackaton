import { api } from "../lib/api";
import { openInnerCircleOptimistic, resetDeadTimeForSession } from "../state/deadTimeStore";

export type PromptSubmitResult = {
  sessionId: string;
  prompt: string;
};

/**
 * Non-empty prompt → create session, start thinking, optimistic inner-circle open.
 * Empty prompt → no-op (no network).
 */
export async function submitPrompt(prompt: string): Promise<PromptSubmitResult | null> {
  const trimmed = prompt.trim();
  if (!trimmed) return null;

  const session = await api<{ id: string }>("/v1/agent/sessions", {
    method: "POST",
    body: JSON.stringify({ prompt: trimmed }),
  });
  resetDeadTimeForSession(session.id, trimmed);
  // Allow EventSource to attach before start event.
  await new Promise((r) => setTimeout(r, 50));
  await api(`/v1/agent/sessions/${session.id}/thinking/start`, { method: "POST" });
  openInnerCircleOptimistic();
  return { sessionId: session.id, prompt: trimmed };
}
