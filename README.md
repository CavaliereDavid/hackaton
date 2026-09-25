# Dead Time — Inner Circle

Hackathon app: turn agent wait into purposeful dead time with your inner circle.

## Stack

Node + Express API, Vite + React web, pnpm workspace (`virtualStoreType: global`).

## Spec Kit + worktrees

Use Spec Kit and a dedicated pnpm git worktree per feature:

- https://github.com/github/spec-kit
- https://pnpm.io/git-worktrees

Feature worktree for this branch: `/home/david/grok/001-dead-time-circle` (`001-dead-time-circle`).

## Run (from feature worktree)

```bash
pnpm install
pnpm dev:api   # http://localhost:3001
pnpm dev:web   # http://localhost:5173
```

Or `pnpm dev` to run both in parallel.

### Demo path

1. Open **Inner Circle** → add 1–2 people (this alone does not open chat or meet).
2. **Agent** → **Start thinking** (dead-time overlay opens).
3. Talk with someone during the wait; optionally **Start meet** for an in-app short video meet (local camera + simulated remote — not a full WebRTC call).
4. Wait ~8s for auto-ready **or** click **Stop (ready)** → completion banner → return to agent result (meet can stay open until End/Dismiss).

Env:

| Variable | Default | Notes |
|----------|---------|-------|
| `THINKING_AUTO_MS` | `8000` | `0` = manual stop only |
| `TALK_AUTO_REPLY` | on | Set `0` to disable person auto-replies |
| `MEET_SIMULATED_CONNECT_MS` | `800` | Delay before simulated remote is live; `0` = immediate |

Meet expects a camera/mic permission prompt. Deny still shows a clear panel state so the demo does not break.


## Notes

valutazione · esposizione demo · estetica · esperienza ui ux · originalita

Tema: tempo morto — sfruttare l’attesa mentre l’agente pensa (notifiche / pop-up / inner circle).
