# Quickstart: Dead Time Inner Circle

Validate the feature end-to-end after implementation. This guide is a **run checklist**, not an implementation dump.

## Prerequisites

- Node.js 22+
- pnpm 12+
- Feature branch + worktree (constitution) — already provisioned:
  - Branch: `001-dead-time-circle`
  - Path: `/home/david/grok/001-dead-time-circle`
  - Bare hub: `/home/david/grok/hackaton.git` ([pnpm git worktrees](https://pnpm.io/git-worktrees))
- Design refs: [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [contracts/events.md](./contracts/events.md)

## Expected workspace layout

```text
apps/web  → Vite React client (default http://localhost:5173)
apps/api  → Express API (default http://localhost:3001)
```

## Setup (once in the feature worktree)

```bash
pnpm install
pnpm --filter api dev    # terminal 1
pnpm --filter web dev    # terminal 2
```

Exact script names may match whatever `apps/*/package.json` defines; both API and web MUST be running for the scenarios below.

Seed data SHOULD include a demo user and optionally 1–2 inner-circle people. If empty, use scenario B to add contacts first.

## Scenario A — P1 dead-time open/close (no contacts required)

1. Open the web app and create/start an agent session with any prompt.
2. Subscribe/observe wait events (UI should open SSE via session events).
3. Trigger **thinking start** (demo control or auto mock).
4. **Expect**: Dead-time transition opens within ~1s; status shows agent is thinking.
5. Trigger **thinking stop** with `outcome=ready` and a result payload.
6. **Expect**: Completion signal within ~1s; agent result still available when returning from dead time.

Pass criteria: SC-001 timing feel; FR-001–004.

## Scenario B — P2 inner circle during dead time

1. Ensure at least one inner-circle person exists (`POST /v1/inner-circle` or settings UI).
2. Start thinking so dead time opens.
3. **Expect**: Inner circle list visible on the dead-time surface.
4. Remove all people (or use a fresh profile) and reopen dead time.
5. **Expect**: Clear empty state (not a crash/spinner-only).

Pass criteria: FR-005, FR-008, FR-010.

## Scenario C — P3 talk while thinking, then agent finishes

1. Open dead time with a configured inner circle.
2. Start talk with one person; send a text message.
3. **Expect**: Message appears; agent-thinking status remains visible.
4. While talk is active, stop thinking with a ready result.
5. **Expect**: Completion banner/signal; return to agent shows the same result; talk can be paused/closed without losing the result.

Pass criteria: FR-006 (text), FR-007, FR-009, SC-004.

## Scenario D — Meet stub (optional SHOULD)

1. From dead time or talk, choose **Start meet** if present.
2. **Expect**: Meet stub offers/opens a placeholder experience (no hard dependency on WebRTC).

## Automated checks (when implemented)

```bash
pnpm --filter api test
pnpm --filter web test
```

Minimum automated coverage expected by tasks phase:

- AgentSession state transitions reject illegal moves
- SSE ordering: `thinking_started` before `thinking_stopped`
- Inner circle max 10 enforced
- Talk create attaches optional `agentSessionId`

## Demo reset

Delete or migrate-reset the SQLite DB file used by `apps/api`, then restart API to reseed.
