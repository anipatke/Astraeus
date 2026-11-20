---
id: I-183
title: setGroupLook, setLook and setCamera read a Map or Date as an empty object instead of refusing it
type: defect
status: resolved
source:
  kind: check
  check: C-190
  actor: {role: checker, session: check-o078-20261120}
  at: '2026-11-20T20:45:00Z'
tasks: [T-324]
checks: [C-190]
guardrail_ids: [API-04, API-05]
severity: low
resolution:
  disposition: accepted
  actor: {role: owner, session: plan-g022-20261120}
  at: '2026-11-20T20:50:00Z'
  reason: 'Owner, 2026-11-20, after the fix was offered: "do all of this, you are authorised". Accepted on the executor''s repair evidence below; not a checker CLEAR.'
history:
  - at: '2026-11-20T20:45:00Z'
    actor: {role: checker, session: check-o078-20261120}
    kind: observed
    note: 'C-190 observation A4b: setGroupLook(id, new Map()) or a Date passes as {} and changes nothing, where O-078 asks for bad-group; setLook checks the same way. TypeScript rejects both.'
    check: C-190
  - at: '2026-11-20T20:49:00Z'
    actor: {role: executor, session: exec-t324-20261120}
    kind: repair_attempted
    note: 'One shared check, src/api/plainObject.ts isPlainObject (prototype null or a prototype whose own prototype is null, so any realm), now used by checkedGroupLook (setGroupLook), checkedLook top level and nested (setLook) and cameraRequestOf (setCamera). New table test tests/plainObjectInputs.test.ts: Map, Date, class instance, array, function, null, number refused by each entry with its own code (bad-group, bad-look, bad-camera); literal, Object.create(null), JSON, frozen literal accepted. Existing messages unchanged (viewerLinkPin exact-text tests pass). Gates recorded in the commit run. Not verified by a checker.'
  - at: '2026-11-20T20:50:00Z'
    actor: {role: owner, session: plan-g022-20261120}
    kind: owner_decision
    note: 'Owner: "do all of this, you are authorised" (fix it, close O-078, release 0.9.4).'
---

## Summary

The host calls that take an options or look object accepted any non-array object, so a `Map` or `Date` read as an empty object and silently changed nothing.

## Evidence

C-190 observation A4b; repair and table test as in history.

## Proof Needed

`setGroupLook("g", new Map())`, `setLook(new Date())` and `setCamera(new Map())` each throw their call's error code; plain objects still pass.
