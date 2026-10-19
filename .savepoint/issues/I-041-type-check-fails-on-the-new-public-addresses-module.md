---
id: I-041
title: The type-check gate fails on the new public-addresses module
type: defect
status: resolved
source:
  kind: check
  check: C-081
  actor: {role: checker, session: o024-full-check-20261019}
  at: '2026-10-19T10:40:00Z'
tasks: [T-093]
checks: [C-081, C-082]
guardrail_ids: [TEST-01]
history:
  - at: '2026-10-19T10:40:00Z'
    actor: {role: checker, session: o024-full-check-20261019}
    kind: observed
    note: '`npm run typecheck` fails: tests/homePage.test.ts(3,66) TS7016, no declaration file for tools/validate/public-addresses.mjs. T-093 evidence recorded typecheck ok from a run before that module was added.'
    check: C-081
  - at: '2026-10-19T10:50:00Z'
    actor: {role: checker, session: o024-recheck-20261019}
    kind: observed
    note: 'Repair confirmed: tools/validate/public-addresses.d.mts matches the module''s three exports; npm run typecheck exit 0, build exit 0, tests 1098 passed. Left open only because C-082 is NEEDS WORK on I-042; close as verified at the next CLEAR Check.'
    check: C-082
  - at: '2026-10-19T11:10:00Z'
    actor: {role: owner, session: owner-chat-20261019}
    kind: owner_decision
    note: 'Owner accepted the repair in chat ("no mark it checked ... we arent doing the whole thing over again"); the repair itself was confirmed by C-082. Recorded by the agent on direct instruction; not a technical CLEAR.'
resolution:
  disposition: accepted
  actor: {role: owner, session: owner-chat-20261019}
  at: '2026-10-19T11:10:00Z'
  reason: Accepted by the owner in chat on 2026-10-19 after C-082 confirmed the repair, recorded by the agent on direct instruction.
---

# I-041: The type-check gate fails on the new public-addresses module

## Summary

`tools/validate/public-addresses.mjs` (new in T-093) has no declaration file, so `npm run typecheck` (a configured gate with `block_on_failure: true`) fails. Its siblings (`load-budget`, `public-build-assets`, `driver`) each have a `.d.mts`.

## Evidence

`npm run typecheck` at HEAD 1707f21 plus the uncommitted tree: `tests/homePage.test.ts(3,66): error TS7016`. Unit tests (74 files, 1098 passed) and the build pass.

## Proof Needed

Add `tools/validate/public-addresses.d.mts` (or an equivalent typing); `npm run typecheck` exits 0; build and tests still pass.
