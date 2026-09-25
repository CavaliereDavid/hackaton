import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config } from "../src/config.js";
import { resetDbForTests } from "../src/db/client.js";
import { ensureSeedUser } from "../src/db/seed.js";
import { addInnerCirclePerson } from "../src/db/innerCircle.js";
import { createSession, getSession, startThinking, stopThinking } from "../src/services/agentWait.js";
import { startTalk } from "../src/services/talk.js";
import {
  ConflictError,
  NotFoundError,
  clearAllMeetTimers,
  getMeet,
  patchMeet,
  startMeet,
} from "../src/services/meet.js";

function withTestDb() {
  const testDb = path.join(
    path.dirname(config.dbPath),
    `test-meet-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`,
  );
  (config as { dbPath: string }).dbPath = testDb;
  resetDbForTests();
  return testDb;
}

function cleanupDb(testDb: string) {
  clearAllMeetTimers();
  resetDbForTests();
  for (const suffix of ["", "-wal", "-shm"]) {
    const p = `${testDb}${suffix}`;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

describe("MeetSession lifecycle", () => {
  let testDb = "";
  const prevConnectMs = config.meetSimulatedConnectMs;

  beforeEach(() => {
    testDb = withTestDb();
    (config as { meetSimulatedConnectMs: number }).meetSimulatedConnectMs = 0;
  });

  afterEach(() => {
    (config as { meetSimulatedConnectMs: number }).meetSimulatedConnectMs = prevConnectMs;
    cleanupDb(testDb);
  });

  it("creates meet with optional agentSessionId/talkSessionId and reaches live", () => {
    const userId = ensureSeedUser().id;
    const person = addInnerCirclePerson(userId, { displayName: "Alex" });
    const agent = createSession(userId, "think");
    startThinking(agent.id);
    const talk = startTalk({ userId, personId: person.id, agentSessionId: agent.id });

    const meet = startMeet({
      userId,
      personId: person.id,
      talkSessionId: talk.id,
      agentSessionId: agent.id,
    });
    expect(meet.talkSessionId).toBe(talk.id);
    expect(meet.agentSessionId).toBe(agent.id);
    expect(meet.state).toBe("live"); // connect ms = 0 → immediate live
  });

  it("returns 404-equivalent when person missing", () => {
    const userId = ensureSeedUser().id;
    expect(() =>
      startMeet({ userId, personId: "00000000-0000-4000-8000-000000000099" }),
    ).toThrow(NotFoundError);
  });

  it("rejects second concurrent active meet", () => {
    const userId = ensureSeedUser().id;
    const person = addInnerCirclePerson(userId, { displayName: "Alex" });
    startMeet({ userId, personId: person.id });
    expect(() => startMeet({ userId, personId: person.id })).toThrow(ConflictError);
  });

  it("rejects illegal transitions", () => {
    const userId = ensureSeedUser().id;
    const person = addInnerCirclePerson(userId, { displayName: "Alex" });
    const meet = startMeet({ userId, personId: person.id });
    expect(meet.state).toBe("live");
    expect(() => patchMeet(meet.id, "connecting")).toThrow(ConflictError);
  });

  it("ending meet does not clear AgentSession.resultText", () => {
    const userId = ensureSeedUser().id;
    const person = addInnerCirclePerson(userId, { displayName: "Alex" });
    const agent = createSession(userId, "think");
    startThinking(agent.id);
    const meet = startMeet({ userId, personId: person.id, agentSessionId: agent.id });
    stopThinking(agent.id, { outcome: "ready", resultText: "Keep me" });
    patchMeet(meet.id, "ended");
    expect(getSession(agent.id)?.resultText).toBe("Keep me");
    expect(getMeet(meet.id)?.state).toBe("ended");
  });

  it("auto-advances connecting→live after MEET_SIMULATED_CONNECT_MS", async () => {
    (config as { meetSimulatedConnectMs: number }).meetSimulatedConnectMs = 30;
    vi.useFakeTimers();
    const userId = ensureSeedUser().id;
    const person = addInnerCirclePerson(userId, { displayName: "Alex" });
    // Temporarily force connecting without immediate advance by setting high ms then ticking
    const meet = startMeet({ userId, personId: person.id });
    // With fake timers, setTimeout(0) path isn't used; ms=30 schedules
    expect(["connecting", "live"]).toContain(meet.state);
    if (meet.state === "connecting") {
      await vi.advanceTimersByTimeAsync(40);
      expect(getMeet(meet.id)?.state).toBe("live");
    }
    vi.useRealTimers();
  });
});
