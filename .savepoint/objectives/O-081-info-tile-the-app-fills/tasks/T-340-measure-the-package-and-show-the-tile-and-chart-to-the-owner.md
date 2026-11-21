---
id: T-340
title: Measure the package and show the tile and chart to the owner
objective: O-081
status: done
depends_on: [{task: T-339, requires: clear}]
check_waiver: {task: T-340, reason: 'Owner said "Orchestrate this obj" (O-081): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o081-20261121}, recorded_at: '2026-11-21T07:23:30Z'}
owner_validation: {required: true, accepted_check: C-195, accepted_by: {role: owner, session: orchestrate-o081-20261121}}
planned_by: {role: planner, session: plan-o081-20261121}
---

# Measure the package and show the tile and chart to the owner

## Outcome

The package sizes are measured with both parts in, the design notes describe what was built, and the owner has looked at the tile and chart on the Parts page at phone and desktop sizes before the Full Objective Check.

## User Check

The owner opens `localhost:5490/components.html` at phone and desktop sizes, runs the chart and tile examples, and says whether they look right.

## Done When

The "Sizes" and "Owner look" O-081 Success Conditions hold: engine pack (`node tools/check-packs.mjs`) and API pages (main and `api/shelf.html`) measured against their limits and recorded; any red goes to the owner with measured options and the owner's choice is recorded in the Objective before the Full Check. Every Drift Note from the three earlier Tasks is reflected in `docs/architecture/viewer-interface.md` (sections 2, 5, 7, 11) and `.savepoint/Design.md` "Viewer interface", or marked non-architectural with a reason. The owner's look is recorded in the Objective's Decisions; anything they ask to change is done or captured before the Full Check. Apply `docs/agents/verification.md`.

## Context Files

- `.savepoint/objectives/O-081-info-tile-the-app-fills/Objective.md`
- T-337, T-338 and T-339 `Technical Evidence` and `Drift Notes`
- `docs/architecture/viewer-interface.md` under `2. Screen areas`, `5. Panels`, `7. Public interface (O-079, O-080, O-081)`, `11. Story-component shelf`
- `.savepoint/Design.md` under `Viewer interface`
- `tools/check-packs.mjs`
- `docs/agents/build.md`
- `docs/agents/browser-policy.md`

## Design References

Design "Viewer interface", "Size budgets are split".

## Guardrails

TEST-01, STYLE-09.

## Implementation Plan

1. Run the full gates and the pack and API page measures; record numbers against limits.
2. If anything is red, stop and present measured options to the owner (an artifact page), then do what they choose.
3. Reconcile each drift note into the design note and Design.md.
4. Start the site on `localhost:5490` and ask the owner to judge the two entries; record the answer.

## Boundaries

No new behaviour; size fixes only as the owner chooses; no limit raised without the owner.

## Technical Verification

Configured gates; `node tools/check-packs.mjs`; the API page measure as in O-080 T-336. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executed 2026-11-21 by the coordinator (Opus), after T-337..T-339.

**Sizes (all green; no owner decision needed)**

| Measure | Now | Limit |
|---|---|---|
| Engine pack, unpacked (`npm run check:pack`) | 9.30 MB | 9.5 MB |
| Engine pack, packed | 7.24 MB | 8.0 MB |
| `api/index.html` raw / gzip (`renderApiPage`, `zlib`) | 200,798 B / 43,693 B | 230,000 / 46,000 |
| `api/shelf.html` raw / gzip (`renderShelfApiPage`) | 32,117 B / 6,701 B | 35,000 / 8,000 |

`check:pack` passed for every package. Split check page (T-338): 2,196,139 B raw, 750,896 B gzip with `readoutTile`.

**Design reconciliation (each drift note)**

- T-337: names `low`/`high`/`value` and `axisLabel`, highlight within the bins, `setBins` dropping a stale highlight → note section 7 (as built) and 11 table; Design "Viewer interface" Shelf bullet. `chartSummary`, the `bad-part` message naming `chart`, the cell's internal shape → non-architectural (implementation detail; the contract is unchanged). Objective text already used `low/high/value` (updated at the owner's naming decision).
- T-338: tile fields and control, `TilePart` and the widened `addParts`, `ShelfTile`/`ShelfPart`, tile-in-blocks `bad-part`, `checkTiles` and unlisted tiles, the `tile` grid rows under `:has`, the strip button, the `tile` occupant and `dropsTile` → note sections 2 (as built), 7, 11 and Design Shelf bullet. Section 5's "Tile expanded" row already matches. Shell class names avoiding the split marker → non-architectural.
- T-339: first `addParts` entry may be any shelf part, optional `live(viewer)`, the 1fr/2fr grid → note section 11 "Public catalogue page". The shelf API page listing itself → no change needed (already said: every export under `src/shelf/`).

**Owner look**: owner opened localhost:5490/components.html, ran Readout tile and Chart at desktop and phone sizes: "Looks right, run the final check (Recommended)" (2026-11-21). Owner validation is recorded against the Full Objective Check id once it exists.

Files changed: `.savepoint/Design.md` (Viewer interface, Shelf bullet), `docs/architecture/viewer-interface.md` (sections 2, 7, 11).

## Drift Notes

None expected; this Task reconciles the others.

Coordinator marked done (owner: "Looks right, run the final check (Recommended)"); owner acceptance is recorded against the Full Objective Check id.
