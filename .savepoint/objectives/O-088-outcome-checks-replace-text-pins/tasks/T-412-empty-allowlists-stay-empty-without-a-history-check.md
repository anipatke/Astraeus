---
id: T-412
title: Empty allowlists stay empty without a history check
objective: O-088
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-412, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: allowlists
planned_reads: [packages/astraeus-site/tests/apiOutsideTypes.allowlist.json, packages/astraeus-site/tests/apiTypeLint.allowlist.json, packages/astraeus-site/tests/apiErrors.allowlist.json, packages/astraeus-site/tests/apiSettings.allowlist.json, packages/astraeus-site/tests/apiIsolation.allowlist.json, packages/astraeus-site/tests/packageBoundaries.test.ts]
planned_writes: [packages/astraeus-site/tests/allowlistGrowth.test.ts]
---

# Empty allowlists stay empty without a history check

## Outcome

The allowlist growth check stops comparing the five API allowlists with git `main` where there is nothing left to grow from: the break sections that are now empty are held empty directly, and the git comparison is kept only for the permanent sections and the deep-import counts, which still hold entries (AH-33 "the ... allowlist-growth tests guard history"; Gemini: "`git show main` on 5 now-empty allowlists").

## User Check

None visual. `npx vitest run packages/astraeus-site/tests/allowlistGrowth.test.ts` passes, and a planted entry in an empty break section fails without git.

## Done When

- Today's state recorded in evidence: `apiOutsideTypes.entries` 0, `apiTypeLint.breaks` 0, `apiErrors.breaks` 0, `apiSettings.addressOnly` 0, `apiIsolation.breaks` 0 (all empty); `apiTypeLint.unitless` 18 (3 with owner approval) and `exceptions` 3 (permanent); `apiSettings.public` 18 (resolved mappings, never counted); `DEEP_IMPORT_COUNTS` apollo11 125, showers 61.
- The break sections are held empty by a case that reads the files directly (no git): any entry in `entries`, `breaks` or `addressOnly` fails unless it carries `approved: { by: "owner", at, reason }`, naming the file, section and entry. It runs in a shallow checkout too.
- The git comparison with `ALLOWLIST_BASE` (default `main`) remains only for `apiTypeLint`'s permanent sections (`unitless`, `exceptions`) and `DEEP_IMPORT_COUNTS`; the per-file loop over the other four files is gone. The made-up-data case keeps its existing rows unchanged and gains rows for the empty-section rule (an unapproved entry fails, an owner-approved one passes).
- ARCH-06 is not reduced: the `src/api/` body-name allowlist is not one of these five files and is not touched (recorded).
- Planted break, recorded then reverted: add one made-up entry to `apiErrors.allowlist.json` `breaks`; the new case fails with git unavailable (`ALLOWLIST_BASE=no-such-ref`).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tests/allowlistGrowth.test.ts` (whole: the subject)
- The five `*.allowlist.json` files (section names and counts only, by a JSON query)
- `packages/astraeus-site/tests/packageBoundaries.test.ts` (`DEEP_IMPORT_COUNTS` block only)

## Design References

`.savepoint/Design.md` under `O-053 checks (Guardrails API-01 to API-07)` (the "Allowlist growth counted per finding" bullet).

## Guardrails

API-03, API-04, API-05, API-06, ARCH-06, TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Record the counts.
2. Add the empty-section case; narrow the git loop to the permanent sections and the counts.
3. Extend the made-up table; planted break; revert.
4. Focused run, gates.

## Boundaries

Test file only; allowlist files unchanged (the planted entry is reverted). No change to `packageBoundaries.test.ts` or `tools/api-rules.mjs`.

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/apiRules.test.ts`, and the allowlist test again with `ALLOWLIST_BASE=no-such-ref`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Expected: the Design "Allowlist growth counted per finding" bullet gains one clause (empty break sections held empty directly); the planner reconciles.
