import type { DemoUser } from "@hackaton/shared";
import { getDb, newId, nowIso } from "./client.js";

const SEED_ID = "00000000-0000-4000-8000-000000000001";

export function ensureSeedUser(): DemoUser {
  const db = getDb();
  const existing = db.prepare("SELECT id, display_name, created_at FROM demo_users WHERE id = ?").get(SEED_ID) as
    | { id: string; display_name: string; created_at: string }
    | undefined;
  if (existing) {
    return {
      id: existing.id,
      displayName: existing.display_name,
      createdAt: existing.created_at,
    };
  }
  const createdAt = nowIso();
  db.prepare("INSERT INTO demo_users (id, display_name, created_at) VALUES (?, ?, ?)").run(
    SEED_ID,
    "Demo User",
    createdAt,
  );
  return { id: SEED_ID, displayName: "Demo User", createdAt };
}

export function getSeedUserId(): string {
  return ensureSeedUser().id;
}

// keep newId available for other modules via re-export if needed
export { newId };
