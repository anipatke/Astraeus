---
id: I-190
title: The bad-part doc comment and README row name only panel and customBlock shape errors
type: drift
status: open
source:
  kind: check
  check: C-193
  actor: {role: checker, session: check-o080-20261121}
  at: '2026-11-21T06:47:10Z'
tasks: [T-334]
guardrail_ids: [API-07]
checks: [C-193]
severity: low
history:
  - at: '2026-11-21T06:47:10Z'
    actor: {role: checker, session: check-o080-20261121}
    kind: observed
    note: 'C-193: SceneErrorCode bad-part doc (errors.ts:73) and the generated README error row (README.md:454) still read as T-333 wrote them.'
    check: C-193
  - at: '2026-11-21T06:56:24Z'
    actor: {role: executor, session: repair-o080-c193-20261121}
    kind: repair_attempted
    note: 'Repair (executor): errors.ts bad-part doc now reads: a shelf factory (panel, customBlock, explainer, actions, filterChips, colourKey) or a part control''s setter given a bad value, addParts given a value no factory made, an action''s camera naming what the scene lacks (at build), or handle.part given a part this viewer''s scene does not hold. npm run api:errors rewrote README.md:454 to match; npm run api:lock rewrote api-surface.lock.json. After npm run build: dist/api/index.html 199,695 B raw (limit 230,000), 43,454 B gzip at Node default level (was 43,388; limit 46,000). Gates as I-188''s entry.'
---

# I-190: The bad-part doc comment and README row name only panel and customBlock shape errors

## Summary

O-080 "Proof and docs" asks for doc comments and `npm run api:errors`. The public `bad-part` description says "`panel` or `customBlock` given a bad shape, `addParts` given a value no shelf factory made, or `handle.part` given a part this viewer's scene does not hold". Since T-334 it is also thrown for a bad shape given to `explainer`, `actions`, `filterChips` and `colourKey`, for a bad control argument (`setOpen`, `setSelected`, `setChoices`, `setParagraphs`, `setEntries`) and for an action camera naming a missing object when the scene is built. A host reading the error table cannot tell those cases apart from other codes.

## Evidence

- `packages/astraeus/src/api/errors.ts:73`; `packages/astraeus/README.md:454` (generated from it).
- `packages/astraeus/src/shelf/*/factory.ts` (13 `badPart(` sites), `src/api/planParts.ts` `checkCameras`, `src/api/viewerParts.ts` `setOpen`.

## Proof Needed

- The `bad-part` doc comment covers every part factory, the control setters and the build-time action camera check; `npm run api:errors` regenerates the README row to match.
