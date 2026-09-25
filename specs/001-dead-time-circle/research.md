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

**Decision**: Inner circle is a curated list (max 10) stored per demo user. MVP talk is **text** over WebSocket. Short **meet** is a SHOULD capability delivered as an **in-app simulated live panel** (see R11)—not an alert-only stub.

**Rationale**: Matches FR-006/FR-010 and Keep It Shipable. Text talk proves the theme; verifiable meet satisfies US3 “join a short meet” without a WebRTC mesh.

**Alternatives considered**:
- Full WebRTC meet in MVP — high risk for demo reliability (deferred; see R11).
- Alert / external placeholder URL only — not verifiable as working video chat.
- Email/SMS only — not “talk” during dead time.

## R5 — Persistence

**Decision**: SQLite via Node.js built-in `node:sqlite` (`DatabaseSync`) with a single local DB file for the demo.

**Rationale**: Zero external native modules; works on Node 22+/26 where `better-sqlite3` failed to compile.

**Alternatives considered**:
- `better-sqlite3` — preferred initially; native build broken on Node 26 in this environment.
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

## R9 — SSE subscribe race & orphan thinking (fed demo findings)

**Decision**:
1. On SSE connect, **replay a session snapshot** (emit the lifecycle events that match current `AgentSession.state`).
2. On API boot, **cancel all rows still in `thinking`** (orphans from crashed/restarted demos).
3. Client MAY call optimistic open after successful `POST .../thinking/start`, and MUST show HTTP errors (e.g. 409) instead of failing silently.
4. Demo MAY auto-transition `thinking → ready` after `THINKING_AUTO_MS` (default 8s); manual stop remains.

**Rationale**: Live demo showed SC-001 failures when `thinking_started` fired before `EventSource` subscribed, and a stuck `thinking` row blocked all subsequent starts. Snapshot + orphan cleanup + error surfacing restore reliability without adding a new transport.

**Alternatives considered**:
- Client-only polling after start — works but duplicates SSE contract and weakens FR-001 “detect via wait stream”.
- Persist an event log and replay history — heavier than snapshot-of-current-state for a single-session demo.
- Allow multiple concurrent `thinking` sessions — contradicts “one primary dead-time window”.

## R10 — Talk “pop-up” expectation vs opt-in talk

**Decision**: Adding inner-circle people does **not** push inbound calls/chats. During open dead time the user **selects** a person. On talk create, persist a **person greeting** and deliver it when the WebSocket connects; keep post-message auto-reply for single-player demos.

**Rationale**: Matches FR-006 (user starts talk) while satisfying the demo feel that “someone is there” without inventing a notification product.

**Alternatives considered**:
- Random unsolicited popups from contacts — novelty, but not in current spec acceptance scenarios; defer as a separate Spec Kit feature if desired.
- Empty talk panel until user types — correct but weaker demo energy.

## R11 — Meet / video chat verification (simulated live, not full WebRTC)

**Decision**: Promote meet from alert-only stub to an **in-app short meet panel**:
1. Persist a `MeetSession` (`offered` → `connecting` → `live` → `ended` | `dismissed`).
2. Client captures **local** camera/mic via `navigator.mediaDevices.getUserMedia` for a real video preview.
3. Show a **simulated remote person tile** (identity from `InnerCirclePerson` + connected status). Optional short delay (`MEET_SIMULATED_CONNECT_MS`) before `live`.
4. Meet remains usable when agent thinking ends; completion banner coexists; ending meet MUST NOT clear agent result.
5. Permission denied / no-device MUST show a clear non-broken state (still “verified” as handled).

**Rationale**: User request is to **verify** meet/video chat works. Spec FR-006 SHOULD + US3 independent test require a joinable short meet, not a fake URL alert. Constitution V rejects a full WebRTC mesh for a single-player hackathon demo. Local media proves “video chat” visually; simulated remote proves social presence without a second peer.

**Alternatives considered**:
- Keep stub alert + `meet.example.local` — not verifiable as working video chat.
- Full browser WebRTC (offer/answer + STUN/TURN) between two tabs — high flakiness, needs second client or loopback complexity; defer as a new Spec Kit feature if needed.
- Third-party embed (Daily, Meet deep-link) — external dependency, weak dead-time integration, permission/network variance in demos.
- Audio-only — weaker demo of “video chat”; local video preview is the verification signal.

