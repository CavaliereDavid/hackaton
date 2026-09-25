<!--
Sync Impact Report
- Version change: (template placeholders) → 1.0.0
- Modified principles:
  - [PRINCIPLE_1_NAME] → I. Spec-Kit First
  - [PRINCIPLE_2_NAME] → II. One Feature, One Worktree
  - [PRINCIPLE_3_NAME] → III. Spec Before Code
  - [PRINCIPLE_4_NAME] → IV. Worktree Isolation
  - [PRINCIPLE_5_NAME] → V. Keep It Shipable
- Added sections: Feature Delivery Rules, Development Workflow
- Removed sections: none (scaffold placeholders replaced)
- Follow-up TODOs: none
-->

# Hackaton Constitution

## Core Principles

### I. Spec-Kit First
Every feature MUST be created and advanced through Spec Kit
(https://github.com/github/spec-kit). Agents MUST use the Spec Kit skill
commands (`/speckit-specify`, `/speckit-plan`, `/speckit-tasks`,
`/speckit-implement`, and related commands) rather than inventing an ad-hoc
delivery path. Spec and plan artifacts under `.specify/` and `specs/` are the
source of truth for scope.

Rationale: Shared, reviewable specs keep hackathon work aligned and
prevent silent scope drift across worktrees.

### II. One Feature, One Worktree
Each feature MUST be developed in its own pnpm git worktree
(https://pnpm.io/it/git-worktrees). Do not implement multiple unrelated
features in the same worktree. Create the worktree when the feature branch is
created; remove or archive it when the feature is merged or abandoned.

Rationale: Isolated worktrees keep Spec Kit feature branches independent and
reduce merge/checkout conflicts during parallel agent work.

### III. Spec Before Code
No implementation work MAY begin until the feature has at least a written
spec (via `/speckit-specify`) and an agreed plan/tasks path for that
worktree. Clarifications MUST be encoded back into the spec before coding
continues.

Rationale: Forces explicit problem framing (especially for agent/time and
UX themes) before code locks in assumptions.

### IV. Worktree Isolation
A feature worktree MUST contain only that feature's branch, Spec Kit
artifacts for that feature, and changes required to deliver it. Shared
mainline changes that are not feature-specific MUST go through a separate
governed change (docs, constitution, tooling) on the default branch or a
dedicated chore branch—not smuggled into an unrelated feature worktree.

Rationale: Preserves clean PR history and makes reviews map 1:1 to a
single Spec Kit feature.

### V. Keep It Shipable
Prefer the smallest vertical slice that can be demoed. Complexity MUST be
justified in the plan. Do not add speculative abstractions, unused
packages, or parallel experimental forks inside an active feature worktree
without a new Spec Kit feature (and worktree) of their own.

Rationale: Hackathon scoring rewards working demos and clear UX over
incomplete architecture.

## Feature Delivery Rules

- Feature creation sequence MUST be: Spec Kit feature scaffold → pnpm
  worktree for that feature branch → specify → plan → tasks → implement.
- pnpm MUST be the package manager for workspace and worktree operations
  when dependencies are involved.
- Feature naming and numbering follow Spec Kit project settings
  (`feature_numbering: sequential` unless amended here).
- Evaluating or forking third-party apps (e.g. chat clients) is a product
  decision: capture it in a feature spec; do not treat research as a
  substitute for Spec Kit + worktree delivery of the chosen slice.

## Development Workflow

1. Start a feature with Spec Kit (`/speckit-specify` or create-new-feature
   scripts under `.specify/scripts/`).
2. Create a pnpm git worktree bound to that feature branch before editing
   application code.
3. Run `/speckit-plan` and `/speckit-tasks` in that worktree context.
4. Implement only the active feature's tasks; open a PR from the feature
   branch.
5. After merge (or abandon), clean up the worktree.

Quality gate: a PR that adds product behavior without a corresponding Spec
Kit feature path and dedicated worktree history is non-compliant unless
explicitly waived in the PR description with constitution rationale.

## Governance

This constitution supersedes informal chat guidance and README notes when
they conflict on *how* work is delivered. Product ideas in `README.md`
are inputs to specs, not overrides of these rules.

Amendments:
- Propose changes by editing `.specify/memory/constitution.md` and bumping
  **Version** per semantic versioning (MAJOR: remove/redefine principles;
  MINOR: add/expand principles or sections; PATCH: clarifications only).
- Set **Last Amended** to the amendment date (ISO `YYYY-MM-DD`).
- Keep **Ratified** as the original adoption date.
- PRs and agent runs MUST verify Spec Kit usage and worktree isolation for
  feature work.

Compliance review: before marking a feature complete, confirm the spec,
plan/tasks, and worktree/branch mapping still match what was shipped.

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
