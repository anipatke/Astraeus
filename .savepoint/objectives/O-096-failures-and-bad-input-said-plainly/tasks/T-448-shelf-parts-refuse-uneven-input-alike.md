---
id: T-448
title: Shelf parts refuse uneven input alike
objective: O-096
status: planned
depends_on: []
check_waiver: {task: T-448, reason: 'Owner said "orchestrate O-96" (2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o096-20261124}, recorded_at: '2026-11-24T06:57:50Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o096-20261124}
planned_reads: [packages/astraeus/src/shelf/part.ts, packages/astraeus/src/shelf/chart/factory.ts, packages/astraeus/src/shelf/colourKey/factory.ts, packages/astraeus/src/shelf/panel/factory.ts, packages/astraeus/src/shelf/explainer/factory.ts, packages/astraeus/src/shelf/actions/factory.ts, packages/astraeus/src/shelf/filterChips/factory.ts, packages/astraeus/src/shelf/customBlock/factory.ts, packages/astraeus/src/shelf/readoutTile/factory.ts, packages/astraeus/src/app/shelfContract.ts, packages/astraeus/tests/shelfContentParts.test.ts, packages/astraeus/tests/shelfParts.test.ts, packages/astraeus/tests/readoutTile.test.ts, packages/astraeus/tests/lifecycle.test.ts, docs/architecture/viewer-interface.md]
planned_writes: [packages/astraeus/src/shelf/part.ts, packages/astraeus/src/shelf/chart/factory.ts, packages/astraeus/src/shelf/colourKey/factory.ts, packages/astraeus/tests/shelfInputTable.test.ts, packages/astraeus/tests/shelfContentParts.test.ts, packages/astraeus/tests/lifecycle.test.ts, docs/architecture/viewer-interface.md, packages/astraeus/api-surface.lock.json, packages/astraeus/CHANGELOG.md]
---

# Shelf parts refuse uneven input alike

## Outcome

