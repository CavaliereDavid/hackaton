import { useEffect, useState } from "react";
import { AgentDoneBanner } from "../components/AgentDoneBanner";
import { DeadTimeTransition } from "../components/DeadTimeTransition";
import { MeetPanel } from "../components/MeetPanel";
import { TalkPanel } from "../components/TalkPanel";
import { useAgentWait } from "../hooks/useAgentWait";
import { useMeet } from "../hooks/useMeet";
import { useTalk } from "../hooks/useTalk";
import { api } from "../lib/api";
import {
  onThinkingStarted,
  resetDeadTimeForSession,
  setDeadTimeState,
} from "../state/deadTimeStore";

type Person = { id: string; displayName: string; status: string };

export function AgentPage() {
  const [prompt, setPrompt] = useState("Summarize my afternoon plan");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const wait = useAgentWait(sessionId);
  const talk = useTalk();
  const meet = useMeet();

  useEffect(() => {
    api<{ people: Person[] }>("/v1/inner-circle")
      .then((r) => setPeople(r.people))
      .catch(() => setPeople([]));
  }, [wait.isOpen]);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const session = await api<{ id: string }>("/v1/agent/sessions", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    resetDeadTimeForSession(session.id, prompt);
    setSessionId(session.id);
    return session.id;
  }

  async function createAndListen() {
    setActionError(null);
    setActivePerson(null);
    meet.clear();
    const session = await api<{ id: string }>("/v1/agent/sessions", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    resetDeadTimeForSession(session.id, prompt);
    setSessionId(session.id);
  }

  async function startThinking() {
    setActionError(null);
    try {
      const id = await ensureSession();
      // Let React attach EventSource before the start event is emitted.
      await new Promise((r) => setTimeout(r, 50));
      await api(`/v1/agent/sessions/${id}/thinking/start`, { method: "POST" });
      // Optimistic: don't depend on SSE timing for the overlay to open.
      onThinkingStarted();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to start thinking");
    }
  }

  async function stopThinkingReady() {
    if (!sessionId) return;
    setActionError(null);
    try {
      await api(`/v1/agent/sessions/${sessionId}/thinking/stop`, {
        method: "POST",
        body: JSON.stringify({
          outcome: "ready",
          resultText: `Here's a focused take on: "${prompt}"`,
        }),
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to stop thinking");
    }
  }

  async function selectPerson(person: Person) {
    setActivePerson(person);
    meet.clear();
    await talk.start(person.id, sessionId);
  }

  async function startMeet() {
    if (!activePerson) return;
    setActionError(null);
    try {
      await meet.start({
        personId: activePerson.id,
        talkSessionId: talk.talkSessionId,
        agentSessionId: sessionId,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to start meet");
    }
  }

  const showBanner =
    !wait.isThinking &&
    wait.completionSignal !== "none" &&
    (wait.softDismissed || Boolean(activePerson) || wait.isOpen);

  return (
    <div className="stack">
      <header>
        <h1 className="brand">Dead Time</h1>
        <p>Ask the agent, then spend the wait with your inner circle.</p>
      </header>

      <AgentDoneBanner
        visible={showBanner && !wait.isOpen}
        resultText={wait.resultText}
        errorMessage={wait.errorMessage}
        onReturn={() => setDeadTimeState({ isOpen: false, softDismissed: false })}
        onPauseTalk={activePerson ? () => void talk.pause() : undefined}
      />

      <section className="panel stack">
        <label>
          Prompt
          <textarea className="field" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </label>
        <div className="row">
          <button type="button" className="btn" onClick={() => void createAndListen()}>
            New session
          </button>
          <button type="button" className="btn" onClick={() => void startThinking()}>
            Start thinking
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={!wait.isThinking}
            onClick={() => void stopThinkingReady()}
          >
            Stop (ready)
          </button>
        </div>
        {sessionId ? <p className="muted">Session {sessionId.slice(0, 8)}…</p> : null}
        {actionError ? <p style={{ color: "#b42318", margin: 0 }}>{actionError}</p> : null}
        {wait.resultText && !wait.isThinking ? (
          <div className="panel">
            <strong>Agent result</strong>
            <p>{wait.resultText}</p>
          </div>
        ) : null}
      </section>

      <DeadTimeTransition
        open={wait.isOpen}
        softDismissed={wait.softDismissed}
        isThinking={wait.isThinking}
        completionSignal={wait.completionSignal}
        people={people}
        onSoftDismiss={() => setDeadTimeState({ softDismissed: true, isOpen: false })}
        onReturn={() => setDeadTimeState({ isOpen: false, softDismissed: false })}
        onSelectPerson={(p) => void selectPerson(p)}
        talkSlot={
          activePerson ? (
            <div className="stack">
              <AgentDoneBanner
                visible={!wait.isThinking && wait.completionSignal !== "none"}
                resultText={wait.resultText}
                errorMessage={wait.errorMessage}
                onReturn={() => setDeadTimeState({ isOpen: false, softDismissed: false })}
                onPauseTalk={() => void talk.pause()}
              />
              {meet.isOpen && meet.meet ? (
                <MeetPanel
                  personName={activePerson.displayName}
                  meet={meet.meet}
                  localStream={meet.localStream}
                  mediaError={meet.mediaError}
                  onEnd={() => void meet.end().then(() => meet.clear())}
                  onDismiss={() => void meet.dismiss().then(() => meet.clear())}
                />
              ) : (
                <TalkPanel
                  personName={activePerson.displayName}
                  messages={talk.messages}
                  onSend={talk.send}
                  onClose={() => {
                    void talk.close();
                    meet.clear();
                    setActivePerson(null);
                  }}
                  onMeet={() => void startMeet()}
                />
              )}
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
