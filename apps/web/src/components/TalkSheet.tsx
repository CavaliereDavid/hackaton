import { useState, type FormEvent } from "react";
import type { TalkMessage } from "../hooks/useTalk";

type Props = {
  personName: string;
  messages: TalkMessage[];
  onSend: (body: string) => void;
  onClose: () => void;
};

export function TalkSheet({ personName, messages, onSend, onClose }: Props) {
  const [text, setText] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <div className="talk-sheet">
      <div className="talk-sheet__bar">
        <strong>{personName}</strong>
        <md-text-button type="button" onClick={onClose}>
          Close
        </md-text-button>
      </div>
      <div className="talk-sheet__messages">
        {messages.length === 0 ? <p className="muted">Say hi while the agent thinks…</p> : null}
        {messages.map((m) => (
          <p key={m.id} className={`talk-msg talk-msg--${m.sender}`}>
            <span className="talk-msg__who">{m.sender}</span>
            {m.body}
          </p>
        ))}
      </div>
      <form className="talk-sheet__composer" onSubmit={onSubmit}>
        <input
          className="talk-sheet__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          aria-label="Message"
        />
        <md-filled-button type="submit" disabled={!text.trim()}>
          Send
        </md-filled-button>
      </form>
    </div>
  );
}
