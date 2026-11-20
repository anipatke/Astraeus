---
id: I-182
title: README and CHANGELOG say referenceTime makes no difference to a measured group, but it does when orbits omit time
type: drift
status: open
source:
  kind: check
  check: C-188
  actor: {role: checker, session: check-o077-20261120}
  at: '2026-11-20T08:32:30Z'
tasks: [T-323]
checks: [C-188]
guardrail_ids: [API-07, PROV-01]
severity: low
history:
  - at: '2026-11-20T08:32:30Z'
    actor: {role: checker, session: check-o077-20261120}
    kind: observed
    note: Found by the O-077 Full Objective Check with an independent probe of a measured group whose orbits give meanAnomalyDeg but no time.
    check: C-188
  - at: '2026-11-20T08:36:00Z'
    actor: {role: executor, session: exec-t323-20261120}
    kind: repair_attempted
    note: 'README addGroup row and CHANGELOG 0.10.0 now say an orbit without time has its mean anomaly read at referenceTime, and referenceTime makes no difference only when every orbit gives time (behaviour unchanged, per the O-077 rule). New test publicApiGroup "reads an orbit''s mean anomaly at referenceTime when the orbit gives no time": without time, moving referenceTime 2 days moves dots > 1,000 km and equals giving time = referenceTime explicitly; the existing test, renamed "... when every orbit gives its time", keeps the other side. No doc comment changed; apiReference budget test passes. Gates 08:34:09Z-08:35:50Z all exit 0 (npm test 4060 passed). Not verified by a checker.'
---

# I-182: README and CHANGELOG say referenceTime makes no difference to a measured group, but it does when orbits omit time

## Summary

`GroupOrbitInput.time` is optional and defaults to the group's reference time (`packages/astraeus/src/api/group.ts`, `buildGroupLayer`: `epochUtcMs: orbit.time === undefined ? referenceUtcMs : ...`; O-077 Success Conditions: "Absent `time` -> epoch = reference time"). So when a measured group's orbits omit `time`, each `meanAnomalyDeg` is read at `referenceTime`, and moving `referenceTime` moves every dot. The README and CHANGELOG state without condition that `referenceTime` makes no difference for a measured group. The behaviour follows the plan; the docs overstate it.

## Evidence

- `packages/astraeus/README.md:90` (addGroup row): "each dot sits at that record's position, advanced by unperturbed two-body motion about the centre (...), so `referenceTime` makes no difference".
- `packages/astraeus/CHANGELOG.md:9` (0.10.0 proposed): "`referenceTime` then makes no difference."
- Reproduction (C-188 probe, public API): `new Scene().addBody(earth).setTime(T0).addGroup({ id: "g", plane: "ecliptic-j2000", orbits })` with five orbits each giving `meanAnomalyDeg` and no `time`, against the same call with `referenceTime: T0 + 2 days`; filled at `T0 + 3 days`, member 1 differs by 84,018 km. Expected per the docs: no difference. Actual: the dots move (correct per the `time` default, so the docs are wrong, not the code).
- Test evidence: `packages/astraeus/tests/publicApiGroup.test.ts` "places the same dots whatever the reference time and list order" only uses orbits that give `time`, so the unconditional claim is untested for the default.

Consequence: an app that leaves `time` out (for example, all records sharing one epoch) and sets `referenceTime` to something other than that epoch gets dots in the wrong place on a card that says the positions are measured (API-07 honest docs; PROV-01).

## Proof Needed

1. README addGroup row and the CHANGELOG 0.10.0 entry state that `referenceTime` makes no difference only when each orbit gives its `time` (its epoch), and that an orbit without `time` has its mean anomaly read at `referenceTime`; or the behaviour changes by an owner/planner decision and the docs match it.
2. A test (or the existing one extended) shows both sides: with `time` given, `referenceTime` makes no difference; without it, the mean anomaly is taken at `referenceTime`.
3. The /api page still fits its gzip budget if a doc comment changes.
