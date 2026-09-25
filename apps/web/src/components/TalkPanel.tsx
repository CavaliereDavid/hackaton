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
        <h3 style={{ margin: 0 }}>Talk with {personName}</h3>
        <div className="row">
          {onMeet ? (
            <button type="button" className="btn secondary" onClick={onMeet}>
              Start meet
            </button>
          ) : null}
          <button type="button" className="btn secondary" onClick={onClose}>
            Close talk
          </button>
        </div>
      </div>
      <div
        className="panel"
        style={{ maxHeight: 220, overflow: "auto", background: "rgba(255,255,255,0.7)" }}
      >
        {messages.length === 0 ? <p className="muted">Say hi while the agent thinks…</p> : null}
        {messages.map((m) => (
          <p key={m.id} style={{ margin: "0.35rem 0" }}>
            <strong>{m.sender}:</strong> {m.body}
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
          placeholder="Message…"
          aria-label="Message"
        />
        <button type="submit" className="btn">
          Send
        </button>
      </form>
    </div>
  );
}
