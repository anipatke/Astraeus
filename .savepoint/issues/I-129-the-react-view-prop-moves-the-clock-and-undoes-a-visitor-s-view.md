---
id: I-129
title: "The React view prop moves the clock back, and other prop changes undo a visitor's view"
type: defect
status: resolved
source:
  kind: check
  check: C-134
  actor: {role: checker, session: o051-check-20261101}
  at: '2026-11-01T00:30:00Z'
tasks: [T-220]
checks: [C-134, C-135]
guardrail_ids: [TEST-01]
severity: medium
resolution:
  disposition: verified
  check: C-135
  actor: {role: checker, session: o051-recheck-20261101}
  at: '2026-11-01T00:35:00Z'
  reason: 'Repair ac6d5df5 verified by C-135: AstraeusScene applies time, rate and view in three effects, each keyed on drawn, link and its own prop (AstraeusScene.tsx:59-65). An independent probe run against both the repaired and the pre-repair component reproduces I-129 on the old one (view change seeks back 3,000 s; time or rate change reverts a visitor view; a bad time skips the view) and shows all three gone on the new one; a fresh Date of the same moment does not seek, unknown ids still go to onError, and a new Scene re-applies the props. Fresh gates, test:full (2135 passed), check:pack, check:engine-alone, check:node-consumer and one check:browser (9/9) pass.'
history:
  - at: '2026-11-01T00:30:00Z'
    actor: {role: checker, session: o051-check-20261101}
    kind: observed
    note: 'Found by an independent probe in the O-051 Full Objective Check (C-134). AstraeusScene applies time, rate and view in one effect keyed on all three, so changing the view prop seeks the clock back to the time prop, and changing the time or rate prop re-applies the view prop over a visitor''s switch.'
    check: C-134
  - at: '2026-11-01T01:00:00Z'
    actor: {role: executor, session: o051-repair-i129}
    kind: repair_attempted
    note: 'AstraeusScene now applies time, rate and view in three effects, one per prop, each keyed on drawn and its own prop only, so a host change to one never re-applies another. Regression tests change one prop at a time (viewerHostDom.test.ts, I-129 describe). Also from C-134: setViews deep-copies its input (O1), CHANGELOG T-219 line corrected (O2), journey-views.mjs asserts 44 px on phone (O6). Awaiting a Check to verify.'
  - at: '2026-11-01T00:35:00Z'
    actor: {role: checker, session: o051-recheck-20261101}
    kind: rechecked
    note: 'Verified by C-135 (supersedes C-134): independent probe against the repaired and pre-repair AstraeusScene; gates and one check:browser pass. Resolved as verified.'
    check: C-135
---

# I-129: The React view prop moves the clock back, and other prop changes undo a visitor's view

## Summary

`AstraeusScene` applies its `time`, `rate` and `view` props in one effect, keyed on all three (`packages/astraeus/src/api/AstraeusScene.tsx:58-67`):

```ts
if (timeKey !== undefined) link.setTime(timeKey);
if (rate !== undefined) link.setRate(rate);
if (view !== undefined) link.setView(view);
}, [definition, link, timeKey, rate, view]);
```

When any one of these props changes, all three are applied again. Two things go wrong in an app that passes `time` (or `rate`) together with `view`:

1. **Changing the view moves the clock.** If the app changes only `view`, the viewer also seeks back to the old `time` prop. This breaks the O-051 Success Condition "Switching keeps time, speed and playing state" for a host switch through the React component, and T-220's "a `view` prop applied once drawn and on change". It also resets a visitor's speed to the `rate` prop.
2. **Changing the time undoes the visitor's view.** If the app changes `time` (for example from its own scrubber) or `rate` while `view` stays the same, the visitor's own view choice is replaced by the prop's view. `onChange` reports it with `cause: "host"`. The README row says the opposite (`README.md:141`: "Switches to that view once drawn and whenever it changes; not a controlled value (a visitor can switch too)").

A third, smaller effect: if `setTime` throws (a `time` outside the timeline), `setView` never runs for that render.

## Evidence

Check probe (happy-dom, with the same stubs as `tests/viewerHostDom.test.ts`):

The probe source is `zzCheckProbeDom.test.ts`, in the C-134 appendix. It uses two views `a` and `b` and is run with `npx vitest run tests/zzCheckProbeDom.test.ts --silent=false`.

- Render `<AstraeusScene scene view="a" time={T1} />`. Advance the fake clock 5 s while playing, so the viewer's time is T1 + 3,000,000 ms. Then re-render with only `view="b"`. Expected: time T1 + 3,000,000, view b. Actual: `{"time":1893456001000 (= T1),"view":"b","cause":"host"}`. The clock jumped back 3,000 s.
- Render `<AstraeusScene scene view="a" time={T1} />`. A visitor presses `b`, and `onChange` reports `view: "b", cause: "visitor"`. Then re-render with `time={T1 + 1000}` and the same `view="a"`. Expected: view b stays. Actual: `{"view":"a","cause":"host"}`, and button b is `aria-pressed="false"`.

## Proof Needed

Each prop takes effect only when that prop changes: `time` seeks when `time` changes, `rate` when `rate` changes, and `view` when `view` changes. The suggested general fix is three effects, one per prop, so this kind of coupling cannot come back. A regression test should change one prop at a time and check that the other two values stay where they were.

## Missing test evidence

`tests/viewerHostDom.test.ts` > "AstraeusScene applies the view prop once drawn and when it changes, and sends an unknown id to onError" changes only `view`, and passes no `time` or `rate`, so the coupling is never exercised.
