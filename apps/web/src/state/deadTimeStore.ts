export type CompletionSignal = "none" | "ready" | "error" | "cancelled";

export type DeadTimeState = {
  sessionId: string | null;
  isThinking: boolean;
  isOpen: boolean;
  softDismissed: boolean;
  completionSignal: CompletionSignal;
  resultText: string | null;
  errorMessage: string | null;
  prompt: string | null;
};

type Listener = () => void;

let state: DeadTimeState = {
  sessionId: null,
  isThinking: false,
  isOpen: false,
  softDismissed: false,
  completionSignal: "none",
  resultText: null,
  errorMessage: null,
  prompt: null,
};

const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function getDeadTimeState() {
  return state;
}

export function subscribeDeadTime(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDeadTimeState(patch: Partial<DeadTimeState>) {
  state = { ...state, ...patch };
  emit();
}

export function resetDeadTimeForSession(sessionId: string, prompt: string) {
  state = {
    sessionId,
    isThinking: false,
    isOpen: false,
    softDismissed: false,
    completionSignal: "none",
    resultText: null,
    errorMessage: null,
    prompt,
  };
  emit();
}

export function onThinkingStarted() {
  state = {
    ...state,
    isThinking: true,
    isOpen: true,
    softDismissed: false,
    completionSignal: "none",
  };
  emit();
}

export function onThinkingStopped(outcome: CompletionSignal, resultText?: string | null, errorMessage?: string | null) {
  state = {
    ...state,
    isThinking: false,
    isOpen: state.softDismissed ? false : true,
    completionSignal: outcome,
    resultText: resultText ?? state.resultText,
    errorMessage: errorMessage ?? null,
  };
  emit();
}
