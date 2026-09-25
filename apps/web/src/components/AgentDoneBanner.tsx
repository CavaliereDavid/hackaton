type Props = {
  visible: boolean;
  resultText: string | null;
  errorMessage: string | null;
  onReturn: () => void;
  onPauseTalk?: () => void;
};

export function AgentDoneBanner({ visible, resultText, errorMessage, onReturn, onPauseTalk }: Props) {
  if (!visible) return null;
  return (
    <div className="panel" style={{ borderColor: "rgba(180,83,9,0.35)", marginBottom: "1rem" }}>
      <strong>Agent is done</strong>
      <p style={{ margin: "0.35rem 0 0.75rem" }}>
        {errorMessage ? `Error: ${errorMessage}` : resultText ? "Result is ready." : "Session finished."}
      </p>
      <div className="row">
        <button type="button" className="btn" onClick={onReturn}>
          Return to agent
        </button>
        {onPauseTalk ? (
          <button type="button" className="btn secondary" onClick={onPauseTalk}>
            Pause talk
          </button>
        ) : null}
      </div>
    </div>
  );
}
