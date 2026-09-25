import { Router } from "express";
import { z } from "zod";
import { getSeedUserId } from "../db/seed.js";
import * as talk from "../services/talk.js";

export const talkRouter = Router();

talkRouter.post("/talk/sessions", (req, res) => {
  const parsed = z
    .object({
      personId: z.string().uuid(),
      agentSessionId: z.string().uuid().optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const session = talk.startTalk({
      userId: getSeedUserId(),
      personId: parsed.data.personId,
      agentSessionId: parsed.data.agentSessionId,
    });
    res.status(201).json(session);
  } catch (err) {
    const e = err as { status?: number; message: string };
    res.status(e.status ?? 500).json({ error: e.message });
  }
});

talkRouter.get("/talk/sessions/:talkSessionId", (req, res) => {
  const detail = talk.getTalkDetail(req.params.talkSessionId);
  if (!detail) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(detail);
});

talkRouter.patch("/talk/sessions/:talkSessionId", (req, res) => {
  const parsed = z.object({ state: z.enum(["active", "paused", "closed"]) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const updated = talk.patchTalk(req.params.talkSessionId, parsed.data.state);
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated);
});
