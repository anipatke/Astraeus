---
id: T-335
objective: O-080
title: Show every shelf component on a public catalogue page
status: planned
depends_on: [{task: T-334, requires: clear}]
check_waiver: {task: T-335, reason: 'Owner said "Orchestrate 080": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o080-20261121}, recorded_at: '2026-11-21T05:15:22Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o080-20261121}
---

# Show every shelf component on a public catalogue page

## Outcome

A new site page, `components.html`, linked beside Assets, lists each shelf part: what it is (the first sentence of its doc comment), suggested uses by story job (switch, filter, readout, explainer), a live example on a synthetic scene run on demand one viewer at a time and shown as its own source, and the import and `addParts` lines from that example; plus a "What you get out of the box" section for the basic interface. A test keeps it complete.

## User Check

Open `/components.html` on localhost:5490 at 1280x720 and 375x667: every part has its entry; starting an example runs one viewer (starting another stops the first); the shown code is the run code; nothing overlaps. Remove a part's entry and `shelfCatalogue.test.ts` fails.

## Done When

The "Catalogue" O-080 Success Condition holds: page, navigation link, `data/shelf-catalogue.json`, `src/catalogue/examples/<part>.ts` (one per part, built only through the public API), `tests/shelfCatalogue.test.ts` (a `@shelf` root export with no entry or example fails; an entry naming no such export fails). The page is in the site build, its load budget and public-address lists as other pages are; the browser driver and a journey (or an extension of an existing one) cover it at both sizes. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/Objective.md`
- `.savepoint/Design.md` under `The planets demo and the site on the public way`
- `packages/astraeus-site/assets.html`
- `packages/astraeus-site/index.html`
- `packages/astraeus-site/vite.config.ts`
- `packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts`
- `packages/astraeus-site/tools/site/api-reference.mjs`
- `packages/astraeus-site/tools/validate/load-budget.mjs`
- `packages/astraeus-site/tools/validate/public-addresses.mjs`
- `packages/astraeus-site/tools/validate/driver.mjs`
- `packages/astraeus-site/tools/validate/journey-views.mjs`
- `packages/astraeus-site/tests/apiReference.test.ts`
- `docs/agents/browser-policy.md`

## Design References

Design "The planets demo and the site on the public way", "Viewer interface", "Size budgets are split".

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm the four content parts and `panel`/`customBlock` are exported with `@shelf`; return REPLAN REQUIRED if not.
2. Page shell and navigation link, styled like the site's other pages.
3. JSON entries and one example per part; read doc-comment first sentences at build (reuse the API reference's export reader).
4. On-demand runner: one viewer at a time, unmounting the previous; `?raw` source shown beside it.
5. Completeness test; build, load-budget and public-address wiring; driver and journey at both sizes.

## Boundaries

No engine changes except a doc-comment wording fix; no changes to the existing demos; no readout tile or chart entries (O-081).

## Technical Verification

Focused tests during iteration; configured gates at handoff. No browser run per step (browser policy); the Full Check runs `check:browser` once. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for the planner.
