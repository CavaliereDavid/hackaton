import { Router } from "express";
import { z } from "zod";
import { getSeedUserId } from "../db/seed.js";
import * as meet from "../services/meet.js";

export const meetRouter = Router();

meetRouter.post("/meet/sessions", (req, res) => {
  const parsed = z
    .object({
      personId: z.string().uuid(),
      talkSessionId: z.string().uuid().optional(),
      agentSessionId: z.string().uuid().optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const session = meet.startMeet({
      userId: getSeedUserId(),
      personId: parsed.data.personId,
      talkSessionId: parsed.data.talkSessionId,
      agentSessionId: parsed.data.agentSessionId,
    });
    res.status(201).json(session);
  } catch (err) {
    const e = err as { status?: number; message: string };
    res.status(e.status ?? 500).json({ error: e.message });
  }
});

meetRouter.get("/meet/sessions/:meetSessionId", (req, res) => {
  const session = meet.getMeet(req.params.meetSessionId);
  if (!session) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(session);
});

meetRouter.patch("/meet/sessions/:meetSessionId", (req, res) => {
  const parsed = z
    .object({
      state: z.enum(["offered", "connecting", "live", "ended", "dismissed"]),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const updated = meet.patchMeet(req.params.meetSessionId, parsed.data.state);
    res.json(updated);
  } catch (err) {
    const e = err as { status?: number; message: string };
    res.status(e.status ?? 500).json({ error: e.message });
  }
});
