---
id: I-088
title: The main app screen and a few drawing parts are still barely tested
type: verification
status: open
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
---

# I-088: The main app screen and a few drawing parts are still barely tested

## Summary

After O-043 (C-116) overall coverage is 88.28% and `src/app` 82.4%, but these stay at or near 0%: `App.tsx` (about 92 of 256 statements missed before O-043), `FeatureMarkers.ts`, the remaining hooks in `sceneContentsHooks.ts` and `sceneHooks.ts` (`useSkyStars`, `useSceneViews`), `DeveloperSettings.tsx`, `BodyView.tsx`, `scenePointer.ts`.

## Evidence

T-180 Technical Evidence and C-116 coverage section.

## Proof Needed

Behaviour tests (outcomes asserted, happy-dom like T-180's) for the listed files, largest gap first, within a ~30 minute box; `npm run test:full` figures before and after for each file; no new coverage exclusions.
