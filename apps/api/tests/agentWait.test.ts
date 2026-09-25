import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import { config } from "../src/config.js";
import { resetDbForTests } from "../src/db/client.js";
import { ensureSeedUser } from "../src/db/seed.js";
import { addInnerCirclePerson } from "../src/db/innerCircle.js";
import {
  ConflictError,
  createSession,
  getSession,
  resetOrphanThinking,
  startThinking,
  stopThinking,
} from "../src/services/agentWait.js";
import { addSseClient, emitSessionSnapshot } from "../src/realtime/agentEvents.js";
import { getTalkDetail, startTalk } from "../src/services/talk.js";

function withTestDb() {
  const testDb = path.join(path.dirname(config.dbPath), `test-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
  (config as { dbPath: string }).dbPath = testDb;
  resetDbForTests();
  return testDb;
}

function cleanupDb(testDb: string) {
  resetOrphanThinking();
  resetDbForTests();
  for (const suffix of ["", "-wal", "-shm"]) {
    const p = `${testDb}${suffix}`;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

function mockSseRes() {
  const chunks: string[] = [];
  const res = {
    write: (chunk: string) => {
      chunks.push(String(chunk));
      return true;
    },
    on: () => res,
  } as unknown as Response;
  return { res, chunks };
}

describe("agentWait state machine", () => {
  let testDb = "";

  beforeEach(() => {
    testDb = withTestDb();
  });

  afterEach(() => {
    cleanupDb(testDb);
  });

  it("rejects illegal transitions and allows idle→thinking→ready", () => {
    const userId = ensureSeedUser().id;
    const session = createSession(userId, "Hello agent");
    expect(session.state).toBe("idle");

    const thinking = startThinking(session.id);
    expect(thinking.state).toBe("thinking");
    expect(() => startThinking(session.id)).toThrow(ConflictError);

    const ready = stopThinking(session.id, { outcome: "ready", resultText: "Done" });
    expect(ready.state).toBe("ready");
    expect(ready.resultText).toBe("Done");
    expect(() => stopThinking(session.id, { outcome: "ready", resultText: "x" })).toThrow(ConflictError);
  });

  it("cancels orphan thinking so a new session can start", () => {
    const userId = ensureSeedUser().id;
    const stuck = createSession(userId, "orphan");
    startThinking(stuck.id);
    expect(getSession(stuck.id)?.state).toBe("thinking");

    const cleared = resetOrphanThinking();
    expect(cleared).toBeGreaterThanOrEqual(1);
    expect(getSession(stuck.id)?.state).toBe("cancelled");

    const next = createSession(userId, "fresh");
    expect(startThinking(next.id).state).toBe("thinking");
    stopThinking(next.id, { outcome: "cancelled" });
  });

  it("auto-ready after THINKING_AUTO_MS and cancels timer on manual stop", async () => {
    const prev = config.thinkingAutoMs;
    (config as { thinkingAutoMs: number }).thinkingAutoMs = 40;
    try {
      const userId = ensureSeedUser().id;
      const auto = createSession(userId, "auto prompt");
      startThinking(auto.id);
      await vi.waitFor(() => {
        expect(getSession(auto.id)?.state).toBe("ready");
      }, { timeout: 500 });
      expect(getSession(auto.id)?.resultText).toContain("auto prompt");

      const manual = createSession(userId, "manual");
      (config as { thinkingAutoMs: number }).thinkingAutoMs = 200;
      startThinking(manual.id);
      stopThinking(manual.id, { outcome: "ready", resultText: "manual result" });
      await new Promise((r) => setTimeout(r, 250));
      expect(getSession(manual.id)?.resultText).toBe("manual result");
      expect(getSession(manual.id)?.state).toBe("ready");
    } finally {
      (config as { thinkingAutoMs: number }).thinkingAutoMs = prev;
    }
  });
});

describe("SSE session snapshot", () => {
  let testDb = "";

  beforeEach(() => {
    testDb = withTestDb();
  });

  afterEach(() => {
    cleanupDb(testDb);
  });

  it("emits thinking_started for late subscribers while thinking", () => {
    const userId = ensureSeedUser().id;
    const session = createSession(userId, "late sse");
    const thinking = startThinking(session.id);
    const { res, chunks } = mockSseRes();
    addSseClient(session.id, res);
    emitSessionSnapshot(thinking);
    const payload = chunks.join("");
    expect(payload).toContain("event: thinking_started");
    expect(payload).toContain(session.id);
    stopThinking(session.id, { outcome: "cancelled" });
  });

  it("emits thinking_stopped + result_ready for ready sessions", () => {
    const userId = ensureSeedUser().id;
    const session = createSession(userId, "ready snap");
    startThinking(session.id);
    const ready = stopThinking(session.id, { outcome: "ready", resultText: "snap result" });
    const { res, chunks } = mockSseRes();
    addSseClient(session.id, res);
    emitSessionSnapshot(ready);
    const payload = chunks.join("");
    expect(payload).toContain("event: thinking_stopped");
    expect(payload).toContain("event: result_ready");
    expect(payload).toContain("snap result");
  });
});

describe("talk greeting", () => {
  let testDb = "";

  beforeEach(() => {
    testDb = withTestDb();
  });

  afterEach(() => {
    cleanupDb(testDb);
  });

  it("persists an opening person message on talk create", () => {
    const userId = ensureSeedUser().id;
    const person = addInnerCirclePerson(userId, { displayName: "Alex" });
    const talk = startTalk({ userId, personId: person.id });
    const detail = getTalkDetail(talk.id);
    expect(detail?.messages.length).toBeGreaterThanOrEqual(1);
    expect(detail?.messages[0]?.sender).toBe("person");
  });
});
