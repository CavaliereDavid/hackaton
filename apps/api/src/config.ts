import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 3001),
  dbPath: process.env.DB_PATH ?? path.join(__dirname, "..", "data", "deadtime.sqlite"),
  talkAutoReply: process.env.TALK_AUTO_REPLY !== "0",
  /** Demo mock: auto-finish thinking after N ms (0 disables). */
  thinkingAutoMs: Number(process.env.THINKING_AUTO_MS ?? 8000),
  /** Delay before simulated remote becomes live (0 = immediate). */
  meetSimulatedConnectMs: Number(process.env.MEET_SIMULATED_CONNECT_MS ?? 800),
};
