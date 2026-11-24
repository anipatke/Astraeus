---
id: T-457
title: Long chart axis labels wrap
objective: O-100
status: done
depends_on: [{task: T-455, requires: clear}]
check_waiver: {task: T-457, reason: 'Owner chose "Chart first" for G-027 (2026-11-24), to be built while the label questions were answered: standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g027-20261124}, recorded_at: '2026-11-24T09:55:03Z'}
owner_validation: {required: true, accepted_check: C-223, accepted_by: {role: owner, session: orchestrate-g027-20261124}}
planned_by: {role: planner, session: plan-g027-20261124}
lane: chart
planned_reads: [packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/part.css, packages/astraeus/tests/chartMarkRows.test.ts, packages/astraeus/tests/chartSummary.test.ts, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md]
planned_writes: [packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/part.css, packages/astraeus/tests/chartAxisLabel.test.ts, packages/astraeus/tests/chartMarkRows.test.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md]
---

# Long chart axis labels wrap

## Outcome

A `chart`'s `axisLabel` wraps inside its panel however long it is, as every other shelf text has since 0.11.0, instead of one SVG line cut off on both sides in a 360 px panel (belt #35). Written for G-027 Decision 6 (a), the planner's recommendation; **do not start until the owner has answered Decision 6**, and if the owner picks (b) or (c), return REPLAN REQUIRED.

## User Check

Run `npm run preview:owner`, open `localhost:5490/components.html` wide and at phone width (390 px), press Run on **Bar chart**: the axis label "Size (invented units)" sits under the bars as before, with no gap and no overlap with the end ticks. In devtools, make the label text long (edit the caption's text): it wraps onto further lines inside the panel.

## Done When

- **Caption, not SVG text.** The axis label is an HTML element under the chart's SVG inside `.shelf-chart` (keeping the class `shelf-chart-label`), wrapped by the shared panel CSS (`overflow-wrap: anywhere` from O-097); its look comes from the shared tokens (muted colour, the extra-small text size), no raw lengths (lookDrift). No measuring code is added.
- **SVG height.** The bottom strip that held the one-line label is removed from the SVG (a new `HEIGHT` constant just below the end ticks' text, chosen and stated by the builder), so the caption follows the ticks with no gap. Owner-approved edits under Decision 6 (a), and no others: `packages/astraeus/tests/chartMarkRows.test.ts` line 79 (`"0 0 320 156"`), line 125 (`` `0 0 320 ${156 + height}` ``) and line 131 (`"0 0 320 168"`) change only the constant 156 (and 168 = 156 + 12) to the new height; record the before and after lines in Technical Evidence.
- **The chart's summary** (`aria-label` on the SVG) still names the axis; the caption is hidden from screen readers if the summary already says it (no double reading) — state which in evidence.
- **Unit test**, new `packages/astraeus/tests/chartAxisLabel.test.ts` (TEST-02), happy-dom: the axis label is an HTML element outside the SVG with the given text, the SVG holds no `.shelf-chart-label`, and a one-row chart's viewBox is `0 0 320 <new height>`.
- **Browser:** the existing `catalogue` step passes unedited at both sizes; its long-word check (`driver.mjs` `catalogueLongWordFit`) now also writes into the caption, because it is HTML text in the panel. Record that the caption is among the texts it changed (one read, no script change).
- **Docs:** viewer-interface section 11, the `chart` row: the axis label is a caption under the bars that wraps.
- **CHANGELOG** (`packages/astraeus/CHANGELOG.md`, the open 0.11.1 section): one `Fixed` line: "A `chart`'s long `axisLabel` now wraps inside its panel (it was one line, cut off on both sides); the chart is a few units shorter, as the label sits under it." Not a breaking change (no input or output changes shape).
- **Size.** `npm run check:pack` and `npm run check:shelf-split`; report the engine figure (CSS lines count toward it).
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/shelf/chart/View.tsx` (after T-455)
- `packages/astraeus/src/shelf/chart/part.css`
- `packages/astraeus/tests/chartMarkRows.test.ts` lines 60-132
- `packages/astraeus/tests/chartSummary.test.ts`
- `packages/astraeus-site/tools/validate/driver.mjs` `catalogueLongWordFit` only (read, not edit)
- `docs/architecture/viewer-interface.md` section `11. Story-component shelf`, the `chart` row only
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

`.savepoint/Design.md` under `Viewer interface`; viewer-interface section 11. G-027 Decision 6.

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-02, STYLE-07, CODE-01.

## Implementation Plan

1. Confirm Decision 6 is answered (a); else REPLAN REQUIRED.
2. New test; see it fail.
3. Move the label to an HTML caption; shorten the SVG; CSS from tokens.
4. Edit only the three named assertions' constants; run the chart tests.
5. Docs, CHANGELOG, `check:pack`, `check:shelf-split`; run the `catalogue` browser step once (one browser job at a time).

## Boundaries

No change to mark rows or measuring (T-455), ticks, bars, highlight or summary wording; no driver or journey script edits; no other existing test edited.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/chartAxisLabel.test.ts packages/astraeus/tests/chartMarkRows.test.ts packages/astraeus/tests/chartSettles.test.ts packages/astraeus/tests/chartSummary.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/lookDrift.test.ts`; the `catalogue` browser step per `docs/agents/browser-policy.md`. Handoff: the configured gates, `npm run check:pack`, `npm run check:shelf-split`. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Done When -> evidence:
- Caption not SVG text / aria: chartAxisLabel.test.ts (div.shelf-chart-label outside svg, aria-hidden=true because the SVG aria-label summary already names the axis; no svg .shelf-chart-label). CSS from tokens, lookDrift passes. No measuring code added.
- SVG height: HEIGHT 156 -> 136 (ticks baseline 131 plus descent). Owner-approved edits (answers 6 and 6b), constants only: chartMarkRows.test.ts line 79 `"0 0 320 156"`->`"0 0 320 136"`; line 125 `${156 + height}`->`${136 + height}`; line 131 `"0 0 320 168"`->`"0 0 320 148"`; line 75 `toBeGreaterThan(156)`->136; chartSettles.test.ts line 75 `156 + extra`->`136 + extra`.
- Unit test: new tests/chartAxisLabel.test.ts, 2 pass (viewBox 0 0 320 136).
- Browser: `npm run check:browser -- --step catalogue` once, exit 0, 12 s, error-lines 0, evidence docs/evidence/browser-steps-20261124T100252Z; its long-word check (catalogueLongWordFit) writes into the caption as HTML panel text (one read, no script change).
- Docs: viewer-interface section 11 chart row updated. CHANGELOG: Fixed line in 0.12.0 (unreleased).
- Size: check:pack pass, engine 526014 B gzip (cap 527000); check:shelf-split ok.
- Gates: typecheck, eslint, prettier clean on changed files; vitest chart tests (chartMarkRows, chartSettles, chartSummary, chartAxisLabel), lifecycle, twoViewers, lookDrift, site shelfCatalogue, apiReference: 9 files, 264 passed.
Limitations: none.

## Drift Notes

None.

Marked done by the coordinator under the owner's G-027 orchestration (2026-11-24) after the wave gate passed (`npm run typecheck`, `npm run lint`, `npm test` 351 files 5642 passed 2 skipped, `npm run build`). Owner looked on localhost:5490 (`npm run preview:owner`, branch g027-belt-follow-ups at 1bb6f809, 2026-11-24T10:08Z, components.html bar chart at desktop and phone width) and said "Looks good". The acceptance fields are filled in once the Full Objective Check has an id.
