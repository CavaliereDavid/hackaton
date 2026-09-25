# Quickstart: Dead Time Inner Circle

Validate the feature end-to-end after implementation. This guide is a **run checklist**, not an implementation dump.

## Prerequisites

- Node.js 22+ (26 OK; API uses `node:sqlite`)
- pnpm 12+
- Feature branch + worktree (constitution) — already provisioned:
  - Branch: `001-dead-time-circle`
  - Path: `/home/david/grok/001-dead-time-circle`
  - Bare hub: `/home/david/grok/hackaton.git` ([pnpm git worktrees](https://pnpm.io/git-worktrees))
- Design refs: [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [contracts/events.md](./contracts/events.md), [plan.md](./plan.md) (Meet Verification Session)

## Expected workspace layout

```text
apps/web  → Vite React client (default http://localhost:5173)
apps/api  → Express API (default http://localhost:3001)
```

## Setup (once in the feature worktree)

```bash
pnpm install
pnpm dev:api    # terminal 1 — ensure nothing else holds :3001
pnpm dev:web    # terminal 2
```

Exact script names: root `pnpm dev:api` / `pnpm dev:web` (or `pnpm dev` for both).

**Stale process tip**: if API fails with `EADDRINUSE`, kill the old listener on `:3001` before retrying. Only one API instance should own the SQLite file.

**Env (optional)**:

| Variable | Default | Notes |
|----------|---------|-------|
| `THINKING_AUTO_MS` | `8000` | Auto-finish thinking; `0` = manual stop only |
| `TALK_AUTO_REPLY` | on | Set `0` to disable person auto-reply |
| `MEET_SIMULATED_CONNECT_MS` | `800` | Delay before simulated remote is `live`; `0` = immediate |

Seed data includes a demo user. Inner circle starts empty unless you add people (Scenario B) or reuse prior DB rows.

## Scenario A — P1 dead-time open/close (no contacts required)

1. Open http://localhost:5173/ and enter any prompt.
2. Click **Start thinking** (creates session + opens SSE).
3. **Expect**: Dead-time transition opens within ~1s; status shows agent is thinking.
4. Either wait for auto-ready (~8s) **or** click **Stop (ready)**.
5. **Expect**: Completion signal within ~1s; agent result still available when returning from dead time.
6. Refresh and **Start thinking** again after a prior crash/restart.
7. **Expect**: No silent failure / stuck “another session is already thinking” (orphans cleared on API boot).

Pass criteria: SC-001 timing feel; FR-001–004; events.md snapshot behavior.

## Scenario B — P2 inner circle during dead time

1. Open **Inner Circle** settings; add at least one person (`POST /v1/inner-circle` or UI).
2. **Note**: Adding people alone MUST NOT open a chat/call popup.
3. Start thinking so dead time opens.
4. **Expect**: Inner circle list visible on the dead-time surface with Talk actions.
5. Remove all people (or use a fresh DB) and reopen dead time.
6. **Expect**: Clear empty state (not a crash/spinner-only).

Pass criteria: FR-005, FR-008, FR-010.

## Scenario C — P3 talk while thinking, then agent finishes

1. Open dead time with a configured inner circle.
2. Choose **Talk with …** for one person.
3. **Expect**: Talk panel opens; an initial **person** greeting appears (via GET history and/or WS).
4. Send a text message; **Expect** message + optional auto-reply; agent-thinking status remains visible if still thinking.
5. While talk is active, let auto-ready fire or stop thinking with a ready result.
6. **Expect**: Completion banner/signal; return to agent shows the same result; talk can be paused/closed without losing the result.

Pass criteria: FR-006 (text), FR-007, FR-009, SC-004.

## Scenario D — Meet / video chat verification (required for this session)

**Goal**: Prove short live meet works during dead time (local video + simulated remote), including when the agent finishes mid-meet.

1. Open dead time with a configured inner circle; start **Talk** with one person (Scenario C setup).
2. Choose **Start meet** (single CTA from talk / person — not a separate orphan stub).
3. Allow camera/mic when the browser prompts (or note the deny path in step 9).
4. **Expect within ~1–2s**: In-app **MeetPanel** opens (not a `window.alert` and not an external `meet.example.local` URL).
5. **Expect**: Local self-view video (or audio-only fallback if video device missing but mic granted); simulated remote tile shows the person’s name and reaches **live** / connected status.
6. While meet is live, let auto-ready fire or stop thinking.
7. **Expect**: Agent completion banner still appears; agent result preserved; meet can stay open until **End** / **Dismiss**.
8. End the meet; **Expect**: panel closes; talk (if still open) and agent result remain.
9. **Permission denied path**: Start meet and deny camera/mic. **Expect**: clear non-broken message; dismiss works; dead-time / agent wait continue.

Pass criteria: FR-006 (short live meet available and verifiable); FR-007 / FR-009 (result preserved mid-meet); research R11 simulated-live design.

## Automated checks

```bash
pnpm --filter @hackaton/api test
```

Minimum coverage expected after Meet Verification Session (Phase 8 tasks):

- AgentSession state transitions reject illegal moves
- SSE snapshot: late subscriber receives `thinking_started` if already thinking
- Orphan `thinking` rows cancelled on boot / via reset helper
- Auto-ready timer cancelled when stop is called manually
- Inner circle max 10 enforced
- Talk create attaches optional `agentSessionId`; greeting message exists
- MeetSession create attaches optional `agentSessionId` / `talkSessionId`; illegal state transitions 409
- Second concurrent active meet for same user rejected (409)
- Ending meet does not clear AgentSession result (assertion via session GET)

## Demo reset

Delete or migrate-reset the SQLite DB file under `apps/api/data/`, then restart API to reseed the demo user. Restarting API alone is enough to clear orphaned `thinking` sessions.
