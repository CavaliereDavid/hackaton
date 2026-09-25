import type { AgentSession } from "@hackaton/shared";
import { getDb, newId, nowIso } from "./client.js";

type Row = {
  id: string;
  user_id: string;
  prompt: string;
  state: AgentSession["state"];
  result_text: string | null;
  error_message: string | null;
  thinking_started_at: string | null;
  thinking_stopped_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: Row): AgentSession {
  return {
    id: row.id,
    userId: row.user_id,
    prompt: row.prompt,
    state: row.state,
    resultText: row.result_text,
    errorMessage: row.error_message,
    thinkingStartedAt: row.thinking_started_at,
    thinkingStoppedAt: row.thinking_stopped_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createAgentSession(userId: string, prompt: string): AgentSession {
  const db = getDb();
  const id = newId();
  const ts = nowIso();
  db.prepare(
    `INSERT INTO agent_sessions
      (id, user_id, prompt, state, result_text, error_message, thinking_started_at, thinking_stopped_at, created_at, updated_at)
     VALUES (?, ?, ?, 'idle', NULL, NULL, NULL, NULL, ?, ?)`,
  ).run(id, userId, prompt, ts, ts);
  return getAgentSession(id)!;
}

export function getAgentSession(id: string): AgentSession | null {
  const row = getDb().prepare("SELECT * FROM agent_sessions WHERE id = ?").get(id) as Row | undefined;
  return row ? mapRow(row) : null;
}

export function countThinkingForUser(userId: string): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) as c FROM agent_sessions WHERE user_id = ? AND state = 'thinking'")
    .get(userId) as { c: number };
  return row.c;
}

/** Cancel orphaned thinking rows (e.g. after server restart / lost SSE). */
export function cancelAllThinkingSessions(): number {
  const ts = nowIso();
  const result = getDb()
    .prepare(
      `UPDATE agent_sessions
       SET state = 'cancelled', thinking_stopped_at = ?, updated_at = ?
       WHERE state = 'thinking'`,
    )
    .run(ts, ts);
  return Number(result.changes ?? 0);
}

export function updateAgentSession(session: AgentSession): AgentSession {
  const db = getDb();
  db.prepare(
    `UPDATE agent_sessions SET
      state = ?, result_text = ?, error_message = ?,
      thinking_started_at = ?, thinking_stopped_at = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    session.state,
    session.resultText ?? null,
    session.errorMessage ?? null,
    session.thinkingStartedAt ?? null,
    session.thinkingStoppedAt ?? null,
    session.updatedAt,
    session.id,
  );
  return getAgentSession(session.id)!;
}
