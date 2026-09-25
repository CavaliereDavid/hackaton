import type { MeetSession } from "@hackaton/shared";
import { config } from "../config.js";
import { getInnerCirclePerson } from "../db/innerCircle.js";
import {
  createMeetSession,
  findActiveMeetForUser,
  getMeetSession,
  updateMeetSessionState,
} from "../db/meet.js";

export class ConflictError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class NotFoundError extends Error {
  status = 404;
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

const ALLOWED: Record<MeetSession["state"], MeetSession["state"][]> = {
  offered: ["connecting", "dismissed", "ended"],
  connecting: ["live", "ended", "dismissed"],
  live: ["ended", "dismissed"],
  ended: [],
  dismissed: [],
};

const connectTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearConnectTimer(id: string) {
  const t = connectTimers.get(id);
  if (t) {
    clearTimeout(t);
    connectTimers.delete(id);
  }
}

function scheduleSimulatedLive(id: string) {
  clearConnectTimer(id);
  const ms = config.meetSimulatedConnectMs;
  if (ms <= 0) {
    const current = getMeetSession(id);
    if (current?.state === "connecting") {
      updateMeetSessionState(id, "live");
    }
    return;
  }
  const timer = setTimeout(() => {
    connectTimers.delete(id);
    const current = getMeetSession(id);
    if (current?.state === "connecting") {
      updateMeetSessionState(id, "live");
    }
  }, ms);
  connectTimers.set(id, timer);
}

export function startMeet(input: {
  userId: string;
  personId: string;
  talkSessionId?: string;
  agentSessionId?: string;
}): MeetSession {
  const person = getInnerCirclePerson(input.personId);
  if (!person) throw new NotFoundError("Person not found");

  const active = findActiveMeetForUser(input.userId);
  if (active) {
    throw new ConflictError("Another meet is already active");
  }

  const session = createMeetSession({
    userId: input.userId,
    personId: input.personId,
    talkSessionId: input.talkSessionId,
    agentSessionId: input.agentSessionId,
    state: "connecting",
  });
  scheduleSimulatedLive(session.id);
  return getMeetSession(session.id)!;
}

export function getMeet(id: string): MeetSession | null {
  return getMeetSession(id);
}

export function patchMeet(id: string, state: MeetSession["state"]): MeetSession {
  const current = getMeetSession(id);
  if (!current) throw new NotFoundError("Meet session not found");

  if (current.state === state) {
    return current;
  }

  const allowed = ALLOWED[current.state];
  if (!allowed.includes(state)) {
    throw new ConflictError(`Cannot transition meet from ${current.state} to ${state}`);
  }

  if (state === "ended" || state === "dismissed" || state === "live") {
    clearConnectTimer(id);
  }

  const updated = updateMeetSessionState(id, state);
  if (!updated) throw new NotFoundError("Meet session not found");

  // Ending/dismissing MUST NOT mutate AgentSession.resultText — we never touch agent rows here.
  return updated;
}

/** Test helper: clear pending connect timers. */
export function clearAllMeetTimers(): void {
  for (const id of connectTimers.keys()) {
    clearConnectTimer(id);
  }
}
