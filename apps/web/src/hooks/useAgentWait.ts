import { useEffect, useSyncExternalStore } from "react";
import {
  getDeadTimeState,
  onThinkingStarted,
  onThinkingStopped,
  subscribeDeadTime,
  type CompletionSignal,
} from "../state/deadTimeStore";

export function useAgentWait(sessionId: string | null) {
  const state = useSyncExternalStore(subscribeDeadTime, getDeadTimeState, getDeadTimeState);

  useEffect(() => {
    if (!sessionId) return;
    const es = new EventSource(`/v1/agent/sessions/${sessionId}/events`);

    es.addEventListener("thinking_started", () => {
      onThinkingStarted();
    });
    es.addEventListener("thinking_stopped", (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as {
        outcome: CompletionSignal;
      };
      onThinkingStopped(data.outcome);
    });
    es.addEventListener("result_ready", (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as { resultText: string };
      onThinkingStopped("ready", data.resultText);
    });
    es.addEventListener("wait_error", (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as { errorMessage: string };
      onThinkingStopped("error", null, data.errorMessage);
    });

    return () => es.close();
  }, [sessionId]);

  return state;
}
