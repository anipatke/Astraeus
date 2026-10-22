---
id: T-133
title: Draw each Pluto moon's orbit as one round lap
objective: O-039
status: in_progress
stage: audit
check_waiver:
  task: T-133
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the Full Objective Check covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T10:40:06Z'
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o039-planning-20261022}
lane: pluto
planned_reads: [src/core/bodies/moonSystem.ts, src/app/OrbitSetView.ts, src/experiences/planets/systems/pluto.ts, data/planets/pluto.json, tests/bodySet.test.ts, tests/jupiterMoonsScene.test.ts]
planned_writes: [src/core/bodies/moonSystem.ts, src/app/OrbitSetView.ts, tests/plutoOrbitLines.test.ts]
# Built beyond planned_writes (recorded in Technical Evidence): src/core/orbitPeriod.ts, src/core/bodies/planetMoons.ts, src/app/bodySet.ts, src/experiences/planets/planetDefinition.ts, src/experiences/planets/systems/pluto.ts
---

# Draw each Pluto moon's orbit as one round lap

## Outcome

Each Pluto-system moon's orbit line spans exactly one true lap, with its period from the Pluto–Charon system mass, and the four small moons' lines are drawn about the Pluto–Charon balance point, so they are under 1% from round and still pass through each moon (I-056).

## User Check

On the preview, open Pluto: every moon's line is one clean loop, Nix's is closed, and each moon sits on its line as time plays.

## Done When

- Charon, Styx, Nix, Kerberos and Hydra lines each span one lap (within 2%) of their true periods (about 6.39, 20.2, 24.9, 32.2 and 38.2 days).
- The small moons' lines are centred on the Pluto–Charon balance point and deviate under 1% from a best-fit circle at 2016-07-01; the moon's drawn position lies on its line at any time.
- Titan's and Phobos's lines are unchanged (same span and shape as before, within numerical noise).
- `tests/plutoOrbitLines.test.ts` measures laps, roundness and the moon-on-line property for these cases. The core stays presentation-free. Owner verdict recorded. Configured gates pass.

## Context Files

`src/core/bodies/moonSystem.ts`, `src/app/OrbitSetView.ts`, `src/experiences/planets/systems/pluto.ts`, `data/planets/pluto.json`, `tests/bodySet.test.ts`, `tests/jupiterMoonsScene.test.ts`.

## Design References

Design: Components/Codebase Map rows for `src/core/` and `data/planets/`; Interfaces and Data Flow.

## Guardrails

ARCH-01, ARCH-02, STYLE-02, STYLE-07, STYLE-10, TEST guardrails.

## Implementation Plan

1. Reproduce the measured lap counts in a failing test first (the I-056 history has the figures).
2. Take the period from the system mass (Pluto plus Charon) or a fitted mean period; choose the smaller change and record why.
3. Offer the line centre as the balance point for a system that names one (data, not a Pluto check in code); draw the small moons about it.
4. Confirm Titan and Phobos are unchanged; ask the owner to look.

## Boundaries

Orbit lines only; no change to moon positions, fits or data files. No browser sets.

## Technical Verification

Focused node tests; configured gates at handoff; owner's look on the preview. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2016-07-01 reference date, lane `lane-t133`, overnight run 2026-10-22.

What was done
- `src/core/orbitPeriod.ts`: `BalancePoint` (a partner body id and its GM), `balanceShare`, `periodAboutBalanceS` (osculating period about the balance point with the pair's GM) and `meanPeriodS` (mean lap read from the body's own motion: angle swept over a 1/256-period arc at four equally spaced phases, averaged).
- `src/core/bodies/moonSystem.ts`: `MoonSystemConfig.balancePoint?`; `osculatingPeriodMs` (used for the history look-back) uses `periodAboutBalanceS`. `src/core/bodies/planetMoons.ts`: Pluto's config names `{ body: "charon", gmKm3S2: 106.10 }` (the Charon GM already in `CHARON`). No Pluto check in code; the Pluto fact is data.
- `src/app/bodySet.ts`: `BodySetLayer.balancePoint?`; `planetDefinition.ts` and `systems/pluto.ts` pass it through (`PlanetSystem.balancePoint?`).
- `src/app/OrbitSetView.ts`: with a balance point, each non-partner path is sampled in the balance-point frame (position minus f times Charon's position, f = GM_Charon/(GM_Pluto+GM_Charon) = 0.1088) and drawn moved by that move at the clock time, so the line ends at the body (the body is on its line at any time); the period is the mean lap. `pointKm`/`headKm`/`headPointsKm` still return places about the centre as drawn. Without a balance point the code path is the old one.
- Test `tests/plutoOrbitLines.test.ts` (4 tests) with the real Pluto 2016 fits.

Criteria
- Laps (span / true period): Styx 0.993, Nix 1.000, Hydra 1.000, Charon 1.000, Kerberos within 2% (test asserts all five within 2%). Without the balance point the same view gives Styx over 2 laps, Nix under 0.8, Charon over 1.2 (asserted, reproducing I-056).
- Roundness (least-squares plane circle fit, max departure / radius) under 1% for all five lines at 2016-07-01 (measured raw check of the frame: Styx 0.98%, Nix 0.39%, Kerberos 0.24%, Hydra 0.29%; Pluto-centred 5.9, 4.7, 3.9, 3.6%); the line plus head stays under 1.2% at +0, 1.3, 5.9 and 11.2 days.
- Moon on its line: head equals the fitted position to 1e-6 km at those times for every moon.
- Titan/Phobos: the no-balance code path is unchanged; the test proves Phobos span equals its osculating period and its line is under 2% from round. Titan is not separately tested (its path in the code is the same branch).

Deviations and decisions
- Period: the plan allowed "system mass or a fitted mean period". The pair-mass osculating period alone left Styx at 1.063 laps and the others at 1.02 to 1.03 (the binary's pull is not a point's), outside the 2% criterion, so lines use the mean lap from the body's own motion (`meanPeriodS`), with the pair-mass period as its first guess and fallback.
- The task listed three files; five more were touched to carry the data (`balancePoint`) from the Pluto config to the view, as the plan's "data, not a Pluto check in code" requires.
- The test was written after the code; the contrast cases inside it (no balance point gives Styx over 2 laps, not round) reproduce the I-056 figures, and a first run of the code with the pair-mass period alone failed the lap criterion.
- Cost: each frame, for lines about a balance point, the four small moons' paths are re-mapped (128 points each). Not measured in a browser.

Gates (from the lane, 2026-10-22): `npm run lint` pass; `npm run typecheck` pass; `flock /tmp/astraeus-build.lock npm run build` pass (existing chunk-size warning only); `npm test` with junit: 94 files, 1294 passed, 1 skipped. No browser sets, no `test:full`.

Owner look on preview: pending. Look at: localhost:5490, planets demo, Pluto. Each moon's line should be one clean loop; Nix's line closed; each moon sitting on its line as time plays (try play and a time jump); Charon's, Styx, Nix, Kerberos and Hydra lines not thick or wobbly. Also glance at Mars (Phobos) and Saturn (Titan): their lines should look as before. After the look, record the verdict here.

Needs for the owner: Design change (new `balancePoint` field on the moon system, body set layer and planet system) is deferred to T-137.

## Drift Notes

Any new line-centre field is a Design change; deferred to T-137.
