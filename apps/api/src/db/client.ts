import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "../config.js";

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  db = new DatabaseSync(config.dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

export function resetDbForTests(): void {
  if (!db) return;
  try {
    db.close();
  } catch {
    // already closed
  }
  db = null;
}

function migrate(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS demo_users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 80),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inner_circle_people (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL REFERENCES demo_users(id),
      display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 80),
      handle TEXT,
      avatar_url TEXT,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','away','unreachable')),
      sort_order INTEGER NOT NULL DEFAULT 0 CHECK(sort_order >= 0),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES demo_users(id),
      prompt TEXT NOT NULL,
      state TEXT NOT NULL CHECK(state IN ('idle','thinking','ready','error','cancelled')),
      result_text TEXT,
      error_message TEXT,
      thinking_started_at TEXT,
      thinking_stopped_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS talk_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES demo_users(id),
      person_id TEXT NOT NULL REFERENCES inner_circle_people(id),
      agent_session_id TEXT REFERENCES agent_sessions(id),
      state TEXT NOT NULL CHECK(state IN ('active','paused','closed')),
      created_at TEXT NOT NULL,
      closed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS talk_messages (
      id TEXT PRIMARY KEY,
      talk_session_id TEXT NOT NULL REFERENCES talk_sessions(id),
      sender TEXT NOT NULL CHECK(sender IN ('user','person','system')),
      body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 4000),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meet_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES demo_users(id),
      person_id TEXT NOT NULL REFERENCES inner_circle_people(id),
      talk_session_id TEXT REFERENCES talk_sessions(id),
      agent_session_id TEXT REFERENCES agent_sessions(id),
      state TEXT NOT NULL CHECK(state IN ('offered','connecting','live','ended','dismissed')),
      started_at TEXT,
      ended_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  // Retire stub table from earlier MVP slice
  database.exec(`DROP TABLE IF EXISTS meet_stubs;`);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}
