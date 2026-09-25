import { Link } from "react-router-dom";
import type { WaitStatus } from "../state/deadTimeStore";
import { InnerCircleFeed } from "./InnerCircleFeed";
import { StoriesStrip, type PersonLite } from "./StoriesStrip";

type Props = {
  open: boolean;
  waitStatus: WaitStatus;
  people: PersonLite[];
  talkSlot?: React.ReactNode;
  onSelectPerson: (person: PersonLite) => void;
  onSoftDismiss: () => void;
  onReturnToChat: () => void;
};

function statusLabel(status: WaitStatus) {
  switch (status) {
    case "thinking":
      return "Agent is thinking";
    case "ready":
      return "Agent is ready";
    case "error":
      return "Agent error";
    case "cancelled":
      return "Wait cancelled";
    default:
      return "Waiting";
  }
}

export function InstagramInnerCircleSurface({
  open,
  waitStatus,
  people,
  talkSlot,
  onSelectPerson,
  onSoftDismiss,
  onReturnToChat,
}: Props) {
  if (!open) return null;

  return (
    <div className="ig-surface" role="dialog" aria-label="Inner circle">
      <header className="ig-surface__header">
        <div>
          <h2 className="ig-surface__title">Inner circle</h2>
          <md-assist-chip label={statusLabel(waitStatus)} />
        </div>
        <div className="ig-surface__actions">
          {waitStatus !== "thinking" ? (
            <md-text-button type="button" onClick={onReturnToChat}>
              Back to chat
            </md-text-button>
          ) : null}
          <md-text-button type="button" onClick={onSoftDismiss}>
            Hide
          </md-text-button>
        </div>
      </header>

      {people.length === 0 ? (
        <div className="ig-empty">
          <p>No one in your circle yet.</p>
          <Link to="/inner-circle" className="ig-empty__link">
            Add people
          </Link>
        </div>
      ) : (
        <>
          <StoriesStrip people={people} onSelect={onSelectPerson} />
          <InnerCircleFeed people={people} onSelect={onSelectPerson} />
        </>
      )}

      {talkSlot ? <div className="ig-surface__talk">{talkSlot}</div> : null}
    </div>
  );
}
