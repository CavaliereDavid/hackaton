# Data Model: Dead Time Inner Circle

**Feature**: `001-dead-time-circle`  
**Date**: 2026-09-25

## Entities

### DemoUser

Represents the single (or few) demo profile(s) using the app.

| Field | Type | Rules |
|-------|------|-------|
| id | string (UUID) | Required, immutable |
| displayName | string | Required, 1–80 chars |
| createdAt | datetime | Required |

**Notes**: Auth is out of scope for MVP; a default seeded user is acceptable.

### InnerCirclePerson

A curated close contact available during dead time.

| Field | Type | Rules |
|-------|------|-------|
| id | string (UUID) | Required |
| ownerUserId | string (UUID) | FK → DemoUser |
| displayName | string | Required, 1–80 chars |
| handle | string | Optional unique-per-owner slug/label |
| avatarUrl | string | Optional URL |
| status | enum(`available`, `away`, `unreachable`) | Default `available` |
| sortOrder | integer | Non-negative; used for list order |
| createdAt | datetime | Required |

**Validation**:
- Max **10** people per `ownerUserId` (FR-010 small intentional set).
- `displayName` required; empty circle allowed (FR-008).

### AgentSession

One agent interaction that may enter a thinking wait.

| Field | Type | Rules |
|-------|------|-------|
| id | string (UUID) | Required |
| userId | string (UUID) | FK → DemoUser |
| prompt | string | Required (user request text) |
| state | enum(`idle`, `thinking`, `ready`, `error`, `cancelled`) | Required |
| resultText | string | Nullable until `ready` |
| errorMessage | string | Nullable |
| thinkingStartedAt | datetime | Nullable; set on enter `thinking` |
| thinkingStoppedAt | datetime | Nullable; set on leave `thinking` |
| createdAt | datetime | Required |
| updatedAt | datetime | Required |

**State transitions**:

```text
idle → thinking → ready
idle → thinking → error
idle → thinking → cancelled
ready|error|cancelled → (terminal for this session; new wait = new session or restart only via explicit API)
```

Only **one** foreground session per user may be in `thinking` at a time (spec edge case).

**Operational rules** (reliability):
- On API process start, any session still in `thinking` MUST be moved to `cancelled` (orphan cleanup) so a new demo run is not blocked by HTTP 409.
- Demo MAY schedule an automatic `thinking → ready` transition after a configured delay (`THINKING_AUTO_MS`); cancelling/stopping thinking MUST clear that timer.
- Illegal transitions remain 409; clients MUST surface those errors.

### AgentWait (derived / projected)

Not necessarily a separate table; projection of an `AgentSession` while `state === thinking` or during completion handoff.

| Field | Type | Rules |
|-------|------|-------|
| sessionId | string | FK → AgentSession |
| openedAt | datetime | = thinkingStartedAt |
| closedAt | datetime | = thinkingStoppedAt when set |
| completionSignal | enum(`none`, `ready`, `error`, `cancelled`) | Drives UI banner |

### DeadTimeTransition (client + server projection)

UI/session facade over the active AgentWait.

| Field | Type | Rules |
|-------|------|-------|
| sessionId | string | Required |
| isOpen | boolean | True while thinking, or until user acknowledges completion if configured |
| statusLabel | string | e.g. “Agent is thinking…” / “Agent is ready” |
| softDismissed | boolean | User hid surface; completion still notifiable |

### TalkSession

A text talk between the user and one inner-circle person, often started during dead time.

| Field | Type | Rules |
|-------|------|-------|
| id | string (UUID) | Required |
| userId | string (UUID) | FK → DemoUser |
| personId | string (UUID) | FK → InnerCirclePerson |
| agentSessionId | string (UUID) | Optional FK → AgentSession that was active at start |
| state | enum(`active`, `paused`, `closed`) | Default `active` |
| createdAt | datetime | Required |
| closedAt | datetime | Nullable |

### TalkMessage

| Field | Type | Rules |
|-------|------|-------|
| id | string (UUID) | Required |
| talkSessionId | string (UUID) | FK → TalkSession |
| sender | enum(`user`, `person`, `system`) | Required |
| body | string | Required, 1–4000 chars |
| createdAt | datetime | Required |

### MeetSession (SHOULD — verifiable short live meet)

Replaces the earlier `MeetStub` placeholder. Represents a short in-app meet with an inner-circle person during (or overlapping) dead time.

| Field | Type | Rules |
|-------|------|-------|
| id | string (UUID) | Required |
| userId | string (UUID) | FK → DemoUser |
| personId | string (UUID) | FK → InnerCirclePerson; required |
| talkSessionId | string (UUID) | Optional FK → TalkSession |
| agentSessionId | string (UUID) | Optional FK → AgentSession active at start |
| state | enum(`offered`, `connecting`, `live`, `ended`, `dismissed`) | Required |
| startedAt | datetime | Nullable; set when entering `connecting` or `live` |
| endedAt | datetime | Nullable; set on `ended` / `dismissed` |
| createdAt | datetime | Required |
| updatedAt | datetime | Required |

**State transitions**:

```text
offered → connecting → live → ended
offered → connecting → live → dismissed
offered → connecting → ended | dismissed   (user cancels before live)
offered → dismissed
connecting → dismissed
```

**Client-side (not persisted)**:
- Local `MediaStream` from `getUserMedia` while state is `connecting` | `live`.
- Simulated remote presence flag (true once server/client reaches `live` after optional connect delay).

**Validation**:
- At most **one** non-terminal meet (`offered` | `connecting` | `live`) per user at a time.
- `personId` must belong to the user's inner circle.
- Ending/dismissing meet MUST NOT mutate `AgentSession.resultText`.

**Migration note**: Existing `meet_stubs` table/rows MAY be renamed or replaced by `meet_sessions`; stub `launchUrl` is retired (no external placeholder URL required).

## Relationships

```text
DemoUser 1──* InnerCirclePerson
DemoUser 1──* AgentSession
DemoUser 1──* TalkSession
DemoUser 1──* MeetSession
InnerCirclePerson 1──* TalkSession
InnerCirclePerson 1──* MeetSession
AgentSession 0..1──* TalkSession (via agentSessionId)
AgentSession 0..1──* MeetSession (via agentSessionId)
TalkSession 1──* TalkMessage
TalkSession 0..1──* MeetSession (optional link)
```

## Integrity rules

1. Starting talk during dead time SHOULD attach `agentSessionId` when an AgentWait is open.
2. Completing an AgentSession MUST persist `resultText` / error before UI return (FR-007).
3. Deleting an InnerCirclePerson MUST close or block new talk sessions for that person, and MUST end/dismiss any active MeetSession for that person.
4. Soft-dismiss of dead time MUST NOT clear AgentSession result.
5. Creating a TalkSession for demo SHOULD insert one initial `person` TalkMessage (greeting); delivery to the client MUST occur after WebSocket subscribe (and/or via GET history) so messages are not lost to connect races.
6. Soft-dismiss / return MUST NOT require inbound contact popups; talk and meet remain user-initiated from the dead-time surface.
7. Starting meet during dead time SHOULD attach `agentSessionId` when an AgentWait is open; meet MAY outlive thinking stop (FR-009 style).
8. Only one active MeetSession per user; creating another while `offered|connecting|live` MUST 409 or end the prior session explicitly.
