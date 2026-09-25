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

### MeetStub (optional / SHOULD)

| Field | Type | Rules |
|-------|------|-------|
| id | string (UUID) | Required |
| talkSessionId | string (UUID) | Optional link |
| personId | string (UUID) | Required |
| state | enum(`offered`, `opened`, `dismissed`) | Required |
| launchUrl | string | Optional placeholder URL |

## Relationships

```text
DemoUser 1──* InnerCirclePerson
DemoUser 1──* AgentSession
DemoUser 1──* TalkSession
InnerCirclePerson 1──* TalkSession
AgentSession 0..1──* TalkSession (via agentSessionId)
TalkSession 1──* TalkMessage
```

## Integrity rules

1. Starting talk during dead time SHOULD attach `agentSessionId` when an AgentWait is open.
2. Completing an AgentSession MUST persist `resultText` / error before UI return (FR-007).
3. Deleting an InnerCirclePerson MUST close or block new talk sessions for that person.
4. Soft-dismiss of dead time MUST NOT clear AgentSession result.
