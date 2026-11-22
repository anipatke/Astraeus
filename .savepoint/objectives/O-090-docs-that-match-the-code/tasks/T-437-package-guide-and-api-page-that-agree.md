---
id: T-437
objective: O-090
title: Package guide and API page that agree
status: planned
depends_on: [{task: T-436, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-437, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, packages/astraeus/README.md, packages/astraeus/package.json, packages/astraeus-site/tools/site/api-reference.mjs, tools/api-rules.mjs, packages/astraeus-site/tests/apiRules.test.ts, packages/astraeus/src/api/index.ts]
planned_writes: [packages/astraeus/README.md, packages/astraeus-site/tools/site/api-reference.mjs]
---

# Package guide and API page that agree

## Outcome

Owner plan step 3, engine README and generated API reference. The engine README keeps install, the first scene, React and headless use, lifecycle and errors, optional data packages and links; "Bodies and paths" and "Looks, controls and views" are reviewed first; unique guidance moves to the API doc comments or a linked guide before anything is cut; the module tour ("Working on the engine in the repository" onward) becomes one contributor link that works from npm (absolute GitHub URL). The generated API reference drops the hard-coded "0.2 preview" lead and reads the version from the engine's package.json at generation; symbol and error coverage stay. The README error table and API tables that `apiRules.test.ts` checks stay valid.

## User Check

A package user builds a first scene from the packed README and finds an advanced option through one link.

## Done When

| Item | Evidence |
|---|---|
| API page lead has no hard-coded version; the version comes from the manifest; a new test case proves the lead names the manifest version and contains no "preview" | vitest |
| `apiRules.test.ts` green (error table, API-07 tables) | vitest |
| Every engine-README cut has a home or a recorded reason | table |
| Links in the engine README work from npm (no repo-relative links outside the package) | command |
| Packed README inspected (`npm pack --dry-run -w astraeus` lists it); quick-start code matches current exports (snippet typechecked or the covering example test cited) | evidence |
| Before/after word count | wc -w |

## Context Files

T-434 Technical Evidence; `docs/README.md`; `packages/astraeus/README.md` (whole: this Task rewrites it); `packages/astraeus/package.json`; `packages/astraeus-site/tools/site/api-reference.mjs` around the `lead:` line and its callers; `tools/api-rules.mjs` (README sections); `packages/astraeus-site/tests/apiRules.test.ts`; the site test covering api-reference.mjs (find by grep, log it).

## Design References

Design `Decisions` → `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap). API-07.

## Implementation Plan

1. Fix the API lead: read the version from packages/astraeus/package.json; add a test case.
2. Review the two named README sections; move unique guidance; then trim reference-style sections that repeat the generated API page, linking to it.
3. Replace the module tour with one absolute contributor link.
4. Run `npm run api:errors` and confirm the generated table is unchanged; run the tests.

## Boundaries

No public API change; doc comments change only to receive moved guidance. Existing test setup unchanged. Data packages' READMEs untouched unless the T-434 list names them.

## Technical Verification

typecheck; eslint and prettier on changed files; `npx vitest run packages/astraeus-site/tests/apiRules.test.ts` plus the api-reference test file; `npm run api:errors` leaves no diff.

## Technical Evidence

Pending execution.

## Drift Notes

Pending.
