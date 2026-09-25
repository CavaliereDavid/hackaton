# Research: Dead Time Inner Circle

**Feature**: `001-dead-time-circle`  
**Date**: 2026-09-25

## R1 — Application foundation (greenfield vs fork)

**Decision**: Build a thin first-party web app (Express + Vite/React) in the existing pnpm workspace. Do **not** fork Chatwoot (or similar) for this slice.

**Rationale**: Constitution V (Keep It Shipable) and the spec assumption that a full chat-platform fork is out of scope unless chosen in planning. A fork would dominate the hackathon with setup cost and obscure the dead-time UX thesis.

**Alternatives considered**:
- Fork Chatwoot — rich chat/meet, high integration cost, weak fit for agent-wait lifecycle.
- Embed a third-party widget only — still couples demo to external product; less control over dead-time transition aesthetics.

## R2 — Detecting agent thinking start/stop

**Decision**: Model an explicit `AgentSession` with wait states (`idle` → `thinking` → `ready` | `error` | `cancelled`). Emit lifecycle events on transitions. Provide a demo control (and/or mock agent job) that starts/stops thinking so timing is testable without a real LLM.

**Rationale**: Spec FR-001–003 and SC-001 need deterministic start/stop. Explicit states beat inferring from spinners or network heuristics.

**Alternatives considered**:
- Infer thinking from HTTP request duration only — brittle for streaming and multi-step agents.
- Depend on an external IDE agent (e.g. Cursor) — out of product boundary for a self-contained demo.

## R3 — Realtime transport for wait signals

**Decision**: Use **Server-Sent Events (SSE)** for agent-wait lifecycle (`thinking_started`, `thinking_stopped`, `result_ready`, `wait_error`). Use **WebSocket** for talk message exchange.

**Rationale**: Wait signals are server→client one-way (SSE is simple and sufficient). Talk is bidirectional (WebSocket). Splitting concerns keeps the dead-time path easy to reason about and test.

**Alternatives considered**:
- WebSocket-only for everything — works, but mixes unrelated channels.
- Polling — fails SC-001 reliability/feel for open/close within 1s under load or tab throttling risk.

## R4 — Inner circle & talk scope

**Decision**: Inner circle is a curated list (max 10) stored per demo user. MVP talk is **text** over WebSocket. Short **meet** is a SHOULD stub (e.g. “Start meet” opens a placeholder/deep-link panel) unless time remains after P3 text talk.

**Rationale**: Matches FR-006/FR-010 and Keep It Shipable. Text talk proves the theme; meet is originality-friendly but not blocking.

**Alternatives considered**:
- Full WebRTC meet in MVP — high risk for demo reliability.
- Email/SMS only — not “talk” during dead time.

## R5 — Persistence

**Decision**: SQLite via `better-sqlite3` with a single local DB file for the demo.

**Rationale**: Zero external services; supports entities (circle, talk, agent sessions) better than ad-hoc JSON; easy reset for demos.

**Alternatives considered**:
- In-memory only — loses inner circle between restarts (hurts FR-010 reuse).
- Postgres — unnecessary ops for hackathon scale.

## R6 — Frontend composition

**Decision**: React SPA with a dead-time transition route/overlay driven by `useAgentWait`. Agent chat view remains underneath/returnable. Inner-circle list and talk panel live inside the dead-time surface; agent-done banner persists while talk continues.

**Rationale**: Spec stories P1–P3 map cleanly to overlay + status + talk panel. Aesthetics/UX scoring favors a deliberate transition, not a tiny toast.

**Alternatives considered**:
- Separate window/tab for social — weaker “transition” narrative.
- Modal only over spinner — less immersive for the theme.

## R7 — Delivery mechanics (branch + worktree)

**Decision**: Implement application code only on branch `001-dead-time-circle` inside a **pnpm git worktree** dedicated to this feature (constitution II / Feature Delivery Rules).

**Rationale**: Required governance; avoids mixing feature work with unrelated mainline edits.

**Alternatives considered**:
- Implement on `main` in the current checkout — violates constitution.
- Git worktree without pnpm — README and constitution specify pnpm worktrees for dependency-aware isolation.

## R8 — Testing strategy

**Decision**: Vitest for domain state machine and API route tests; assert SSE event ordering for thinking start/stop; quickstart scripted manual checklist for demo path. Optional Playwright later if time allows — not required for plan gate.

**Rationale**: SC-001 is about timing semantics; unit/integration on the state machine + SSE is the highest leverage.

**Alternatives considered**:
- E2E-only — slower feedback for a greenfield scaffold.
