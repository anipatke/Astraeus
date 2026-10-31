---
id: T-209
objective: O-048
title: Prove the fixes on a graphics card and write them up
status: done
depends_on: [{task: T-204, requires: clear}, {task: T-205, requires: clear}, {task: T-206, requires: clear}, {task: T-208, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-209, reason: 'Owner said "orchestrate O48"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o048-run-20261031}, recorded_at: '2026-10-31T09:02:27Z'}
planned_by: {role: planner, session: probe-feedback-2-20261031}
---

# Prove the fixes on a graphics card and write them up

## Outcome

The synthetic journey shows Saturn, its rings and moons when the camera is near Saturn with the whole-path reach, every catalogued moon's orbit can be drawn, Go to frames an event's object, and labels stay steady at fast playback; checked in a browser and by the owner in a GPU browser; docs and Design reconciled.

## User Check

Open `localhost:5490/app.html?experience=synthetic-journey` in your normal browser: pick Saturn and zoom in close; Saturn, its rings and moons stay visible (before, they vanished). Zoom right out; the whole path still shows. Press Go to on a flyby; the view jumps to that moon. Play fast; labels don't flicker.

## Done When

- The synthetic journey (`?experience=synthetic-journey`) gains: rings on the ringed planets (by default), orbit lines for a few moons beyond Io, events naming their objects; a browser case zooms near Saturn with the whole-path reach and reads that Saturn and its rings draw (depth mode recorded).
- `npm run check:node-consumer` covers rings in a public definition and a moon orbit beyond Io.
- One `npm run check:browser` passes.
- README, CHANGELOG `Unreleased`, API reference agree; every earlier drift note reflected in `.savepoint/Design.md` or marked non-architectural with a reason.
- Owner look on `localhost:5490` in a GPU browser, recorded before the Full Objective Check.

## Context Files

`packages/astraeus/src/synthetic/syntheticJourneyScene.ts`, `packages/astraeus-site/src/journeyData.ts`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `tools/check-node-consumer.mjs`, `.savepoint/Design.md`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` (sections touched by this Objective's drift notes).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Extend the journey fixture (ARCH-01: made-up names).
3. Extend browser and node-consumer checks; run the gates once.
4. Reconcile docs and Design; ask the owner to look.

## Boundaries

No real mission data; no publishing.

## Technical Verification

Full configured gate, `npm run check:node-consumer`, one `npm run check:browser`; then the Full Objective Check under `docs/agents/verification.md`.

## Technical Evidence

Executor: build session for T-209; step check waived by the run rules (the Full Objective Check covers it). No screenshots; the owner look and User Check are left to the owner. Not done by me: owner look on `localhost:5490` in a GPU browser (Done When, last bullet).

Per criterion:
- Journey fixture (`packages/astraeus/src/synthetic/syntheticJourneyScene.ts`): rings come by default from the catalogue (T-205; nothing to attach); Europa, Ganymede and Titan now `orbit: true` (beyond Io); the two pass events name `object: "jupiter"` / `"saturn"` (T-207). Met.
- Browser case `nearSaturnChecks` in `packages/astraeus-site/tools/validate/browser-smoke.mjs`, run inside the synthetic-journey view: seek to the Saturn pass, pick Saturn, 60 wheel turns in; reads `data-body-screen` (Saturn is a sphere, in view, radius > 20 px), the scene's `data-rings` band count (> 0), `data-paths` (europa-orbit, ganymede-orbit, titan-orbit present) and the new `data-depth-mode` (must be "logarithmic"). The canvas now reports `data-depth-mode` (`LayeredRender.tsx`, one line, from `gl.capabilities.logarithmicDepthBuffer`). The scene runs with the journey's whole-path reach (far plane past 170 AU). Result (desktop and phone): depthMode logarithmic, rings 10 bands, Saturn sphere radiusPx 702.7 (desktop) / 659.0 (phone). Passed. Rings are inferred from the band count in the scene plus Saturn drawing; the readouts have no per-ring draw flag (stated limitation).
- check:node-consumer (`tools/check-node-consumer.mjs`): new test on the packed package: Titan with `orbit: true` about Saturn gives a path of spanMs 15.945 days (a made-up data source supplies Titan so the data package is not needed); Saturn's catalogue visual (read from the packed file by URL since the public entry does not export the catalogue) has ring bands, Mars none. Pass.
- One `npm run check:browser`: run once (docs/evidence/browser-20261031T085359Z). First run: smoke failed only the new case (my read of `data-rings` hit the drawing surface, not the wrapper where the attribute lives; fixed to `ui.sceneCanvas`) and `public-build-assets` failed on the load budget: Apollo 11 page 4,460,925 B raw (limit 4,450,000), 2,829,833 B gzip (limit 2,900,000). Raised the raw limit to 4,470,000 in `load-budget.mjs` with a dated note (growth = rings in the engine catalogue, moon periods, log-depth chunks); no other page over. All other steps passed (smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-addresses). After the fixes I did NOT repeat the whole command (policy: once); I reran only the fixed case: `ASTRAEUS_VIEWS=synthetic-journey` browser-smoke on a dev server at port 5199 (2/2 passed), and did not re-run the load budget (no public build): the raised limit is checked arithmetically (4,460,925 < 4,470,000) only. The Full Objective Check should run `npm run check:browser` fresh.
- Frame time: headless software GL, wheel-nudging near Saturn for 3 s: 5 frames/s desktop viewport (1440x900), 43 frames/s phone viewport. Software rendering and the nudge loop dominate; this is NOT a GPU number and cannot show the log-depth cost. Unmeasured on a GPU; for the owner look.
- Docs: README addBody row already names rings, moon orbits, Phobos/Deimos refusal; the addEvents row lists `object?`; CHANGELOG Unreleased has one line per fix (T-204..T-208); the API reference is generated from the export doc comments (tested). The `data-depth-mode` readout is test-facing and not public API, no CHANGELOG line. Agreement checked by reading; no change needed.
- Design reconciliation: one paragraph "Near planets and rings (O-048)" added to `.savepoint/Design.md` under Interfaces and Data Flow. See Drift Notes for each note.
- Note on T-206: the Done When said Phobos/Deimos are refused at `toDefinition`; the code throws `no-orbit` at `addBody` (earlier, the same error); README and CHANGELOG say addBody.

Gates (final, after the last code change except the load-budget and smoke-script edits noted above): `npm run lint` pass, `npm run typecheck` pass (rerun after fixes), `npm run build` pass, `npm test` 159 files, 2006 passed, 1 skipped (run before the browser-smoke/load-budget edits; those files are not covered by the unit suite except the driver guard, unchanged), `npm run check:node-consumer` pass.

Files read: Context Files plus T-204..T-208 task files, Design.md, README addBody/addEvents rows, CHANGELOG Unreleased, LayeredRender.tsx, sceneDebug.ts, driver.mjs, load-budget.mjs, AstraeusScene.tsx, experienceDefinition.ts (extra reads to find the readouts and the data-rings source).
Files changed: packages/astraeus/src/app/LayeredRender.tsx, packages/astraeus/src/synthetic/syntheticJourneyScene.ts, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, tools/check-node-consumer.mjs, .savepoint/Design.md, this Task.

Limitations: owner look and GPU frame cost not done; the new browser case ran fully only on the post-fix focused rerun, not inside a second whole check:browser; the raised Apollo limit is not re-measured by the budget script; junit.xml rewritten by npm test (was it tracked? left as produced).

- Owner look (2026-10-31T09:02:19Z, session o048-run-20261031): the owner opened `localhost:5490/app.html?experience=synthetic-journey` in their GPU browser for the User Check (Saturn close, whole path zoomed out, Go to on a flyby, fast playback) and answered "Looks good, run final check". GPU frame time was not measured.
- Owner decision (2026-10-31T09:02:19Z): Apollo 11 public-page raw load budget raised 4,450,000 → 4,470,000 B ("Raise to 4.47 MB"); gzip limit unchanged.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

Reconciliation (T-209): all notes below are now in `.savepoint/Design.md`, Interfaces and Data Flow, paragraph "Near planets and rings (O-048)".
- T-204 logarithmic depth buffer and the shader-chunk rule: reflected (also the `data-depth-mode` readout).
- T-205 rings as catalogue data, ring data apart from moon lists, pack limit: reflected (pack limit now 464, with T-206's raise).
- T-206 `orbitPeriodDays`, `orbitLineFades`, `siderealPeriod.ts`, `moonOrbitPath`: reflected; OrbitSetView not reused: reflected as a separate-by-design note.
- T-207 `TimelineEvent.object`, `bad-event`, Go to via Focus preset: reflected.
- T-208 label memory and 14 px re-appear margin: reflected (layout only).
- New from T-209: Apollo 11 first-load raw limit 4,450,000 to 4,470,000 in `load-budget.mjs`: a gate threshold, non-architectural (the limit and its note live in the budget file).
