---
id: T-217
title: Prove one-path probes on the packed package and write it up
objective: O-050
status: in_progress
stage: audit
depends_on: [{task: T-213, requires: clear}, {task: T-214, requires: clear}, {task: T-215, requires: clear}, {task: T-216, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-217, reason: 'Owner said "orchestrate O50"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o050-run-20261101}, recorded_at: '2026-10-31T22:04:59Z'}
planned_by: {role: planner, session: probe-switch-20261101}
---

# Prove one-path probes on the packed package and write it up

## Outcome

The packed package shows a made-up flyby followed as one path through every stretch, listed and automatic, with close timeline markers each reachable. Docs, CHANGELOG and Design match, and the owner has looked at it on the preview.

## User Check

On `localhost:5490`, open the synthetic journey scene, follow the probe from its start at fast playback, and confirm: the camera stays on it through each encounter, the menu shows it once with no "(Unavailable)", and each close timeline marker opens its own event on desktop and phone sizes.

## Done When

- `check:node-consumer` builds a scene on the packed package with a listed-stretch path, an `"auto"` path and a Moon-orbit stretch against the Moon, and asserts one menu object per path and the resolved stretches.
- The synthetic journey scene (`packages/astraeus/src/synthetic/syntheticJourneyScene.ts`) gains an encounter stretch and close events, and the browser check covers following across a stretch boundary. One `npm run check:browser` passes.
- README, API reference and example lines; CHANGELOG `Unreleased` with the first-download size change (`node tools/measure-example.mjs`); `check:pack` and `check:engine-alone` pass.
- Every Drift Note from the O-050 steps is reflected in Design.md or marked non-architectural with a reason.
- Owner look recorded before the Full Objective Check.

## Context Files

`packages/astraeus/src/synthetic/syntheticJourneyScene.ts`, `packages/astraeus/tests/syntheticJourney.test.ts`, `tools/check-node-consumer.mjs`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/Design.md` under `Interfaces and Data Flow`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` and `Current Technical State`.

## Guardrails

ARCH-01, ARCH-03, ARCH-06, PROV-01, TEST-01, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Confirm the previous steps are in place; return REPLAN REQUIRED if not.
3. Packed-package consumer cases; synthetic scene and browser coverage.
4. Docs, CHANGELOG with size; Design reconciliation.
5. One `npm run check:browser`; ask the owner to look on the preview.

## Boundaries

No Voyager app or Apollo 11 demo change; no release.

## Technical Verification

Full configured gates plus `check:pack`, `check:engine-alone`, `check:node-consumer` and one `check:browser` (browser policy). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-11-01 (builder session, branch o050-one-path, nothing committed).

Per Done When:
- Consumer: `tools/check-node-consumer.mjs` gains one test on the packed package: a listed-stretch path (sun, earth, sun) asserted against its resolved `trackedBodies[0].lineFixedTo`, an `"auto"` path (resolves to sun, earth, sun) and a Moon-orbit `"auto"` path (resolves to one `moon` stretch); each asserts exactly one `experience.objects` entry. `check:node-consumer` 7 tests pass.
- Synthetic journey: `syntheticJourneyScene.ts` draws the traveller against the Sun, Jupiter (20 days either side of its pass) and the Sun again, and adds Io, Europa and Ganymede passes within nine hours of the Jupiter pass; `syntheticJourney.test.ts` asserts the stretches, one menu entry and the six event ids. Browser smoke (`browser-smoke.mjs`) gains `followAcrossStretchesChecks` (one menu entry with no "(Unavailable)"; at Jupiter -30, -19, +19, +30 days the traveller's line stays in view and through the middle of the screen) and `closeMarkerChecks` (at 1280x720 on the desktop load and 375x667 on the phone load: the numbered mark holds the four Jupiter events, each list item is inside the screen, at least 32 px, not overlapping another, and pressing it seeks the clock to its own event and closes the list). `driver.mjs` gains `resizeViewport`, `markerGroups`, `pressMarkerGroup`, `markerGroupList`, `pressMarkerGroupItem`, and `firstStoryMarkerId`/`openStoryPanel` now fall back to a gathered group.
- Docs: README lines were written by T-213/T-216; CHANGELOG Unreleased gains the marker-group line (T-214 had none), the proof line and the size line; Design.md reconciled (below).
- Two defects found by the browser proof and repaired in this Task: (1) on a phone the open group list was covered by the information sheet (timeline bar z-index 3 against the sheet's 8), so items were unreachable; `TimelineBar.css` raises the bar to 9 while a group list is open. (2) a story panel whose marker gathers under a numbered mark vanished from `.timeline-panel-marker` (the hello-scene example check failed); group items for panels now carry `data-panel-id` and the driver reads and opens them.

Gates (2026-11-01, final tree): `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm test` 166 files, 2060 passed, 1 skipped, 0 failed; `check:pack` pass; `check:engine-alone` pass; `check:node-consumer` pass. `node tools/measure-example.mjs`: first-open 1,644,201 B raw / 470,469 B gzip (0.6.0: 1,638,245 / 468,717; +5,956 raw, +1,752 gzip).

Browser: one `npm run check:browser` (docs/evidence/browser-20261031T214500Z): smoke (including the new journey checks at both sizes), smoke-public-showers, planets-phone, meteor-shower, hello-react, public-addresses passed. hello-scene failed (defect 2 above); public-build-assets failed: Apollo 11 first load 4,492,013 B raw against the 4,490,000 limit (2,013 B over; gzip 2,839,900 of 2,900,000 passes). After the fix for defect 2 the hello-scene script alone was re-run on a rebuilt example and passes. The Apollo 11 raw limit in `packages/astraeus-site/tools/validate/load-budget.mjs` was NOT raised: past raises are owner decisions (O-048 T-209, O-049 T-212), so the second `check:browser` run waits for that decision. Earlier development runs of `browser-smoke.mjs` on the synthetic-journey view alone (about six) fixed the check's own readouts (the traveller is not in the body readout; the line readout is used) and found defect 1.

Owner decision (actor: owner, 2026-11-01, relayed by the coordinator): chose "Raise to 4,500,000 (Recommended)" for the Apollo 11 raw first-load limit; `load-budget.mjs` rawLimit 4_490_000 to 4_500_000 (measured 4,492,013 B). Second and last `check:browser` run (docs/evidence/browser-20261031T215751Z, 318 s): all eight steps exit 0 with no error lines (smoke, smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-build-assets, public-addresses).

Preview: localhost:5490 restarted from this tree at the end (the earlier server held a stale `scene.ts`).

Not verified by the builder: appearance on a real display.

- Owner look (2026-10-31T22:04:59Z, session o050-run-20261101): the owner was given the steps for `localhost:5490/app.html?experience=synthetic-journey` (one menu entry, follow at fast playback through the Jupiter, Saturn and Uranus passes, the numbered marker group near March 1979 at desktop and phone width) and answered "looks good".

## Drift Notes

Reconciled 2026-11-01 (every note from T-213 to T-216 is now in `.savepoint/Design.md`, Current Technical State, paragraph "One path through every stretch (O-050)"):

- T-213 `lineFixedTo` list, `TrackedBody.lineFixedTo` type, boundary and uncovered-time rules: in Design (that paragraph).
- T-213 `planSpans` behind `planPathProvenance` and `planLineStretches`; State and `stateOf` untouched: in Design.
- T-214 `groupMarkers`, 22 px, gathered numbered mark, unmeasured track gathers nothing: in Design. The phone information sheet covering an open list and the panel-id on group items (this Task) are non-architectural: a stacking fix and a test hook.
- T-215 none expected: nothing to reconcile.
- T-216 `api/sphereOfInfluence.ts`, resolution in `toDefinition`/`prepare` into the same list, root body holds everything, GM-less bodies skipped, `trackedBodies` replaced in `prepare`, listed moons have no GM: in Design.
- T-216 pack file limit 470 to 472: Design's pack-limit sentence updated to 472.
- This Task: no new architecture beyond the synthetic scene and browser coverage, also named in the Design paragraph.
