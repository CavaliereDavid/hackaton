# Research: M3 Minimal Chat + Instagram Inner Circle

**Feature**: `002-m3-minimal-chat`  
**Date**: 2026-09-25

## R1 — New feature worktree vs redesign inside 001

**Decision**: Deliver this UI as Spec Kit feature `002-m3-minimal-chat` in a dedicated pnpm git worktree at `/home/david/grok/002-m3-minimal-chat`, branched from `001-dead-time-circle`.

**Rationale**: Constitution II (One Feature, One Worktree) and V (no parallel experimental forks inside an active feature worktree). The user explicitly asked for a different worktree. UX scope (M3 + Claude/GPT shell + Instagram auto-open + minimal chrome) is a coherent new feature, not a silent rewrite of 001’s plan.

**Alternatives considered**:
- Overwrite `001-dead-time-circle` plan/UI in place — violates isolation and mixes finished MVP history with a new aesthetic thesis.
- Only document “do UI later” without a feature — fails Spec-Kit First.

## R2 — Material Design 3 implementation stack

**Decision**: Target [Material Design 3](https://m3.material.io/) via:
1. **M3 design tokens** (color roles, type scale, shape, motion) as CSS variables for the app shell, chat canvas, and Instagram surface.
2. **Official Material Web components** (`@material/web`) for standard controls (filled/tonal buttons, outlined text fields, icon buttons, chips, progress indicators) wrapped thinly for React.
3. **Custom React layouts** for Claude/GPT-like transcript and Instagram-like stories/feed (M3 does not ship those product patterns).

**Rationale**: Material UI’s core library documents Material Design **2** as its baseline; using it alone would not satisfy FR-001’s M3 requirement. Material Web is Google’s M3 web implementation; tokens keep custom Instagram/chat surfaces on-brand.

**Alternatives considered**:
- `@mui/material` only — ships faster for React, but MD2-first; insufficient without a deliberate M3 token remapping (still weaker authenticity than Material Web + tokens).
- Fully custom CSS with no Material components — possible, but loses ready M3 motion/accessibility for buttons/fields.
- Flutter/Compose M3 — wrong platform for this web monorepo.

## R3 — Claude/GPT-like minimal chat chrome

**Decision**: Single-column conversation UI: scrollable transcript (user/assistant bubbles), bottom composer (multiline + send), Enter-to-send (Shift+Enter for newline). Strip default chrome to meet SC-005 (≤3 primary chat controls). Hide demo/debug (manual stop, raw session ids) behind a discrete overflow or `?demo=1` unless needed for facilitators.

**Rationale**: User asked to reduce chatbot functionality to a minimum while remaining Claude/GPT-like. Recognition comes from layout restraint, not feature parity with commercial assistants.

**Alternatives considered**:
- Keep 001’s Agent page debug controls as primary — conflicts with FR-003/SC-005.
- Multi-panel IDE-like agent UI — not Claude/GPT-like.

## R4 — Instagram-like inner circle + auto-open on prompt

**Decision**: On successful non-empty prompt submit:
1. Create/start agent session thinking (reuse 001 wait lifecycle).
2. **Optimistically open** an Instagram-like surface immediately (stories avatar strip + profile/feed cards).
3. Reconcile with SSE snapshot/events for open duration and completion.

Primary people UI is avatar-forward (circular story highlights + card grid), not a dense table/list. Talk opens from a person card into a minimal thread sheet.

**Rationale**: Matches FR-004/FR-005 and SC-001. Optimistic open avoids “wait for thinking event” latency that would make auto-open feel broken. Instagram metaphor communicates social dead time instantly.

**Alternatives considered**:
- Open only after `thinking_started` SSE — can miss SC-001 if subscribe races (001 already documented this).
- Plain contact list with M3 list items — fails “Instagram-like” acceptance.
- Full Instagram clone (Reels, DMs graph, explore) — out of shipable scope.

## R5 — Backend reuse from 001

**Decision**: Reuse agent-wait SSE, inner-circle REST, and talk WebSocket contracts from `001-dead-time-circle` with **UI-facing clarifications** only (e.g. prompt submit is the primary thinking start; Instagram surface is the dead-time host). Port/sync the as-built `apps/api` + `packages/shared` from the 001 worktree into 002 if the branch tip lacks that code.

**Rationale**: Constitution V — smallest vertical slice. This feature’s delta is presentation and interaction timing, not a new social protocol.

**Alternatives considered**:
- New backend for “stories” media — unnecessary for avatar-forward mock data.
- Real Anthropic/OpenAI API — out of scope; mock/auto-ready remains fine for demo.

## R6 — Baseline sync risk (worktree tip vs 001 working tree)

**Decision**: Treat `/home/david/grok/001-dead-time-circle` as-built monorepo (`apps/web`, `apps/api`, `packages/shared`) as the **implementation baseline** to copy/sync into this worktree at the start of `/speckit-implement` (or via an early task), then replace `apps/web` UI per this plan. Do not invent a second API.

**Rationale**: Branch `002-m3-minimal-chat` was cut from committed `001-dead-time-circle` tip, which may lag the uncommitted MVP in the 001 worktree. Planning must name the sync step so implement does not rebuild the backend from scratch.

**Alternatives considered**:
- Reimplement API in 002 — wastes hackathon time and drifts contracts.
- Force-commit all 001 WIP before branching — process choice for humans; plan only requires a sync task.

## R7 — Testing strategy

**Decision**: Keep Vitest for API/wait contracts; add lightweight React component tests or manual quickstart checklist for: Enter → Instagram open ≤1s; empty prompt does nothing; assistant turn appears after ready; talk still works. Visual M3/Instagram feel is checklist/SC-003, not pixel automation.

**Rationale**: Highest risk is interaction timing and chrome reduction; backend already covered by 001 patterns.

**Alternatives considered**:
- Full Playwright visual regression — optional later; not a plan gate.
