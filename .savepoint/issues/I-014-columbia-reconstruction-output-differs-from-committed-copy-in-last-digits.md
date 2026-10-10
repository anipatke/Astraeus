---
id: I-014
title: Columbia reconstruction output differs from the committed copy in last digits
type: defect
status: resolved
source:
  kind: report
  actor: {role: executor, session: t025-2026-10-11}
  at: '2026-10-10T20:50:00Z'
tasks: [T-025]
guardrail_ids: [TEST-01]
history:
  - at: '2026-10-10T20:50:00Z'
    actor: {role: executor, session: t025-2026-10-11}
    kind: observed
    note: Found while running the T-025 test gate. Searched existing Issues (I-002 to I-009, I-011); none covers this symptom. Not caused by T-025; it fails identically with the T-025 changes stashed.
  - at: '2026-10-10T21:05:00Z'
    actor: {role: executor, session: t025-2026-10-11}
    kind: repair_attempted
    note: Owner chose the tolerance option. tests/apollo11Reconstruction.test.ts now compares the four generated JSON files as parsed data, numbers within 2e-6 and keys, lengths and text exactly; the anchors and the report stay exact-text. Saved data untouched. Proof Needed re-run on this machine only - typecheck pass, build pass earlier, npm test 173 of 173 pass (was 172 of 173), second-run byte-identical test still passes. Unverified - other machines or Node versions, and whether 2e-6 is too loose for velocities (printed to 1e-9 km/s). Executor evidence only; Issue stays in_progress for a checker or owner acceptance.
  - at: "2026-10-10T20:29:47Z"
    actor:
      role: owner
      session: board-owner
    kind: owner_decision
    note: Resolved by the owner from the board.
resolution:
  disposition: accepted
  actor:
    role: owner
    session: board-owner
  at: "2026-10-10T20:29:47Z"
  reason: Resolved by the owner from the board.
---

# I-014: Columbia reconstruction output differs from the committed copy in last digits

## Summary

`tests/apollo11Reconstruction.test.ts` "matches the committed data package and report" fails. It regenerates the Apollo 11 data and requires it to match the saved files byte for byte. Only `data/apollo11/generated/columbia.json` differs; the anchors, Eagle, events, validation file and report all match.

## Evidence

Regenerated into a scratch folder (saved files untouched) on Node v24.16.0, Linux/WSL2. 22 lines differ, all by one unit in the last printed digit, for example a velocity of `0.102171114` against the saved `0.102171113`, or a position of `10322.030172` against `10322.030173`. The same-run "byte-identical on a second run" test passes, so the output is stable on this machine. The saved copy was last written in commit 10a22d0 (2026-10-06). Likely cause, not yet proven: last-digit floating-point differences between the machine or Node version that wrote the saved file and this one.

## Proof Needed

Decide between (a) regenerating and committing `columbia.json` and any dependent report, if the owner accepts last-digit changes, or (b) making the test compare with a tolerance (about 1e-6 km, 1e-9 km/s) instead of exact text. Then `npm test` passes in full, and the Apollo scene still passes the four browser scripts.
