# Tasks: Dead Time Inner Circle

**Input**: Design documents from `/specs/001-dead-time-circle/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Worktree**: Implement only in `/home/david/grok/001-dead-time-circle` on branch `001-dead-time-circle`

**Tests**: Not requested as TDD for P1–P3 originally. Phase 8 includes meet Vitest tasks (T051) because plan.md / quickstart.md explicitly require MeetSession coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- API: `apps/api/src/`
- Web: `apps/web/src/`
- Shared (optional): `packages/shared/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the pnpm monorepo apps for Express + Vite/React

- [x] T001 Create monorepo app directories `apps/api/`, `apps/web/`, and optional `packages/shared/` per plan.md structure
- [x] T002 Initialize `apps/api/package.json` as TypeScript ESM Express service with scripts `dev`, `build`, `test` and dependencies `express`, `zod`, `better-sqlite3`, `ws`, `cors`, `uuid` (or `crypto.randomUUID`)
- [x] T003 [P] Initialize `apps/web/package.json` as Vite + React + TypeScript app with scripts `dev`, `build`, `preview` and React Router (or equivalent) dependency
- [x] T004 [P] Add root `package.json` workspace scripts (`dev:api`, `dev:web`, `dev`) wiring `pnpm --filter` for `apps/api` and `apps/web`
- [x] T005 [P] Add TypeScript configs `apps/api/tsconfig.json` and `apps/web/tsconfig.json` (and `packages/shared/tsconfig.json` if shared package is created)
- [x] T006 [P] Add `.gitignore` entries for SQLite DB files (`*.sqlite`, `*.db`), `dist/`, and local env files without ignoring required workspace config

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared server/client foundation that MUST exist before any user story UI/API

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create SQLite bootstrap in `apps/api/src/db/client.ts` and schema/migrations in `apps/api/src/db/schema.sql` (or `apps/api/src/db/migrate.ts`) for tables: `demo_users`, `inner_circle_people`, `agent_sessions`, `talk_sessions`, `talk_messages`, `meet_stubs`
- [x] T008 Seed default `DemoUser` (`id` UUID immutable, `displayName` 1–80 chars, `createdAt`) in `apps/api/src/db/seed.ts`
- [x] T009 [P] Create shared Zod DTO schemas in `packages/shared/src/schemas.ts` (or `apps/api/src/schemas/`) matching `specs/001-dead-time-circle/contracts/openapi.yaml` component schemas
- [x] T010 Create Express app entry `apps/api/src/index.ts` with CORS, JSON body parsing, `GET /health`, and mount point for `/v1/*` routers
- [x] T011 [P] Implement `GET /v1/me` in `apps/api/src/routes/me.ts` returning seeded DemoUser
- [x] T012 [P] Add API env/config module `apps/api/src/config.ts` (port default `3001`, DB path, optional auto-reply flag for talk)
- [x] T013 Create web API client base `apps/web/src/lib/api.ts` pointing at `http://localhost:3001`
- [x] T014 [P] Create app shell routes in `apps/web/src/App.tsx` and `apps/web/src/main.tsx` with pages placeholders: agent chat, settings/inner-circle, dead-time overlay host
- [x] T015 [P] Add Vite proxy or `import.meta.env` config in `apps/web/vite.config.ts` / `apps/web/.env.example` for API base URL

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Dead-time transition opens and closes with agent thinking (Priority: P1) 🎯 MVP

**Goal**: When agent thinking starts, open dead-time transition; when it stops, signal completion and preserve return to agent result

**Independent Test**: Simulate thinking start/stop with no inner-circle contacts; transition opens within ~1s of start and completion signals within ~1s of stop (quickstart Scenario A)

### Implementation for User Story 1

