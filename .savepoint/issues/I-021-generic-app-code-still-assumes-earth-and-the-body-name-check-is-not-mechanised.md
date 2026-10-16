---
id: I-021
title: Generic app code still assumes Earth, and the body-name check is not mechanised
type: defect
status: resolved
source:
  kind: check
  check: C-020
  actor: {role: checker, session: o014-orchestrator-check-20261012}
  at: '2026-10-12T10:10:00Z'
tasks: [T-047]
checks: [C-020, C-021]
resolution:
  disposition: verified
  check: C-021
  actor: {role: checker, session: o014-orchestrator-check-20261012}
  at: '2026-10-12T09:25:00Z'
  reason: Name check mechanised with a reasoned allowlist, defaults derived from the experience, Earth-specific spacecraft metrics moved under experiences; proven by C-021 (CLEAR).
history:
  - at: '2026-10-12T10:10:00Z'
    actor: {role: checker, session: o014-orchestrator-check-20261012}
    kind: observed
    note: Found in the T-047 Task Check (C-020). Violates T-047 Done When 5 (body names only in src/core/bodies/ and src/assets/bodies/) and leaves no test proving the name check; the executor's own report lists the body-name rule as not mechanised.
  - at: '2026-10-12T09:21:48Z'
    actor: {role: executor, session: o014-t047-sonnet-executor-repair-20261012}
    kind: repair_attempted
    note: >-
      Repaired inside T-047 (Task back at build, then test). (1) tests/nameCheck.test.ts mechanises the check over src/core, src/assets, src/shell and src/app: experience/mission/shower/dataset names fail everywhere; body literals ("sun","earth","moon") and the EARTH/MOON/SUN constants fail outside src/core/bodies/ and src/assets/bodies/ unless the file is in an allowlist with a reason; it proves itself on a planted tree and fails on a stale allowlist entry. src/shell and generic src/app now hold no body literal or constant. (2) Default selection comes from initialObjectIdOf (scene centre if listed, else first shell item), the camera starts focused on sceneCenter (createOrbitCameraState takes the focus), sceneCenterOf no longer falls back to Earth (the bodiless fixture declares sceneCenter), the Sun body is the catalogue root (rootBodyId), the developer readout pair is derived from the mounted bodies (readoutPairOf). tests/experiences.test.ts mounts Moon-alone and Sun-alone compositions and shows selection and focus are mounted bodies; tests/compositions.test.ts checks rootBodyId and readoutPairOf on a made-up star/world/moonlet catalogue. (3) Spacecraft metrics (Earth/Moon radii) moved to src/experiences/apollo11/spacecraftMetrics.ts; the Earth/Moon hierarchy helper moved to tests/scenePlacement.ts; usesEarthMoon removed. Allowlist: src/assets/compositions.ts and nine src/core providers (astronomyAdapter, body, illumination, moonTrajectory, referenceCenters, scalePolicy, state, sunCentredSources, twoBodyAdapter), each with a reason in the test; recorded as a drift note for T-050 (Task text says bodies only in core/bodies and assets/bodies; design section E check 7 differs). Results: typecheck exit 0; build exit 0; npm test 28 files / 535 tests passed; browser scripts earth-moon, showers, spike02, spike03, shell, anchor-labels, synthetic, synthetic-ring, synthetic-belt, precision all exit 0 with errors [] in docs/evidence/o014-t047-repair-20261012-2012/ (browser-synthetic and browser-synthetic-belt first failed on the retired data-earth-moon canvas flag and were updated to assert data-bodies instead, then passed). Unverified: owner visual look; no pixel comparison re-run for Apollo (the changes touch no drawing path, but the Apollo scripts spike02/03 passed unchanged).
    check: C-020
  - at: '2026-10-12T09:25:00Z'
    actor: {role: checker, session: o014-orchestrator-check-20261012}
    kind: rechecked
    note: C-021 CLEAR; checker planted a body literal in src/app and an experience name in src/shell and the name check caught both. Closed as verified. (The observed entry's 10:10Z time was ahead of the machine clock; see C-021 observation 1.)
    check: C-021
---

# I-021: Generic app code still assumes Earth, and the body-name check is not mechanised

## Summary

T-047 Done When 5 requires that no mission, shower or dataset name appears in `src/core/`, `src/assets/`, `src/shell/` or generic `src/app/`, and that body names appear only in `src/core/bodies/` and `src/assets/bodies/`. The experience-name half holds (checker grep finds no Apollo, Perseids, Geminids, Columbia, Eagle or shower names there). The body-name half neither holds nor is tested:

- `src/app/App.tsx:62` starts every experience with `selectedObjectId: "earth"`, and `src/app/CameraController.tsx:40` starts with `focus: "earth"`, whatever the composition. An experience whose composition has no Earth (the Jupiter–Io composition in T-049) would start selected and focused on a body it does not mount.
- `src/app/experienceDefinition.ts:220` falls back to `"earth"` as the scene centre for a definition with no composition, and `:239` (`usesEarthMoon`) tests for the literal Earth and Moon.
- `src/app/AstraeusScene.tsx:108,329–341` builds the developer readout only for a literal Earth and Moon.
- `src/app/metricReadouts.ts:1,95–119` (spacecraft range, altitude, Moon distance metrics, used by Apollo and the synthetic fixture) hard-codes `EARTH` and `MOON` radii.
- `src/core/` providers outside `src/core/bodies/` (`moonTrajectory.ts`, `astronomyAdapter.ts`, `illumination.ts`, `referenceCenters.ts`, `bodyOrientation.ts`, `sunCentredSources.ts`, `twoBodyAdapter.ts`, `state.ts`, `body.ts`, `scalePolicy.ts`) name bodies because they are the scientific providers and defaults that the bindings use.

## Proof Needed

1. A mechanised name-check test (e.g. extending `tests/layerRule.test.ts` or the existing ARCH-01 check) that fails on any experience, mission, shower or dataset name in `src/core/`, `src/assets/`, `src/shell/` or generic `src/app/`, and on any body id literal (`"sun"`, `"earth"`, `"moon"`) or body constant import in `src/shell/` and generic `src/app/`, except through an explicit allowlist where each entry names the file and a one-line reason. The test proves itself by catching a planted offence, as `layerRule.test.ts` does.
2. The default selection and camera focus come from the experience (its `sceneCenter`, or its first shell object), not a literal `"earth"`. A test mounts a definition whose composition has no Earth and shows the initial selection and focus are bodies it mounts.
3. Every remaining body-name use in generic `src/app/` is either removed (moved under `src/experiences/` or generalised to a composition/catalogue lookup) or in the allowlist with its reason. Body names in `src/core/` providers outside `src/core/bodies/` are allowlisted with reasons and recorded as a drift note for T-050's Design reconciliation, since the Task text and the design document (§E check 7) differ on them.
4. Gates pass; Apollo, Earth–Moon Explorer, Perseids and the synthetic fixtures still pass their browser scripts in a fresh run directory with zero console errors.
