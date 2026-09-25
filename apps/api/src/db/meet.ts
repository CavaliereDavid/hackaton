import type { MeetSession } from "@hackaton/shared";
import { getDb, newId, nowIso } from "./client.js";

type MeetRow = {
  id: string;
  user_id: string;
  person_id: string;
  talk_session_id: string | null;
  agent_session_id: string | null;
  state: MeetSession["state"];
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

const ACTIVE_STATES = ["offered", "connecting", "live"] as const;

function mapMeet(row: MeetRow): MeetSession {
  return {
    id: row.id,
    userId: row.user_id,
    personId: row.person_id,
    talkSessionId: row.talk_session_id,
    agentSessionId: row.agent_session_id,
    state: row.state,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findActiveMeetForUser(userId: string): MeetSession | null {
  const row = getDb()
    .prepare(
      `SELECT * FROM meet_sessions
       WHERE user_id = ? AND state IN ('offered','connecting','live')
       ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as MeetRow | undefined;
  return row ? mapMeet(row) : null;
}

export function createMeetSession(input: {
  userId: string;
  personId: string;
  talkSessionId?: string | null;
  agentSessionId?: string | null;
  state?: MeetSession["state"];
}): MeetSession {
  const id = newId();
  const now = nowIso();
  const state = input.state ?? "connecting";
  const startedAt = state === "connecting" || state === "live" ? now : null;
  getDb()
    .prepare(
      `INSERT INTO meet_sessions
        (id, user_id, person_id, talk_session_id, agent_session_id, state, started_at, ended_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    )
    .run(
      id,
      input.userId,
      input.personId,
      input.talkSessionId ?? null,
      input.agentSessionId ?? null,
      state,
      startedAt,
      now,
      now,
    );
  return getMeetSession(id)!;
}

export function getMeetSession(id: string): MeetSession | null {
  const row = getDb().prepare(`SELECT * FROM meet_sessions WHERE id = ?`).get(id) as MeetRow | undefined;
  return row ? mapMeet(row) : null;
}

export function updateMeetSessionState(id: string, state: MeetSession["state"]): MeetSession | null {
  const now = nowIso();
  const current = getMeetSession(id);
  if (!current) return null;

  let startedAt = current.startedAt ?? null;
  let endedAt = current.endedAt ?? null;

  if ((state === "connecting" || state === "live") && !startedAt) {
    startedAt = now;
  }
  if (state === "ended" || state === "dismissed") {
    endedAt = now;
  }

  getDb()
    .prepare(
      `UPDATE meet_sessions
       SET state = ?, started_at = ?, ended_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(state, startedAt, endedAt, now, id);
  return getMeetSession(id);
}

export function isActiveMeetState(state: MeetSession["state"]): boolean {
  return (ACTIVE_STATES as readonly string[]).includes(state);
}
