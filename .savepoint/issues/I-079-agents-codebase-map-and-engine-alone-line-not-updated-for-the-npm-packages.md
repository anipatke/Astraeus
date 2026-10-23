---
id: I-079
title: AGENTS.md Codebase Map and engine-alone line not updated for the npm packages
type: drift
status: in_progress
source:
  kind: check
  check: C-107
  actor: {role: checker, session: o036-full-check-20261023}
  at: '2026-10-23T08:14:48Z'
tasks: [T-161, T-162]
checks: [C-107]
severity: low
history:
  - at: '2026-10-23T08:14:48Z'
    actor: {role: checker, session: o036-full-check-20261023}
    kind: observed
    note: Found by the O-036 Full Objective Check (C-107); T-162 Done When (AGENTS.md describes the packages and commands) and the Deferred Design reconciliation project rule.
    check: C-107
  - at: '2026-10-23T08:30:56Z'
    actor: {role: executor, session: o036-repair-20261023}
    kind: repair_attempted
    note: "Owner decision 2026-10-23: \"Fix all three, short recheck (Recommended)\". Repair in AGENTS.md: Codebase Map rows added for packages/astraeus-data, the six astraeus-data-<planet> packages and examples/hello-scene; the packages/astraeus row no longer says \"shipped as source\" (workspace uses source, tools/build-packages.mjs compiles to dist/); the tools/ row names build-packages, check-packs, publish-packages and build-example; the engine-alone line no longer says the engine has no build. Also C-107 notes: README astraeus-data size now \"about 39 MB\" (38.6 MB measured); .github/workflows/publish.yml now fails the job when npm is older than 11.5.1 (was only printed). Checked by reading the diff and running packages/astraeus-site publishWorkflow.test.ts inside npm test (pass). The publish workflow's real run is not exercised here. Left in_progress for the recheck."
---

# I-079: AGENTS.md Codebase Map and engine-alone line not updated for the npm packages

## Summary

T-161's second drift note asked for Codebase Map rows for `astraeus-data*`. T-162's evidence says it updated "`AGENTS.md` (Build lines, Codebase Map rows)", but only one Build line was added (diff 7498e7a3..HEAD). The AGENTS.md Codebase Map still has no row for the seven data packages or `examples/hello-scene`. It still describes `packages/astraeus/` as "shipped as source", and `tools/` as "Root only: check-engine-alone.mjs and tools/lint/". The four new tools (`build-packages`, `check-packs`, `publish-packages`, `build-example`) are not listed. AGENTS.md:139 still says "The engine has no build of its own." Design's Components row is accurate. The stale part is the agent guide, and the evidence claim about it is not true.

## Evidence

- `git diff 7498e7a3..HEAD -- AGENTS.md`: one added line (Package gates). Nothing changed in the Codebase Map.
- AGENTS.md Codebase Map rows for `packages/astraeus/` and `tools/`, and AGENTS.md:139.

## Proof Needed

The AGENTS.md Codebase Map has rows for `packages/astraeus-data`, the six `astraeus-data-<planet>` packages and `examples/hello-scene`. The engine and `tools/` rows name the compiled build and the new root tools. The engine-alone line no longer says the engine has no build. These edits stay outside the Savepoint-managed block, or within it as the project allows.
