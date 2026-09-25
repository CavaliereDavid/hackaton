# Feature Specification: M3 Minimal Chat + Instagram Inner Circle

**Feature Branch**: `002-m3-minimal-chat`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "create a new ui in a different worktree using https://m3.material.io/ , the chatbot needs to be claude or gpt like. The inner circle section should look like instagram and open automatically as soon as the user press enter or start prompting the chatbot. Reduce the chatbot functionalities to a minimum"

**Depends on**: Product thesis and API concepts from `001-dead-time-circle` (agent wait → dead-time social surface). This feature is a **UI/UX redesign** delivered in its own worktree; it does not expand agent capability.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Minimal Claude/GPT-like chat shell (Priority: P1)

A first-time demo user sees a Material Design 3 chat surface that feels like Claude or ChatGPT: a calm conversation canvas, a single large prompt field, and assistant/user turns—without toolbars, model pickers, file upload, plugins, or other chat chrome.

**Why this priority**: The new UI must be recognizable as a modern AI chat before dead-time social behavior matters.

**Independent Test**: Open the app with no inner-circle interaction; send one prompt; see user message appear and a thinking/waiting state begin. No secondary chat features are required for the test to pass.

**Acceptance Scenarios**:

1. **Given** the user opens the app, **When** they view the first screen, **Then** they see an M3-styled chat composition (brand/title optional, primary prompt composer, conversation area) and MUST NOT see multi-tool chat chrome (attachments, model selector, sidebar history, plugins, voice, or settings drawers) in the default demo path.
2. **Given** the composer is focused, **When** the user types a prompt and presses Enter (or activates the send control), **Then** the prompt is submitted as a user turn and agent thinking/wait begins.
3. **Given** a prior assistant result exists for the session, **When** thinking completes, **Then** the result appears as an assistant turn in the same conversation canvas.

---

### User Story 2 - Instagram-like inner circle auto-opens on prompt (Priority: P1)

The moment the user starts prompting (Enter/send), an Instagram-like inner circle surface opens automatically so dead time is immediately social—without a separate “open dead time” control.

**Why this priority**: Auto-open on prompt is the core UX change requested for this feature; it replaces relying on a delayed or separate transition trigger in the user’s mental model.

**Independent Test**: With a seeded inner circle, submit a prompt; within a short moment, the Instagram-style inner circle is visible and browsable while the agent wait is active.

**Acceptance Scenarios**:

1. **Given** the user has at least one inner-circle person, **When** they press Enter/send on a non-empty prompt, **Then** the Instagram-like inner circle section opens automatically (stories/avatar strip and/or feed-style people cards) without requiring a second click.
2. **Given** the inner circle is open during agent wait, **When** the user browses people, **Then** agent-wait status remains visible so they understand the chat is still thinking.
3. **Given** the inner circle is empty, **When** a prompt starts wait, **Then** the surface still opens with a non-broken empty state (and a path to manage/add people that may live outside the minimal chat chrome).

---

### User Story 3 - Talk from the Instagram-like surface during wait (Priority: P2)

From the open Instagram-like inner circle, the user can open a minimal text talk with one person while the agent thinks, then return to the assistant result when ready.

**Why this priority**: Preserves the dead-time product payoff; depends on P1 auto-open + minimal chat.

**Independent Test**: Start a prompt → inner circle opens → pick a person → exchange at least one text message → see agent completion and return to the assistant turn.

**Acceptance Scenarios**:

1. **Given** dead-time/inner-circle is open from a prompt, **When** the user selects a person, **Then** a minimal talk thread opens (message list + composer only).
2. **Given** the user is in talk, **When** the agent finishes, **Then** completion is signaled and the assistant result remains available in the chat canvas.
3. **Given** the user closes talk, **When** wait is still active, **Then** they remain on the Instagram-like inner circle until wait ends, unless they soft-dismiss the surface (allowed); if soft-dismissed, completion MUST still notify and the assistant result MUST remain available in the chat canvas.

---

### Edge Cases

