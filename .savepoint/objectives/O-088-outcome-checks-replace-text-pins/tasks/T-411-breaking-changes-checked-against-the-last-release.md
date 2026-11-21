---
id: T-411
title: Breaking changes checked against the last release
objective: O-088
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-411, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: release-breaks
planned_reads: [tools/api-surface.mjs, packages/astraeus/api-surface.lock.json]
planned_writes: [packages/astraeus-site/tests/migrationTable.test.ts, packages/astraeus-site/tests/fixtures/api-surface-0.7.0.json, packages/astraeus-site/tests/releaseBreaks.test.ts, packages/astraeus-site/tests/fixtures/api-surface-previous.json, packages/astraeus/CHANGELOG.md, docs/RELEASING.md]
---

# Breaking changes checked against the last release

## Outcome

The API-01 migration check compares today's public surface with the last release instead of 0.7.0, and asks that every removed or changed public name be named in the open version's "Breaking changes" list. The 0.7.0 to 0.8.0 table stays as history and is no longer parsed, so later changes are no longer forced into it (AH-33 "the migration ... tests guard history"; C-197 observation: the 0.10.0 `ScalePolicy.id` row had to sit in the 0.7.0 to 0.8.0 table, `CHANGELOG.md` ~281).

## User Check

None visual. `npx vitest run packages/astraeus-site/tests/releaseBreaks.test.ts` passes; the 0.7.0 to 0.8.0 table no longer carries a "From 0.10.0" row.

## Done When

- `packages/astraeus-site/tests/fixtures/api-surface-previous.json` holds `{ "version": "0.9.5", "root": ... }`, the `root` taken from the released lock (`git show 55295278:packages/astraeus/api-surface.lock.json`, the 0.9.5 release commit; the tag `v0.9.5` is on origin but not fetched locally, so use the commit). Record the command.
- New `packages/astraeus-site/tests/releaseBreaks.test.ts` (reusing the surface comparison of `migrationTable.test.ts`: `brokenNames`, `canonical`, `holds`, `namesIn`, moved, not copied twice):
  - the fixture's version equals the newest dated `## x.y.z (date)` heading of `packages/astraeus/CHANGELOG.md` (a stale fixture fails, naming the refresh command);
  - when the top heading is an open version (no date, for example `## 0.10.0 (proposed)`), every name in `brokenNames(previous, lock)` is named (backticked) in that section's `### Breaking changes in <version>` list, or is in a short `NOT_BREAKING` map with a reason (each entry must be a real difference, as `WIDENED` was);
  - when there is no open version, the lock's surface equals the fixture's (a change after a release must open a new section);
  - a planted case: a made-up surface change that no line names fails, and a widened entry with no real difference fails.
- The changelog is read by headings only (project rule): the test finds the top section and the newest dated heading; it never reads older sections.
- `packages/astraeus/CHANGELOG.md`: the `ScalePolicy.id` "From 0.10.0 (O-083)" row (~281, inside `### Migration from 0.7.0 to 0.8.0`) is removed from that table; the 0.10.0 "Breaking changes" `ScaleId` line names `ScalePolicy.id` itself and no longer says "see the migration table". Any other name the new test reports missing from the 0.10.0 list is added there in the section's one-line style, or put in `NOT_BREAKING` with its reason; each addition is listed in evidence.
- Deleted: `packages/astraeus-site/tests/migrationTable.test.ts`, `packages/astraeus-site/tests/fixtures/api-surface-0.7.0.json`.
- `docs/RELEASING.md` "Each release" step 3 gains one sentence: refresh the previous-release surface in the release commit, with the exact command (a `node -e` or `node tools/api-surface.mjs` one-liner that writes `{version, root}` from the current lock; no new npm script).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tests/migrationTable.test.ts` (whole: the logic to move)
- `tools/api-surface.mjs` (`readLock` and the lock format only)
- `packages/astraeus/CHANGELOG.md`: the top section (`## 0.10.0 (proposed)` through the line before `## 0.9.5`, found with `grep -n '^## '`), and line ~281 of the 0.7.0 to 0.8.0 table only (named here as the one older line this Task changes)
- `docs/RELEASING.md` under `Each release`

## Design References

`.savepoint/Design.md` under `O-053 checks (Guardrails API-01 to API-07)` (the Public surface lock bullet).

## Guardrails

API-01, TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Write the fixture from the 0.9.5 commit.
2. Move the comparison helpers into the new test; write the four rules and the planted case.
3. Run; reconcile every reported name with the 0.10.0 Breaking changes list or `NOT_BREAKING`.
4. Move the `ScalePolicy.id` row; delete the old test and fixture.
5. The RELEASING sentence; gates.

## Boundaries

No change to the lock, `tools/api-surface.mjs` or `apiSurface.test.ts`. The 0.7.0 to 0.8.0 table text stays as history except the one moved row. No version bump (the owner's release step).

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/releaseBreaks.test.ts packages/astraeus-site/tests/apiSurface.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Expected: `.savepoint/Design.md` Public surface lock bullet names `migrationTable.test.ts` and `api-surface-0.7.0.json`; the planner rewrites it.
