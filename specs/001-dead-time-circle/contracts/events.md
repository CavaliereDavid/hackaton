# Realtime Contracts: Dead Time Inner Circle

## SSE — Agent wait lifecycle

**Endpoint**: `GET /v1/agent/sessions/{sessionId}/events`  
**Content-Type**: `text/event-stream`

Client MUST open this stream when an agent session is active (or about to think). Dead-time UI MUST react to events below within the SC-001 timing budget on a local demo.

### Subscribe snapshot (required)

Immediately after the client is registered on the stream, the server MUST emit a **snapshot** of the current `AgentSession` state so late subscribers do not miss open/close:

| Current `state` | Snapshot emissions (in order) |
|-----------------|-------------------------------|
| `idle` | (none beyond optional `heartbeat`) |
| `thinking` | `thinking_started` |
| `ready` | `thinking_stopped` (`outcome=ready`) then `result_ready` |
| `error` | `thinking_stopped` (`outcome=error`) then `wait_error` |
| `cancelled` | `thinking_stopped` (`outcome=cancelled`) |

Clients MAY also optimistically open dead time on HTTP `200` from `POST .../thinking/start`; snapshot/SSE remain the source of truth for reconnect.

### Event: `thinking_started`

```text
event: thinking_started
data: {"sessionId":"<uuid>","startedAt":"<iso-8601>"}
```

**UI effect**: Open dead-time transition; show “agent thinking” status (FR-002, FR-004).

### Event: `thinking_stopped`

```text
event: thinking_stopped
data: {"sessionId":"<uuid>","stoppedAt":"<iso-8601>","outcome":"ready"|"error"|"cancelled"}
```

**UI effect**: Signal completion; keep return-to-agent available (FR-003, FR-007).

### Event: `result_ready`

```text
event: result_ready
data: {"sessionId":"<uuid>","resultText":"<string>"}
```

Emitted after `thinking_stopped` when `outcome=ready`. Payload MUST match persisted session result.

### Event: `wait_error`

```text
event: wait_error
data: {"sessionId":"<uuid>","errorMessage":"<string>"}
```

Emitted when thinking ends in `error` (or unexpected failure).

### Event: `heartbeat`

```text
event: heartbeat
data: {"ts":"<iso-8601>"}
```

Optional keep-alive every ~15s.

### Demo auto-ready

When `THINKING_AUTO_MS` > 0, the API MAY emit the normal `thinking_stopped` + `result_ready` sequence after that delay without a client stop call. Manual `POST .../thinking/stop` MUST cancel the pending timer.

## WebSocket — Talk messages

**URL**: `ws://localhost:3001/v1/talk/ws?talkSessionId=<uuid>`

### Client → server

```json
{ "type": "talk.send", "body": "hello" }
```

### Server → client

```json
{ "type": "talk.message", "message": { "id": "<uuid>", "talkSessionId": "<uuid>", "sender": "user"|"person"|"system", "body": "hello", "createdAt": "<iso-8601>" } }
```

```json
{ "type": "talk.state", "state": "active"|"paused"|"closed" }
```

```json
{ "type": "error", "code": "validation"|"not_found"|"closed", "message": "…" }
```

### Opening greeting (demo)

On `POST /v1/talk/sessions`, the API SHOULD persist an initial `person` message. On WebSocket connection, the server SHOULD emit that message via `talk.message` if the client has not already loaded it via `GET /v1/talk/sessions/{id}`. Clients MUST dedupe by `message.id`.

### Demo auto-reply (MVP)

For hackathon demos without a second human client, the API MAY emit a `person` auto-reply shortly after a `user` message so talk is demonstrable single-handed. Document this behavior in quickstart; disable via env (`TALK_AUTO_REPLY=0`) if a second client is used.

## Dead-time UI contract (frontend)

| Condition | Required UI |
|-----------|-------------|
| `thinking_started` (or successful start + optimistic open) | Dead-time surface opens automatically |
| Surface open | Inner circle visible (or empty state) |
| Talk active + thinking | Status still shows agent waiting |
| Meet active + thinking | Status still shows agent waiting; meet panel remains usable |
| `thinking_stopped` / `result_ready` | Non-blocking completion banner; agent result preserved (even if meet is live) |
| Soft dismiss while thinking | Surface hidden; completion still toast/banner capable |
| Return to agent | Focus returns to agent result without deleting talk/meet session (pause/end/background OK) |
| HTTP error on start/stop | Visible error copy (no silent failure) |
| Inner circle managed in settings | Does **not** by itself open talk or meet popups |
| Start meet | In-app MeetPanel opens (not an external URL alert); local video preview after permission; simulated remote tile when `live` |
| Camera/mic denied or unavailable | Clear non-broken state; user can dismiss meet; dead time + agent wait continue |
| End / dismiss meet | Meet panel closes; talk (if any) and agent result remain |

## Meet session notes

- Meet is **simulated live** for the demo: real local `getUserMedia` preview + simulated remote person presence. No peer WebRTC signaling channel in this slice.
- Server MAY auto-advance `connecting → live` after `MEET_SIMULATED_CONNECT_MS`, or the client MAY PATCH to `live` after local media is ready; either path MUST be documented in quickstart.
- Retire stub-only UX (`window.alert` + `meet.example.local` launch URLs).

