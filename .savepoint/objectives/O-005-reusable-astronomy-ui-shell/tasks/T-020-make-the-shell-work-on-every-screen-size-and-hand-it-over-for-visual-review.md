---
id: T-020
title: Make the shell work on every screen size and hand it over for visual review
objective: O-005
status: planned
depends_on: [{task: T-019, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: g002-replan-2026-10-06}
---

# Make the shell work on every screen size and hand it over for visual review

## Outcome

The shell keeps the canvas dominant at desktop ~1440+, laptop 1280×800, tablet and mobile portrait, using bottom sheets, drawers or compact menus on small screens. Primary controls meet the brief's basic accessibility bar. The owner can judge the design from a screenshot set without running tools, and `docs/ASTRAEUS_SPIKE_03.md` records what Spike 03 proved.

## User Check

Open the screenshot set and the design note. Judge whether the canvas feels like the main product at each viewport, and whether play/seek/speed/events, object focus/follow, scale and provenance are understandable without instructions. Record your visual verdict.

## Done When

1. Layouts at the four viewports follow the progressive-disclosure hierarchy; no permanent sidebar on tablet or mobile.
2. Primary controls are keyboard-reachable with visible focus, labelled, at least ~44 px tap targets on touch layouts, readable contrast, and nothing critical is hover-only (named checks or scenario validations).
3. A browser script under `tools/validate/` captures screenshots into `docs/evidence/spike03/` for Earth–Moon overview, translunar coast, close Earth, close Moon, spacecraft follow, event/provenance open, Metric Visuals, mobile and 1280×800, and reports 0 console errors, identical readouts under both scales and unchanged readouts across camera changes.
4. Spike 01/02 browser and unit evidence still holds (the existing scripts re-run or are superseded with named equivalents).
5. `docs/ASTRAEUS_SPIKE_03.md` covers the brief's thirteen design-note topics, including storytelling requirements discovered (and the recorded future needs: time-ranged provenance, Readable-scale radii, imperative Scene API) and a Perseids recommendation.
6. `.savepoint/Design.md` is reconciled to the implemented shell; configured gates pass fresh.
7. Owner visual validation is recorded after the integration evidence.

## Context Files

`docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `src/app/App.tsx`, `src/app/style.css`, `tools/validate/browser-spike02.mjs`, `docs/ASTRAEUS_SPIKE_02.md`, `docs/DONOR_PROVENANCE.md`, `.savepoint/Design.md`, `.savepoint/Idea.md`.

## Design References

Design: all sections for reconciliation. Brief sections 4, 5, 10, 12, 16 and deliverables E and F.

## Guardrails

TEST-01, TEST-03, STYLE-05, STYLE-09, ARCH-01, ARCH-02, PROV-01.

## Implementation Plan

1. Add responsive layout rules and small-screen containers using the audit's donor patterns.
2. Apply the accessibility basics to primary controls.
3. Write the Spike 03 browser script and capture the screenshot set; re-run the Spike 02 script.
4. Write the design note and reconcile Design.
5. Run gates fresh; present screenshots to the owner for visual validation.

## Boundaries

No new shell primitives beyond what layouts need, no Story DSL, no Perseids, no accessibility certification work.

## Technical Verification

Configured gates fresh at handoff; browser scripts in headless Chromium (as Spike 02, via the donor's playwright-core); owner visual validation. Full Objective Check per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