- [x] T016 [P] [US1] Implement `AgentSession` persistence helpers in `apps/api/src/db/agentSessions.ts` with fields/constraints from data-model.md: `state` enum `idle|thinking|ready|error|cancelled`; `prompt` required; `resultText`/`errorMessage` nullable; `thinkingStartedAt`/`thinkingStoppedAt` nullable; only one foreground `thinking` session per user
- [x] T017 [US1] Implement agent wait state machine service in `apps/api/src/services/agentWait.ts` enforcing transitions `idle→thinking→ready|error|cancelled` and rejecting illegal moves with 409
- [x] T018 [US1] Implement agent HTTP routes in `apps/api/src/routes/agent.ts`: `POST /v1/agent/sessions`, `GET /v1/agent/sessions/{sessionId}`, `POST .../thinking/start`, `POST .../thinking/stop` per `contracts/openapi.yaml` (`ThinkingStopRequest.outcome` `ready|error|cancelled`)
- [x] T019 [US1] Implement SSE broadcaster in `apps/api/src/realtime/agentEvents.ts` and `GET /v1/agent/sessions/{sessionId}/events` emitting `thinking_started`, `thinking_stopped`, `result_ready`, `wait_error`, optional `heartbeat` per `contracts/events.md`
- [x] T020 [P] [US1] Create client hook `apps/web/src/hooks/useAgentWait.ts` that opens EventSource on session events and maps to `{ isThinking, isOpen, completionSignal, resultText, errorMessage }`
- [x] T021 [P] [US1] Create dead-time transition UI `apps/web/src/components/DeadTimeTransition.tsx` that opens on `thinking_started`, shows agent-thinking status (FR-004), supports soft-dismiss without clearing session result
- [x] T022 [US1] Build agent chat page `apps/web/src/pages/AgentPage.tsx` to create session, submit prompt, demo controls for start/stop thinking, subscribe to SSE, and show result after completion (FR-001–003, FR-007)
- [x] T023 [US1] Wire completion banner / return-to-agent affordance in `apps/web/src/components/AgentDoneBanner.tsx` so completion remains visible after soft-dismiss or when overlay resolves
- [x] T024 [US1] Handle short waits and rapid consecutive sessions in `apps/web/src/state/deadTimeStore.ts` so open/close never traps the UI (spec edge cases)

**Checkpoint**: US1 demo works with Scenario A in `quickstart.md` — MVP

---

## Phase 4: User Story 2 - Reach inner circle during dead time (Priority: P2)

**Goal**: During open dead time, user can see and choose inner-circle people; empty circle shows a clear empty state; users can designate circle members

**Independent Test**: With dead time open and preconfigured contacts, list and select a person; with empty circle, empty state is non-broken (quickstart Scenario B)

### Implementation for User Story 2

- [x] T025 [P] [US2] Implement `InnerCirclePerson` persistence in `apps/api/src/db/innerCircle.ts` with constraints: `displayName` required 1–80 chars; `status` enum `available|away|unreachable` default `available`; `sortOrder` non-negative; **max 10 people per ownerUserId**
- [x] T026 [US2] Implement inner-circle service in `apps/api/src/services/innerCircle.ts` enforcing max-10 (409 on overflow) and ordered listing
- [x] T027 [US2] Implement routes in `apps/api/src/routes/innerCircle.ts`: `GET/POST /v1/inner-circle`, `DELETE /v1/inner-circle/{personId}` per OpenAPI
- [x] T028 [P] [US2] Create settings/manage UI `apps/web/src/pages/InnerCirclePage.tsx` to list/add/remove people (FR-010)
- [x] T029 [P] [US2] Create `apps/web/src/components/InnerCircleList.tsx` and empty state `apps/web/src/components/InnerCircleEmpty.tsx` for use inside dead-time surface (FR-005, FR-008)
- [x] T030 [US2] Embed inner-circle list into `apps/web/src/components/DeadTimeTransition.tsx` while thinking status remains visible; completion still signaled if agent finishes while browsing (FR-003)

**Checkpoint**: US1 + US2 satisfy quickstart Scenario B

---

## Phase 5: User Story 3 - Talk with inner circle while the agent thinks (Priority: P3)

**Goal**: Start text talk during dead time; keep agent status visible; when agent finishes mid-talk, notify and preserve agent result; meet stub optional

**Independent Test**: Start talk during dead time, send a message, stop thinking while talk active — completion + return still work (quickstart Scenario C)

### Implementation for User Story 3

