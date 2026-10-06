---
id: I-001
title: Range-zero UTC millisecond constant in APOLLO11_SOURCES.md is eight hours early
type: defect
status: resolved
source:
  kind: report
  actor: {role: executor, session: T-007}
  at: '2026-10-06T00:00:00Z'
tasks: [T-005, T-007]
checks: [C-004]
resolution:
  disposition: verified
  check: C-004
  actor: {role: checker, session: check-o002-full-2026-10-06}
  at: '2026-10-06T06:02:00Z'
  reason: docs/APOLLO11_SOURCES.md 4.1 now gives -14552880000; Date.parse('1969-07-16T13:32:00Z') equals it and it formats back to 13:32:00Z.
history:
  - at: '2026-10-06T00:00:00Z'
    actor: {role: executor, session: T-007}
    kind: observed
    note: T-007 found it while converting anchors; T-007 uses the correct value and asserts it against events.json.
  - at: '2026-10-06T05:25:00Z'
    actor: {role: executor, session: o002-recheck-2026-10-06}
    kind: repair_attempted
    note: "T-009: docs/APOLLO11_SOURCES.md 4.1 formula and constant changed to -14552880000 with a correction note. Date.parse('1969-07-16T13:32:00Z') = -14552880000 and new Date(-14552880000).toISOString() = 1969-07-16T13:32:00.000Z (node, this session). No code or data change was needed. Not verified by a Check."
  - at: '2026-10-06T06:02:00Z'
    actor: {role: checker, session: check-o002-full-2026-10-06}
    kind: rechecked
    note: "O-002 Full Objective Check C-004 (CLEAR): docs/APOLLO11_SOURCES.md:127-128 gives -14552880000 with a correction note; node Date.parse('1969-07-16T13:32:00Z') = -14552880000 and new Date(-14552880000).toISOString() = 1969-07-16T13:32:00.000Z. No current document or code carries the old constant."
    check: C-004
---

# I-001: Range-zero UTC millisecond constant in APOLLO11_SOURCES.md is eight hours early

## Summary

`docs/APOLLO11_SOURCES.md` section 4.1 gives `-14581680000` ms as the exact UTC Unix timestamp of `1969-07-16T13:32:00.000Z`. That value is `1969-07-16T05:32:00Z`. The correct value is `-14552880000`. Anyone using the documented formula puts every anchor 8 hours early, which rotates Earth-fixed anchors by about 120 degrees.

## Evidence

`new Date(-14581680000).toISOString()` gives `1969-07-16T05:32:00.000Z`; `Date.parse("1969-07-16T13:32:00Z")` gives `-14552880000`. `data/apollo11/raw/events.json` carries the correct ISO `range_zero_gmt`. T-007's tool uses `-14552880000` and throws if it disagrees with `range_zero_gmt`.

## Proof Needed

Correct the constant and the formula text in `docs/APOLLO11_SOURCES.md` section 4.1, then confirm `Date.parse` of the documented instant equals the documented number.
