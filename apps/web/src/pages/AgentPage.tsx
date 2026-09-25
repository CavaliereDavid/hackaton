import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AgentDoneBanner } from "../components/AgentDoneBanner";
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

const COLORS = ["#f59e0b", "#fb7185", "#38bdf8", "#fde047", "#f472b6", "#a78bfa", "#34d399", "#60a5fa"];

const COPY = [
  {
    role: "Partner",
    hint: "Ore 21:30 · In attesa di rientro a casa",
    title: "Un respiro d'affetto prima di tornare al codice.",
    subtitle:
      "Un bacio veloce o un pensiero spontaneo. Non servono discorsi lunghi per farsi sentire vicini.",
  },
  {
    role: "Famiglia",
    hint: "Momento ideale per rassicurare · Bastano dieci secondi",
    title: "Rassicura chi si preoccupa sempre per te.",
    subtitle: "Basta fargli sentire il tono sereno della tua voce per togliere qualsiasi pensiero.",
  },
  {
    role: "Presenza",
    hint: "Prima che vada a dormire · Un pensiero breve",
    title: "Due parole sincere tra un traguardo e l'altro.",
    subtitle: "Uno scambio essenziale di presenza. Fagli sapere che stai costruendo qualcosa di bello.",
  },
  {
    role: "Cerchio",
    hint: "Micro-ricarica di complicità · Ora è il momento",
    title: "Spezza la serietà con chi ti conosce da sempre.",
    subtitle: "Un micro-messaggio per ricordare che siete una squadra, anche durante l'attesa.",
  },
];

