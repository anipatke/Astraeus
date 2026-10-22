---
id: I-062
title: Complexity still reads Needs attention on the scene component
type: verification
status: resolved
source:
  kind: check
  check: C-094
  actor: {role: checker, session: o037-full-check-20261021}
  at: '2026-10-21T11:10:00Z'
tasks: [T-124, T-127]
checks: [C-094, C-095]
guardrail_ids: [CODE-01]
resolution:
  disposition: accepted
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  at: '2026-10-22T10:55:00Z'
  reason: 'Owner, 2026-10-22: "yes record it, then close the tidy-up" after C-095 (code repairs proven; browser proof replaced by the owner''s preview look; runner complexity left for O-038). Recorded by the agent on direct instruction; not a technical CLEAR.'
history:
  - at: '2026-10-21T11:10:00Z'
    actor: {role: checker, session: o037-full-check-20261021}
    kind: observed
    check: C-094
    note: Found by the O-037 Full Objective Check.
  - at: '2026-10-21T11:20:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: owner_decision
    note: 'Owner chose "Slim the scene file so it reads under 20 (Recommended)" over accepting the lizard reading. Repair planned in T-129.'
  - at: '2026-10-22T20:45:00Z'
    actor: {role: executor, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: repair_attempted
    note: 'T-129: the scene callbacks moved into named hooks (src/app/sceneContentsHooks.ts) and a SceneBody component; scratch lizard on src/app/AstraeusScene.tsx reads highest CCN 13; npm run lint passes. Another lizard function over 20 remains elsewhere: tools/validate/runner.mjs 27 (not in this Task).'
  - at: '2026-10-22T09:00:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: owner_decision
    note: 'After T-129 (AstraeusScene 38 to 13 by lizard), tools/validate/runner.mjs still reads 27 by lizard (ESLint passes). Owner: "Leave it for the cut-down (Recommended)": O-038 rewrites or retires the runner; the health complexity reading may stay above target until then.'
  - at: '2026-10-22T10:30:00Z'
    actor: {role: checker, session: o037-full-recheck-20261022}
    kind: rechecked
    check: C-095
    note: 'C-095 recheck: snapshot sha256:4cb756cb... complexity 27 max, 1 function over 20 (tools/validate/runner.mjs:28 runStep); AstraeusScene no longer over 20. SC8 complexity still unmet; rests on the owner''s 2026-10-22 decision (O-038). Owner may record it as a structured exception or resolve this Issue as accepted.'
  - at: '2026-10-22T10:55:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: owner_decision
    note: 'Resolved as accepted on the owner''s instruction "yes record it, then close the tidy-up".'
---

# I-062: Complexity still reads Needs attention on the scene component

## Summary

Success Condition 8 asks the health report after O-037 to show complexity at Watch or better. The official snapshot reports highest complexity 38 (Needs attention; watch line 20) for `src/app/AstraeusScene.tsx:147` `AstraeusScene`, one more lizard function over 20 (2 in total). ESLint's `complexity` rule (SC3) passes because it counts each nested callback alone; lizard cannot bound functions in JSX and counts the component with its hook callbacks, as T-124's evidence already noted (CCN 38). SC3 is met; SC8's complexity clause is not.

## Evidence

C-094 snapshot sha256:ec881d17a43d5e029ae394135845776bd01ab3c9ac4de34087cb226ffd6b0191: complexity 38 ccn, functions_over_20 = 2, average 1.80, classification needs_attention. `npm run lint` exit 0 at 2026-10-21T10:50:38Z.

## Proof Needed

An owner decision either way: reduce what lizard counts in `AstraeusScene.tsx` (and the second function over 20) until the next official snapshot reads Watch or better, or accept the lizard reading as a known mis-measure with SC3 (ESLint) as the governing figure.
