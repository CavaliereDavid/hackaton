import type { ReactNode } from "react";
import "./DeadTimeTransition.css";

type Person = {
  id: string;
  displayName: string;
  status: string;
};

type Props = {
  open: boolean;
  softDismissed: boolean;
  isThinking: boolean;
  completionSignal: string;
  people: Person[];
  onSoftDismiss: () => void;
  onReturn: () => void;
  onSelectPerson: (person: Person) => void;
  talkSlot?: ReactNode;
};

export function DeadTimeTransition({
  open,
  softDismissed,
  isThinking,
  completionSignal,
  people,
  onSoftDismiss,
  onReturn,
  onSelectPerson,
  talkSlot,
}: Props) {
  if (!open || softDismissed) return null;

  return (
    <div className="deadtime" role="dialog" aria-label="Dead time">
      <div className="deadtime__glow" />
      <div className="deadtime__panel">
        <p className="deadtime__eyebrow">Dead time</p>
        <h2 className="deadtime__title">
          {isThinking ? "Agent is thinking…" : "Agent finished"}
        </h2>
        <p className="deadtime__copy">
          {isThinking
            ? "Use this wait to reconnect with your inner circle."
            : "Your result is ready whenever you want to return."}
        </p>

        <div className="deadtime__status" data-state={isThinking ? "thinking" : completionSignal}>
          {isThinking ? "Waiting on agent" : `Signal: ${completionSignal}`}
        </div>

        {talkSlot ?? (
          <div className="deadtime__circle">
            <h3>Inner circle</h3>
            {people.length === 0 ? (
              <p className="deadtime__empty">No one here yet — add people in Inner Circle settings.</p>
            ) : (
              <ul>
                {people.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="btn secondary" onClick={() => onSelectPerson(p)}>
                      Talk with {p.displayName}
                    </button>
                    <span className="muted">{p.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="row">
          {isThinking ? (
            <button type="button" className="btn secondary" onClick={onSoftDismiss}>
              Hide for now
            </button>
          ) : (
            <button type="button" className="btn" onClick={onReturn}>
              Return to agent
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
