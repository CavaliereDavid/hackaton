import { z } from "zod";

export const DemoUserSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(80),
  createdAt: z.string().datetime(),
});

export const InnerCirclePersonSchema = z.object({
  id: z.string().uuid(),
  ownerUserId: z.string().uuid(),
  displayName: z.string().min(1).max(80),
  handle: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  status: z.enum(["available", "away", "unreachable"]),
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export const InnerCirclePersonCreateSchema = z.object({
  displayName: z.string().min(1).max(80),
  handle: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const AgentSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  prompt: z.string().min(1).max(8000),
  state: z.enum(["idle", "thinking", "ready", "error", "cancelled"]),
  resultText: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  thinkingStartedAt: z.string().datetime().nullable().optional(),
  thinkingStoppedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ThinkingStopRequestSchema = z.object({
  outcome: z.enum(["ready", "error", "cancelled"]),
  resultText: z.string().optional(),
  errorMessage: z.string().optional(),
});

export const TalkSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  personId: z.string().uuid(),
  agentSessionId: z.string().uuid().nullable().optional(),
  state: z.enum(["active", "paused", "closed"]),
  createdAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable().optional(),
});

export const TalkMessageSchema = z.object({
  id: z.string().uuid(),
  talkSessionId: z.string().uuid(),
  sender: z.enum(["user", "person", "system"]),
  body: z.string().min(1).max(4000),
  createdAt: z.string().datetime(),
});

export const MeetSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  personId: z.string().uuid(),
  talkSessionId: z.string().uuid().nullable().optional(),
  agentSessionId: z.string().uuid().nullable().optional(),
  state: z.enum(["offered", "connecting", "live", "ended", "dismissed"]),
  startedAt: z.string().datetime().nullable().optional(),
  endedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DemoUser = z.infer<typeof DemoUserSchema>;
export type InnerCirclePerson = z.infer<typeof InnerCirclePersonSchema>;
export type AgentSession = z.infer<typeof AgentSessionSchema>;
export type TalkSession = z.infer<typeof TalkSessionSchema>;
export type TalkMessage = z.infer<typeof TalkMessageSchema>;
export type MeetSession = z.infer<typeof MeetSessionSchema>;
