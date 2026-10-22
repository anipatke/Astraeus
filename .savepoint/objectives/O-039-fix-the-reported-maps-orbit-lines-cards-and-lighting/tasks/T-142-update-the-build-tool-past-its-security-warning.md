---
id: T-142
title: Update the build tool past its security warning
objective: O-039
status: done
check_waiver:
  task: T-142
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the recheck of C-096 covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T11:24:09Z'
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: 8d73d3f8}
lane: deps
planned_reads: [.savepoint/issues/I-066-vite-8-3-2-carries-a-high-severity-advisory.md, package.json, package-lock.json]
planned_writes: [package.json, package-lock.json]
---

# Update the build tool past its security warning

## Outcome

Vite moves from 8.3.2 to the latest 8.3 patch (8.3.5 or later 8.3.x) if that release clears the high-severity advisory, with every gate green (I-066; owner 2026-10-22: "Try the small update now").

## User Check

None; the recheck's health snapshot shows the result.

## Done When

- The advisories named in I-066 are looked up (GHSA pages or `npm audit`) and the evidence says which 8.3.x release fixes each, if any.
- If a patch fixes the high one: `package.json` and `package-lock.json` updated to it with `npm install vite@<version>` (no other dependency changes beyond what that pulls), `npm audit` output recorded before and after, and lint, typecheck, build, `npm run test:full` and a public build all pass.
- If no 8.3.x patch fixes it: no change, and the evidence says so plainly for the owner to decide (accept or a bigger upgrade).

## Context Files

`.savepoint/issues/I-066-vite-8-3-2-carries-a-high-severity-advisory.md`, `package.json`, `package-lock.json`.

## Design References

None.

## Guardrails

SEC guardrails as listed in `.savepoint/Guardrails.md`; STYLE-10.

## Implementation Plan

1. Look up each advisory's fixed version.
2. Update only if a patch release fixes the high one; run every gate.

## Boundaries

Patch release within 8.3 only; no major or minor upgrades; no other dependency bumps by hand. Do not touch the typescript-eslint parser shim or npm overrides.

## Technical Verification

Configured gates plus `npm run test:full` and a public build. Evaluated by the recheck's health snapshot.

## Technical Evidence

Advisories (GitHub advisory API): all six findings against vite 8.3.2 are fixed in vite 8.3.3 (GHSA-587h-7wmj-h5pm, GHSA-698v-4r3x-3vcv and GHSA-r825-w8mm-5pxw are the launch-editor ones, patched in vite 8.3.3 and launch-editor 2.14.2; the other three npm audit reported, GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22, GHSA-vfpm-58rq-9qcg, also 8.3.3). Latest 8.3.x is 8.3.5, installed with `npm install --save-exact vite@8.3.5` (exact pin kept, as before).

`npm audit` before (vite 8.3.2): 1 high severity vulnerability (vite 8.3.0 - 8.3.2, six advisories above). After (vite 8.3.5): found 0 vulnerabilities.

Changes: package.json (vite 8.3.2 -> 8.3.5) and package-lock.json (vite plus the rolldown packages it pulls; no other manual bumps; typescript-eslint shim and overrides untouched).

Gates, from a lane with its own `npm ci` node_modules: lint pass; typecheck pass; build pass (under flock); `npm run test:full` 99 files, 1335 passed, 1 skipped, 0 failures (junit tests=1336 failures=0); public build (ASTRAEUS_PUBLIC_BUILD=1 vite build to a scratch outDir under /tmp) then `node tools/validate/public-build-assets.mjs`: ok true, 102 checked.

Owner look on preview: pending. Nothing visual should change; open localhost:5490 after the merge and confirm the app still loads and the planets demo shows Jupiter.

## Drift Notes

None expected.
