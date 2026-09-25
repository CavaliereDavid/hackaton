import type { TalkMessage, TalkSession } from "@hackaton/shared";
import { getInnerCirclePerson } from "../db/innerCircle.js";
import {
  addMessage,
  createTalkSession,
  getTalkSession,
  listMessages,
  updateTalkSessionState,
} from "../db/talk.js";
import { config } from "../config.js";
import { broadcastTalk } from "../realtime/talkWs.js";

export function startTalk(input: {
  userId: string;
  personId: string;
  agentSessionId?: string;
}): TalkSession {
  const person = getInnerCirclePerson(input.personId);
  if (!person) throw Object.assign(new Error("Person not found"), { status: 404 });
  const session = createTalkSession(input);
  // Persist greeting now; broadcast when the first WS client connects (see talkWs).
  addMessage({
    talkSessionId: session.id,
    sender: "person",
    body: `Hey — saw you had a minute. What's going on?`,
  });
  return session;
}

export function pushPendingGreeting(talkSessionId: string): void {
  const messages = listMessages(talkSessionId);
  const greeting = messages.find((m) => m.sender === "person");
  if (greeting) {
    broadcastTalk(talkSessionId, { type: "talk.message", message: greeting });
  }
}

export function getTalkDetail(id: string): (TalkSession & { messages: TalkMessage[] }) | null {
  const session = getTalkSession(id);
  if (!session) return null;
  return { ...session, messages: listMessages(id) };
}

export function patchTalk(id: string, state: TalkSession["state"]): TalkSession | null {
  const updated = updateTalkSessionState(id, state);
  if (updated) {
    broadcastTalk(id, { type: "talk.state", state });
  }
  return updated;
}

export function sendTalkMessage(talkSessionId: string, body: string): TalkMessage {
  const session = getTalkSession(talkSessionId);
  if (!session) throw Object.assign(new Error("Not found"), { status: 404 });
  if (session.state === "closed") {
    throw Object.assign(new Error("Talk session closed"), { status: 409 });
  }
  const message = addMessage({ talkSessionId, sender: "user", body });
  broadcastTalk(talkSessionId, { type: "talk.message", message });

  if (config.talkAutoReply) {
    setTimeout(() => {
      const reply = addMessage({
        talkSessionId,
        sender: "person",
        body: "Hey — catching you during the wait. What's up?",
      });
      broadcastTalk(talkSessionId, { type: "talk.message", message: reply });
    }, 400);
  }
  return message;
}
