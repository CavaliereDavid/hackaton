# Realtime Contracts: Dead Time Inner Circle

## SSE — Agent wait lifecycle

**Endpoint**: `GET /v1/agent/sessions/{sessionId}/events`  
**Content-Type**: `text/event-stream`

Client MUST open this stream when an agent session is active (or about to think). Dead-time UI MUST react to events below within the SC-001 timing budget on a local demo.

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
{ "type": "error", "code": "validation"|"not_found"|"closed", "message": "<string>" }
```

### Demo auto-reply (MVP)

For hackathon demos without a second human client, the API MAY emit a `person` auto-reply shortly after a `user` message so talk is demonstrable single-handed. Document this behavior in quickstart; disable via env if a second client is used.

## Dead-time UI contract (frontend)

| Condition | Required UI |
|-----------|-------------|
| `thinking_started` | Dead-time surface opens automatically |
| Surface open | Inner circle visible (or empty state) |
| Talk active + thinking | Status still shows agent waiting |
| `thinking_stopped` / `result_ready` | Non-blocking completion banner; agent result preserved |
| Soft dismiss while thinking | Surface hidden; completion still toast/banner capable |
| Return to agent | Focus returns to agent result without deleting talk session (pause/background OK) |
