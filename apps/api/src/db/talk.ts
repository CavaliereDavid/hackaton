import type { TalkMessage, TalkSession } from "@hackaton/shared";
import { getDb, newId, nowIso } from "./client.js";

type SessionRow = {
  id: string;
  user_id: string;
  person_id: string;
  agent_session_id: string | null;
  state: TalkSession["state"];
  created_at: string;
  closed_at: string | null;
};

type MessageRow = {
  id: string;
  talk_session_id: string;
  sender: TalkMessage["sender"];
  body: string;
  created_at: string;
};

function mapSession(row: SessionRow): TalkSession {
  return {
    id: row.id,
    userId: row.user_id,
    personId: row.person_id,
    agentSessionId: row.agent_session_id,
    state: row.state,
    createdAt: row.created_at,
    closedAt: row.closed_at,
  };
}

function mapMessage(row: MessageRow): TalkMessage {
  return {
    id: row.id,
    talkSessionId: row.talk_session_id,
    sender: row.sender,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function createTalkSession(input: {
  userId: string;
  personId: string;
  agentSessionId?: string | null;
}): TalkSession {
  const id = newId();
  const createdAt = nowIso();
  getDb()
    .prepare(
      `INSERT INTO talk_sessions (id, user_id, person_id, agent_session_id, state, created_at, closed_at)
       VALUES (?, ?, ?, ?, 'active', ?, NULL)`,
    )
    .run(id, input.userId, input.personId, input.agentSessionId ?? null, createdAt);
  return getTalkSession(id)!;
}

export function getTalkSession(id: string): TalkSession | null {
  const row = getDb().prepare(`SELECT * FROM talk_sessions WHERE id = ?`).get(id) as SessionRow | undefined;
  return row ? mapSession(row) : null;
}

export function updateTalkSessionState(id: string, state: TalkSession["state"]): TalkSession | null {
  const closedAt = state === "closed" ? nowIso() : null;
  getDb()
    .prepare(`UPDATE talk_sessions SET state = ?, closed_at = COALESCE(?, closed_at) WHERE id = ?`)
    .run(state, closedAt, id);
  return getTalkSession(id);
}

export function listMessages(talkSessionId: string): TalkMessage[] {
  const rows = getDb()
    .prepare(`SELECT * FROM talk_messages WHERE talk_session_id = ? ORDER BY created_at ASC`)
    .all(talkSessionId) as MessageRow[];
  return rows.map(mapMessage);
}

export function addMessage(input: {
  talkSessionId: string;
  sender: TalkMessage["sender"];
  body: string;
}): TalkMessage {
  const id = newId();
  const createdAt = nowIso();
  getDb()
    .prepare(
      `INSERT INTO talk_messages (id, talk_session_id, sender, body, created_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, input.talkSessionId, input.sender, input.body, createdAt);
  return {
    id,
    talkSessionId: input.talkSessionId,
    sender: input.sender,
    body: input.body,
    createdAt,
  };
}
