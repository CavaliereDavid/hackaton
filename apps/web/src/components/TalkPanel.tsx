import { useState } from "react";
import type { TalkMessage } from "../hooks/useTalk";

type Props = {
  personName: string;
  messages: TalkMessage[];
  onSend: (body: string) => void;
  onClose: () => void;
  onMeet?: () => void;
};

export function TalkPanel({ personName, messages, onSend, onClose, onMeet }: Props) {
  const [text, setText] = useState("");
  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <p className="sanctuary__eyebrow" style={{ margin: 0 }}>
            Tempo morto
          </p>
          <h3
            style={{
              margin: "0.2rem 0 0",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            Con {personName}
          </h3>
        </div>
        <div className="row">
          {onMeet ? (
            <button type="button" className="btn secondary" onClick={onMeet}>
              Avvia meet
            </button>
          ) : null}
          <button type="button" className="btn secondary" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
      <div className="panel" style={{ maxHeight: 240, overflow: "auto" }}>
        {messages.length === 0 ? (
          <p className="muted">Di&apos; qualcosa mentre l&apos;agente pensa…</p>
        ) : null}
        {messages.map((m) => (
          <p key={m.id} style={{ margin: "0.4rem 0", fontSize: "0.9rem" }}>
            <strong style={{ color: m.sender === "user" ? "var(--candle-soft)" : "#e7e5e4" }}>
              {m.sender === "user" ? "Tu" : m.sender === "system" ? "Sistema" : personName}:
            </strong>{" "}
            {m.body}
          </p>
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onSend(text.trim());
          setText("");
        }}
      >
        <input
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Un pensiero veloce…"
          aria-label="Messaggio"
          autoFocus
        />
        <button type="submit" className="btn">
          Invia
        </button>
      </form>
    </div>
  );
}