- User presses Enter on an empty prompt (MUST NOT open inner circle or start thinking).
- User submits a second prompt while a wait is already active → **no-op** (FR-012); wait and open surface unchanged.
- Inner circle opens before SSE connects (optimistic open on successful submit MUST be allowed; reconnect must reconcile).
- Agent wait ends very quickly (under ~2s) while the Instagram surface is animating open → surface MAY finish open then immediately show completion / allow return to chat; MUST NOT drop the assistant result (FR-008).
- Soft-dismiss of inner circle while thinking continues; completion MUST still notify.
- Talk still open when assistant result arrives.
- Network interruption during wait or talk → show a non-fatal error/reconnect affordance; on restore, reconcile wait snapshot (open/close + status) and talk history; do not invent a second wait.
- Rapid consecutive prompts after prior wait closed → each non-empty submit starts a new wait + auto-open (FR-004).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present a Material Design 3 (https://m3.material.io/) visual system for the chat and inner-circle surfaces (color roles, typography, shape, and elevation consistent with M3—not Material Design 2 defaults).
- **FR-002**: System MUST provide a Claude/GPT-like chat shell limited to: conversation transcript (user + assistant turns), a single prompt composer, send/Enter submit, and wait/result presentation.
- **FR-003**: System MUST NOT include, in the default demo chat shell: model picker, attachment/upload, tool/plugin marketplace, conversation history sidebar, voice input, regenerate/branch controls, or other non-essential chat amenities (management of inner circle MAY live on a separate minimal screen).
- **FR-004**: When the user submits a non-empty prompt via Enter or send, the system MUST start agent thinking/wait and MUST automatically open the Instagram-like inner circle surface.
- **FR-005**: The Instagram-like inner circle MUST present people primarily via avatar-forward UI (stories-style highlight row and/or profile/feed-style cards), not a plain text list as the primary affordance.
- **FR-006**: While the inner circle is open during wait, the system MUST keep agent-wait status visible (FR parity with dead-time awareness).
- **FR-007**: Users MUST be able to start a minimal text talk with a selected inner-circle person during the open surface; short meet MAY remain a stub.
- **FR-008**: System MUST preserve and display the agent outcome in the chat transcript when thinking ends, even if talk is active.
- **FR-009**: System MUST handle empty inner circle with a non-broken empty state when the surface auto-opens.
- **FR-010**: Users MUST still be able to curate who is in the inner circle (small set) without expanding the chat shell’s feature set.
- **FR-011**: This feature MUST be developed in its own pnpm git worktree on branch `002-m3-minimal-chat`, separate from `001-dead-time-circle`.
- **FR-012**: While an agent wait is active, submitting another non-empty prompt MUST NOT start a second concurrent wait. For the demo default, the system MUST ignore/no-op that submit (composer non-submitting or equivalent) while wait status remains visible; it MUST NOT replace the active session. Rapid prompts after a wait has closed MUST behave like a normal new submit (FR-004).

### Key Entities

- **Chat Turn**: A user or assistant message in the minimal transcript; user turns are created on prompt submit; assistant turns are created from agent results.
- **Agent Wait**: Period from prompt-driven thinking start to thinking stop. Drives auto-open eligibility, wait-status UI, and completion signal. Soft-dismiss MAY hide the Instagram surface while wait continues; wait end MUST still notify and MUST preserve the assistant transcript turn (FR-008).
- **Instagram Inner Circle Surface**: The auto-opened social overlay/section styled like Instagram (avatars/stories/feed cards) hosting inner-circle browse + talk entry.
- **Inner Circle / Inner-Circle Person / Talk Session**: Same product meanings as `001-dead-time-circle` (curated close people; text talk during wait).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In at least 95% of local demo runs, submitting a non-empty prompt opens the Instagram-like inner circle within 1 second of Enter/send.
- **SC-002**: A first-time demo user can submit a prompt, see the Instagram-like surface, and start talk with a seeded contact in under 60 seconds.
- **SC-003**: In a short checklist review, at least 8 of 10 reviewers agree the chat feels “Claude/GPT-like” and the people surface feels “Instagram-like” (avatar-forward), and agree the chat chrome is minimal (no model picker/attachments/history sidebar in the default path).
- **SC-004**: When the agent finishes while the user is in talk, 100% of test runs still show the assistant result in the chat transcript without losing that result.
- **SC-005**: Default chat shell exposes ≤3 primary interactive controls for chatting (composer text field, send/Enter, and at most one wait/result return dismiss control)—excluding inner-circle/talk controls that appear only after prompt submit.

## Assumptions

- Material Design 3 refers to the design language at https://m3.material.io/ (color roles, type, motion, components). Implementation may use official Material Web components and/or M3 tokens in CSS; a pure Material Design 2 library without M3 theming is insufficient.
- “Claude or GPT like” means conversational layout and restraint, not integration with Anthropic/OpenAI APIs. Agent responses remain mockable/demo-driven as in feature 001 unless a later feature adds a real LLM.
- “Instagram like” means visual/interaction metaphor (avatar stories strip, profile tiles, feed cards)—not Instagram API, Reels, shopping, or full social graph.
- “Reduce chatbot functionalities to a minimum” overrides any prior UI that exposed demo debug controls as primary chrome; demo-only controls (e.g. force stop) MUST be secondary/hidden or developer-only.
- Backend wait/talk contracts from `001-dead-time-circle` are the preferred reuse target; this feature’s primary delta is client UX + M3 presentation. If the 002 worktree baseline lacks the as-built API, implementation MUST port or sync that API before UI polish.
- Only one primary Instagram/dead-time surface is shown per foreground wait.
- Soft-dismiss of the social surface while thinking continues remains allowed; completion MUST still be notifiable.
- Hackathon aesthetics/UX scoring is a first-class quality goal for this redesign.
