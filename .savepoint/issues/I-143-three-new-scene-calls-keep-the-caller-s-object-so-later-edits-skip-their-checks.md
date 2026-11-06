---
id: I-143
title: Three new scene calls keep the caller's object, so later edits skip their checks
type: defect
status: open
source:
  kind: check
  check: C-148
  actor: {role: checker, session: o059-check-20261107}
  at: '2026-11-06T19:51:42Z'
tasks: [T-267, T-268]
checks: [C-148]
guardrail_ids: [API-04]
severity: low
history:
  - at: '2026-11-06T19:51:42Z'
    actor: {role: checker, session: o059-check-20261107}
    kind: observed
    note: 'Full Objective Check matrix, input axis "mutation after validation".'
    check: C-148
---

# I-143: Three new scene calls keep the caller's object, so later edits skip their checks

## Summary

`Scene.addPlaces`, `Scene.setMoonPanel` and `Scene.addBodySet` check their input and then keep the caller's own object, reading it again when the scene is built. An edit after the call reaches the viewer unchecked, and one object reused for two scenes changes the first scene. API-04 says inputs are checked early, at the call that received them. `Scene.setPicker` (same Objective) and `setLook` already keep a frozen copy.

## Evidence

Violated: API-04 ("typed inputs checked early"; "shape errors throw at the call that received them").

Keeping the object: `packages/astraeus/src/api/planPlaces.ts:68`, `packages/astraeus/src/api/planMoonPanel.ts:60`, `packages/astraeus/src/api/planBodySets.ts:81`. The copy to match: `packages/astraeus/src/api/planPicker.ts:29`.

Smallest scenarios, run through the public calls:

| Scenario | Expected | Actual |
|---|---|---|
| `addPlaces("moon", input)`, then `input.places[0].latitudeDeg = 999` | scene keeps 12, or a typed error | `check()` passes; 999 reaches the definition's `bodyFeatures` |
| `addBodySet(input)`, then `input.members[0].radiusKm = -1` | scene keeps 4 | `check()` passes; `radiusKm: -1` reaches the definition |
| `setMoonPanel(input)`, then `input.label = ""` | scene keeps the label | `check()` passes; empty heading |
| one panel object: label "One", scene a; label "Two", scene b | a shows One | a and b both show Two |
| the same edit on `setPicker` | scene unchanged | scene unchanged |

No test edits an input after these calls.

## Proof Needed

Each of the three calls keeps its own frozen copy at the call, as `setPicker` does. Tests on a made-up scene edit the input after each call (nested lists and items too) and prove the reads, `check()` and `toDefinition` output are unchanged, and that one object reused for two scenes keeps them apart. Under Strategic fix first, also add a general test that walks every object-taking `Scene` call, so a new call cannot keep the caller's object.
