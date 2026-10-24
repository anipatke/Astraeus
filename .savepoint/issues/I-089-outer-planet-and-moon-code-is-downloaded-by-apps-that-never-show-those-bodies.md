---
id: I-089
title: Outer-planet and moon code is downloaded by apps that never show those bodies
type: other
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

# I-089: Outer-planet and moon code is downloaded by apps that never show those bodies

## Summary

T-178's breakdown (docs/evidence/o043-bundle-baseline.md): `outerPlanets`, `moonSystem`, `planetMoons`, `swiftTuttle`, `planetSystemMaps`, `MoonFamilyPanel` (about 20k characters, 1.4% of the first-open script) load on first open in `examples/hello-scene`, which shows only Earth, the Moon and a probe. Left out of O-043 by the owner's "Panels only" choice; offered again as an improvement on 2026-10-24 and accepted for an issue.

## Evidence

docs/evidence/o043-bundle-baseline.md candidate list; `packages/astraeus/src/api/bodies.ts` exports every named body.

## Proof Needed

A design note first (in this Issue's history): which modules can load on demand without changing a public export or making `addBody(io)` asynchronous for the caller. If that is not possible without an API change, stop and report the options for the owner. Otherwise: `npm run measure:example` before and after shows a drop, the first-open graph test (`firstOpenGraph.test.ts`) asserts the split modules are not reached, and every demo still draws its planets and moons (fast suite; one browser run at the end of the batch).