- [x] T031 [P] [US3] Implement `TalkSession` / `TalkMessage` persistence in `apps/api/src/db/talk.ts` with `TalkSession.state` enum `active|paused|closed`; message `sender` enum `user|person|system`; `body` 1–4000 chars; optional `agentSessionId` when started during dead time
- [x] T032 [US3] Implement talk service in `apps/api/src/services/talk.ts` for create/get/patch session and append messages; optional demo auto-reply for `person` sender when enabled in config
- [x] T033 [US3] Implement HTTP routes in `apps/api/src/routes/talk.ts`: `POST /v1/talk/sessions`, `GET/PATCH /v1/talk/sessions/{talkSessionId}` per OpenAPI
- [x] T034 [US3] Implement WebSocket endpoint `/v1/talk/ws` in `apps/api/src/realtime/talkWs.ts` with message types `talk.send`, `talk.message`, `talk.state`, `error` per `contracts/events.md`
- [x] T035 [P] [US3] Create client hook `apps/web/src/hooks/useTalk.ts` for session create + WebSocket send/receive
- [x] T036 [P] [US3] Create talk panel UI `apps/web/src/components/TalkPanel.tsx` launched from inner-circle person during dead time; keep agent-thinking status visible (FR-004, FR-006 MUST text)
- [x] T037 [US3] On agent completion while talk active, show non-blocking done signal and allow pause/background talk via `apps/web/src/components/AgentDoneBanner.tsx` + talk `paused` state without discarding agent `resultText` (FR-007, FR-009)
- [x] T038 [P] [US3] Implement meet stub API `POST /v1/meet/stub` in `apps/api/src/routes/meet.ts` and UI affordance `apps/web/src/components/MeetStubButton.tsx` (SHOULD; placeholder launch) per OpenAPI `MeetStub` states `offered|opened|dismissed`

**Checkpoint**: All three stories independently demonstrable; Scenario C (+ optional D) pass

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Demo readiness across stories

- [x] T039 [P] Add minimal Vitest config for API state machine smoke tests in `apps/api/vitest.config.ts` and `apps/api/tests/agentWait.test.ts` (illegal transitions + SSE event order)
- [x] T040 [P] Add README run instructions at repo `README.md` (or `apps/README.md`) for `pnpm install`, `pnpm dev:api`, `pnpm dev:web` from feature worktree
- [x] T041 Unify dead-time aesthetics (transition motion, typography, status chrome) in `apps/web/src/styles/` for hackathon demo scoring
- [x] T042 Run `specs/001-dead-time-circle/quickstart.md` Scenarios A–C (D optional) and fix gaps
- [x] T043 Confirm implement work stays isolated to worktree `/home/david/grok/001-dead-time-circle` and commit feature increments on branch `001-dead-time-circle`

---

## Phase 7: Reliability hardening (Next Implementation Session)

**Purpose**: Encode fed demo findings into contracts-backed behavior — SSE snapshot, orphan cleanup, auto-ready, talk greeting, client error surfacing (see plan.md)

**Independent Test**: Cold API restart + rapid Start thinking opens dead time within ~1s; auto-ready or Stop works; Talk with person shows greeting; second run after crash is not blocked by 409

### Implementation for Phase 7

- [x] T044 [P] Document + keep SSE session snapshot on connect in `apps/api/src/realtime/agentEvents.ts` (`emitSessionSnapshot`) wired from `apps/api/src/routes/agent.ts` per `contracts/events.md`
- [x] T045 [P] Orphan thinking cleanup on boot via `resetOrphanThinking` in `apps/api/src/services/agentWait.ts` + `apps/api/src/index.ts`
- [x] T046 Demo auto-ready via `THINKING_AUTO_MS` in `apps/api/src/config.ts` / `agentWait.ts`; manual stop cancels timer
- [x] T047 [P] Talk opening person greeting in `apps/api/src/services/talk.ts` + deliver on WS connect in `apps/api/src/realtime/talkWs.ts`; hydrate/dedupe in `apps/web/src/hooks/useTalk.ts`
- [x] T048 Client resilience in `apps/web/src/pages/AgentPage.tsx`: single-session ensure, optimistic `onThinkingStarted`, visible action errors
- [x] T049 [P] Refresh `specs/001-dead-time-circle/quickstart.md` + root `README.md` for auto-ready, EADDRINUSE, “add people ≠ inbound popup”
- [x] T050 Vitest coverage in `apps/api/tests/`: SSE snapshot emissions, orphan cancel, auto-ready timer cleared on manual stop

