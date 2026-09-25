# Implementation Plan: Dead Time Inner Circle

**Branch**: `001-dead-time-circle` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-dead-time-circle/spec.md`

**Worktree**: `/home/david/grok/001-dead-time-circle` (pnpm + git worktree; `virtualStoreType: global`)

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Turn agent wait (“dead time”) into a purposeful transition: when the agent starts thinking, open a dead-time surface; while it is open, let the user reach a curated inner circle and talk (text MUST; short meet SHOULD as a stub/extension). When thinking stops, signal completion and preserve the agent result even if talk is still active.

Technical approach: greenfield pnpm monorepo with a Vite/React client and Express API. Agent wait lifecycle is a first-class state machine exposed via HTTP + Server-Sent Events. Inner circle and talk are lightweight first-party features (no Chatwoot fork in this slice). Demo can drive thinking start/stop via a mockable agent session.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS (ESM)

**Primary Dependencies**: pnpm workspace; Express (API); Vite + React (UI); Zod (validation); better-sqlite3 (persistence); EventSource/SSE for agent wait events; WebSocket (`ws`) for talk messages

**Storage**: SQLite (local file) for users demo profile, inner circle, talk sessions/messages, agent sessions/results

**Testing**: Vitest (unit + API integration); contract checks against OpenAPI schemas; manual/scripted quickstart scenarios for dead-time timing

**Target Platform**: Modern desktop browsers (Chrome/Firefox/Safari latest); local hackathon demo on Linux

**Project Type**: Web application (SPA frontend + REST/realtime backend) in a pnpm monorepo

**Performance Goals**: Dead-time open/close signal within 1s of thinking start/stop (SC-001); talk message round-trip feels interactive (&lt;500ms local)

**Constraints**: Shipable vertical slice for demo; no full third-party chat platform fork; one primary dead-time window; meet is optional/stub if time-boxed; feature work MUST use Spec Kit + a dedicated pnpm git worktree on branch `001-dead-time-circle`

**Scale/Scope**: Single-demo-user scale; ≤10 inner-circle people; one foreground agent wait; P1 timing → P2 contacts → P3 text talk (meet stub)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Spec-Kit First | PASS | Spec exists; this plan continues the Spec Kit path toward tasks/implement |
| II. One Feature, One Worktree | PASS | Branch `001-dead-time-circle` checked out at `/home/david/grok/001-dead-time-circle` via `git worktree add` against bare repo `hackaton.git`; `pnpm install` run with global virtual store |
| III. Spec Before Code | PASS | Spec validated; no app implementation in this command |
| IV. Worktree Isolation | PASS | Plan scoped to this feature only; no unrelated mainline product changes |
| V. Keep It Shipable | PASS | Custom thin stack instead of Chatwoot fork; meet deferred to stub/SHOULD; SQLite local demo |

**Post-Phase 1 re-check**: PASS — contracts and data model stay within one web app + API; no extra services or speculative packages beyond Express, React, SQLite, SSE, and WebSocket.

**Post-worktree re-check (2026-09-25)**: PASS — feature worktree created; implement/tasks MUST run inside `/home/david/grok/001-dead-time-circle`, not the `main` worktree at `/home/david/grok/hackaton`.

## Worktree Delivery

| Item | Value |
|------|-------|
| Bare repo | `/home/david/grok/hackaton.git` |
| Main worktree | `/home/david/grok/hackaton` → `main` |
| Feature worktree | `/home/david/grok/001-dead-time-circle` → `001-dead-time-circle` |
| Create command used | `git -C /home/david/grok/hackaton.git worktree add /home/david/grok/001-dead-time-circle 001-dead-time-circle` |
| pnpm | `virtualStoreType: global` in `pnpm-workspace.yaml`; `pnpm install` completed in feature worktree |

Spec/plan artifacts were synced into the feature worktree working tree (still uncommitted). Commit on the feature branch before implement if you want the worktree durable across clean checkouts.

## Project Structure

### Documentation (this feature)

```text
specs/001-dead-time-circle/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── openapi.yaml
│   └── events.md
└── tasks.md             # Created later by /speckit-tasks
```

### Source Code (repository root)

```text
apps/
├── web/                 # Vite + React SPA (agent UI + dead-time transition + talk)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/       # useAgentWait, useInnerCircle, useTalk
│   │   ├── state/       # dead-time / agent wait client state
│   │   └── lib/         # API + SSE + WebSocket clients
│   └── tests/
└── api/                 # Express + SQLite + SSE + WebSocket
    ├── src/
    │   ├── routes/
    │   ├── services/    # agentWait, innerCircle, talk
    │   ├── db/
    │   └── realtime/
    └── tests/

packages/
└── shared/              # Shared Zod schemas / DTO types (optional thin package)

pnpm-workspace.yaml
package.json
```

**Structure Decision**: Use the existing empty pnpm workspace (`apps/*`, `packages/*`) with `apps/web` + `apps/api` (+ optional `packages/shared`). Matches README stack (Node/Express + Vite/React) and keeps the demo shipable without forking Chatwoot.

## Complexity Tracking

> No constitution violations requiring justification.
