---
id: T-426
title: Public site built once per check
objective: O-094
status: planned
depends_on: [{task: T-424, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-426, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on, merge when clear" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:12:54Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
---

# Public site built once per check

## Outcome

The owner's ticked cut P06 (docs/evidence/test-cost/proposals.json): when a browser run has just built the public site, `check:public-build` reuses that build for its two file checks instead of building again; with no browser build to reuse it builds as today.

## User Check

None.

## Done When

1. `tools/check-public-build.mjs` accepts an existing build (a path the browser runner prints or records, e.g. `--from <dir>` or an env var) and verifies it is the build of the current head (record how: commit id stamp written by the runner's build, refused when it differs or is missing, then it builds itself). The runner (`packages/astraeus-site/tools/validate/runner.mjs` `buildPublicSite`) records where it built and for which commit.
2. Named test cases (in the existing test file for check-public-build, found by name) prove: reuses a matching build; rebuilds when the stamp is missing or for another commit; plain run unchanged.
3. build.md's public-build gate line says how to reuse (one sentence), and the Full Check order lists the browser run before check:public-build so reuse happens.
4. Measured gate time with and without reuse.
5. Focused gates per builder rules; no browser run (the reuse path is proved with a build made by calling the runner's build function directly, or a fixture build dir).

## Context Files

`docs/evidence/test-cost/proposals.json` (P06), `tools/check-public-build.mjs`, `packages/astraeus-site/tools/validate/runner.mjs`, `docs/agents/build.md` (public-build gate line only).

## Design References

None.

## Guardrails

TEST-01, TEST-03.

## Implementation Plan

1. Read both files; add the stamp on build and the reuse path.
2. Add the named cases.
3. One sentence in build.md (coordinate: the rules Task also edits build.md — edit only the public-build gate line and the Full Check order line, and say so in evidence).
4. Measure.

## Boundaries

No change to what the two file checks assert. No browser runs.

## Technical Verification

Focused gates; the coordinator's combined gate; the Full Check uses the reuse.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
