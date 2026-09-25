import { useEffect, useRef } from "react";
import type { MeetSession } from "../hooks/useMeet";

type Props = {
  personName: string;
  meet: MeetSession;
  localStream: MediaStream | null;
  mediaError: string | null;
  onEnd: () => void;
  onDismiss: () => void;
};

export function MeetPanel({
  personName,
  meet,
  localStream,
  mediaError,
  onEnd,
  onDismiss,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = localStream;
    if (localStream) {
      void el.play().catch(() => {
        /* autoplay may be blocked; user gesture already happened via Start meet */
      });
    }
  }, [localStream]);

  const remoteLive = meet.state === "live";
  const hasVideo = Boolean(localStream?.getVideoTracks().some((t) => t.readyState === "live"));

  return (
    <div className="meet-panel stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Meet with {personName}</h3>
        <span className="meet-status" data-state={meet.state}>
          {meet.state === "connecting" ? "Connecting…" : meet.state === "live" ? "Live" : meet.state}
        </span>
      </div>

      <div className="meet-grid">
        <div className="meet-tile meet-tile-local">
          <span className="meet-tile-label">You</span>
          {hasVideo ? (
            <video ref={videoRef} className="meet-video" muted playsInline autoPlay />
          ) : localStream ? (
            <>
              <video ref={videoRef} className="meet-video meet-video-hidden" muted playsInline autoPlay />
              <div className="meet-placeholder">Audio only</div>
            </>
          ) : (
            <div className="meet-placeholder">No local media</div>
          )}
        </div>
        <div className={`meet-tile meet-tile-remote${remoteLive ? " is-live" : ""}`}>
          <span className="meet-tile-label">{personName}</span>
          <div className="meet-placeholder">
            {remoteLive ? "Connected" : "Waiting to connect…"}
          </div>
        </div>
      </div>

      {mediaError ? <p className="meet-media-error">{mediaError}</p> : null}

      <div className="row">
        <button type="button" className="btn" onClick={onEnd}>
          End meet
        </button>
        <button type="button" className="btn secondary" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
