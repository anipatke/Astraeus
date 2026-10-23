---
id: T-169
title: Rebuild Apollo 11 on the public API
objective: O-041
status: planned
depends_on: [{task: T-167, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o041-planning-20261024}
---

# Rebuild Apollo 11 on the public API

## Outcome

The Apollo 11 demo's code imports only `astraeus`, builds its story with the public Scene calls, and the site shows it in place of the old definition, looking as before apart from O-041 Decisions 2 and 3; Design.md is reconciled for O-041.

## User Check

Open `localhost:5490` (Apollo is the default experience), desktop and phone: the opening view, paths, anchor dots, events on the timeline, story panels and the Moon's orbit look as before; each spacecraft's info card shows its notes, known limits and the telemetry bars; the Developer drawer no longer has Apollo's "This demo" section; the camera menu reads Overview / Focus / Follow.

## Done When

- `packages/astraeus-demo-apollo11/src` imports only `astraeus` (`.` entry); `packages/astraeus-site/tests/packageBoundaries.test.ts` enforces it, proved on a made-up offence.
- A scene builder (e.g. `buildApollo11Scene()`) replaces the hand-written definition; `packages/astraeus-site/src/main.tsx` uses its `toDefinition()`.
- `MissionPanel.tsx` and `DebugControls.tsx` are gone (Decision 2); mission notes live in the spacecraft descriptions/provenance; telemetry is the info-card readout bars.
- A comparison test (captured from the pre-rebuild definition) shows the same objects (ids, labels, colours, provenance, known limits), events, panels (ids and times), window, rates, scale choices and opening view; each difference is one allowed by a Decision and named.
- Apollo's 11 test files are rewritten against the public result; every dropped case is named with a reason in Technical Evidence.
- Browser scripts that name the old camera labels or Apollo Developer sections are repaired in `driver.mjs` only and mapped in `docs/BROWSER_CHECKS.md`.
- The Apollo page set in `packages/astraeus-site/tools/validate/load-budget.mjs` is re-measured on a public build; any limit raise is flagged for the owner, not decided by the builder.
- Design.md reconciled for O-041's drift notes (new public calls, moved metrics file, no-timeline shell option, Apollo on the public API), each reflected or named non-architectural with a reason.
- Hand-off gates green, plus `check:engine-alone`; owner look recorded.

## Context Files

`packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11.ts`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Definition.tsx`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/apolloMetrics.ts`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/MissionPanel.tsx`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/DebugControls.tsx`, `packages/astraeus-demo-apollo11/package.json`, `packages/astraeus-demo-apollo11/tests/apollo11Reconstruction.test.ts`, `packages/astraeus-demo-apollo11/tests/controls.test.ts`, `packages/astraeus-demo-apollo11/tests/domApollo.test.ts`, `packages/astraeus-demo-apollo11/tests/infoProvenance.test.ts`, `packages/astraeus-demo-apollo11/tests/metricVisuals.test.ts`, `packages/astraeus-demo-apollo11/tests/missionScene.test.ts`, `packages/astraeus-demo-apollo11/tests/paths.test.ts`, `packages/astraeus-demo-apollo11/tests/pointsLayer.test.ts`, `packages/astraeus-demo-apollo11/tests/storyMarkers.test.ts`, `packages/astraeus-demo-apollo11/tests/sunCentred.test.ts`, `packages/astraeus-demo-apollo11/tests/timeline.test.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/tests/packageBoundaries.test.ts`, `packages/astraeus-site/tools/validate/load-budget.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `docs/BROWSER_CHECKS.md`, `packages/astraeus/src/api/scene.ts`, `.savepoint/Design.md`.

## Design References

Design Components/Codebase Map (Apollo demo, site), Current Technical State O-035/O-036/O-040.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03.

## Implementation Plan

1. Capture the current definition's comparable shape as a fixture before changing anything.
2. Write the scene builder on public calls; switch the site; drop the Developer sections.
3. Comparison test, boundary rule, rewritten demo tests.
4. Repair browser driver labels if needed; re-measure the page set.
5. Reconcile Design.md.
6. If a needed call is missing from the public API, return REPLAN REQUIRED naming it rather than reaching into internals.

## Boundaries

No new Apollo data or reconstruction re-run; no change to other demos; no custom Developer-panel hook.

## Technical Verification

Hand-off gates plus `check:engine-alone`; public build plus `public-build-assets.mjs` alone for the page set. No `check:browser` per Task (once at the Full Objective Check). Owner look on the preview. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Integration Task for O-041 Design reconciliation.
