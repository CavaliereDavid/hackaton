export type ChatTurn = {
  id: string;
  role: "user" | "assistant" | "system";
  body: string;
};

type Props = {
  turns: ChatTurn[];
  thinking?: boolean;
};

export function ChatTranscript({ turns, thinking }: Props) {
  return (
    <div className="chat-transcript" role="log" aria-live="polite">
      {turns.length === 0 && !thinking ? (
        <p className="chat-empty">Ask anything. Your inner circle opens while the agent thinks.</p>
      ) : null}
      {turns.map((t) => (
        <div key={t.id} className={`chat-turn chat-turn--${t.role}`}>
          <span className="chat-turn__role">{t.role === "user" ? "You" : "Assistant"}</span>
          <p className="chat-turn__body">{t.body}</p>
        </div>
      ))}
      {thinking ? (
        <div className="chat-turn chat-turn--assistant chat-turn--thinking">
          <span className="chat-turn__role">Assistant</span>
          <div className="chat-thinking">
            <md-circular-progress indeterminate aria-label="Thinking" />
            <span>Thinking…</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
