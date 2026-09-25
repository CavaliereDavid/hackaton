# Implementation Plan: Dead Time Inner Circle

**Branch**: `001-dead-time-circle` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-dead-time-circle/spec.md`

**Worktree**: `/home/david/grok/001-dead-time-circle` (pnpm + git worktree; `virtualStoreType: global`)

**Plan revision**: 2026-09-25 — **Meet / video-chat verification session**. User request: verify that meet / video chat functionality works (FR-006 SHOULD short live meet).

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Turn agent wait (“dead time”) into a purposeful transition: when the agent starts thinking, open a dead-time surface; while it is open, let the user reach a curated inner circle and talk (text MUST; short live meet SHOULD and must be **demo-verifiable**). When thinking stops, signal completion and preserve the agent result even if talk or meet is still active.

Technical approach (as-built MVP): greenfield pnpm monorepo with Vite/React + Express; agent wait via HTTP + SSE; text talk via WebSocket; meet currently a stub (`POST /v1/meet/stub` + `window.alert`).

**This revision**: replace the non-verifiable alert stub with an **in-app short meet panel** so quickstart Scenario D proves video chat works end-to-end during dead time—without a full multi-party WebRTC mesh.

## As-built meet gap (why this session exists)

| Finding | Spec impact | Design implication |
|---------|-------------|-------------------|
| `MeetStubButton` only alerts a fake `meet.example.local` URL | FR-006 SHOULD; US3 independent test (“join a short meet”) | Meet MUST open an in-app live panel, not an external placeholder URL |
| `TalkPanel` `onMeet` is wired to `undefined`; separate stub button duplicates CTA | UX / SC-002 | Single **Start meet** entry from talk (or person row) opens the meet panel |
| No camera/mic path; nothing to “verify” visually | Demo authenticity | Client uses `getUserMedia` for local preview; remote side is a **simulated person tile** (single-player demo) |
| Meet state not tied to dead-time / agent-done | Edge: meet active when thinking ends | Meet session survives agent ready; completion banner still shows; dismiss/end meet does not drop agent result |
| OpenAPI `MeetStub` + table `meet_stubs` are stub-shaped | Contracts drift | Promote to `MeetSession` with verifiable states; keep DB table rename or evolve in place |

## Prior reliability notes (still in force)

Earlier demo findings remain binding (SSE snapshot on connect, orphan `thinking` cancel on boot, `THINKING_AUTO_MS`, talk greeting, visible HTTP errors, single API instance). See [research.md](./research.md) R9–R10 and [contracts/events.md](./contracts/events.md).

## Next Implementation Session (scope for `/speckit-tasks`)

**Goal**: Make short live meet **verifiable** during dead time so Scenario D passes on a cold demo path. Keep shipable: no STUN/TURN farm, no second human peer required.

**In scope**

1. **MeetSession lifecycle** — `offered` → `connecting` → `live` → `ended` | `dismissed`; persist via API; attach optional `talkSessionId` + `personId` + `agentSessionId`.
2. **In-app MeetPanel** — local video/audio preview (`getUserMedia`); simulated remote person tile (name/avatar + “connected” status); End / Dismiss controls; permission-denied empty state that is not broken.
3. **Dead-time integration** — Start meet from talk (or person) while dead time is open; agent-thinking status remains visible; when agent finishes mid-meet, show completion banner without auto-killing the meet.
4. **Contracts** — Update OpenAPI (`/v1/meet/sessions`, GET/PATCH); evolve schema from `MeetStub`; document UI contract in `events.md`.
5. **Quickstart Scenario D** — Required verification of meet/video; include permission allow/deny paths.
6. **Tests** — API: create meet, illegal transitions, person-not-found, concurrent-meet 409; optional UI note in quickstart for media permission.

**Out of scope (defer or new Spec Kit feature)**

- True peer-to-peer or SFU WebRTC between two browsers
- Screen share, recording, dial-in PSTN
- Real LLM / Cursor agent backend
- Multi-user auth
- Chatwoot (or other) fork
- Unsolicited inbound meet popups when adding inner-circle people

**Exit criteria**: From open dead time, user starts meet with an inner-circle person, sees **local camera preview** (or a clear permission-denied state), sees a **live simulated remote tile**, can end/dismiss meet, and can still return to a preserved agent result if thinking ended during the meet. Scenario D in quickstart passes; contracts match code.

After this plan revision, run `/speckit-tasks` to append a **Phase 8** task list for Meet Verification (do not rewrite completed T001–T043 / Phase 7 history).

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22+ / 26 (ESM; `node:sqlite` requires recent Node)

**Primary Dependencies**: pnpm workspace; Express (API); Vite + React (UI); Zod (validation); Node.js `node:sqlite` (persistence); EventSource/SSE for agent wait; WebSocket (`ws`) for talk; browser **MediaDevices.getUserMedia** for local meet preview (no extra media SDK)

**Storage**: SQLite via Node.js `node:sqlite` (local file) for demo profile, inner circle, talk, agent sessions, and meet sessions

**Testing**: Vitest (unit + API integration) for MeetSession transitions; manual quickstart Scenario D for camera permission + visual verify; contract checks against OpenAPI

**Target Platform**: Modern desktop browsers with camera/mic permission prompts (Chrome/Firefox/Safari latest); local hackathon demo on Linux

**Project Type**: Web application (SPA frontend + REST/realtime backend) in a pnpm monorepo

**Performance Goals**: Dead-time open/close within 1s (SC-001); meet panel opens within ~1s of Start meet after permission grant; talk round-trip feels interactive (<500ms local)

**Constraints**: Shipable vertical slice; meet is **simulated live** (local media + fake remote), not full WebRTC; one primary dead-time window; Spec Kit + dedicated pnpm git worktree on `001-dead-time-circle`

**Scale/Scope**: Single-demo-user; ≤10 inner-circle people; one foreground agent wait; one active meet at a time per user; P1–P3 as-built + meet verification

**Config knobs (demo)**:

| Env | Default | Purpose |
|-----|---------|---------|
| `PORT` | `3001` | API listen port |
| `DB_PATH` | `apps/api/data/deadtime.sqlite` | SQLite file |
| `THINKING_AUTO_MS` | `8000` | Auto `ready` after start (`0` disables) |
| `TALK_AUTO_REPLY` | on (set `0` to disable) | Person reply after user message |
| `MEET_SIMULATED_CONNECT_MS` | `800` | Delay before simulated remote becomes `live` (`0` = immediate) |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Spec-Kit First | PASS | Meet verification encoded in plan/research/contracts before `/speckit-tasks` Phase 8 |
| II. One Feature, One Worktree | PASS | Branch `001-dead-time-circle` at `/home/david/grok/001-dead-time-circle` |
| III. Spec Before Code | PASS | Design artifacts updated before meet implementation tasks |
| IV. Worktree Isolation | PASS | Plan scoped to this feature only |
| V. Keep It Shipable | PASS | Simulated in-app meet (getUserMedia + remote tile); full WebRTC mesh explicitly deferred |

**Post-Phase 1 re-check**: PASS — meet contracts stay inside existing `apps/web` + `apps/api`; no new services or media SFU.

## Worktree Delivery

| Item | Value |
|------|-------|
| Bare repo | `/home/david/grok/hackaton.git` |
| Main worktree | `/home/david/grok/hackaton` → `main` |
| Feature worktree | `/home/david/grok/001-dead-time-circle` → `001-dead-time-circle` |
| Create command used | `git -C /home/david/grok/hackaton.git worktree add /home/david/grok/001-dead-time-circle 001-dead-time-circle` |
| pnpm | `virtualStoreType: global` in `pnpm-workspace.yaml`; `pnpm install` completed in feature worktree |

## Project Structure

### Documentation (this feature)

```text
specs/001-dead-time-circle/
├── plan.md              # This file (/speckit-plan)
├── research.md          # Phase 0 (+ R11 meet verification)
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── openapi.yaml
│   └── events.md
└── tasks.md             # Prior phases done; Phase 8 via /speckit-tasks next
```

### Source Code (repository root)

```text
apps/
├── web/                 # Vite + React SPA
│   ├── src/
│   │   ├── components/  # + MeetPanel (replace alert-only MeetStubButton)
│   │   ├── pages/
│   │   ├── hooks/       # + useMeet (session + local media)
│   │   ├── state/
│   │   └── lib/
│   └── …
└── api/
    ├── src/
    │   ├── routes/      # meet.ts → MeetSession CRUD
    │   ├── services/    # + meet.ts lifecycle
    │   ├── db/          # meet_sessions (evolve meet_stubs)
    │   ├── realtime/
    │   └── config.ts    # + MEET_SIMULATED_CONNECT_MS
    └── tests/

packages/
└── shared/              # MeetSession Zod schema (replace MeetStub)

pnpm-workspace.yaml
package.json
```

**Structure Decision**: Keep `apps/web` + `apps/api` + `packages/shared`. Meet verification adds UI panel + API session model only—no new apps.

## Complexity Tracking

> No constitution violations requiring justification. Full WebRTC was considered and rejected under Keep It Shipable (see research R11).
