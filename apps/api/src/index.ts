import http from "node:http";
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { ensureSeedUser } from "./db/seed.js";
import { attachTalkWs } from "./realtime/talkWs.js";
import { agentRouter } from "./routes/agent.js";
import { innerCircleRouter } from "./routes/innerCircle.js";
import { meRouter } from "./routes/me.js";
import { meetRouter } from "./routes/meet.js";
import { talkRouter } from "./routes/talk.js";
import { resetOrphanThinking } from "./services/agentWait.js";

ensureSeedUser();
const cleared = resetOrphanThinking();
if (cleared > 0) {
  console.log(`Cleared ${cleared} orphaned thinking session(s)`);
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/v1", meRouter);
app.use("/v1", innerCircleRouter);
app.use("/v1", agentRouter);
app.use("/v1", talkRouter);
app.use("/v1", meetRouter);

const server = http.createServer(app);
attachTalkWs(server);

server.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
