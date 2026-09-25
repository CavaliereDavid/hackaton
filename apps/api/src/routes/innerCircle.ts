import { Router } from "express";
import { InnerCirclePersonCreateSchema } from "@hackaton/shared";
import { getSeedUserId } from "../db/seed.js";
import * as innerCircle from "../services/innerCircle.js";

export const innerCircleRouter = Router();

innerCircleRouter.get("/inner-circle", (_req, res) => {
  const people = innerCircle.listPeople(getSeedUserId());
  res.json({ people });
});

innerCircleRouter.post("/inner-circle", (req, res) => {
  const parsed = InnerCirclePersonCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const person = innerCircle.addPerson(getSeedUserId(), parsed.data);
    res.status(201).json(person);
  } catch (err) {
    const e = err as { status?: number; message: string };
    res.status(e.status ?? 500).json({ error: e.message });
  }
});

innerCircleRouter.delete("/inner-circle/:personId", (req, res) => {
  const ok = innerCircle.removePerson(req.params.personId);
  if (!ok) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});
