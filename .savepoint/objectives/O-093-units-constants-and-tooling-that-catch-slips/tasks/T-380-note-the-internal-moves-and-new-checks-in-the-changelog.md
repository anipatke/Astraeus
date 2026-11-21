---
id: T-380
title: Note the internal moves and new checks in the changelog
objective: O-093
status: done
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

Extra reads: `packages/astraeus/README.md` ("What it holds", "How a demo plugs in", reason: T-370 drift, named by the brief); `eslint.config.js`, `.prettierignore`, `.prettierrc`, root `package.json` scripts, `core/constants.ts`, `core/bodies/moon.ts` (to check each doc claim); T-370/T-374 evidence (numbers). Parked-branch recipe omitted per the brief (O-085 merged); one general sentence kept.

| Done When | Evidence |
|---|---|
| Changelog lines (packed size, internal subpaths, Moon limitation; nothing for internal types/constants) | Three lines added to `## 0.10.0 (proposed)`; numbers from T-370 (679 to 663 files, 7.25 to 7.24 MB packed, 9.33 to 9.29 MB unpacked); Moon wording matches `moon.ts` knownLimitations |
| Breaking-changes line with migration | One line added to `### Breaking changes in 0.10.0` |
| build.md lint bullet and formatting bullet | Rules match `eslint.config.js`; scripts match root `package.json`; scope matches `.prettierignore`; one general sentence instead of the parked-branch recipe |
| Gates | `gateLimits.test.ts` 11 passed; lint, typecheck, build clean; `npm test` 313 files, 5085 passed, 2 skipped |

Also fixed README "What it holds" rows (removed `src/experiences/`, `src/synthetic/`; added `src/presentation/`, `tests/synthetic/`) and the "How a demo plugs in" example path. Files changed: packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, docs/agents/build.md, this Task file. Limitation: the Moon changelog line says accuracy is stated over the 2022 to 2025 samples (validUtc in moon.ts).

## Drift Notes

None. (T-370's README drift is fixed here.)

Coordinator (orchestrate-g024-20261121): gates green (lint, typecheck, build; `npm test` 313 files, 5085 passed). O-085 merged before this Task, so the parked-branch recipe was replaced by one general sentence (coordinator brief). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
