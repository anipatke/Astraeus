---
id: T-338
title: Add a live readout tile with its own place on screen
objective: O-081
status: planned
depends_on: [{task: T-337, requires: clear}]
check_waiver: {task: T-338, reason: 'Owner said "Orchestrate this obj" (O-081): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o081-20261121}, recorded_at: '2026-11-21T07:23:30Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o081-20261121}
---

# Add a live readout tile with its own place on screen

## Outcome

A `readoutTile` part an app adds with `scene.addParts` beside its panels: a label and big value, an optional line (`scale {low, high, value, stretch?: "linear" | "log", marks? [{value, label}]}` (owner naming decision, Objective Decisions)) with a dot at the value, and up to a few small `facts [{label, value}]`. `handle.part(tile)` gives silent setters (`setValue` and, within the section 7 grammar, setters for the scale position and facts); it hears nothing. On a wide viewer it sits at the top of the left column under the bar, always shown, with any left panel below it; on a phone it is a one-line strip above the timeline that opens the full tile in the bottom sheet on a tap. At most one tile shows per view.

## User Check

A synthetic scene with two views, each with its own tile: on a wide viewer the tile sits top left and About opens below it; `setValue` moves the number and the dot; a view switch shows the other view's tile; at phone size the strip shows label and value above the timeline, a tap opens the sheet, Escape closes it, opening About's sheet replaces it. A scene with two tiles in one view throws `bad-part` naming both.

## Done When

The "Readout tile", "Tile place", "One tile per view" and (for the tile) "One contract" O-081 Success Conditions hold: `addParts` accepts the tile (part union widened, ids unique across parts, blocks and story panels); `bad-part` shape cases per field (empty label, non-finite or reversed scale, `value` outside, log scale with `low <= 0`, bad mark, too many facts); the panel rule's phone "tile expanded" detail occupant with named close-rule unit tests in `tests/panelRule.test.ts`; the area in `shell/areas/` with `data-area="tile"` (no `@media` outside `areas.css`); both embedding paths in the lifecycle suite; two viewers with different layouts; synthetic scene (ARCH-03); drift check clean; split check knows the tile's marker; computed-look baseline regenerated with `node tools/look-lock.mjs` and its diff reviewed if the grid changes; site browser driver updated only if a hook it reads moves. Doc comment with `@shelf` (gate-keeping catalogue minimum as in T-337 if needed). README, CHANGELOG, `npm run api:errors`, `npm run api:lock`. Apply `docs/agents/verification.md`.

## Context Files

- `.savepoint/objectives/O-081-info-tile-the-app-fills/Objective.md`
- `docs/architecture/viewer-interface.md` under `2. Screen areas`
- `docs/architecture/viewer-interface.md` under `5. Panels`
- `docs/architecture/viewer-interface.md` under `7. Public interface (O-079, O-080, O-081)`
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- `.savepoint/Design.md` under `Views of one scene`
- T-337's `Technical Evidence` and `Drift Notes` (the files it created)
- `packages/astraeus/src/app/shelfContract.ts`
- `packages/astraeus/src/shelf/part.ts`
- `packages/astraeus/src/api/planParts.ts`
- `packages/astraeus/src/api/scene.ts` (the `addParts` method)
- `packages/astraeus/src/api/viewerParts.ts`
- `packages/astraeus/src/app/useShelf.ts`
- `packages/astraeus/src/shell/areas/screen.ts`
- `packages/astraeus/src/shell/areas/Area.tsx`
- `packages/astraeus/src/shell/areas/areas.css`
- `packages/astraeus/src/shell/panels/panelRule.ts`
- `packages/astraeus/src/shell/AstraeusShell.tsx` (the shelf panel and `left` area sections)
- `packages/astraeus/tests/panelRule.test.ts`
- `tools/check-shelf-split.mjs`

## Design References

Design "Viewer interface", "Views of one scene", "Public API shape (G-016, owner 2026-11-01)".

## Guardrails

ARCH-01, ARCH-02, ARCH-03, API-01, API-02, API-03, API-04, API-05, API-07, TEST-01, TEST-03, TEST-08, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm the chart landed and the part union point in `shelfContract.ts` is where the note says; return REPLAN REQUIRED if `addParts` cannot widen without breaking the O-080 contract.
2. Widen the part union and `PartPlan`: tile accepted, ids unique, one-tile-per-view check at build (a tile not listed in any view's `panels` shows in every view, so it conflicts with any other tile showing there).
3. `src/shelf/readoutTile/`: factory, frozen descriptor, view (value, line with stretched scale and marks, facts), silent control.
4. Tile area: wide at the top of `left` with the `left` occupant below; phone strip above the timeline; the panel rule gains the phone tile-expanded detail occupant (opens on tap, closes another detail sheet, Escape, view switch). The shell renders `descriptor.view`; no placement code in the part.
5. Tests (factory, plan, panel rule, lifecycle both paths, two viewers, screen), split check marker, look baseline if needed, docs, api errors and lock.

## Boundaries

No catalogue page design changes, no several-tiles stacking, no tile taps on a wide viewer, no change to how other `left` occupants close one another, no site demo changes.

## Technical Verification

Focused tests during iteration; configured gates plus `npm run check:shelf-split` at handoff; no browser run here (the catalogue Task covers the browser journey; the Full Check runs `check:browser` once). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here for the planner to reconcile in T-340 before the Full Objective Check.
