---
id: I-147
title: The node consumer check reads a packed internal file
type: drift
status: open
source:
  kind: check
  check: C-152
  actor: {role: checker, session: o057-check-20261107}
  at: '2026-11-07T06:15:58Z'
tasks: [T-274, T-280]
checks: [C-152]
guardrail_ids: [API-01]
severity: low
history:
  - at: '2026-11-07T06:15:58Z'
    actor: {role: checker, session: o057-check-20261107}
    kind: observed
    note: 'Full Objective Check, public surfaces axis: the consumer checks were read for anything past the package exports.'
    check: C-152
  - at: '2026-11-07T07:10:00Z'
    actor: {role: executor, session: c152-repair-20261107}
    kind: repair_attempted
    note: 'Repaired under T-280: the node consumer check no longer reads a packed file; the ring facts (Saturn has bands, Mars none) moved to check:pack (ringFactProblems on the packed catalogue); pastTheEntry fails either consumer check that reaches past the public entry, with planted cases in packagePacks.test.ts. Left open for savepoint-check.'
---

# I-147: The node consumer check reads a packed internal file

## Summary

O-057 says "The node and React consumer checks use only public calls", and T-274's Done When and User Check say the same. `tools/check-node-consumer.mjs` still imports the packed `assets/catalogue.js`. No owner decision narrows those words: T-274 left it as an observation, and Design's accounting calls it non-architectural.

## Evidence

`tools/check-node-consumer.mjs` lines 115 to 117, in the O-048 test:

```js
const { catalogue } = await import(new URL('../assets/catalogue.js', import.meta.resolve('astraeus')).href);
expect(catalogue.get('saturn').visual.rings.bands.length).toBeGreaterThan(0);
expect(catalogue.get('mars').visual.rings).toBeUndefined();
```

The packed `exports` map offers `.`, `./style.css` and `./package.json` only, so this builds a file URL to step past it. A host could not make this read by the front door. Expected: public calls only. Actual: one internal read. The check passes, so no test shows the gap, and moving that file would fail a "public" gate with no public change. `tools/check-react-consumer.mjs` is clean.

## Proof Needed

`tools/check-node-consumer.mjs` makes no read of a packed file: nothing reaches past the package's `exports`. `npm run check:node-consumer` and `npm run check:react-consumer` pass. The ring facts (Saturn has bands, Mars none) stay proven, by a public read or by a named case in `check:pack` or an engine test on the packed build. Under the Strategic fix first rule, a test fails if either consumer check imports a path past the public entry, shown by a planted case.