function personMeta(index: number) {
  return {
    color: COLORS[index % COLORS.length],
    ...COPY[index % COPY.length],
  };
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {muted ? (
        <>
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M15 9.5V12a3 3 0 0 1-.1.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M5 12a7 7 0 0 0 11.5 5.3M19 12a7 7 0 0 0-.2-1.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 19v3M8 22h8M4 4l16 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
        </>
      ) : (
        <>
          <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5 12a7 7 0 0 0 14 0M12 19v3M8 22h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      {muted ? (
        <path d="m16 9 5 5M21 9l-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      ) : (
        <>
          <path d="M15.5 8.5a4 4 0 0 1 0 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M18 6a7 7 0 0 1 0 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5l3 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function AgentPage() {
  const [prompt, setPrompt] = useState("Summarize my afternoon plan");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [holding, setHolding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const holdStarted = useRef(false);
  const wait = useAgentWait(sessionId);
  const talk = useTalk();
  const meet = useMeet();

  useEffect(() => {
    api<{ people: Person[] }>("/v1/inner-circle")
      .then((r) => setPeople(r.people))
      .catch(() => setPeople([]));
  }, [wait.isOpen, activePerson]);

  useEffect(() => {
    if (!wait.isThinking) {
      setElapsed(0);
      return;
    }
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsed((Date.now() - started) / 1000);
    }, 100);
    return () => window.clearInterval(id);
  }, [wait.isThinking]);

  const selected = people[selectedIndex] ?? people[0] ?? null;
  const meta = personMeta(selectedIndex);

  const agentLabel = useMemo(() => {
    if (wait.isThinking) return `Agente in calcolo (${elapsed.toFixed(1)}s)`;
    if (wait.completionSignal === "ready") return "Elaborazione completata";
    if (wait.completionSignal === "error") return "Agente in errore";
    return "Agente in attesa";
  }, [wait.isThinking, wait.completionSignal, elapsed]);

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

  async function startThinking() {
    setActionError(null);
    setActivePerson(null);
    meet.clear();
    try {
      const id = await ensureSession();
      await new Promise((r) => setTimeout(r, 50));
      await api(`/v1/agent/sessions/${id}/thinking/start`, { method: "POST" });
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

  async function selectPerson(person: Person, index: number) {
    setSelectedIndex(index);
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

  async function openTalkWithSelected() {
    if (!selected) return;
    await selectPerson(selected, selectedIndex);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!wait.isThinking) void startThinking();
        return;
      }

      if (e.key >= "1" && e.key <= "8") {
        const idx = Number(e.key) - 1;
        if (people[idx]) {
          e.preventDefault();
          void selectPerson(people[idx], idx);
        }
        return;
      }

      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setHolding(true);
        if (!holdStarted.current) {
          holdStarted.current = true;
          void openTalkWithSelected();
        }
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        setHolding(false);
        holdStarted.current = false;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable handlers for demo shortcuts
  }, [people, selected, selectedIndex, wait.isThinking, sessionId, prompt]);

  const showBanner =
    !wait.isThinking &&
    wait.completionSignal !== "none" &&
    (wait.softDismissed || Boolean(activePerson) || wait.isOpen);

  const pulseColor = `${meta.color}24`;

  return (
    <div className="sanctuary">
      <div className="sanctuary__glow" />
      <div
        className="sanctuary__pulse"
        data-thinking={wait.isThinking ? "true" : "false"}
        style={{ backgroundColor: pulseColor }}
      />

      <header className="sanctuary__header">
        <div className="sanctuary__brand">
          <h1 className="brand">Himalaya</h1>
          <span aria-hidden="true">·</span>
          <span className="sanctuary__tag">Santuario Umano</span>
          <span className="sanctuary__version hide-sm">v2.6.10</span>
        </div>

        <div className="sanctuary__agent quiet-pill">
          <span
            className="sanctuary__dot"
            data-live={wait.isThinking ? "true" : undefined}
            data-ready={!wait.isThinking && wait.completionSignal === "ready" ? "true" : undefined}
          />
          <span className="sanctuary__agent-label">{agentLabel}</span>
          {wait.isThinking ? (
            <button type="button" className="sanctuary__avvia" onClick={() => void stopThinkingReady()}>
              Stop
            </button>
          ) : (
            <button
              type="button"
              className="sanctuary__avvia"
              onClick={() => void startThinking()}
            >
              <span>Avvia</span>
              <kbd className="sanctuary__kbd">⌘↵</kbd>
            </button>
          )}
        </div>

        <div className="sanctuary__header-actions">
          <button
            type="button"
            className="sanctuary__icon-btn quiet-pill"
            data-on={micOn ? "true" : undefined}
            aria-label={micOn ? "Microfono attivo" : "Microfono disattivato"}
            onClick={() => setMicOn((v) => !v)}
          >
            <MicIcon muted={!micOn} />
          </button>
          <button
            type="button"
            className="sanctuary__icon-btn quiet-pill"
            data-on={audioOn ? "true" : undefined}
            aria-label={audioOn ? "Audio attivo" : "Audio disattivato"}
            onClick={() => setAudioOn((v) => !v)}
          >
            <SpeakerIcon muted={!audioOn} />
          </button>
        </div>
      </header>

      <main className="sanctuary__main">
        <div className="sanctuary__connect">
          <div className="sanctuary__connect-row">
            <span className="sanctuary__eyebrow">In connessione con</span>
            <button
              type="button"
              className="sanctuary__recipient quiet-pill"
              onClick={() => {
                if (selected) void selectPerson(selected, selectedIndex);
              }}
            >
              <span className="sanctuary__recipient-dot" style={{ background: meta.color }} />
              <span className="sanctuary__recipient-name">{selected?.displayName ?? "—"}</span>
              <span className="sanctuary__recipient-role">{selected ? meta.role : "Cerchio"}</span>
              <span aria-hidden="true" style={{ fontSize: "0.55rem", color: "#78716c" }}>
                ▾
              </span>
            </button>
            {wait.isThinking || wait.isOpen ? (
              <span className="sanctuary__badge">
                <ClockIcon />
                Finestra consigliata
              </span>
            ) : null}
          </div>
          <p className="sanctuary__hint">
            {selected ? meta.hint : "Aggiungi qualcuno al cerchio per iniziare"}
          </p>
        </div>

        <div className="sanctuary__chips">
          {people.length === 0 ? (
            <Link className="chip" to="/inner-circle">
              <span className="chip__dot" style={{ background: "#f59e0b" }} />
              Aggiungi al cerchio
            </Link>
          ) : (
            people.slice(0, 8).map((p, i) => {
              const c = personMeta(i);
              return (
                <button
                  key={p.id}
                  type="button"
                  className="chip"
                  data-active={i === selectedIndex ? "true" : undefined}
                  onClick={() => void selectPerson(p, i)}
                  title={p.status}
                >
                  <span className="chip__dot" style={{ background: c.color }} />
                  <span>{p.displayName}</span>
                  <span className="chip__n">{i + 1}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="sanctuary__quote">
          <h2 className="sanctuary__title">“{meta.title}”</h2>
          <p className="sanctuary__subtitle">{meta.subtitle}</p>
        </div>

        <div className="stack" style={{ alignItems: "center", gap: "0.85rem" }}>
          <button
            type="button"
            className="sanctuary__hold quiet-pill"
            data-pressed={holding ? "true" : undefined}
            onMouseDown={() => {
              setHolding(true);
              void openTalkWithSelected();
            }}
            onMouseUp={() => setHolding(false)}
            onMouseLeave={() => setHolding(false)}
            onTouchStart={() => {
              setHolding(true);
              void openTalkWithSelected();
            }}
            onTouchEnd={() => setHolding(false)}
          >
            <span className="sanctuary__hold-dot" />
            <span className="sanctuary__hold-label">Tieni premuto Spazio</span>
            <kbd className="sanctuary__hold-kbd">Spazio</kbd>
          </button>
          <p className="sanctuary__echo">
            “Tieni premuta la barra Spazio per catturare un momento di calore...”
          </p>
          {actionError ? <p style={{ color: "var(--danger)", margin: 0 }}>{actionError}</p> : null}
        </div>
      </main>

      {showBanner && !activePerson ? (
        <div className="sanctuary__drawer">
          <AgentDoneBanner
            visible
            resultText={wait.resultText}
            errorMessage={wait.errorMessage}
            onReturn={() => setDeadTimeState({ isOpen: false, softDismissed: false })}
          />
        </div>
      ) : null}

      {activePerson ? (
        <div className="sanctuary__overlay" role="dialog" aria-label={`Connessione con ${activePerson.displayName}`}>
          <div className="sanctuary__sheet stack">
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
                  setActionError(null);
                  void talk.close();
                  meet.clear();
                  setActivePerson(null);
                }}
                onMeet={() => void startMeet()}
              />
            )}
            {!wait.isThinking && wait.completionSignal !== "none" ? (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setDeadTimeState({ isOpen: false, softDismissed: false });
                  setActivePerson(null);
                  void talk.close();
                  meet.clear();
                }}
              >
                Torna all&apos;agente
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {promptOpen ? (
        <div className="sanctuary__prompt-box">
          <div className="sanctuary__prompt-card stack">
            <h2>Chiedi all&apos;agente</h2>
            <p>Il prompt viaggia mentre tu resti nel santuario con il tuo cerchio.</p>
            <textarea
              className="field"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              aria-label="Prompt"
            />
            <div className="row">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setPromptOpen(false);
                  void startThinking();
                }}
              >
                Avvia calcolo
              </button>
              <button type="button" className="btn secondary" onClick={() => setPromptOpen(false)}>
                Chiudi
              </button>
            </div>
            {sessionId ? (
              <p className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                Session {sessionId.slice(0, 8)}…
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <footer className="sanctuary__footer">
        <span className="sanctuary__footer-left">
          Team Himalaya · Padova 2026 · <Link to="/inner-circle">Cerchio</Link>
        </span>
        <button type="button" className="sanctuary__ask" onClick={() => setPromptOpen(true)}>
          <span className="sanctuary__ask-mark" aria-hidden="true" />
          Chiedi a Grok
        </button>
        <span className="sanctuary__footer-right hide-sm">
          Tasti 1-8 per cambiare · Spazio per Parlare · ⌘↵ Avvia Agente
        </span>
      </footer>
    </div>
  );
}
