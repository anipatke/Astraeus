---
id: I-148
title: The old picture width field is ignored without a word
type: defect
status: open
source:
  kind: check
  check: C-152
  actor: {role: checker, session: o057-check-20261107}
  at: '2026-11-07T06:15:58Z'
tasks: [T-277, T-280]
checks: [C-152]
guardrail_ids: [API-04]
severity: low
history:
  - at: '2026-11-07T06:15:58Z'
    actor: {role: checker, session: o057-check-20261107}
    kind: observed
    note: 'Full Objective Check, input axis: the renamed input rows of the migration table were compared with RENAMED_INPUTS, and old names were passed through the public calls.'
    check: C-152
---

# I-148: The old picture width field is ignored without a word

## Summary

O-057 says "A plain JavaScript caller who passes an old input name gets a `SceneError` naming its replacement, from one table", and the CHANGELOG repeats it. T-277 renamed `TextureRef.desktop.minViewportWidth` to `minViewportWidthPx`, and the migration table has that row. `RENAMED_INPUTS` has none, and no call refuses it. `TextureRef` is an input: a data package gives it through `DataSource.pictures`. So the old name is ignored silently, which is the trap the table exists to stop.

## Evidence

Smallest scenario, in plain JavaScript on the compiled engine:

```js
const pic = { url: "a.jpg", widthPx: 10, heightPx: 5, localOnly: { reason: "x" }, desktop: { url: "b.jpg", widthPx: 20, heightPx: 10, minViewportWidth: 768 } };
scene.check({ data: [{ name: "pkg", pictures: { earth: pic } }] }); // passes
await scene.load({ data: [{ name: "pkg", pictures: { earth: pic } }] }); // passes
```

Expected: `renamed` naming `minViewportWidthPx`. Actual: no error. `textureUrlFor` in `packages/astraeus/src/assets/licence.ts` then compares the width with `undefined`, so at 1920 px it returns `a.jpg`, where the new name returns `b.jpg`. The large picture is lost with no sign.

`packages/astraeus/src/api/renamedInputs.ts` has no `TextureRef` scope, and `installData` in `src/api/data.ts` checks `picturesProblem` only. The tests miss it because `renamedInputs.test.ts` proves each table row has a CHANGELOG row, and not that each input row of the CHANGELOG has a table row. No shipped package or either app uses `desktop` today, so nothing is broken yet.

## Proof Needed

A `pictures` entry with `desktop.minViewportWidth` throws a `SceneError` with code `renamed` naming `minViewportWidthPx`, at `load` and at `mount`, from a row in `RENAMED_INPUTS`, tested on a made-up data source. A test now holds the other direction: every `renamed` row of the CHANGELOG migration table for an input has a `RENAMED_INPUTS` row, or is listed by name as a read or a method. Removing the new row fails that test.
