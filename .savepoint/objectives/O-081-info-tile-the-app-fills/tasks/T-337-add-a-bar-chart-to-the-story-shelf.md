---
id: T-337
title: Add a bar chart to the story shelf
objective: O-081
status: done
depends_on: []
check_waiver: {task: T-337, reason: 'Owner said "Orchestrate this obj" (O-081): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o081-20261121}, recorded_at: '2026-11-21T07:23:30Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o081-20261121}
planned_reads: [packages/astraeus/src/app/shelfContract.ts, packages/astraeus/src/shelf/part.ts, packages/astraeus/src/shelf/colourKey/factory.ts, packages/astraeus/src/shelf/colourKey/View.tsx]
planned_writes: [packages/astraeus/src/shelf/chart/factory.ts, packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/part.css, packages/astraeus/src/shelf/part.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/app/style.css, packages/astraeus/src/api/errors.ts, tools/check-shelf-split.mjs, packages/astraeus/tests/shelfContentParts.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus/api-surface.lock.json]
---

# Add a bar chart to the story shelf

## Outcome

A `chart` block an app puts in a shelf panel and fills with its own counts: bars from `bins [{from, to, count, color?}]`, an axis label, optional labelled `marks [{at, label}]`, and an optional `highlight {from, to}` that dims bars outside it. `handle.part(chart)` gives `setBins` and `setHighlight` (silent); the chart hears nothing. It is its own import, drawn as SVG from the shared look, with a short accessible summary of the bars.

## User Check

A synthetic panel holding a chart of made-up counts with two marks: open it, call `setHighlight` and see bars outside the range dim; call `setBins` and see the bars redraw while the panel is open; `npm run check:shelf-split -- --import chart` passes and importing chart alone carries no other part's marker.

## Done When

The "Chart" and (for the chart) "One contract" O-081 Success Conditions hold: `bad-part` shape cases for every chart field (empty bins, `from >= to`, negative or non-finite count, bad colour, highlight outside or reversed, bad mark), both embedding paths in the lifecycle suite, two viewers, a synthetic scene (ARCH-03), drift check clean over `src/shelf`, the split check knows the chart's marker, doc comment with `@shelf` (a catalogue entry comes in the catalogue Task; if `shelfCatalogue.test.ts` fails for the missing entry, add a minimal entry and example only so the gate stays green, noting it for that Task). `npm run api:errors`, `npm run api:lock`. Apply `docs/agents/verification.md`.

## Context Files

- `.savepoint/objectives/O-081-info-tile-the-app-fills/Objective.md`
- `docs/architecture/viewer-interface.md` under `7. Public interface (O-079, O-080, O-081)`
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- `docs/architecture/viewer-interface.md` under `10. Shared look`
- `packages/astraeus/src/app/shelfContract.ts`
- `packages/astraeus/src/shelf/part.ts`
- `packages/astraeus/src/shelf/colourKey/factory.ts`
- `packages/astraeus/src/shelf/colourKey/View.tsx`
- `packages/astraeus/src/shelf/colourKey/part.css`
- `packages/astraeus/src/api/index.ts`
- `packages/astraeus/src/shell/look/look.css`
- `tools/check-shelf-split.mjs`
- `packages/astraeus/tests/shelfContentParts.test.ts`

## Design References

Design "Viewer interface", "Public API shape (G-016, owner 2026-11-01)".

## Guardrails

ARCH-01, ARCH-02, ARCH-03, API-01, API-02, API-03, API-04, API-05, API-07, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm the O-080 block contract (`BlockPart<K>`, `ShelfCell`, descriptor `control`) exists as described; return REPLAN REQUIRED if not.
2. `src/shelf/chart/` following the colour key's pattern: factory checked at the call, frozen descriptor, view and control carried on the descriptor.
3. SVG view: one x scale from the bins' extent, y from the largest count, marks as labelled lines, highlight dims bars wholly outside it; colours from `--astraeus-*` tokens, a bin's own colour through the part's custom property as the colour key does; `role="img"` with a summary label (bin count, range, largest bin, highlight).
4. Control: `setBins`, `setHighlight(range | undefined)`, silent, checked as the factory checks.
5. Add the chart's marker to `check-shelf-split.mjs`; tests; doc comment; README line; CHANGELOG 0.9.5 Added line; api errors and lock.

## Boundaries

No readout tile, no new screen area, no catalogue entry beyond a gate-keeping minimum, no bar or panel rule changes, no site demo changes. Bars do not take taps.

## Technical Verification

Focused tests during iteration; configured gates plus `npm run check:shelf-split` at handoff. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads (none beyond Context Files except): `tests/lifecycle.test.ts` and `tests/twoViewers.test.ts` (existing shelf cases, to place new `it` cases), `packages/astraeus-site/data/shelf-catalogue.json` and `src/catalogue/examples/colourKey.ts` (the minimal catalogue entry the Task allows), `tools/api-rules.mjs` and `packages/astraeus-site/tests/apiTypeLint.allowlist.json` (to read why API-04 fails), `packages/astraeus/CHANGELOG.md` top and README lines 133/245/454.