Every shelf factory, and each part control setter that takes the same fields, refuses the same kinds of bad input with `SceneError` `bad-part` naming the field (belt #31): text that is empty after trimming; `chart` bins that overlap or run backwards (right to left), and `chart` marks outside the bins' range (as the highlight already is); a fractional `colourKey` count; an empty `colourKey` (owner decision 4). One table test runs every shelf factory through every bad-input kind, so an uneven check cannot come back.

## User Check

None beyond the tests: no visible change for valid input. (The owner reads the CHANGELOG breaking lines at release.)

## Done When

- **Blank text.** The shared checks in `shelf/part.ts` (`checkedId`, `checkedText`, `checkedStrings`) refuse a string that is empty after `trim()`; the value is kept as given (not trimmed). This covers every shelf text field through the one rule: panel `button.label`, `shortLabel`, `title`; explainer `heading`, `paragraphs`, `notes`; actions `id`, `label`; filterChips `label`, choice `value`, `label`; colourKey `label`, `note`; chart `axisLabel`, mark `label`; readoutTile `label`, `value`, fact and mark labels; and every part `id`. No factory keeps its own blank check.
- **Chart bins.** `chart` and `ChartControl.setBins` refuse bins that run backwards or overlap: each bin's `low` must be at or above the previous bin's `high` (touching and gaps are fine), naming the later bin (`bins[1].low must be at or above bins[0].high`).
- **Chart marks.** `chart` refuses a mark whose `value` lies outside the bins' range (`marks[0].value must lie within the bins' range`), as `readoutTile` already does for its scale marks. After `setBins`, a mark the new bins no longer cover is not drawn, as today (the same as a highlight `setBins` drops); `setBins` does not throw for it. Update the `ChartInput.marks` doc comment ("must lie within the bins' range; after `setBins` a mark outside the new bins is not drawn").
- **Colour key.** `colourKey` and `ColourKeyControl.setEntries` refuse a count that is not a whole number of 0 or more (`entries[0].count must be a whole number of 0 or more`) and an empty `entries` list (`entries must be a non-empty list ...`). Update the `ColourKeyInput.entries` and `ColourKeyEntry.count` doc comments (no longer "may be empty"; "a whole number of 0 or more").
- **Chart counts stay as they are** (any finite number of 0 or more) unless the owner rules otherwise (see the Objective's open question); the table records which.
- **One table test**, new `packages/astraeus/tests/shelfInputTable.test.ts`: rows of (part, field, bad-input kind, bad value, expected message fragment) across all eight factories (`panel`, `customBlock`, `explainer`, `actions`, `filterChips`, `colourKey`, `chart`, `readoutTile`) and the kinds blank text, fraction, backwards range, overlapping range, out-of-range value, empty list. Each kind is listed for every factory: where a factory has no field of that kind, or a field that may lawfully take it (an empty `marks` or `notes` list, a fractional chart count), the row says "accepted" with the reason, so the table states the rule for every pair. The same rows run against the setters that take those fields (`ExplainerControl.setParagraphs`, `ColourKeyControl.setEntries`, `ChartControl.setBins`, `ReadoutTileControl` setters) through the descriptor's `control` with a small stub link; if the internal link shape makes that more than a few lines, run the factory rows only and say so in evidence. A guard row fails when a factory is exported from `astraeus` (the `@shelf` tag) without rows, so a new part cannot skip the table.
- **Existing tests that pin the old behaviour** (planned, owner-authorised behaviour changes under G-025 decisions 1 and 4; change only these lines, name each in evidence):
  - `tests/shelfContentParts.test.ts` "a colour key may start empty and a chip row may start with a value lit": the empty-key half becomes a refusal (`bad-part`); the chip half is unchanged.
  - `tests/shelfContentParts.test.ts` "a block id used twice in a scene is duplicate-id, across panels and kinds": its `colourKey({ id: "same", entries: [] })` gets one entry, so the case still reaches `duplicate-id`.
  - `tests/lifecycle.test.ts` "chart (O-081 T-337): ...": the mark `{ value: 99, label: "Off" }` outside the bins is now refused at build; move it so the case still proves an out-of-range mark is not drawn through `setBins` narrowing the bins (the later `setBins([{ low: 0, high: 5, count: 5 }])` already leaves "Limit" at 10 outside), keeping every other assertion.
  - `tests/lifecycle.test.ts` colour-key case, `setEntries([])` expecting `not-mounted` after unmount: give it one entry, so it still proves `not-mounted`.
  - Any other existing case that turns red is not edited: stop and report it.
- `docs/architecture/viewer-interface.md` section 11: the `chart` and `colourKey` rows state the new rules (bins left to right without overlap, marks within the bins; at least one entry, whole counts), and one line under "One contract" says shelf text must not be blank.
- CHANGELOG (`packages/astraeus/CHANGELOG.md`, open 0.11.0 section only): a `Fixed` entry ("shelf parts refuse blank text, uneven chart bins, marks outside the bins, fractional colour-key counts and an empty key with `bad-part`"); under "### Breaking changes in 0.11.0" replace the "None: ..." line if it is still there (the no-WebGL Task may have replaced it first; then add below) with one line each, with its migration:
  - "Blank (spaces-only) shelf text is refused with `bad-part`: labels, titles, paragraphs, notes, ids and values. Pass real text, or leave an optional field out."
  - "`chart` and `setBins` refuse bins that overlap or run backwards. Sort bins by `low` and merge overlaps first."
  - "`chart` refuses a mark outside the bins' range. Drop the mark or widen the bins."
  - "`colourKey` and `setEntries` refuse a fractional count. Round it (`Math.round`), or put the exact figure in the `note`."
  - "`colourKey` and `setEntries` refuse an empty list. Leave the key out of the panel until it has a row."
- Regenerate the API lock (`npm run api:lock`) only if it changes (interface doc comments are not in it today); the README needs no change (its error table and shelf wording are unchanged by this Task; check with `grep`).
- Size: about 0.1 to 0.2 KB gzip on the engine's first download; report the `npm run check:pack` engine figure (shared 1.4 KB headroom with the no-WebGL Task).
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/shelf/part.ts`
- `packages/astraeus/src/shelf/chart/factory.ts`
- `packages/astraeus/src/shelf/colourKey/factory.ts`
- `packages/astraeus/src/shelf/readoutTile/factory.ts` (`scaleOf`, the marks-within-scale precedent)
- `packages/astraeus/src/app/shelfContract.ts` (the `control(link)` shape, for the setter rows)
- `packages/astraeus/tests/shelfContentParts.test.ts`
- `packages/astraeus/tests/lifecycle.test.ts` (the colour-key and chart cases only)
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- `packages/astraeus/CHANGELOG.md` (top section only)
- `/home/user/code/belt/tests/shelfEdges.test.ts` (read only; the "engine gaps pinned" block lists the inputs accepted today)

## Design References

`.savepoint/Design.md` under `Viewer interface` and `Errors and labels that tell the truth (O-083)`; the viewer-interface note section 11 ("One contract").

## Guardrails

API-01, API-04, API-05, TEST-01, TEST-02, TEST-03, CODE-02.

## Implementation Plan

1. Write `tests/shelfInputTable.test.ts` from today's factories and see the new-rule rows fail.
2. Blank-text rule in `part.ts`; bins order and overlap, marks within the bins in `chart/factory.ts`; whole counts and non-empty entries in `colourKey/factory.ts`; doc comments.
3. Run `tests/shelfContentParts.test.ts`, `tests/shelfParts.test.ts`, `tests/readoutTile.test.ts`, `tests/lifecycle.test.ts`, `tests/twoViewers.test.ts`; change only the four pinned lines named above.
4. Search the site and examples for shelf inputs the new rules refuse (`git grep -n "colourKey(\|chart(" -- packages/astraeus-site examples`); the catalogue examples are valid today, so a hit is a stop-and-report, not an edit.
5. viewer-interface section 11, CHANGELOG, `npm run api:lock` if needed, `npm run check:pack`.

## Boundaries

No new error code; no change to valid input's look or behaviour; no trimming of the text a host gives; no change to `customBlock`; chart counts unchanged unless the owner rules; no edits to the belt app.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/shelfInputTable.test.ts packages/astraeus/tests/shelfContentParts.test.ts packages/astraeus/tests/shelfParts.test.ts packages/astraeus/tests/readoutTile.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/twoViewers.test.ts packages/astraeus-site/tests/releaseBreaks.test.ts`. Handoff: the configured gates and `npm run check:pack`. No browser step (shelf code puts the `catalogue` step in the Full Check by path). Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, reviewed source basis, files read/changed, and limitations, recorded after the work lands.
