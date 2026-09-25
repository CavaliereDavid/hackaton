# Feature Specification: Dead Time Inner Circle

**Feature Branch**: `001-dead-time-circle`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "the theme is dead time and we want a transition that open when the agent thinking start until it stops. During this time the user can interact with their inner circle and talk."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dead-time transition opens and closes with agent thinking (Priority: P1)

While waiting for an AI agent to think, the user sees a clear dead-time transition surface that opens when thinking starts and ends when thinking stops, so the wait is visible and purposeful instead of empty idle time.

**Why this priority**: Without reliable start/stop of the dead-time window, inner-circle interaction has no trigger and the theme cannot be demonstrated.

**Independent Test**: Simulate agent thinking start and stop; verify the transition opens within a short moment of start and closes (or offers return) when thinking ends, with no inner-circle contacts required.

**Acceptance Scenarios**:

1. **Given** the user has an active agent session that is not thinking, **When** the agent begins thinking, **Then** the dead-time transition opens automatically and clearly indicates that wait time is available for other activity.
2. **Given** the dead-time transition is open, **When** the agent stops thinking and a result is ready, **Then** the user is notified that the agent is done and can return to the agent result without losing awareness of completion.
3. **Given** agent thinking is very short (under a couple of seconds), **When** thinking starts and stops quickly, **Then** the transition still opens and closes gracefully without trapping the user in a broken state.

---

### User Story 2 - Reach inner circle during dead time (Priority: P2)

During the open dead-time transition, the user can see and reach people in their inner circle so the wait becomes social time rather than passive waiting.

**Why this priority**: Inner-circle access is the product differentiator of the dead-time theme; it depends on P1 timing.

**Independent Test**: With dead time open and a preconfigured inner circle, the user can list contacts and open a conversation or meet entry point for one contact.

**Acceptance Scenarios**:

1. **Given** the dead-time transition is open and the user has at least one inner-circle person, **When** the user views the dead-time surface, **Then** they see their inner circle and can choose someone to engage with.
2. **Given** the dead-time transition is open and the inner circle is empty, **When** the user views the surface, **Then** they see a clear empty state and a way to add or designate at least one close person later (adding may be deferred if not in this slice, but empty state MUST NOT look broken).
3. **Given** the user is browsing inner-circle options in dead time, **When** the agent finishes thinking, **Then** completion is still signaled and returning to the agent remains available.

---

### User Story 3 - Talk with inner circle while the agent thinks (Priority: P3)

During dead time, the user can talk with a chosen inner-circle person (message and/or short live meet) so the wait feels productive and human.

**Why this priority**: Talking is the payoff of dead time; it builds on P1–P2 and can be demoed after timing and contact access work.

**Independent Test**: From an open dead-time session, start a talk session with one inner-circle contact and exchange at least one message or join a short meet, then return to the agent when thinking ends.

**Acceptance Scenarios**:

1. **Given** dead time is open and an inner-circle contact is available, **When** the user chooses to talk with them, **Then** a talk session starts without leaving the user unsure whether the agent is still thinking.
2. **Given** the user is mid-talk during dead time, **When** the agent stops thinking, **Then** the user is notified of completion and can finish or pause the talk before returning; the system MUST NOT silently discard the agent result.
3. **Given** the user declines or closes talk, **When** dead time is still active, **Then** they remain on the dead-time surface until thinking ends or they choose to dismiss/return early if allowed.

---

### Edge Cases

- Agent thinking starts again immediately after a previous dead-time window closed (rapid consecutive waits).
- User dismisses or minimizes the dead-time surface while the agent is still thinking.
- Talk or meet is still active when agent thinking ends.
- Network interruption during dead time or during talk.
- Inner-circle contact is unreachable or does not respond during the wait window.
- Agent errors or cancels thinking without a normal completion.
- Multiple agent sessions competing for dead-time focus (only one primary dead-time window at a time).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect when agent thinking starts and when it stops for the user's active agent wait.
- **FR-002**: System MUST open a dead-time transition surface automatically when agent thinking starts.
- **FR-003**: System MUST end or resolve the dead-time transition when agent thinking stops, including a clear completion signal to the user.
- **FR-004**: System MUST keep the user aware that an agent wait is in progress while the dead-time surface is open (status remains visible during inner-circle interaction).
- **FR-005**: Users MUST be able to view their inner circle from the dead-time transition while it is open.
- **FR-006**: Users MUST be able to start a text talk with a selected inner-circle person during dead time. Users SHOULD also be able to start a short live meet with that person when meet capability is available in the demo slice.
- **FR-007**: System MUST preserve the agent outcome when thinking ends even if the user is engaged in talk, and MUST allow the user to return to that outcome.
- **FR-008**: System MUST handle empty inner circle with a non-broken empty state during dead time.
- **FR-009**: System MUST allow the user to return focus to the agent result after thinking stops without requiring them to abandon awareness of an active talk (e.g., return with talk paused or clearly backgrounded).
- **FR-010**: Users MUST be able to designate who belongs to their inner circle (small, intentional set of close people) outside or alongside dead time so the feature is usable more than once.

### Key Entities

- **Agent Wait**: A period bounded by thinking start and thinking stop for the user's current agent interaction; drives dead-time open/close.
- **Dead-Time Transition**: The user-facing wait experience that opens for an Agent Wait and hosts inner-circle actions.
- **Inner Circle**: The user's curated set of close people available during dead time.
- **Inner-Circle Person**: A member of the Inner Circle with enough identity to start talk.
- **Talk Session**: A conversation or short meet between the user and an Inner-Circle Person during (or overlapping) dead time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In at least 95% of simulated agent waits, the dead-time transition opens within 1 second of thinking start and shows a completion signal within 1 second of thinking stop.
- **SC-002**: A first-time demo user can open dead time and start a talk with an inner-circle person in under 60 seconds when an inner circle is already configured.
- **SC-003**: At least 90% of test users correctly understand that dead time is available because the agent is thinking (verified by a short post-demo question).
- **SC-004**: When the agent finishes while the user is in talk, 100% of test runs still surface the agent completion and allow return to the result without data loss of that result.
- **SC-005**: Users rate the dead-time wait as more useful than an empty spinner in a simple A/B or preference check with at least 8 of 10 demo participants preferring the dead-time experience.

## Assumptions

- "Agent thinking" means the product's AI agent is actively working on the user's request and the user is waiting for a result (not background jobs unrelated to the user).
- The product is an interactive app (chat/agent UI) where wait periods are common; forking or embedding a full third-party chat platform is out of scope for this feature slice unless chosen later in planning.
- Inner circle is a small, user-curated list of close people (not the full contact book by default).
- "Talk" for MVP means text conversation; short live meet is a desirable extension when feasible for the demo, not a blocker for P1–P2.
- Only one primary dead-time transition is shown at a time for the foreground agent wait.
- Users may soft-dismiss the surface while thinking continues; thinking completion MUST still be notifiable.
- Hackathon evaluation criteria (demo, aesthetics, UX, originality) apply as quality goals for the experience, not as separate functional requirements.