Per Done When item:
- `bad-part` for every chart field: `tests/shelfContentParts.test.ts` "chart checks its input at the call" (26 refuse rows: id, axisLabel, empty/non-list/non-object bins, `from >= to` equal and reversed, non-finite from/to, negative/NaN/Infinity count, bad colour, highlight equal/reversed/outside/missing key/not an object, bad marks, not a plain object) pass; frozen, copied, panel-accepted descriptor passes.
- Both embedding paths: `tests/lifecycle.test.ts` "chart (O-081 T-337)" inside `describe.each([mountDriver, reactDriver(false)])`, passes on both (bars draw, setHighlight dims, setBins redraws while open, setters silent, bad setters `bad-part`, kept across close/reopen, a tap on a bar is not heard, `not-mounted` after unmount, summary `aria-label`).
- Two viewers: `tests/twoViewers.test.ts` "API-03 (O-081 T-337)" passes (A's setHighlight/setBins do not touch B).
- Synthetic scene (ARCH-03): all tests use made-up scenes (`earth`, `madeUpScene` in the example).
- Drift check over `src/shelf`: `tests/lookDrift.test.ts` passes after the CSS used `--astraeus-text-xs` instead of px (first run failed on 9px/10px, fixed).
- Split check: `npm run check:shelf-split` ok; `-- --no-build --import chart` ok (chart alone carries no other marker); `-- --no-build --import filterChips,chart --allow filterChips` fails as it must. Emitted with chart alone: 2190025 B raw, 750098 B gzip, css 69802 B.
- Doc comment with `@shelf` on `chart`; README (three rows) and CHANGELOG 0.9.5 Added line written; `npm run api:errors` and `npm run api:lock` run (lock +119 lines).
- Catalogue: `shelfCatalogue.test.ts` failed for the missing entry, so a minimal entry (`data/shelf-catalogue.json`, last in the list, job readout) and example (`src/catalogue/examples/chart.ts`) were added; T-338 owns the real entry.

Commands: `npm run lint` ok; `npm run typecheck` ok; `npm run build` ok; `npm test`: 4575 passed, 2 failed (below); `npm run check:shelf-split` ok (x3 as above); `api:errors`, `api:lock` wrote.

Follow-up (coordinator, owner decision "low / high / value for both", recorded in the Objective's Decisions): fields renamed to a bin `{low, high, count, color?}`, highlight `{low, high}`, mark `{value, label}` across factory, view, control, tests, catalogue example, README, CHANGELOG, doc comment. `apiTypeLint.allowlist.json` gained owner-approved `unitless` entries `low` and `high` (no exceptions or breaks entries); `value` was already unitless. `shelfCatalogue.test.ts`: expected export list now includes "chart" and the test is titled "finds every shelf part as an @shelf export" (coordinator-authorised; nothing else changed). Reran: lint, typecheck, build ok; `npm test` 288 files, 4577 passed, 0 failed; check:shelf-split default and `--import chart` ok; api:lock and api:errors rewritten. No red items remain.

Files changed: packages/astraeus/src/shelf/chart/{factory.ts,View.tsx,part.css} (new); src/shelf/part.ts; src/api/index.ts; src/api/errors.ts; src/api/viewerParts.ts (message text, not in planned writes); src/app/style.css; tools/check-shelf-split.mjs; tests/shelfContentParts.test.ts, tests/lifecycle.test.ts, tests/twoViewers.test.ts (new `it`/`describe` only, plus one import line each); api-surface.lock.json; README.md; CHANGELOG.md; packages/astraeus-site/data/shelf-catalogue.json; packages/astraeus-site/src/catalogue/examples/chart.ts (new); packages/astraeus-site/tests/apiTypeLint.allowlist.json (low, high unitless); packages/astraeus-site/tests/shelfCatalogue.test.ts (expected list and title).

Existing tests touched: additions only (new cases and an import line); no setup, input or fixture changed.

Limitations: no browser run (looks unjudged; SVG is 320x156 viewBox scaled to panel width, text sizes in user units from `--astraeus-text-xs`); marks outside the bins' range are not drawn; `check:pack` and size gates not run.

## Drift Notes

For T-340 (Design reconciliation):
- Chart input field is `axisLabel` (required); `data` holds `{axisLabel, marks}`, cell state is `{bins, highlight?}`.
- Fields are `low`/`high`/`value` (owner decision, API-04); `low` and `high` are owner-approved unitless entries.
- Highlight must lie within the bins' range (the Objective's "outside"); `setBins` drops a highlight the new range no longer holds; `setHighlight` is checked against the current bins.
- Summary text is `chartSummary(axisLabel, state)` in `shelf/chart/View.tsx`.
- The Objective text still says `from/to/at`; T-340 should reconcile it to `low/high/value`.
- `viewerParts.ts` bad-part message and `errors.ts` doc now name `chart`.

Coordinator: reviewed the diff; existing tests changed only by added cases and import lines, plus the authorised expected-list extension in `shelfCatalogue.test.ts`; the API-04 naming went to the owner ("low / high / value for both (Recommended)") and `low`/`high` joined the unitless list with that approval. Gates green (4577 passed, 0 failed). Coordinator marked done (owner: "Orchestrate this obj").
