import { Router } from "express";
import { ThinkingStopRequestSchema } from "@hackaton/shared";
import { z } from "zod";
import { getSeedUserId } from "../db/seed.js";
import * as agentWait from "../services/agentWait.js";
import { addSseClient, emitSessionSnapshot, startHeartbeat } from "../realtime/agentEvents.js";

export const agentRouter = Router();

agentRouter.post("/agent/sessions", (req, res) => {
  const parsed = z.object({ prompt: z.string().min(1).max(8000) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const session = agentWait.createSession(getSeedUserId(), parsed.data.prompt);
  res.status(201).json(session);
});

agentRouter.get("/agent/sessions/:sessionId", (req, res) => {
  const session = agentWait.getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(session);
});

agentRouter.post("/agent/sessions/:sessionId/thinking/start", (req, res) => {
  try {
    const session = agentWait.startThinking(req.params.sessionId);
    res.json(session);
  } catch (err) {
    const e = err as { status?: number; message: string };
    res.status(e.status ?? 500).json({ error: e.message });
  }
});

agentRouter.post("/agent/sessions/:sessionId/thinking/stop", (req, res) => {
  const parsed = ThinkingStopRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const session = agentWait.stopThinking(req.params.sessionId, parsed.data);
    res.json(session);
  } catch (err) {
    const e = err as { status?: number; message: string };
    res.status(e.status ?? 500).json({ error: e.message });
  }
});

agentRouter.get("/agent/sessions/:sessionId/events", (req, res) => {
  const session = agentWait.getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  addSseClient(req.params.sessionId, res);
  emitSessionSnapshot(session);
  const stopHb = startHeartbeat(req.params.sessionId);
  req.on("close", () => stopHb());
  res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: new Date().toISOString() })}\n\n`);
});