**Checkpoint**: Plan Next Implementation Session exit criteria satisfied

---

## Phase 8: Meet / video-chat verification (US3 SHOULD)

**Purpose**: Replace alert-only meet stub with a verifiable in-app short live meet (local `getUserMedia` + simulated remote tile) per plan.md Meet Verification Session and research.md R11. No full WebRTC mesh.

**Goal**: During dead time, user can start meet with an inner-circle person, see local video (or clear permission-denied state), see a live simulated remote tile, end/dismiss meet, and keep agent result if thinking ends mid-meet (FR-006 SHOULD, FR-007, FR-009).

**Independent Test**: Quickstart Scenario D — from open dead time + talk, **Start meet** opens MeetPanel (not `window.alert` / `meet.example.local`); local preview or denied state; remote reaches `live`; agent completion banner coexists; End/Dismiss leaves talk + agent result intact.

### Tests for Phase 8 (requested by plan/quickstart)

> Write these tests so they fail against the stub, then implement until green.

- [x] T051 [P] [US3] Add Vitest meet coverage in `apps/api/tests/meetSession.test.ts`: create with optional `agentSessionId`/`talkSessionId`; illegal transitions → 409; person-not-found → 404; second concurrent active meet → 409; ending meet does not clear `AgentSession.resultText`

### Implementation for Phase 8

- [x] T052 [P] [US3] Add `MEET_SIMULATED_CONNECT_MS` (default `800`, `0` = immediate) to `apps/api/src/config.ts`
- [x] T053 [P] [US3] Replace `MeetStubSchema` with `MeetSessionSchema` in `packages/shared/src/schemas.ts` matching OpenAPI `MeetSession` (`state` enum `offered|connecting|live|ended|dismissed`; optional `talkSessionId`/`agentSessionId`; `startedAt`/`endedAt` nullable)
- [x] T054 [US3] Evolve SQLite `meet_stubs` → `meet_sessions` in `apps/api/src/db/client.ts` (retire `launch_url`; add `user_id`, `agent_session_id`, `started_at`, `ended_at`, `created_at`, `updated_at`; `state` enum per data-model.md)
- [x] T055 [US3] Implement MeetSession persistence helpers in `apps/api/src/db/meet.ts` (create/get/update; enforce at most one non-terminal meet per user)
- [x] T056 [US3] Implement meet lifecycle service in `apps/api/src/services/meet.ts` enforcing transitions `offered→connecting→live→ended|dismissed` (plus early `dismissed`/`ended` from `offered`/`connecting`); optional auto-advance `connecting→live` after `MEET_SIMULATED_CONNECT_MS`; ending MUST NOT mutate `AgentSession.resultText`
- [x] T057 [US3] Replace stub route with MeetSession HTTP API in `apps/api/src/routes/meet.ts`: `POST /v1/meet/sessions`, `GET/PATCH /v1/meet/sessions/{meetSessionId}` per `contracts/openapi.yaml` (404 person missing; 409 concurrent active / illegal transition)
- [x] T058 [P] [US3] Create client hook `apps/web/src/hooks/useMeet.ts` for create/get/patch MeetSession + acquire/release local `MediaStream` via `getUserMedia` while `connecting|live`; surface permission-denied without crashing
- [x] T059 [P] [US3] Create in-app `apps/web/src/components/MeetPanel.tsx`: local self-view video (audio-only fallback OK); simulated remote tile with person name + connected/`live` status; End and Dismiss controls; clear non-broken permission-denied empty state
- [x] T060 [US3] Wire single **Start meet** CTA from talk in `apps/web/src/pages/AgentPage.tsx` + `apps/web/src/components/TalkPanel.tsx` (`onMeet`); open MeetPanel during dead time; keep agent-thinking status visible; on agent completion mid-meet show `AgentDoneBanner` without auto-killing meet (FR-004, FR-007, FR-009)
- [x] T061 [US3] Retire alert-only stub UX: remove or gut `apps/web/src/components/MeetStubButton.tsx` so Scenario D never depends on `window.alert` or `meet.example.local` launch URLs
- [x] T062 [P] Confirm `specs/001-dead-time-circle/quickstart.md` Scenario D + root `README.md` document meet verification, `MEET_SIMULATED_CONNECT_MS`, and permission allow/deny paths
- [x] T063 Run quickstart Scenario D (and A–C regression) from worktree `/home/david/grok/001-dead-time-circle`; fix gaps until exit criteria in plan.md pass

