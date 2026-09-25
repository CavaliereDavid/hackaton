import type { InnerCirclePerson } from "@hackaton/shared";
import { getDb, newId, nowIso } from "./client.js";

type Row = {
  id: string;
  owner_user_id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  status: InnerCirclePerson["status"];
  sort_order: number;
  created_at: string;
};

function mapRow(row: Row): InnerCirclePerson {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    displayName: row.display_name,
    handle: row.handle,
    avatarUrl: row.avatar_url,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function listInnerCircle(ownerUserId: string): InnerCirclePerson[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM inner_circle_people WHERE owner_user_id = ? ORDER BY sort_order ASC, created_at ASC`,
    )
    .all(ownerUserId) as Row[];
  return rows.map(mapRow);
}

export function countInnerCircle(ownerUserId: string): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) as c FROM inner_circle_people WHERE owner_user_id = ?`)
    .get(ownerUserId) as { c: number };
  return row.c;
}

export function addInnerCirclePerson(
  ownerUserId: string,
  input: { displayName: string; handle?: string; avatarUrl?: string },
): InnerCirclePerson {
  const db = getDb();
  const id = newId();
  const createdAt = nowIso();
  const sortOrder = countInnerCircle(ownerUserId);
  db.prepare(
    `INSERT INTO inner_circle_people
      (id, owner_user_id, display_name, handle, avatar_url, status, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, 'available', ?, ?)`,
  ).run(
    id,
    ownerUserId,
    input.displayName,
    input.handle ?? null,
    input.avatarUrl ?? null,
    sortOrder,
    createdAt,
  );
  return getInnerCirclePerson(id)!;
}

export function getInnerCirclePerson(id: string): InnerCirclePerson | null {
  const row = getDb().prepare(`SELECT * FROM inner_circle_people WHERE id = ?`).get(id) as Row | undefined;
  return row ? mapRow(row) : null;
}

export function removeInnerCirclePerson(id: string): boolean {
  const result = getDb().prepare(`DELETE FROM inner_circle_people WHERE id = ?`).run(id);
  return result.changes > 0;
}
