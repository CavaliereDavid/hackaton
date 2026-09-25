import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { ChatTranscript, type ChatTurn } from "../components/ChatTranscript";
import { InstagramInnerCircleSurface } from "../components/InstagramInnerCircleSurface";
import { MeetStubButton } from "../components/MeetStubButton";
import { PromptComposer } from "../components/PromptComposer";
import { TalkSheet } from "../components/TalkSheet";
import { useAgentWait } from "../hooks/useAgentWait";
import { submitPrompt } from "../hooks/usePromptSubmit";
import { useTalk } from "../hooks/useTalk";
import { api } from "../lib/api";
import { setDeadTimeState } from "../state/deadTimeStore";
import type { PersonLite } from "../components/StoriesStrip";

function useDemoMode() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

export function ChatPage() {
  const idBase = useId();
  const demo = useDemoMode();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [people, setPeople] = useState<PersonLite[]>([]);
  const [activePerson, setActivePerson] = useState<PersonLite | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const wait = useAgentWait(sessionId);
  const talk = useTalk();

  useEffect(() => {
    api<{ people: PersonLite[] }>("/v1/inner-circle")
      .then((r) => setPeople(r.people))
      .catch(() => setPeople([]));
  }, [wait.innerCircleOpen]);

  // Append assistant turn when result arrives
  useEffect(() => {
    if (!wait.resultText || wait.isThinking) return;
    setTurns((prev) => {
      if (prev.some((t) => t.role === "assistant" && t.body === wait.resultText)) return prev;
      return [
        ...prev,
        {
          id: `${idBase}-asst-${wait.sessionId ?? "x"}`,
          role: "assistant",
          body: wait.resultText!,
        },
      ];
    });
  }, [wait.resultText, wait.isThinking, wait.sessionId, idBase]);

  async function onSubmitPrompt(prompt: string) {
    setActionError(null);
    setBusy(true);
    setActivePerson(null);
    try {
      setTurns((prev) => [...prev, { id: `${idBase}-u-${Date.now()}`, role: "user", body: prompt }]);
      const result = await submitPrompt(prompt);
      if (result) setSessionId(result.sessionId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  async function stopThinkingReady() {
    if (!sessionId || !wait.prompt) return;
    setActionError(null);
    try {
      await api(`/v1/agent/sessions/${sessionId}/thinking/stop`, {
        method: "POST",
        body: JSON.stringify({
          outcome: "ready",
          resultText: `Here's a focused take on: "${wait.prompt}"`,
        }),
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to stop");
    }
  }

  async function selectPerson(person: PersonLite) {
    setActivePerson(person);
    await talk.start(person.id, sessionId);
  }

  const surfaceOpen = wait.innerCircleOpen && !wait.softDismissed;

  return (
    <div className="chat-page">
      <header className="chat-page__header">
        <h1 className="chat-brand">Dead Time</h1>
        <Link to="/inner-circle" className="chat-manage-link">
          Circle
        </Link>
      </header>

      <ChatTranscript turns={turns} thinking={wait.isThinking} />

      {actionError ? <p className="chat-error">{actionError}</p> : null}

      {!wait.isThinking && wait.completionSignal === "ready" && wait.softDismissed ? (
        <md-text-button
          type="button"
          onClick={() => setDeadTimeState({ innerCircleOpen: true, softDismissed: false, isOpen: true })}
        >
          Show inner circle
        </md-text-button>
      ) : null}

      <PromptComposer disabled={busy || wait.isThinking} onSubmitPrompt={onSubmitPrompt} />

      {demo ? (
        <div className="chat-demo-tools">
          <md-text-button type="button" disabled={!wait.isThinking} onClick={() => void stopThinkingReady()}>
            Stop (ready)
          </md-text-button>
        </div>
      ) : null}

      <InstagramInnerCircleSurface
        open={surfaceOpen}
        waitStatus={wait.waitStatus}
        people={people}
        onSelectPerson={(p) => void selectPerson(p)}
        onSoftDismiss={() => setDeadTimeState({ softDismissed: true, innerCircleOpen: false, isOpen: false })}
        onReturnToChat={() => setDeadTimeState({ innerCircleOpen: false, softDismissed: false, isOpen: false })}
        talkSlot={
          activePerson ? (
            <div className="talk-stack">
              {!wait.isThinking && wait.completionSignal === "ready" ? (
                <p className="talk-ready-banner">Agent is ready — result is in the chat.</p>
              ) : null}
              <TalkSheet
                personName={activePerson.displayName}
                messages={talk.messages}
                onSend={talk.send}
                onClose={() => {
                  void talk.close();
                  setActivePerson(null);
                }}
              />
              {demo ? (
                <MeetStubButton personId={activePerson.id} talkSessionId={talk.talkSessionId} />
              ) : null}
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
