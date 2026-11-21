---
id: T-348
title: Refuse date-time text that does not say its time zone
objective: O-083
status: done
depends_on: []
check_waiver: {task: T-348, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:22:41Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: time
planned_reads: [packages/astraeus/src/core/storyPanels.ts, packages/astraeus/src/core/fieldReaders.ts, packages/astraeus/src/core/state.ts, packages/astraeus-site/tests/addressNavigation.test.ts]
planned_writes: [packages/astraeus/src/core/timeInput.ts, packages/astraeus/src/api/time.ts, packages/astraeus/src/app/viewLink.ts, packages/astraeus/tests/timeText.test.ts]
---

# Refuse date-time text that does not say its time zone

## Outcome

A moment given as text means one instant for every visitor: date-time text must end in `Z` or a `±HH:MM` offset, and text without one is refused with `bad-time` instead of being read in the visitor's local zone. Date-only text (`"2026-08-12"`) keeps its meaning, midnight UTC (AH-25; Claude CQ-7; owner decision 6).

## User Check

None visual. `scene.setTime("2026-08-12T21:00:00")` throws `bad-time` whose message says to add `Z` or an offset; `"2026-08-12T21:00:00Z"`, `"2026-08-12T21:00:00+10:00"` and `"2026-08-12"` are accepted and give the same milliseconds in any `TZ`.

## Done When

- `core/timeInput.ts` `timeInputMs` accepts text only in these forms (planner decision, PLAN.md): `YYYY-MM-DD` (midnight UTC), or `YYYY-MM-DDTHH:MM`, optional `:SS`, optional `.fraction`, then `Z` or `±HH:MM`. Any other text (zone-less date-time, `Date.parse`'s free forms such as `"Aug 12 2026"`) gives NaN. Numbers and `Date`s unchanged. It stays the one conversion every moment input goes through, so `toUtcMs` and story panels' `at.time` (`core/storyPanels.ts`) both follow it.
- `api/time.ts` `toUtcMs`: zone-less date-time text gets its own `bad-time` message naming the fix (add `Z` for UTC or an offset); the generic message stays for other bad text.
- The page address `t` (`app/viewLink.ts` `timeFromSearch`) reads through `timeInputMs`, so a zone-less `t` is ignored like any unreadable one (it writes ISO `Z` text already).
- `TimeInput`'s doc comment (core and `api/time.ts`) states the accepted text forms.
- New `tests/timeText.test.ts`: one table over accepted and refused texts through `toUtcMs`, `scene.setTime`, `setTimeline` start/end and a story panel `at.time` (`bad-panels`); each accepted row gives the expected UTC milliseconds independent of the process zone (run the table under at least two `process.env.TZ` values, e.g. `UTC` and `Australia/Sydney`, or assert against `Date.UTC`). Show the zone-less rows failing (accepted) first.
- Search the repository's sources, data and tests for zone-less date-time text passed as a moment (`grep -rnE "[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+[\"'\`]"` and the address tests); planner search found none outside expected-output strings in `showersYearHorizons.test.ts`; record the result. Existing tests unchanged and green, including `addressNavigation` and `entryChoice`.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/timeInput.ts`
- `packages/astraeus/src/api/time.ts`
- `packages/astraeus/src/core/storyPanels.ts` (around line ~129, `at.time`)
- `packages/astraeus/src/app/viewLink.ts` (`timeFromSearch`, line ~58)
- `packages/astraeus/src/core/fieldReaders.ts` (`ISO_UTC_INSTANT`, line ~7, for consistency only)

## Design References

`.savepoint/Design.md` under `Decisions`: `Public API shape (G-016, owner 2026-11-01)` (the `Names and shapes as built` bullet: inputs vs reported times).

## Guardrails

API-04, API-05, STYLE-06, STYLE-07, TEST-01..04.

## Implementation Plan

1. Write `timeText.test.ts`; show zone-less rows accepted today.
2. Replace the bare `Date.parse` with a form check, then `Date.parse` on the checked text.
3. Add the specific `bad-time` message; route `timeFromSearch` through `timeInputMs`.
4. Run the repository search; focused tests; gates.

## Boundaries

No change to the `TimeInput` type, to numbers or `Date`s, to the record readers that already demand `...Z` (`fieldReaders`, elements records), or to the displayed time zone (`setLook({ time })`). README and CHANGELOG wording goes to the docs Task.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/timeText.test.ts packages/astraeus-site/tests/addressNavigation.test.ts packages/astraeus/tests/publicApi.test.ts`. Handoff: `quality_gates`. No browser run (browser scripts pass `Z` text; confirm with the search above).

## Technical Evidence

| Done When | Evidence |
|---|---|
| `timeInputMs` accepts only date-only / zoned date-time forms | `tests/timeText.test.ts` table (7 accepted, 8 refused rows) x 6 entry points x 3 process zones; zone-less and free-form rows were seen failing (accepted) before the change |
| `toUtcMs` specific `bad-time` message, generic kept | `timeText.test.ts` message tests |
| Page address `t` reads through `timeInputMs` | `timeFromSearch` rows in the table; `addressNavigation` green |
| `TimeInput` doc comments state the forms | `core/timeInput.ts`, `api/time.ts` |
| New table test over toUtcMs, setTime, setTimeline start/end, story panel at.time, page `t`, TZ UTC/Sydney/LA | `timeText.test.ts` |
| Repo search for zone-less text | `grep -rnE "[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+[\"'\`]"` over the repo (excluding docs, .savepoint, node_modules): only `showersYearHorizons.test.ts` lines 82-83 (expected-output strings from `toISOString().slice`); site/browser scripts and demos use `Z` text. Other `Date.parse` sites read record fields already demanding `Z`. |
| Existing tests unchanged and green | focused run: timeText + addressNavigation + publicApi 310 passed; gates below |

Files: `core/timeInput.ts`, `api/time.ts`, `app/viewLink.ts`, `tests/timeText.test.ts`. Gates: lint, typecheck, build clean; full test result in the coordinator report.


## Drift Notes

Accepted moment text forms (Design reconciliation): `YYYY-MM-DD` (midnight UTC) or `YYYY-MM-DDTHH:MM[:SS[.fraction]]` plus `Z` or `±HH:MM`; zone-less date-time and free forms are NaN from `timeInputMs` (`bad-time` / `bad-panels` / ignored page `t`). `isZonelessDateTime` exported from `core/timeInput.ts` for the specific message.

Coordinator (orchestrate-g024-20261121): with T-343, T-347, T-348, T-351 and T-352 all in the tree and no builder running, the coordinator ran `npm run api:lock` (one-line lock change: the widened `out-of-span` comment) and the hand-off gates: lint, typecheck, build ok; `npm test` 296 files, 4946 passed, 2 skipped, 0 failed. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