**Checkpoint**: Meet Verification Session exit criteria satisfied — Scenario D passes; contracts match code; no full WebRTC introduced

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately in feature worktree
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; UX embeds into US1 dead-time surface (US1 overlay should exist first for full demo, but API can proceed after Foundation)
- **User Story 3 (Phase 5)**: Depends on Foundational + benefits from US1 timing + US2 contacts
- **Polish (Phase 6)**: After desired stories complete
- **Reliability (Phase 7)**: After Phase 5–6 as-built; hardening only
- **Meet Verification (Phase 8)**: Depends on Phase 5 talk + Phase 7 reliability still in force; extends US3 SHOULD meet

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on US2/US3
- **US2 (P2)**: After Phase 2 — integrates into US1 overlay for demo; independently testable via API + settings page
- **US3 (P3)**: After Phase 2 — needs a person (US2) and open wait (US1) for full path; talk API independently testable; Phase 8 meet builds on talk CTA

### Within Each User Story

- Persistence → service → routes/realtime → UI hooks/components → page wiring

### Parallel Opportunities

- T003, T005, T006 in Setup
- T009, T011, T012, T014, T015 in Foundational
- T016 || T020/T021 scaffolding after T017–T019 land for full US1
- T025 || T028/T029 after US2 service contracts clear
- T031 || T035/T036 after talk WS contract clear
- T038 meet stub parallel to talk UI polish (superseded by Phase 8)
- T039 || T040 in Polish
- Phase 8: T051 || T052 || T053 scaffolding; T058 || T059 after T057; T062 parallel to T061

---

## Parallel Example: User Story 1

```bash
# After T017–T019 (API wait + SSE) are done, in parallel:
Task: "Create client hook apps/web/src/hooks/useAgentWait.ts"
Task: "Create dead-time transition UI apps/web/src/components/DeadTimeTransition.tsx"
```

---

## Parallel Example: User Story 2

```bash
# After T026–T027:
Task: "Create settings UI apps/web/src/pages/InnerCirclePage.tsx"
Task: "Create InnerCircleList + Empty components under apps/web/src/components/"
```

---

## Parallel Example: Phase 8 Meet Verification

```bash
# After T054–T055 (DB + persistence), in parallel once routes land:
Task: "Create client hook apps/web/src/hooks/useMeet.ts"
Task: "Create MeetPanel apps/web/src/components/MeetPanel.tsx"
Task: "Vitest meetSession.test.ts (can start against failing stub)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: quickstart Scenario A
5. Demo dead-time open/close

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → Scenario A (MVP)
3. US2 → Scenario B
4. US3 → Scenario C (+ meet stub D if time)
5. Polish → aesthetics + smoke tests
6. Phase 7 → reliability hardening
7. Phase 8 → Scenario D meet verification (simulated live)

### Parallel Team Strategy

1. Pair on Setup + Foundational
2. Then: A owns US1 UI, B owns US2 API/settings, C owns US3 talk/WS (after US1 SSE patterns exist)
3. Phase 8: one owner for meet API + panel (depends on talk CTA)

---

## Notes

- [P] = different files, no blocking dependency on incomplete sibling tasks
- Exact paths assume plan structure under `apps/api` and `apps/web`
- Do not fork Chatwoot in these tasks (research.md R1)
- Phase 8: no peer WebRTC / STUN / TURN (research.md R11)
- Constitution: commit and implement inside the feature worktree only
