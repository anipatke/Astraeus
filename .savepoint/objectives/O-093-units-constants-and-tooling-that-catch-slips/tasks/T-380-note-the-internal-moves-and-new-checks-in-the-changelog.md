---
id: T-380
title: Note the internal moves and new checks in the changelog
objective: O-093
status: planned
depends_on: [{task: T-370, requires: clear}, {task: T-374, requires: clear}, {task: T-377, requires: clear}, {task: T-378, requires: clear}, {task: T-379, requires: clear}]
check_waiver: {task: T-380, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: docs
planned_reads: [packages/astraeus/package.json]
planned_writes: [packages/astraeus/CHANGELOG.md, docs/agents/build.md]
---

# Note the internal moves and new checks in the changelog

## Outcome

The `## 0.10.0 (proposed)` section of the engine changelog says what a host or contributor can notice from O-093, and the build guide describes the lint rules and the formatter, before the reformat lands.

## User Check

None visual. Read the new changelog lines and the build guide's lint and formatting bullets.

## Done When

- `packages/astraeus/CHANGELOG.md`, newest section only (read with `grep -n '^## '`, per the Project Rules): one line each for: the engine package no longer ships the made-up test scenes (packed size before and after from draft 01); the internal subpaths `astraeus/synthetic/*` and `astraeus/experiences/*` are gone and `astraeus/presentation/*` is new (internal subpaths, outside the public API, per the package's `x-internal-exports` note); the Moon card states its time-scale limitation (draft 05). Nothing for internal types or constants, which a host cannot see.
- If any line is a change a 0.9.5 host could notice, it is added to `### Breaking changes in 0.10.0` with a one-line migration (planner's view: only a host deep-importing the internal subpaths, which `x-internal-exports` already says may change; list it there for honesty).
- `docs/agents/build.md` "Lint gate" bullet: ESLint with `complexity` at 20, the two React hooks rules, the engine constants rule and unused-directive reporting, and that Prettier formats code (scope as `.prettierignore`), with `npm run format` to apply it. The formatting bullet also says how to bring a branch made before the reformat across (the recipe in the plan's Decision 1), written as steps.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/CHANGELOG.md` (the `## 0.10.0 (proposed)` section only)
- `docs/agents/build.md` (the "Lint gate" bullet and the gate table)
- Drafts 01, 05, 08, 09 and 10's Technical Evidence (numbers to quote)

## Design References

None beyond the build guide.

## Guardrails

API-07, STYLE-10.

## Implementation Plan

1. Read the newest changelog section; add the lines.
2. Update the build guide's lint bullet and add the formatting bullet.
3. Gates.

## Boundaries

No version bump. No edits to older changelog sections. The gate-limit table changes only in draft 12, if a measured lint time requires it.

## Technical Verification

`npx vitest run packages/astraeus-site/tests/gateLimits.test.ts` (the table check), then `quality_gates`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
