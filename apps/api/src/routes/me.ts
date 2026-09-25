import { Router } from "express";
import { ensureSeedUser } from "../db/seed.js";

export const meRouter = Router();

meRouter.get("/me", (_req, res) => {
  res.json(ensureSeedUser());
});
