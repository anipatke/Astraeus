---
id: I-129
title: "The React view prop moves the clock back, and other prop changes undo a visitor's view"
type: defect
status: open
source:
  kind: check
  check: C-134
  actor: {role: checker, session: o051-check-20261101}
  at: '2026-11-01T00:30:00Z'
tasks: [T-220]
checks: [C-134]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-11-01T00:30:00Z'
    actor: {role: checker, session: o051-check-20261101}
    kind: observed
    note: 'Found by an independent probe in the O-051 Full Objective Check (C-134). AstraeusScene applies time, rate and view in one effect keyed on all three, so changing the view prop seeks the clock back to the time prop, and changing the time or rate prop re-applies the view prop over a visitor''s switch.'
    check: C-134
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
