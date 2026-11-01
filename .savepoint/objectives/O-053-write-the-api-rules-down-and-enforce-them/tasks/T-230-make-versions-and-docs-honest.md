---
id: T-230
title: Make versions and docs honest
objective: O-053
status: planned
depends_on: [{task: T-229, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: api-review-20261101}
---

# Make versions and docs honest

## Outcome

Package version ranges state what was tested, the docs the review found stale are fixed, README API tables are checked against the types, and the Objective's checks are reconciled into Design (Guardrails API-07; owner D7; O-053 "Honest versions and docs").

## User Check

Not owner-facing; the owner sees the result at the end of the Objective.

## Done When

- Each `astraeus-data*` package's `astraeus` peer range is the engine's current minor (`>=0.7.0 <0.8.0` today, moving with the engine's version), and `check:pack` fails when a data package's peer floor differs from the engine's minor.
- The engine's React peers (`react`, `react-dom`) cover all of React 19 (`>=19 <20`), and a check installs the latest React 19.x into the packed-package consumer and runs it, wired where the release path runs it (`check:pack`, `check:node-consumer` or `.github/workflows/publish.yml`), with evidence of a run.
- The engine exports `./package.json`; the API-surface lock (T-228) updated with it.
- Stale "0.2 preview" banners removed (README, `src/api/index.ts`, `package.json` description if present); the README React `style.css` note corrected (`AstraeusScene` already imports it); README API rows for `mount` and `<AstraeusScene>` include `address`; the doc comments C-136 O3 noted (`mount.ts` and `viewerLink.ts` saying `camera` is undefined before the first frame) corrected.
- A test checks the README API tables against the types: every `MountedScene` member, `MountOptions` key and `AstraeusSceneProps` prop appears in the README table and every README row names a real member.
- CHANGELOG `Unreleased`: the peer changes and the `./package.json` export.
- `.savepoint/Design.md`: the O-053 checks listed (where they live, what they guard) under `Current Technical State` or `Public API shape`, and every Drift Note of this Objective reflected or marked non-architectural with a reason.

## Context Files

`.savepoint/Guardrails.md` under `Public API`, `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`, `packages/astraeus/package.json`, `packages/astraeus-data/package.json`, `packages/astraeus-data-saturn/package.json`, `tools/check-packs.mjs`, `tools/check-node-consumer.mjs`, `.github/workflows/publish.yml`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/viewerLink.ts`, `docs/agents/build.md`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

API-07, API-01, TEST-01, TEST-02, TEST-03; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Data peer ranges and the check:pack rule.
3. React peer range and the latest-19 consumer check.
4. `./package.json` export; doc fixes; README table sync test.
5. CHANGELOG; Design reconciliation of T-228..T-230 drift.

## Boundaries

Never `npm publish` or run `tools/publish-packages.mjs` without `--dry-run`; no version bump (0.8.0 is prepared after O-057).

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`), plus `check:pack` where the check needs packed output. No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: per check, the planted break that made it fail and the clean pass; allowlist entries with reasons; files read/changed; gates.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
