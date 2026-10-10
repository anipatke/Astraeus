---
id: T-020
title: Make the shell work on every screen size and hand it over for visual review
objective: O-005
status: done
depends_on: [{task: T-019, requires: clear}]
owner_validation:
    required: true
    accepted_check: C-008
    accepted_by: {role: owner, session: owner-directed-visual-review-2026-10-10}
planned_by: {role: planner, session: g002-replan-2026-10-06}
check_waiver:
    task: T-020
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-09T21:27:09Z"
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

Implementation and technical verification are complete; the required owner visual judgement is pending. Extra reads: targeted `rg --files src/shell` inventory, then `src/shell/style.css` and `src/shell/AstraeusShell.tsx`, to locate and inspect the responsive shell implementation because the Task targets the shell while its listed source context names only `src/app/App.tsx` and `src/app/style.css`; `src/shell/ObjectControls.tsx`, `src/shell/TimelineBar.tsx`, `src/shell/InfoPanel.tsx` and `src/shell/ScaleControl.tsx` to check responsive control semantics; `rg --files tools/validate` to locate browser harnesses; `tools/validate/browser-shell.mjs` to review existing shell checks before extending responsive evidence; and `src/app/DebugControls.tsx` to understand the current developer controls after the legacy Spike 02 browser selectors proved stale. Before creating the required design note, T-020 recorded a metadata check of `docs/ASTRAEUS_SPIKE_03.md` to avoid overwriting an existing note.

Responsive implementation: `src/shell/style.css` now wraps the tablet toolbar/timeline and uses a compact mobile control row, camera-mode select, persistent two-row timeline and bounded information sheet above it. `src/shell/ObjectControls.tsx` exposes the configured camera presets through that native mobile select; desktop keeps the labelled preset buttons. No mission-specific strings were added to the shell.

Browser evidence: `tools/validate/browser-spike03.mjs` passed in headless Chromium on 2026-10-10 (Australia/Sydney), using `/home/user/code/planetary-explorer/node_modules/playwright-core/index.js` against `http://127.0.0.1:5199/`. It captured the requested overview, translunar, close-Earth, close-Moon, spacecraft-follow, Metric Visuals, event/provenance, laptop, tablet, mobile and mobile-sheet screenshots under `docs/evidence/spike03/`. It checked 1440×900, 1280×800, 768×1024 and 390×844; tablet/mobile touch target bounds; keyboard focus; equal Metric Visual readouts under True/Readable; unchanged UTC and mission readouts across camera presets; and zero console/page errors. The refreshed capture helper selects and verifies True scale before every screenshot. Results: `docs/evidence/spike03/browser-results.json`. The existing `tools/validate/browser-shell.mjs` also passed after the responsive implementation; it covers the 30-event list, selection/focus/follow, information/provenance, Metric Visuals and scale-invariant readouts.

Regression-script repair after T-020 completion (I-011): the stale Spike 02 harness was rewritten to use the current Developer mode and shell selectors, and anchor-label validation was restored as a separate named script. On 2026-10-10 (Australia/Sydney), `browser-spike02.mjs` passed at 1280×800: all 6 True/Readable pairs matched; 6 camera presets preserved UTC and spacecraft readouts; all 30 event jumps reached their expected timestamps; measured rates were 0.95×, 94.7×, 945.6× and 9,481.7× for configured 1×, 100×, 1,000× and 10,000×; the 30-sample 100× follow track advanced continuously; USNO phase readouts were 50.1%, 0.2%, 50.1% and 99.8%; and there were zero console/page errors. `browser-anchor-labels.mjs` passed with the layer hidden at 0 labels, enabled at 40, then hidden again, with zero console/page errors. Both scripts write only under `docs/evidence/regression-spike01-02/`; original Spike 02 evidence remains untouched. Result files: `docs/evidence/regression-spike01-02/browser-spike02-results.json` and `docs/evidence/regression-spike01-02/anchor-labels/browser-anchor-labels-results.json`.

Fresh configured gates on 2026-10-10 (Australia/Sydney): `npm run typecheck` passed; `npm run build` passed with the existing advisory that the minified JavaScript chunk exceeds 500 kB; `npm test` passed (10 files, 170 tests). Lint is not configured. `git diff --check` passed.

`docs/ASTRAEUS_SPIKE_03.md` covers all thirteen design-note topics and the future needs for time-ranged provenance, Readable-scale radii and the imperative `Astraeus.Scene` API. `.savepoint/Design.md` describes the implemented generic shell, app boundary, current regression scripts and review status. `docs/DONOR_PROVENANCE.md` records the adapted patterns without claiming copied code or licence clearance. T-020 is complete by the owner's recorded decision and owner Task-check waiver. C-008 is the current CLEAR Full Objective Check.

### Owner visual validation — C-008 (2026-10-10)

Accepted. Reviewed the refreshed True-scale captures at 1440×900, 1280×800, 768×1024 and 390×844, including the mobile information sheet, timeline, controls, event/provenance panel, spacecraft-follow view and round anchor markers. The canvas remains dominant; controls and information are understandable; the mobile sheet clears the timeline and remains scrollable. No layout issue blocks acceptance.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
