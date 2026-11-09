---
id: I-161
title: Design.md not reconciled for the O-063 planet series drift note
type: drift
status: resolved
source:
  kind: check
  check: C-159
  actor: {role: checker, session: o063-check-20261110}
  at: '2026-11-09T23:40:26Z'
tasks: [T-290]
checks: [C-159, C-160]
guardrail_ids: []
severity: low
resolution:
  disposition: verified
  check: C-160
  actor: {role: checker, session: o063-recheck-20261110}
  at: '2026-11-09T23:47:25Z'
  reason: Repair proven by C-160 (CLEAR).
history:
  - at: '2026-11-09T23:40:26Z'
    actor: {role: checker, session: o063-check-20261110}
    kind: observed
    note: 'Found by the O-063 Full Objective Check against the AGENTS.md project rule "Deferred Design reconciliation". T-290 Drift Notes say "Reconcile into Design.md (Interfaces and Data Flow, planet series) before the Full Objective Check"; `git diff fc1909ff..HEAD -- .savepoint/Design.md` is empty, and Design.md names neither the planet series source nor `planetBinding`.'
    check: C-159
  - at: '2026-11-09T23:45:36Z'
    actor: {role: planner, session: o063-run-20261110}
    kind: repair_attempted
    note: 'Design.md: new "Planet positions from Horizons (O-063...)" paragraph before "Journeys across years" (series source, importer rule, planetBinding/barycentreOffsetKm, with/without package figures, pre-1972 time labels, Uranus/Neptune satellite barycentres, Earth EPV00, size). docs/ASTRONOMY_VALIDATION.md gains a superseded note above the VSOP87A section (history kept). No code change: C-159 gate, browser and health runs stay reusable. Left open for the recheck.'
  - at: '2026-11-09T23:47:25Z'
    actor: {role: checker, session: o063-recheck-20261110}
    kind: rechecked
    note: 'Proof Needed met, by C-160 (CLEAR): Design.md "Planet positions from Horizons (O-063 ...)" in Interfaces and Data Flow states the Horizons barycentre series (centre minus centre-about-barycentre; Mercury and Venus their barycentre) fitted by planet-fits.mjs, the one planetBinding/barycentreOffsetKm rule in planetTrajectory.ts with bindings in bodies/index.ts, under 1 km from 1972 with the package, barycentre wobble without, Uranus/Neptune satellite-ephemeris gap 3,441/742 km, shared planetEphemeris provenance, Earth EPV00 7.3 km, lazy 348,839 B chunk; each matches the code and tests at 957cbbc6. T-290 drift note reflected. No packages/ change since C-159, so its gate, browser and health evidence were reused.'
    check: C-160
---

# I-161: Design.md not reconciled for the O-063 planet series drift note

## Summary

O-063 replaced the source of every planet's position (VSOP87A to JPL Horizons DE441 system barycentres, satellite-ephemeris planet centres for Uranus and Neptune) and made one planet binding rule (`planetBinding`) that adds the moon package's offset. T-290's drift note asks for this to be reconciled into Design.md before the Full Objective Check. Design.md was not changed on the branch.

## Evidence

- Violated rule: AGENTS.md, Astraeus Project Rules, "Deferred Design reconciliation" (each deferred note reflected in Design.md or marked non-architectural with a reason, before the Full Objective Check).
- `git diff fc1909ff..HEAD -- .savepoint/Design.md`: empty. `grep -n -i "vsop\|planetBinding\|PLUTO_BINDING\|planet-fits\|barycentre\|O-063" .savepoint/Design.md`: no hits.
- T-290 Drift Notes (`.savepoint/objectives/O-063-match-nasa-planet-positions-near-flybys/tasks/T-290-take-planet-positions-from-nasa-s-numbers.md`): the planet series is now Horizons for every planet (barycentre as Horizons reports the planet; Mercury and Venus their barycentre), fitted within 1 km over 1950 to 2045; `planetBinding` (`packages/astraeus/src/core/bodies/planetTrajectory.ts`) is the one binding rule for Mars, Jupiter, Saturn, Uranus, Neptune and Pluto; Earth stays on EPV00. None of this is in Design.md.
- Nothing in Design.md is now contradicted (it never named the planet source), so this is missing accounting, not wrong text.

Expected: an O-063 note in Design.md "Interfaces and Data Flow" (as O-061 has) covering the planet series source and the one binding rule, and stating Earth on EPV00 as a known, unchanged choice. Actual: none.

Missing test evidence: not applicable (documentation reconciliation); a re-check reads Design.md against the drift note.

## Proof Needed

Design.md "Interfaces and Data Flow" carries an O-063 paragraph: the planet series is a fit of each planet's system barycentre as JPL Horizons reports the planet (body about the Sun minus body about its barycentre; Mercury and Venus their barycentre, DE441), within 1 km over 1950 to 2045; `planetBinding` in `src/core/bodies/planetTrajectory.ts` is the one binding, adding the moon package's centre offset when loaded, else the planet sits at its barycentre; Earth stays on EPV00 (measured 7.3 km, not changed). The T-290 drift note is accounted for as reflected. No code change is needed, so the C-159 gate and browser runs stay reusable for the re-check.
