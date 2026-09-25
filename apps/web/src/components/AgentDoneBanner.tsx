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
    <div className="banner-done quiet-pill">
      <div className="row" style={{ gap: "0.75rem", flex: 1 }}>
        <div className="banner-done__icon" aria-hidden="true">
          ✓
        </div>
        <div>
          <div className="banner-done__title">Elaborazione Completata</div>
          <div className="banner-done__sub">
            {errorMessage
              ? `Errore: ${errorMessage}`
              : resultText
                ? "Risultato pronto · Mente serena"
                : "Sessione terminata"}
          </div>
        </div>
      </div>
      <div className="row">
        <button type="button" className="btn secondary" onClick={onReturn}>
          Torna all&apos;agente
        </button>
        {onPauseTalk ? (
          <button type="button" className="btn secondary" onClick={onPauseTalk}>
            Pausa chat
          </button>
        ) : null}
      </div>
    </div>
  );
}
