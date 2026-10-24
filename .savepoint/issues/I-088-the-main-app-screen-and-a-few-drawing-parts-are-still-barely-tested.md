---
id: I-088
title: The main app screen and a few drawing parts are still barely tested
type: verification
status: in_progress
source:
  kind: report
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:47:47Z'
severity: low
history:
  - at: '2026-10-24T02:47:47Z'
    actor: {role: planner, session: improvements-intake-20261024}
    kind: observed
    note: 'Owner, 2026-10-24: "can we add the fixes as issues, and iterate through and fix them with agents" (after "no more demos, here on in only improvements").'
  - at: '2026-10-24T14:10:00Z'
    actor: {role: executor, session: i088-repair}
    kind: repair_attempted
    note: 'Added behaviour tests in happy-dom, no source changes, no new coverage exclusions. Statement coverage before/after (npm run test:full): App.tsx 164/256 64.1% -> 214/256 83.6%; BodyView.tsx 1/39 2.6% -> 39/39 100%; DeveloperSettings.tsx 1/56 1.8% -> 50/56 89.3%; FeatureMarkers.ts 52/136 38.2% -> 130/136 95.6%; sceneContentsHooks.ts 31/98 31.6% -> 91/98 92.9%; sceneHooks.ts 11/57 19.3% -> 50/57 87.7%; scenePointer.ts 0/23 0% -> 23/23 100%. Overall 9284/10515 88.29% -> 9638/10515 91.66%; src/app 3359/4073 82.47% -> 3706/4073 90.99%. New tests: appScreenDom.test.ts (App with AstraeusScene replaced by a recorder of its props; asserts page title, starting controls from the address, play/pause/rate/camera/selection effects on clock and controls, story/feature/pick callbacks, lazily loaded Developer tools writing to live controls, view-link copy with clipboard ok/refused, frame stats on/off, loop wrap), developerSettingsDom.test.ts (each settings body: what a press or drag writes to the scene controls and shows), sceneHooksDom.test.ts (useBodyRefs, useSceneDerived, useSceneViews, useSkyStars incl. cancel/late/missing, useOverlayLayers, useScenePointer, useSceneFrame with @react-three/fiber hooks replaced by recorders), bodyViewDom.test.ts (BodyView sphere/marker/halo/rings with fiber useFrame recorded; BodyMesh and AtmosphereGlow stubbed), pointerAndFeatureLayerDom.test.ts (attachScenePointer hover/tap/drag/detach; FeatureMarkerLayer placement, edge flags, panel occlusion, readout change, press). Gates green: lint, typecheck, npm test (140 files, 1850 passed), test:full (same counts). Unverified: App''s remaining uncovered lines (sections around 408-437 and 530-531, mostly the orbit-line and ring/moon fold bodies); the sky status note in the shell (the sky is not in the object picker, so not asserted); DeveloperSettings lines 53-54 and 62-65 (a few dot-size/colour onChange handlers); sceneContentsHooks and sceneHooks lines left are a few effect branches; no real WebGL canvas (R3F Canvas cannot run in happy-dom), BodyView uses the page''s plain elements for scene groups; check:browser not run (not required).'
---

# I-088: The main app screen and a few drawing parts are still barely tested

## Summary

After O-043 (C-116) overall coverage is 88.28% and `src/app` 82.4%, but these stay at or near 0%: `App.tsx` (about 92 of 256 statements missed before O-043), `FeatureMarkers.ts`, the remaining hooks in `sceneContentsHooks.ts` and `sceneHooks.ts` (`useSkyStars`, `useSceneViews`), `DeveloperSettings.tsx`, `BodyView.tsx`, `scenePointer.ts`.

## Evidence

T-180 Technical Evidence and C-116 coverage section.

## Proof Needed

Behaviour tests (outcomes asserted, happy-dom like T-180's) for the listed files, largest gap first, within a ~30 minute box; `npm run test:full` figures before and after for each file; no new coverage exclusions.
