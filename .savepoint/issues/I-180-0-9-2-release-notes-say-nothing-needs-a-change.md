---
id: I-180
title: The 0.9.2 release notes say nothing needs a change, but fractional panel, anchor and shownDuring times are now refused
type: drift
status: resolved
source:
  kind: check
  check: C-186
  actor: {role: checker, session: check-o076-20261116}
  at: '2026-11-16T10:10:06Z'
tasks: [T-322]
checks: [C-186, C-187]
guardrail_ids: [API-07]
severity: low
resolution:
  disposition: verified
  check: C-187
  actor: {role: checker, session: recheck-o076-20261116}
  at: '2026-11-16T10:13:30Z'
  reason: Repair proven by C-187 (CLEAR).
history:
  - at: '2026-11-16T10:10:06Z'
    actor: {role: checker, session: check-o076-20261116}
    kind: observed
    note: Found by the O-076 Full Objective Check while mapping each release-notes claim to the CHANGELOG and the code.
    check: C-186
  - at: '2026-11-16T10:12:04Z'
    actor: {role: executor, session: orchestrate-o076-20261116}
    kind: repair_attempted
    note: 'Direct docs repair. docs/release-notes-0.9.2.md intro now says one stricter check may need a change (panel at.time, anchor time, shownDuring end must be a whole millisecond within range); Upgrading names the refused inputs, their codes (bad-panels, bad-anchor, bad-body, bad-trajectory) and the fix (round, e.g. Math.round(ms)), then "Nothing else needs a change". Re-read every other claim: unchanged, each still maps to a CHANGELOG line (CHANGELOG Changed line 16). No code change. Also Design.md Constellations item (4) now names outlineLabel and constellationFinder (C-186 non-blocking note).'
  - at: '2026-11-16T10:13:30Z'
    actor: {role: checker, session: recheck-o076-20261116}
    kind: rechecked
    note: 'Re-check C-187 (CLEAR). Intro (line 5) and Upgrading (line 41) name the refused panel at.time, anchor time and shownDuring end, their codes and the rounding fix; no unqualified "nothing needs a change" remains; matches CHANGELOG line 16 and badTime.test.ts 50-57; other claims unchanged and still mapped; no code change since a6ccb200.'
    check: C-187
---

# I-180: The 0.9.2 release notes say nothing needs a change, but fractional panel, anchor and shownDuring times are now refused

## Summary

`docs/release-notes-0.9.2.md` tells app makers twice that upgrading needs no change: line 5 ("Additions and fixes only; no call changed shape and nothing needs a change.") and line 41, Upgrading ("Nothing needs a change."). The code and the `astraeus` CHANGELOG disagree: `packages/astraeus/CHANGELOG.md` line 16 is a `Changed:` entry saying a fractional or out-of-range story panel `at.time`, anchor `time` or `shownDuring` end, accepted in 0.9.1, is now refused (`bad-panels`, `bad-anchor`, `bad-body`, `bad-trajectory`). This was the owner's O-073 decision ("Keep refusing"), so the behaviour is intended; only the notes' upgrade claim is wrong. The notes' own "Bad times" bullet mentions the refusal, so the notes also contradict themselves.

Violated: T-322 Done When ("nothing claimed that the code does not do"; "every claim maps to a CHANGELOG line"), O-076 Success Condition 4 (notes ready), Guardrail API-07 (honest docs).

## Evidence

- 0.9.1 accepted the input: `git show v0.9.1:packages/astraeus/src/core/storyPanels.ts` lines 124-125 check `Number.isFinite(timeUtcMs)` only, so `at: { time: T0 + 0.5 }` was accepted.
- Now refused: `packages/astraeus/src/core/storyPanels.ts` `atOf` uses `isUtcUnixMs`; `packages/astraeus/tests/badTime.test.ts` lines 50-57 prove `addStoryPanels` with `at.time` `T0 + 0.5` throws `bad-panels` (and the anchor and `shownDuring` rows their own codes); the test passed in the C-186 full gate.
- Smallest scenario: an app on 0.9.1 that places a panel at `start + (end - start) / 3` (a non-whole millisecond) mounts; on 0.9.2, following "Nothing needs a change", `mount` throws `bad-panels`.
- Missing evidence: T-322's reconciliation checked each line of the notes against a CHANGELOG line but not the summary and Upgrading claims against the `Changed:` line.

## Proof Needed

- `docs/release-notes-0.9.2.md` no longer claims that nothing needs a change; its intro and Upgrading say that a fractional or out-of-range panel `at.time`, anchor `time` or `shownDuring` end is now refused with that call's code, and what to do (round to a whole millisecond).
- Every other claim in the notes still maps to a CHANGELOG line; no code change.
- A later Check (or the owner's `accepted` resolution) closes this Issue.
