---
id: T-415
title: Engine checked against the newest three.js in its peer range
objective: O-091
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-415, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T23:30:07Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: three
planned_reads: [tools/check-engine-alone.mjs, tools/check-react-consumer.mjs, packages/astraeus/package.json, packages/astraeus/tests/patchedShaders.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, docs/agents/build.md]
planned_writes: [tools/check-engine-alone.mjs, tools/check-react-consumer.mjs, package.json, docs/agents/build.md]
# Only when the newest three fails (Done When, narrowing): packages/astraeus/package.json, package-lock.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md
---

# Engine checked against the newest three.js in its peer range

## Outcome

`npm run check:three-newest` type-checks, lints and tests the engine (including the patched-shader test, `packages/astraeus/tests/patchedShaders.test.ts`, O-085 T-366) against the newest three.js that the engine's own peer range admits, and the peer range in `packages/astraeus/package.json` is kept only as wide as that check proves (owner, G-024 decision 7: "Test newest, narrow if it fails"; AH-37: Claude §I.5/peer ranges, Gemini PKG-03; Guardrail API-07 "Peer ranges state what was tested").

## User Check

None visual. `npm run check:three-newest` prints the three and `@types/three` versions it tested and passes.

## Done When

- `tools/check-engine-alone.mjs` takes `--three <version|newest>` (no flag: unchanged behaviour, byte-for-byte the same steps):
  - `newest` resolves to the highest version the engine's `peerDependencies.three` (read from `packages/astraeus/package.json`, never hard-coded) admits on the registry (`npm view "three@<range>" version --json`, highest by `semver`); a literal version must satisfy the range or the check exits non-zero naming both.
  - `@types/three` is the newest published version with the same `0.<minor>` (`npm view "@types/three@~0.<minor>.0" version --json`); if none exists, the newest `@types/three` overall, and the check says so.
  - One `npm install --no-save --ignore-scripts --no-audit --no-fund --prefix <scratch>/.peers three@<v> @types/three@<t> @react-three/fiber@<root installed version> react@<root installed> react-dom@<root installed>` into a folder inside the scratch copy. Those five names are linked from that prefix instead of from the root `node_modules`, so every package that imports three (the engine copy and Fiber) and every package that imports React resolves the same single copy (PLAN.md decision 5). The check fails if `npm ls three --prefix <scratch>/.peers` shows more than one three.
  - Before the steps it prints `three <v> (REVISION <n>), @types/three <t>`, the REVISION read by importing `three` from inside the scratch copy (so the linked copy, not the root one, is proved to be the one loaded).
  - The steps are the existing typecheck, lint, test of the copy.
- Root `package.json` gains `"check:three-newest": "node tools/check-engine-alone.mjs --three newest"`.
- `tools/check-react-consumer.mjs` also prints the installed `three` version on its `installed:` line (it already installs three from the registry through the peer range); no new failure condition.
- Run `npm run check:three-newest` (needs network) and record the versions, step times and result.
  - **Passes:** the peer range stays `>=0.169.0 <1`; record the proved pair (0.169 locked, newest `<v>`). The release workflow re-proves it against the then-newest three before each publish (draft 04 adds the step; PLAN.md decision 4).
  - **Fails:** record the failing step and first errors. Find the highest passing minor `M` by running `node tools/check-engine-alone.mjs --three 0.<m>.<latest patch>` over minors from newest downwards (or bisecting; record each run). Set `packages/astraeus/package.json` `peerDependencies.three` to `>=0.169.0 <0.<M+1>.0`; update `package-lock.json` with `npm install --package-lock-only --ignore-scripts` (record that the lock diff is the engine workspace's peer entry only); `packages/astraeus/README.md` line ~13 "`three` (0.169 or later)" says the new upper bound; one line under `## 0.10.0 (proposed)` at the top of `packages/astraeus/CHANGELOG.md` (read only that section). Rerun `npm run check:three-newest`: it now tests `0.<M>.x` and passes. A failure only in `@types/three` (typecheck) counts as a failure: consumers compile against those types (PLAN.md decision 6). The cause is written as a Drift Note for the coordinator to capture as an Issue (fixing the engine for newer three is out of scope).
- `docs/agents/build.md` "Engine-alone gate" bullet (line ~9) gains one sentence: `npm run check:three-newest` runs the same copy against the newest three in the peer range (network; when it runs: release workflow, and any Objective that changes shaders, three usage or the three peer range); it states the range rule (kept only as wide as this check proves).
- A unit test is not added for the npm resolution (network); the version-choosing logic, if more than a one-line `semver.maxSatisfying`, is a small exported function with a table test on literal version lists in `packages/astraeus-site/tests/` (STYLE-02, STYLE-03).
- Gates per `docs/agents/verification.md`, plus `npm run check:engine-alone` (no flag) still passes unchanged.

## Context Files

- `tools/check-engine-alone.mjs` (whole; ~100 lines)
- `tools/check-react-consumer.mjs` (the `installed:` report, ~lines 100–115; `latestReact19` for the `npm view` pattern)
- `packages/astraeus/package.json` (`peerDependencies`, lines 10–15)
- `packages/astraeus/tests/patchedShaders.test.ts` (header comment only: what it proves)
- `docs/agents/build.md` (Engine-alone gate bullet)

## Design References

`.savepoint/Design.md` `Decisions` > `O-053 checks (Guardrails API-01 to API-07)` ("Honest versions and docs").

## Guardrails

API-07 (peer range states what was tested), STYLE-07 (the range is read from the manifest, not repeated), STYLE-05, STYLE-10, CODE-01.

## Implementation Plan

1. Add the flag and the prefix install to `check-engine-alone.mjs` (keep the no-flag path identical; branch only where `three`, `@types/three`, Fiber, React, React DOM are linked).
2. Script entry; the three version line in `check-react-consumer.mjs`.
3. Run the check; then the pass or narrow branch.
4. build.md sentence; gates; `npm run check:engine-alone`.

## Boundaries

No change to engine source or tests (a failure is reported, not fixed); no change to the data packages' peers (G-024 decision 6, at release) or to `examples/*/package.json` (`^0.169.0` stays: examples prove the locked version). No workflow edits (drafts 01, 02, 04). Not a timed gate: `tools/gate-limits.json` and `time-gates.mjs` unchanged (PLAN.md decision 7). Never publish.

## Technical Verification

`npm run check:three-newest` (record versions and result), `npm run check:engine-alone` (unchanged path), `npm run check:react-consumer` (new three line), any new focused test; handoff `quality_gates`. No browser run (PLAN.md owner question 4 covers a one-off browser proof).

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
