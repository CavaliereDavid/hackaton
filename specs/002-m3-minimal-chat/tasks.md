# Tasks: M3 Minimal Chat + Instagram Inner Circle

**Input**: Design documents from `/specs/002-m3-minimal-chat/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, contracts/openapi.yaml

**Tests**: Not requested in the feature specification — no TDD/contract-test task phase included. Validation via quickstart scenarios after Polish.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Worktree**: `/home/david/grok/002-m3-minimal-chat` on branch `002-m3-minimal-chat`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app monorepo (after baseline sync): `apps/web/`, `apps/api/`, `packages/shared/`
- Baseline source to sync from: `/home/david/grok/001-dead-time-circle/apps/` and `/home/david/grok/001-dead-time-circle/packages/shared/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align this worktree with the as-built 001 monorepo and install M3 UI dependencies

- [ ] T001 Sync as-built monorepo layout from `/home/david/grok/001-dead-time-circle` into this worktree: copy/update `apps/web/`, `apps/api/`, `packages/shared/`, root `package.json` scripts (`dev:web`, `dev:api`), and `pnpm-workspace.yaml` so the 002 tree matches plan structure
- [ ] T002 Add Material Design 3 dependencies to `apps/web/package.json`: `@material/web` and any required peer helpers; run `pnpm install` in `/home/david/grok/002-m3-minimal-chat`
- [ ] T003 [P] Create M3 theme scaffolding files `apps/web/src/theme/m3-tokens.css` and `apps/web/src/theme/material-web.ts` (token CSS variables + Material Web component imports registration)
- [ ] T004 [P] Complete missing design docs for implementers: write `specs/002-m3-minimal-chat/data-model.md` (reuse 001 entities + Chat Turn / Instagram surface projections), `specs/002-m3-minimal-chat/contracts/events.md` (SSE wait + optimistic open notes), `specs/002-m3-minimal-chat/contracts/ui.md` (minimal chat + Instagram surface UI contract), and `specs/002-m3-minimal-chat/quickstart.md` (Enter→open scenarios)
- [ ] T005 [P] Verify/update `.gitignore` in worktree root for Node/Vite/SQLite patterns (`node_modules/`, `dist/`, `*.log`, `.env*`, `apps/api/data/*.sqlite*`, `.DS_Store`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire M3 theme into the app shell and establish prompt-submit + wait hooks that all stories share — NO Instagram UI yet, NO full chat redesign yet beyond plumbing

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Import M3 tokens and register Material Web elements from `apps/web/src/theme/` in `apps/web/src/main.tsx` and `apps/web/src/styles/global.css` (replace flat/default chrome baseline)
- [ ] T007 Preserve/port agent wait client API in `apps/web/src/lib/api.ts` and `apps/web/src/hooks/useAgentWait.ts` (create session, start thinking, SSE subscribe with snapshot, surface HTTP errors)
- [ ] T008 Add `apps/web/src/hooks/usePromptSubmit.ts` that on non-empty prompt: creates session, starts thinking, returns session id; on empty prompt: no-ops (no network, no state change)
- [ ] T009 Extend `apps/web/src/state/deadTimeStore.ts` with `innerCircleOpen`, `softDismissed`, and `waitStatus` fields needed for optimistic open + completion signal (default closed until prompt submit)
- [ ] T010 Confirm API from synced `apps/api/` serves `/v1/agent/sessions`, `/v1/inner-circle`, talk WS per `specs/002-m3-minimal-chat/contracts/openapi.yaml`; fix only breakage introduced by sync (do not redesign API)

**Checkpoint**: Foundation ready — `pnpm dev:api` + `pnpm dev:web` run; prompt-submit hook can start thinking; M3 tokens load; user stories can begin

---

## Phase 3: User Story 1 - Minimal Claude/GPT-like chat shell (Priority: P1) 🎯 MVP

**Goal**: M3 Claude/GPT-like conversation canvas with transcript + single composer; Enter/send starts wait; assistant result appears as a turn — no multi-tool chat chrome

**Independent Test**: Open app; send one prompt; see user turn + thinking state; when ready, see assistant turn. No model picker, attachments, history sidebar, plugins, or voice in the default path. ≤3 primary chat controls (SC-005).

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create `apps/web/src/components/ChatTranscript.tsx` rendering user/assistant turns (Chat Turn: role + body) with M3 typography/color roles
- [ ] T012 [P] [US1] Create `apps/web/src/components/PromptComposer.tsx` using Material Web text field + send icon button; Enter submits, Shift+Enter inserts newline; empty submit disabled/no-op
- [ ] T013 [US1] Create `apps/web/src/pages/ChatPage.tsx` composing transcript + composer only (replace prior Agent page as primary route `/` in `apps/web/src/App.tsx`)
- [ ] T014 [US1] Wire `usePromptSubmit` + `useAgentWait` into `ChatPage.tsx`: on submit append user turn, start wait, show thinking indicator in transcript; on `result_ready` append assistant turn from `resultText`
- [ ] T015 [US1] Strip non-essential chat chrome from default UI in `apps/web/src/App.tsx` and `ChatPage.tsx` (no model picker, attachments, history sidebar, plugins, voice, regenerate); move any demo stop/debug behind `?demo=1` or a discrete overflow only
- [ ] T016 [US1] Ensure ≤3 primary interactive chat controls in default path (composer field, send/Enter, optional single dismiss/return) per SC-005 in `ChatPage.tsx`

**Checkpoint**: US1 independently demoable — minimal M3 chat works without Instagram surface

---

## Phase 4: User Story 2 - Instagram-like inner circle auto-opens on prompt (Priority: P1)

**Goal**: On Enter/send of a non-empty prompt, Instagram-like inner circle opens automatically within ~1s; wait status stays visible; empty circle shows non-broken empty state

**Independent Test**: Seed ≥1 person; submit prompt → stories/avatar strip and/or feed cards visible within 1s while thinking. Empty circle still opens with empty state + link to manage.

### Implementation for User Story 2

- [ ] T017 [P] [US2] Create `apps/web/src/components/StoriesStrip.tsx` (horizontal avatar-forward Instagram-like highlights from inner-circle people)
- [ ] T018 [P] [US2] Create `apps/web/src/components/PersonCard.tsx` and `apps/web/src/components/InnerCircleFeed.tsx` (feed/profile-style cards; not a plain text list as primary affordance)
- [ ] T019 [US2] Create `apps/web/src/components/InstagramInnerCircleSurface.tsx` composing StoriesStrip + InnerCircleFeed + wait-status chip/banner + empty state (FR-005, FR-006, FR-009)
- [ ] T020 [US2] On successful non-empty prompt submit in `ChatPage.tsx` / `usePromptSubmit.ts`, optimistically set `innerCircleOpen=true` immediately (do not wait for SSE); reconcile with `thinking_started` / snapshot from `useAgentWait.ts`
- [ ] T021 [US2] Keep agent-wait status visible while Instagram surface is open (status chip in `InstagramInnerCircleSurface.tsx`); support soft-dismiss without clearing agent result; empty prompt MUST NOT open surface
- [ ] T022 [US2] Create minimal manage page `apps/web/src/pages/InnerCircleManagePage.tsx` (add/remove ≤10 people) linked from empty state / subtle nav — must not add chat chrome to `ChatPage.tsx` (FR-010)

**Checkpoint**: US1 + US2 — prompt auto-opens Instagram-like surface during wait

---

## Phase 5: User Story 3 - Talk from the Instagram-like surface during wait (Priority: P2)

**Goal**: From open Instagram surface, start minimal text talk with one person; agent completion still surfaces assistant turn in chat

**Independent Test**: Prompt → surface opens → pick person → exchange ≥1 message → agent ready → assistant result still in transcript

### Implementation for User Story 3

- [ ] T023 [P] [US3] Create `apps/web/src/components/TalkSheet.tsx` with message list + composer only (reuse `apps/web/src/hooks/useTalk.ts` / talk WS)
- [ ] T024 [US3] Wire person select from `PersonCard.tsx` / `StoriesStrip.tsx` to open `TalkSheet.tsx` during open Instagram surface; closing talk returns to surface while wait active
- [ ] T025 [US3] On agent `result_ready` / completion while talk is open: show completion signal and append/show assistant turn in `ChatTranscript.tsx` without discarding `resultText` (FR-008, SC-004)
- [ ] T026 [US3] Keep meet as stub only if already present from 001 sync (`apps/web/src/components/MeetStubButton.tsx`); do not expand WebRTC for this feature

**Checkpoint**: All three stories independently functional on the happy path

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Demo reliability, docs, and chrome checklist

- [ ] T027 [P] Seed demo inner-circle people (with `avatarUrl` or generated initials) in `apps/api/src/db/seed.ts` so Instagram UI is demoable cold-start
- [ ] T028 [P] Hide remaining demo/debug controls from default chrome; document `?demo=1` (if used) in `specs/002-m3-minimal-chat/quickstart.md` and root `README.md`
- [ ] T029 Run quickstart scenarios A–C in `specs/002-m3-minimal-chat/quickstart.md` (empty prompt no-op; Enter opens ≤1s; talk + result preserved); fix gaps
- [ ] T030 Visual pass: M3 color roles/type/shape on chat + Instagram surfaces per https://m3.material.io/; confirm SC-003 checklist items (Claude/GPT-like, Instagram-like, minimal chrome)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately (T001 blocks most later work)
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP
- **US2 (Phase 4)**: Depends on Foundational; integrates with US1 submit path (T014/T020) but Instagram components can be built in parallel once foundation exists
- **US3 (Phase 5)**: Depends on US2 surface being openable; talk sheet can be built [P] then wired
- **Polish (Phase 6)**: After desired stories complete

### User Story Dependencies

- **User Story 1 (P1)**: After Phase 2 — no dependency on US2/US3
- **User Story 2 (P1)**: After Phase 2 — needs US1 submit wiring for auto-open; StoriesStrip/PersonCard [P] before surface compose
- **User Story 3 (P2)**: Needs US2 surface; TalkSheet [P] then wire select + completion

### Parallel Opportunities

- T003, T004, T005 after T001/T002
- T011 || T012 within US1
- T017 || T018 within US2
- T023 parallelizable early in US3 while surface polish continues
- T027 || T028 in Polish

---

## Parallel Example: User Story 2

```bash
# After Foundational + US1 submit path exist:
Task: "Create apps/web/src/components/StoriesStrip.tsx"
Task: "Create apps/web/src/components/PersonCard.tsx and InnerCircleFeed.tsx"
# Then sequential:
Task: "Compose InstagramInnerCircleSurface.tsx"
Task: "Optimistic open on prompt submit in ChatPage / usePromptSubmit"
```

---

## Parallel Example: User Story 1

```bash
Task: "Create apps/web/src/components/ChatTranscript.tsx"
Task: "Create apps/web/src/components/PromptComposer.tsx"
# Then:
Task: "Compose ChatPage.tsx and route in App.tsx"
Task: "Wire usePromptSubmit + useAgentWait"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (especially T001 sync)
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 minimal M3 chat
4. **STOP and VALIDATE** US1 independent test
5. Demo if needed, then continue US2 (auto-open is the product differentiator — usually ship US1+US2 together for this feature)

### Suggested MVP for this feature

**US1 + US2** (both P1): minimal chat **and** Instagram auto-open on Enter. US3 talk is the next increment.

### Incremental Delivery

1. Setup + Foundational → API + M3 plumbing
2. US1 → minimal chat demo
3. US2 → Enter opens Instagram surface (core ask)
4. US3 → talk during wait
5. Polish → seed, quickstart, visual M3 pass

---

## Notes

- [P] = different files, no incomplete-task dependencies
- No automated test tasks (not requested in spec); use quickstart for validation
- Do not implement inside `/home/david/grok/001-dead-time-circle` — constitution One Feature, One Worktree
- Prefer reusing 001 API/hooks over rewriting backend
- Meet stays stub; no real LLM/Instagram API
