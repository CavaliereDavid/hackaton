import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

export type MeetSession = {
  id: string;
  userId: string;
  personId: string;
  talkSessionId?: string | null;
  agentSessionId?: string | null;
  state: "offered" | "connecting" | "live" | "ended" | "dismissed";
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function useMeet() {
  const [meet, setMeet] = useState<MeetSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
  }, []);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refresh = useCallback(async (id: string) => {
    const next = await api<MeetSession>(`/v1/meet/sessions/${id}`);
    setMeet(next);
    return next;
  }, []);

  const acquireMedia = useCallback(async () => {
    setMediaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      // Try audio-only fallback
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        streamRef.current = audioOnly;
        setLocalStream(audioOnly);
        setMediaError("Camera unavailable — audio only.");
        return audioOnly;
      } catch {
        const message =
          err instanceof Error && err.name === "NotAllowedError"
            ? "Camera/mic permission denied. You can dismiss the meet and keep waiting."
            : "Could not access camera or microphone.";
        setMediaError(message);
        return null;
      }
    }
  }, []);

  const start = useCallback(
    async (input: { personId: string; talkSessionId?: string | null; agentSessionId?: string | null }) => {
      setBusy(true);
      setMediaError(null);
      stopPoll();
      stopMedia();
      try {
        const session = await api<MeetSession>("/v1/meet/sessions", {
          method: "POST",
          body: JSON.stringify({
            personId: input.personId,
            talkSessionId: input.talkSessionId ?? undefined,
            agentSessionId: input.agentSessionId ?? undefined,
          }),
        });
        setMeet(session);
        await acquireMedia();

        // Prefer advancing to live once local media path completes (or denied).
        if (session.state === "connecting" || session.state === "offered") {
          try {
            const live = await api<MeetSession>(`/v1/meet/sessions/${session.id}`, {
              method: "PATCH",
              body: JSON.stringify({ state: "live" }),
            });
            setMeet(live);
          } catch {
            // Server may still auto-advance; poll briefly.
            pollRef.current = setInterval(() => {
              void refresh(session.id).then((m) => {
                if (m.state === "live" || m.state === "ended" || m.state === "dismissed") {
                  stopPoll();
                }
              });
            }, 200);
          }
        }
        return session;
      } finally {
        setBusy(false);
      }
    },
    [acquireMedia, refresh, stopMedia, stopPoll],
  );

  const end = useCallback(async () => {
    if (!meet) return;
    stopPoll();
    const updated = await api<MeetSession>(`/v1/meet/sessions/${meet.id}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "ended" }),
    });
    setMeet(updated);
    stopMedia();
  }, [meet, stopMedia, stopPoll]);

  const dismiss = useCallback(async () => {
    if (!meet) return;
    stopPoll();
    const updated = await api<MeetSession>(`/v1/meet/sessions/${meet.id}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "dismissed" }),
    });
    setMeet(updated);
    stopMedia();
  }, [meet, stopMedia, stopPoll]);

  const clear = useCallback(() => {
    stopPoll();
    stopMedia();
    setMeet(null);
    setMediaError(null);
  }, [stopMedia, stopPoll]);

  useEffect(() => () => {
    stopPoll();
    stopMedia();
  }, [stopMedia, stopPoll]);

  const isOpen =
    meet !== null && (meet.state === "offered" || meet.state === "connecting" || meet.state === "live");

  return {
    meet,
    localStream,
    mediaError,
    busy,
    isOpen,
    start,
    end,
    dismiss,
    clear,
  };
}
