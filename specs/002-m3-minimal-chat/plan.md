# Implementation Plan: M3 Minimal Chat + Instagram Inner Circle

**Branch**: `002-m3-minimal-chat` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-m3-minimal-chat/spec.md`

**Worktree**: `/home/david/grok/002-m3-minimal-chat` (pnpm + git worktree; branch created from `001-dead-time-circle`)

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Replace the demo chat UI with a **Material Design 3** Claude/GPT-like shell that has **minimal chat chrome**, and make the **Instagram-like inner circle open automatically** as soon as the user presses Enter/send on a prompt (dead time = social surface during agent wait). Reuse the agent-wait / inner-circle / talk backend from feature `001-dead-time-circle`; this feature’s primary work is client UX + M3 presentation in a **separate worktree**.

Technical approach: sync as-built API/shared packages from the 001 worktree, then rebuild `apps/web` around M3 tokens + Material Web controls, a minimal transcript/composer, and an Instagram-style stories/feed overlay opened on prompt submit (optimistic) reconciled with existing SSE wait events.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22+ (ESM; `node:sqlite` for API)

**Primary Dependencies**: pnpm workspace; Vite + React 19 (web); Express (API, reused); Zod (shared); `@material/web` + M3 CSS tokens (UI); EventSource/SSE + WebSocket (existing realtime)

**Storage**: SQLite via `node:sqlite` (reuse 001 schema for demo user, inner circle, talk, agent sessions)

**Testing**: Vitest (API + wait lifecycle); manual/scripted quickstart for Enter→Instagram open and minimal-chrome checklist; optional component tests for composer submit gating

**Target Platform**: Modern desktop browsers (Chrome/Firefox/Safari latest); local hackathon demo on Linux

**Project Type**: Web application (SPA + REST/realtime API) in pnpm monorepo

**Performance Goals**: Instagram inner circle visible within 1s of Enter/send on non-empty prompt (SC-001); talk round-trip feels interactive locally (<500ms)

**Constraints**: Dedicated worktree/branch for 002; no real LLM required; no Instagram/OpenAI/Anthropic integrations; chat chrome MUST stay minimal (FR-003/SC-005); meet remains stub if present; do not expand social graph beyond curated inner circle (≤10)

**Scale/Scope**: Single-demo-user; one foreground wait; UI rewrite of chat + dead-time host; backend reuse/port from 001

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Spec-Kit First | PASS | New feature path `specs/002-m3-minimal-chat/` with spec → plan → (tasks next) |
| II. One Feature, One Worktree | PASS | Worktree `/home/david/grok/002-m3-minimal-chat` on `002-m3-minimal-chat`; not editing product UI inside 001 worktree for this feature |
| III. Spec Before Code | PASS | Spec written before implementation; plan completes Phase 0–1 design only |
| IV. Worktree Isolation | PASS | Artifacts and later code changes scoped to 002 branch/worktree; 001 remains the prior feature history |
| V. Keep It Shipable | PASS | Reuse 001 API; UI-only vertical slice; Material Web + tokens instead of new platforms; no LLM/Instagram API |

**Post-Phase 1 re-check**: PASS — contracts extend 001 wait/talk semantics with UI timing notes; no new services.

## Worktree Delivery

| Item | Value |
|------|-------|
| Bare repo | `/home/david/grok/hackaton.git` |
| Prior feature worktree | `/home/david/grok/001-dead-time-circle` → `001-dead-time-circle` |
| This feature worktree | `/home/david/grok/002-m3-minimal-chat` → `002-m3-minimal-chat` |
| Create command used | `git -C /home/david/grok/hackaton.git worktree add -b 002-m3-minimal-chat /home/david/grok/002-m3-minimal-chat 001-dead-time-circle` |
| Baseline note | At implement start, sync as-built `apps/*` + `packages/shared` from 001 worktree if missing/lagging on this branch tip |

## Project Structure

### Documentation (this feature)

```text
specs/002-m3-minimal-chat/
├── plan.md              # This file (/speckit-plan)
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── openapi.yaml     # Phase 1 (reuse/annotate 001)
│   ├── events.md        # Phase 1 (UI timing for auto-open)
│   └── ui.md            # Phase 1 (M3 + Instagram + minimal chat UI contract)
└── tasks.md             # Phase 2 via /speckit-tasks (not created here)
```

### Source Code (repository root — target layout after baseline sync)

```text
apps/
├── web/                 # Vite + React — M3 minimal chat + Instagram inner circle
│   ├── src/
│   │   ├── components/  # ChatTranscript, PromptComposer, StoriesStrip, PersonCard, TalkSheet, …
│   │   ├── pages/       # ChatPage (primary), InnerCircleManagePage (minimal)
│   │   ├── hooks/       # useAgentWait, useTalk (reuse), usePromptSubmit
│   │   ├── theme/       # M3 tokens + Material Web registration
│   │   ├── state/       # deadTime / innerCircleOpen store
│   │   └── lib/         # API + WS helpers
│   └── …
└── api/                 # Express + sqlite + SSE + WS (ported/reused from 001)

packages/
└── shared/              # Zod schemas / DTOs (reused)

pnpm-workspace.yaml
package.json
```

**Structure Decision**: Keep monorepo `apps/web` + `apps/api` + `packages/shared`. Do not add a second frontend app; replace the web UI in place after baseline sync.

## Complexity Tracking

> No constitution violations requiring justification.
