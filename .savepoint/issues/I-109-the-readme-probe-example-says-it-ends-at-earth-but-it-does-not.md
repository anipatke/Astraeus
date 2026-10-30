---
id: I-109
title: 'The README probe example says its line runs to Earth, but it ends 2 AU from Earth'
type: drift
status: resolved
source:
  kind: check
  check: C-124
  actor: {role: checker, session: o046-full-check-20261030}
  at: '2026-10-30T21:33:14Z'
tasks: [T-193]
checks: [C-124, C-125]
resolution:
  disposition: verified
  check: C-125
  actor: {role: checker, session: o046-recheck-20261030}
  at: '2026-10-30T21:55:00Z'
  reason: Repair proven by C-125 (CLEAR).
severity: low
history:
  - at: '2026-10-30T21:33:14Z'
    actor: {role: checker, session: o046-full-check-20261030}
    kind: observed
    check: C-124
    note: 'Found by an independent probe of the README example in the O-046 Full Objective Check.'
  - at: '2026-10-31T08:45:00Z'
    actor: {role: executor, session: o046-repair-20261031}
    kind: repair_attempted
    note: 'README prose and code comment now state what the samples do (start 0.6 AU, end about 1.49 AU from the Sun, not aimed at a planet); the README-mirroring test checks the start and end distances and the centre; a fixture test checks the probe meets Earth at the flyby.'
  - at: '2026-10-30T21:55:00Z'
    actor: {role: checker, session: o046-recheck-20261030}
    kind: rechecked
    note: 'C-125 CLEAR: README prose and comment match the samples (0.6 AU start, 1.4866 AU end, from the Sun), checked by running the README code as written; the repo test now asserts the centre and both distances. History role of the repair entry corrected from builder to executor so the record loads.'
    check: C-125
---

# I-109: The README probe example says its line runs to Earth, but it ends 2 AU from Earth

## Summary

The new README section "A probe across the solar system" (`packages/astraeus/README.md`, about lines 30-55) describes its made-up path as "an invented line from inside Earth's orbit to Earth". Its code comment says "out from 0.6 AU to 1.1 AU over 200 days". Neither is true of the samples it gives. A reader who copies the example sees the probe end on the far side of the Sun from Earth. That is the same "missed Earth" symptom the owner saw at the T-193 look, so the reader could take it for an engine fault. The Goal (G-013) promises that the docs match the package, and T-193 asks for a README example of a Sun-centred path with the README complete for the Objective.

## Evidence

- Samples: `positionKm: [AU * (0.6 + 0.05 * i), AU * 0.1 * i, 0]` for `i` from 0 to 10. The last sample is (1.1, 1.0, 0) AU, which is 1.49 AU from the Sun, not 1.1.
- Independent probe (checker harness, the README code run unchanged against the source at `0d0fd4ca`; the ecliptic is turned back with the IAU obliquity of 23.4392911 degrees). The centre defaults to the Sun as documented, and `scaleChoices` is `["solar-system", "true-scale"]`:
  - day 0: probe 0.600 AU from the Sun at ecliptic longitude 0 degrees; Earth 0.983 AU from the Sun at 100.2 degrees; gap 1.24 AU.
  - day 100: gap 1.98 AU.
  - day 200: probe 1.487 AU from the Sun at longitude 42.3 degrees; Earth at -63.0 degrees; gap 2.01 AU.
- The engine places the samples correctly (it reads them about the Sun and rotates them once). The fault is in the example's data and its prose. The repo test "builds the README example" (`tests/publicApiSunPaths.test.ts`) checks only the scale choices, so it cannot catch this.
- The dev-site fixture `src/synthetic/syntheticProbeDefinition.ts` does meet Earth (28 km at the flyby, checked independently), so the README and the fixture tell different stories.

## Proof Needed

- The README example's prose and comment match its samples, or the samples are changed to match the prose (for example, derived from Earth's place as the fixture is). A test runs the README example and checks the claim it makes, such as the gap to Earth at the stated time.
