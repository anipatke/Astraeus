---
id: T-240
title: Make the flagged error throws follow the error rule
objective: O-054
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o054-planning-20261101}
---

# Make the flagged error throws follow the error rule

## Outcome

The four F8 error breaks in `src/api/` are gone: every throw there is a `SceneError`, no error is recognised by its message, and a repeated activity id throws `duplicate-id` like every other repeated id (O-054 Success Condition 6).

## User Check

Not owner-facing: the change shows only to a host page's code and its tests. The owner sees the result at the end of the Objective.

## Done When

- `packages/astraeus/src/api/data.ts`: moon positions naming a planet without a moon system throw `SceneError("bad-data", …)` (new code, doc comment: a data package passed to the viewer is malformed) instead of a `RangeError`; a named test proves the code and that the message names the package and the planet.
- `packages/astraeus/src/api/pathProvenance.ts`: the `lineFixedTo` stretch check throws a `SceneError` with code `bad-trajectory`, not a plain `Error`; the existing public message for an empty stretch body is unchanged (test case name recorded).
- `packages/astraeus/src/api/sunOrbit.ts` recognises its two internal faults by type: `core/sunCentredSources.ts` (`fullTurnSpanMs`) and `core/planetModels.ts` (fits that do not cover a moment) throw named error classes declared in `core/` (still `RangeError` subclasses, so existing `instanceof RangeError` callers behave the same); a named test shows a plain `RangeError` whose text says "no full turn" is no longer swallowed, and `packages/astraeus/tests/publicApiSunOrbits.test.ts` still passes.
- A repeated `addActivity` id throws `duplicate-id` (planGroups.ts); the `addActivity` doc comment and the `duplicate-id` doc comment say so; `publicApiActivity.test.ts` "a repeated id" expects `duplicate-id`; `tests/fixtures/scenePin.json` is regenerated with `-u` and `git diff` of it changes only the `"addActivity: repeated id"` entry.
- **Allowlist emptied for O-054:** the three `apiErrors.allowlist.json` entries with `"removedBy": "O-054"` are removed in this change, and `packages/astraeus-site/tests/apiRules.test.ts` (stale-entry and break scans) passes; `grep -c O-054 packages/astraeus-site/tests/*.allowlist.json` prints 0 for every file.
- **Surface recorded:** `npm run api:lock` regenerated `packages/astraeus/api-surface.lock.json`, the README error table regenerated with `npm run api:errors` (the new code has a doc comment in `errors.ts`); `packages/astraeus/CHANGELOG.md` Unreleased has one entry for this step ending in a one-line migration note for app makers (what to change in an app built on 0.7.0); `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/data.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/api/pathProvenance.ts`, `packages/astraeus/src/api/sunOrbit.ts`, `packages/astraeus/src/core/sunCentredSources.ts` under `fullTurnSpanMs`, `packages/astraeus/src/core/planetModels.ts`, `packages/astraeus/src/api/planGroups.ts`, `packages/astraeus/src/api/scene.ts` under `addActivity`, `packages/astraeus/tests/publicApiActivity.test.ts`, `packages/astraeus/tests/publicApiSunOrbits.test.ts`, `packages/astraeus/tests/scenePin.test.ts`, `packages/astraeus-site/tests/apiErrors.allowlist.json`, `packages/astraeus-site/tests/apiRules.test.ts`, `tools/api-rules.mjs` under `errorBreaks`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-054 Objective under `Success Conditions` and `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F8).

## Guardrails

API-05, API-01, ARCH-04, TEST-01, TEST-02, TEST-03, CODE-01, STYLE-06, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Grep `core/` for other catchers of the two internal faults by message; keep `instanceof RangeError` behaviour by subclassing.
3. Add `bad-data` to `SceneErrorCode` with its doc comment; change the data.ts throw; leave the `positions.centre` field name alone (its rename is O-057).
4. Change the pathProvenance throw; keep `planSpans`'s rethrow message the same.
5. Add the two named error classes in `core/`, throw them, and match them by type in `sunOrbit.ts`.
6. Switch the repeated-activity code to `duplicate-id`; update the doc comments, the activity test and the one pin entry.
7. Remove the three allowlist entries; run `npm run api:errors`, `npm run api:lock`, the CHANGELOG entry (migration: an app that catches `bad-activity` for a repeated id catches `duplicate-id`; `bad-data` is new), the O-053 tests and the gates.

## Boundaries

Errors only. The `scene.ts` `startsWith` match stays (O-056 owns it). No rename of `centre` (O-057). No other code changes meaning.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read and changed, and limitations, recorded after the work lands.

## Drift Notes

Record any architecture delta here and name T-249 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
