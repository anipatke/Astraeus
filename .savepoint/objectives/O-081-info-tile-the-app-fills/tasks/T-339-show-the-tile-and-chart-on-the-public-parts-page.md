---
id: T-339
title: Show the tile and chart on the public parts page
objective: O-081
status: planned
depends_on: [{task: T-338, requires: clear}]
check_waiver: {task: T-339, reason: 'Owner said "Orchestrate this obj" (O-081): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o081-20261121}, recorded_at: '2026-11-21T07:23:30Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o081-20261121}
---

# Show the tile and chart on the public parts page

## Outcome

The public Parts page lists the readout tile and the chart in the same plain-words shape as the first set: a plain name, one sentence on what it is for, a "For example:" line about a space story, story-job tags, a Run button with a live synthetic example, and the code tucked into the "For developers" fold. Their types appear on the shelf API page.

## User Check

Open `localhost:5490/components.html` at 375x667 and 1280x720: both new entries read in plain words; Run shows the chart with a highlighted range and the tile updating as time moves (top left on desktop, the strip and its sheet on a phone); the fold shows the import and add lines and the whole example.

## Done When

The "Catalogue and docs" O-081 Success Condition holds: entries in `packages/astraeus-site/data/shelf-catalogue.json`, examples `packages/astraeus-site/src/catalogue/examples/chart.ts` and `readoutTile.ts` (shown through `?raw`, so the shown code is the run code), `shelfCatalogue.test.ts` passing with no gate-keeping placeholders left, the tile and chart on `api/shelf.html`, the site browser driver and the catalogue journey covering both entries at both sizes, README and CHANGELOG complete. Apply `docs/agents/verification.md` and `docs/agents/browser-policy.md` (one browser job at a time).

## Context Files

- `.savepoint/objectives/O-081-info-tile-the-app-fills/Objective.md`
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf` (the "Public catalogue page" paragraph)
- T-337 and T-338 `Technical Evidence`
- `packages/astraeus-site/components.html`
- `packages/astraeus-site/data/shelf-catalogue.json`
- `packages/astraeus-site/src/catalogue/examples/colourKey.ts`
- `packages/astraeus-site/tests/shelfCatalogue.test.ts`
- `packages/astraeus-site/tools/validate/catalogue-lines.mjs`
- `docs/agents/browser-policy.md`
- `packages/astraeus/README.md` under `Looks, controls and views`
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

Design "Viewer interface", "The planets demo and the site on the public way".

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-03, STYLE-09.

## Implementation Plan

1. Confirm both parts are exported with `@shelf` doc comments; return REPLAN REQUIRED if not.
2. Write the two entries in plain words and the two synthetic examples (made-up counts and a made-up live value; no story data, no app names).
3. Replace any gate-keeping placeholder from the earlier Tasks.
4. Extend the browser driver and catalogue journey to run both examples at both sizes; check the tile strip and sheet on the phone size.
5. README and CHANGELOG finish.

## Boundaries

No engine behaviour changes (an engine defect found here is reported, or captured as an Issue, not fixed in this Task), no page redesign, no changes to the site's other demos.

## Technical Verification

Focused site tests, then configured gates; one browser run of the catalogue journey at 375x667 and 1280x720. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here for the planner to reconcile in T-340 before the Full Objective Check.
