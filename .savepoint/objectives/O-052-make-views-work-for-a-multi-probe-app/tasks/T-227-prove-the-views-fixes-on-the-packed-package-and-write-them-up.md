---
id: T-227
title: Prove the views fixes on the packed package and write them up
objective: O-052
status: in_progress
stage: audit
depends_on: [{task: T-226, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: voyagers-feedback-20261101}
---

# Prove the views fixes on the packed package and write them up

## Outcome

The `examples/` projects show a made-up two-probe scene with A / B / Both views, view-aware pacing, and host code that moves the camera to each encounter and back with `onEventZone`, `camera` and `setCamera`, built on the packed package; docs, CHANGELOG and Design are reconciled; the owner has looked on the preview (O-052 "Example", "Proof and docs").

## User Check

On `localhost:5490`, open the made-up views scene: in view A playback slows only at A's events, in Both at both probes' events; open the built example: at each encounter its host code moves the camera to the probe and back; switching mid-cruise eases the speed. The views switch works and the page address does not change.

## Done When

- `examples/hello-scene` (and `hello-react` if it stays small) gain the two-probe views scene with pacing, `await ready` then `setView`, and the camera-to-the-encounter composition (`onEventZone`, `camera`, `setCamera`), built by `npm run build:example` from the packed tarballs; made-up data only (ARCH-03).
- The site's made-up views scene gains pacing rules for the owner look and the browser check.
- `check:pack`, `check:node-consumer` and one `npm run check:browser` pass.
- README reviewed end to end for the new rows; CHANGELOG `Unreleased` complete with the two behaviour changes for 0.7.0 users and the first-download size change; Design.md `Interfaces and Data Flow` reconciled with every Drift Note of this Objective (reflected or non-architectural, with reason).
- Owner look recorded before the Full Objective Check.

## Context Files

`examples/hello-scene/src/main.js`, `examples/hello-scene/package.json`, `examples/hello-react/src/main.jsx`, `tools/build-example.mjs`, `tools/check-node-consumer.mjs`, `packages/astraeus/src/synthetic/syntheticViewsDefinition.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/Design.md` under `Interfaces and Data Flow`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-03, ARCH-06, TEST-01, TEST-03, TEST-04, CODE-01; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Extend the examples and the site's made-up views scene.
3. Run the pack, node-consumer and browser checks.
4. Docs, CHANGELOG, Design reconciliation; ask the owner for the look.

## Boundaries

No new demo; no real mission data; no release.

## Technical Verification

Configured gates plus `check:pack`, `check:node-consumer`, `npm run build:example` and one `npm run check:browser` (browser policy). Evaluated later under `agent-skills/references/check-method.md`; the Full Objective Check follows.

## Technical Evidence

Stage: audit (ready for the Full Objective Check; owner look not yet recorded). No Task Check requested; no waiver recorded by this builder.

Commands run (all from the repo root, branch o052-views-fixes):
- `npm run lint`, `npm run typecheck`, `npm run build`: pass.
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 2201 passed, 1 skipped.
- `npm run check:pack`: pass (17.3 s). `npm run check:node-consumer`: pass (9 tests, including the new two-probe views + pacing test).
- `npm run build:example`: both examples built from the packed tarballs. `npm run measure:example`: 1,659,659 bytes raw, 478,702 gzip first-open.
- `npm run check:browser` (one run, exit 0, 356 s, every step error-lines=0): docs/evidence/browser-20261101T041906Z (steps views, hello-scene, hello-react, public-build-assets, public-addresses all exit 0).

Done When -> evidence:
- Examples gain the two-probe views scene with pacing, `await ready`, and camera-to-encounter: examples/hello-scene/src/main.js (`setViews`, `pacing`, `await viewer.ready`, `onEventZone` + `viewer.camera` + `setCamera`; public API imports only; made-up data) and examples/hello-react/src/main.jsx (views, pacing, `onEventZone` + `camera` prop; follows the encounter's probe, no restore because the React component has no handle); `publishWorkflow.test.ts` asserts the calls; `build:example` pass; browser steps hello-scene and hello-react pass.
- Site's made-up views scene gains pacing: syntheticViewsDefinition.ts (events a and b typed "flyby", near rule 1800 s at 60x; shared event untyped); `syntheticViews.test.ts` and browser step `views` pass.
- check:pack, check:node-consumer, one check:browser pass: results above.
- README reviewed (rows for ready, address, setCamera/camera, onEventZone, Page address, views, pacing present); CHANGELOG Unreleased gains the two 0.7.0 behaviour changes and the first-download size change; Design.md Interfaces and Data Flow paragraph "Views fixes for a multi-probe app (O-052...)" reconciles every Drift Note.
- Owner look: NOT recorded (pending the owner).

Design reconciliation of Drift Notes: T-222 whenAttached/ready: reflected (item 1). T-223 address.ts, loadFadeSeconds, show=: reflected (item 2). T-224/T-226-reuse zonesInView, eventId, per-view pace in SceneControls.pace: reflected (item 3). T-225 pose kind, cameraTargets/readCamera/setCamera, stay-rule pose caveat, target-shown rule: reflected (item 4). T-226 zones/events on host link, no engine camera: reflected (item 5).

Send-back (coordinator): `EventZoneChange.via: "time" | "view"` added (ViewerLink.#publishZones, from the published view changing); README composition, hello-scene and CHANGELOG restore only for `via === "time"`. Tests: via on each trigger in eventZonesDom.test.ts plus "across a mid-zone view switch that hides the zone the composition neither throws nor asks for a restore". Re-run: lint, typecheck, build, npm test (2202 passed, 1 skipped), check:node-consumer pass, build:example pass, publishWorkflow test pass. No second browser run (the browser run above predates this change; the example's restore path is not browser-asserted).

Extra reads: none beyond Context Files and the Drift Notes of T-222..T-226; also read packages/astraeus-site/tools/validate/check-hello-scene.mjs and tests/publishWorkflow.test.ts (to keep the example's browser check and cap valid).

Limitations: the camera-to-encounter motion itself is not asserted by any browser check (the owner look covers it); the browser check does not assert pacing in the views scene; hello-scene's `viewer.setCamera(before)` could throw `bad-camera` if the visitor switches view during a flyby so the saved pose's object is hidden (same pattern as the README snippet; not exercised); the owner's running preview on 5490 may need a restart to show the changed made-up views scene.

## Drift Notes

Reconcile every earlier step's notes here.
