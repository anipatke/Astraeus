---
id: T-203
objective: O-047
title: Prove a historical probe journey end to end and write it up
status: done
check_waiver: {task: T-203, reason: 'Owner said "orchestrate O-47"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o047-run-20261031}, recorded_at: '2026-10-31T03:10:06Z'}
depends_on: [{task: T-200, requires: clear}, {task: T-196, requires: clear}, {task: T-201, requires: clear}, {task: T-198, requires: clear}, {task: T-199, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Prove a historical probe journey end to end and write it up

## Outcome

A made-up probe journey from 1977 out to about 170 AU, with Jupiter and Saturn encounters in 1979-1980, runs on the packed packages: moons placed at their historical dates, Saturn's orbit line drawn and fitted, playback paced, provenance changing along the path, the opening path selected, and the camera and labels holding when zoomed out to 170 AU (I-114). Docs and Design reconciled; the owner looks once.

## User Check

Open `localhost:5490` on the made-up journey: at 1979-03-05 the four large Jupiter moons show; at 1980-11-12 Titan and the inner Saturn moons show with Saturn's orbit line; playback slows near each encounter and speeds up between; picking a speed overrides it until Auto; zoomed right out the whole path and its labels stay visible.

## Done When

- I-114: a test and a `check:browser` case frame a Sun-centred scene with a path reaching 170 AU whole; bodies, path and labels draw without clipping or jitter; record the camera reach and far plane used, and fix the rule if they clip.
- `npm run check:node-consumer` exercises a historical moon date, a Saturn orbit line, pacing and span provenance on the packed packages.
- One `npm run check:browser` run with the new case passes.
- README, CHANGELOG `Unreleased`, API reference and the example agree with the package; every drift note from earlier steps is reflected in `.savepoint/Design.md` or marked non-architectural with a reason.
- Owner look on `localhost:5490`, recorded before the Full Objective Check.

## Context Files

`packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `tools/check-node-consumer.mjs`, `.savepoint/Design.md`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` (all sections touched by this Objective's drift notes).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Build the made-up journey fixture (no mission names, ARCH-01).
3. Run the 170 AU case; fix framing or label reach if needed.
4. Extend node-consumer and browser checks; run the full gate once.
5. Reconcile docs and Design; ask the owner to look on `localhost:5490`.

## Boundaries

No real probe data; no publishing.

## Technical Verification

Full configured gate, `npm run check:node-consumer`, one `npm run check:browser`; then the Full Objective Check under `docs/agents/verification.md`.

## Technical Evidence

Extra reads (path, reason): `packages/astraeus/src/app/sceneFraming.ts`, `sceneFrame.ts`, `App.tsx`, `core/clock.ts`, `core/bodies/moonSystem.ts`, `api/scene.ts`, `api/data.ts` to fix the framing and loader faults the 170 AU case exposed; the O-047 step Tasks' Drift Notes and `.savepoint/issues/I-114-*.md` for the accounting; `docs/architecture/state-and-assets.md` and `reconciliation-history.md` to reconcile.

Plan item 2, the journey fixture: `packages/astraeus/src/synthetic/syntheticJourneyScene.ts` (public Scene API only, no mission data): launch 1977-09-05 from Earth's place, passes of Jupiter 1979-03-05 and Saturn 1980-11-12 (1.5 million km outward), straight out to 170 AU on 2026-01-01; Sun, Earth (enlarged), Jupiter and Saturn with orbit lines, Io with its ring, Europa, Ganymede, Callisto, the seven inner Saturn moons; `provenanceSpans` (reconstructed to Saturn + 90 days, then illustrative), two `encounter` events, pacing (30 days per second base; a day per second within 30 days of an encounter; a year per second after Saturn + 120 days), rates 1 day, 30 days, 1 year per second; the scene opens following the path on the Solar system scale. The site entry is `?experience=synthetic-journey` (`packages/astraeus-site/src/main.tsx`, dev only; `public-build-assets.mjs` lists the key so a public build must not hold it). Its moon chunks come from `packages/astraeus-site/src/journeyData.ts` (the dev server cannot read the data packages' build-time chunk list). `synthetic-probe` is kept untouched.

I-114 result (the rule did not hold, so it was fixed): with a path to 170 AU and no declared reach, the default zoom-out is max(30, span x 3.5) of the drawn bodies and the far plane is 5,000 Earth radii, so the path (170 AU = 3.99 million Earth radii) was cut off and could not be framed. Fix, a general rule: `CameraReach.cover` (declared by `toDefinition` for a Sun-centred scene with paths about its centre and no `setReach`/`fitOrbit`) is twice the paths' farthest distance (2 x 170 AU = 340 AU, so the whole path fits from any point on it, also when the camera follows the traveller at the far end); `liveReach` turns it into a widen-only `minFocusDistance` for the live canvas and a far plane of 2.5 x that; a declared reach wins; the default is never narrowed. Numbers (Solar system scale, earth enlarged 60): `tests/syntheticJourney.test.ts` asserts reach >= fitReach(340 AU) and far = 2.5 x reach at aspect 1.6 and 0.462, with the near plane (0.1 x distance) keeping far/near at 25 (no depth clipping); the camera clamp `stepCameraTarget` limits a request of 1e12 to that reach. Browser readout at the limit with the Sun picked: all 124 of 124 path vertices in view and the "traveller" label shown with the Sun and Earth labels (desktop and 390x844 phone), spanX 0.133 and 0.225 of the view. No jitter measurement beyond the floating origin keeping the near vertices placed relative to the focus; the readouts showed all vertices in view.

Two engine faults the journey exposed and were fixed (general, not special cases): (1) playback with a timeline bar and no loop ran past the timeline's end, so moon positions past the loaded years were asked for every frame (`SimulationClock.stopWithin`, `SceneRuntime.stopAtWindow`, applied per frame and per 100 ms tick; scenes with no timeline bar and looping scenes are unchanged); (2) a moon's orbit ring is centred on the clock, so at the window's last instant it asked for the next year's chunk (`moonSystem.load` now also fetches the chunk year after the window where the build ships it; never required).

Cases and results (all run in this session):
- New: `packages/astraeus/tests/syntheticJourney.test.ts` (5 cases: path to 170 AU frames whole at desktop and phone shape, never narrows the default, declared reach wins, journey builds inside every body's years and frames its 170 AU end, pacing slows at both encounters and speeds the cruise, provenance changes along the path); `tests/sceneFrame.test.ts` (stop at the edge); `tests/planetMoonSystems.test.ts` (loads the year after the window).
- `npm run lint`, `npm run typecheck`, `npm run build` pass; `npm test` 1977 passed, 1 skipped.
- `npm run check:node-consumer` pass: the packed `astraeus` builds a 1977 scene with Saturn's orbit line (`saturn-orbit` present after `prepare`), pacing, two provenance spans, and `out-of-span` for a 1945 timeline (planet series start 1950). A historical moon date is not exercised there: it needs a data package and Node cannot fetch its `file:` chunks; the Io 1979-03-05 and Titan 1980-11-12 positions are covered by `tests/historicalMoons.test.ts` (within a metre of Horizons) and the browser case below.
- `npm run check:pack` pass (Saturn 53.46 MB packed, limit 59). `npm run check:engine-alone` pass.
- Browser: one `npm run check:browser` run, 2026-10-31 03:27-03:30 UTC, 170 s, evidence `docs/evidence/browser-20261031T032731Z/`. Seven of eight steps pass: smoke (95 s, now including `synthetic-journey` at desktop and phone: Io, Europa, Ganymede, Callisto at 1979-03-05, Titan and six more Saturn moons at 1980-11-12, `saturn-orbit` drawn, 124 of 124 path vertices in view at the farthest zoom-out with the label shown), smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-addresses. FAILED: `public-build-assets` (files only): the public Jupiter planets page is 7,138,243 B raw against its limit of 7,130,000 (8,243 B, 0.12 % over; gzip within), the page-load budget in `packages/astraeus-site/tools/validate/load-budget.mjs`. The growth is cumulative from O-047's engine changes (not measured per step; this Task adds a small amount: `cover`, `stopWithin`, the after-window load). Raising the limit is an owner decision (precedent I-086, "Raise the limit a little"); left unchanged and not rerun.
- Preview: dev server on `localhost:5490` is running; owner look at `http://localhost:5490/app.html?experience=synthetic-journey` (User Check). Not recorded.
- Owner look tweak, 2026-10-31: "maybe little circles not squares for the zoomed out indicators be made standard?" Cause: untextured `PointsMaterial` points are squares. Fix: one helper `packages/astraeus/src/app/dotMaterial.ts` (`dotMaterial(params)`, a cached 32 px disc DataTexture with a 1 px soft edge as `map`, `alphaTest` 0.4; map plus alphaTest chosen over a fragment discard because the group materials already patch only the vertex shader via `onBeforeCompile`, and the stock fragment chunks then handle map, opacity and vertex colours unchanged). Routed through it: `bodyDraw.ts` createMarker, `PointsView.ts`, `KeplerPoints.ts`, `BodySetView.ts`, `TrackedBodyView.ts` (anchors keep their own ring map, which overrides the disc). Size and colour unchanged. `releaseDotTexture()` runs with `releaseAnchorSprite()` on unmount. New `tests/dotMaterial.test.ts` fails if `new PointsMaterial(` appears in `src/app/` outside the helper (no allowlist). CHANGELOG Unreleased line added. `SkyView.ts` stars untouched. Lint, typecheck, build, test pass (1979 passed, 1 skipped); no browser run; owner looks on localhost:5490.

Limitations: pacing was proved by pure-function tests and not by watching real playback in a browser; the owner look covers that. The journey loads moon chunks for the whole 1977-2026 window, so its first load is heavier than other demos (about 20 s on the dev server in the smoke run). No moon is exercised in the packed-package consumer check (reason above).

Task Check waived (frontmatter `check_waiver`); the mandatory Full Objective Check follows.

- Owner decision, 2026-10-31 (session o047-run-20261031), asked by the coordinator: "Raise the limit a little" for the public Jupiter page (7,138,243 B raw over 7,130,000). Coordinator raised `rawLimit` in `packages/astraeus-site/tools/validate/load-budget.mjs` to 7,160,000; gzip limit unchanged. Not rerun here; the Full Objective Check runs check:browser.


**Owner validation (2026-10-31, session o047-run-20261031):** the owner looked at `localhost:5490/app.html?experience=synthetic-journey`, asked for round far-away markers as the engine standard (done, `dotMaterial`), reloaded and said "yes run the final check". Recorded by the coordinator from the owner's words; the Full Objective Check gives the Check reference.

## Drift Notes

Reconciled in this Task (see Design.md "Journeys across years", state-and-assets.md "Per-body spans", reconciliation-history.md "O-047"): T-195 (spans, `out-of-span`), T-196 (orbit-line rule, fitOrbit in setup), T-197 (host seam, handle, exact speed menu), T-198 (`provenanceSpans`), T-199 (none), T-200 (packages, two UTC definitions, Saturn size, grid anchoring), T-201 (`pacing`; the pack limit 460 is non-architectural).

New architecture deltas from this Task, already in Design.md: `CameraReach.cover`/`minFocusDistance` and `liveReach` widening; `SimulationClock.stopWithin`/`SceneRuntime.stopAtWindow`; `moonSystem.load` loading the year after the window; the `synthetic-journey` fixture and `journeyData.ts`.
