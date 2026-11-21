---
id: I-185
title: The phone smoke of the synthetic journey finds no free point on the scene at Saturn
type: defect
status: open
source:
  kind: check
  check: C-191
  actor: {role: checker, session: check-o079-20261121}
  at: '2026-11-21T04:14:23Z'
tasks: [T-329, T-326, T-331, T-327]
checks: [C-191]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-11-21T04:14:23Z'
    actor: {role: checker, session: check-o079-20261121}
    kind: observed
    note: 'C-191: npm run check:browser smoke, synthetic-journey phone FAIL after 45.8 s: "no free point on the scene to zoom in from" (browser-smoke.mjs:201, nearSaturnChecks). Desktop passes. Root cause not diagnosed by the checker (no second browser run for the same code).'
    check: C-191
---

# I-185: The phone smoke of the synthetic journey finds no free point on the scene at Saturn

## Summary

The O-079 browser checks do not pass at phone size: in the smoke step, the synthetic journey on a phone fails in `nearSaturnChecks` because none of the eight probe points `ui.freeCanvasPoint` tries has the canvas on top. Something the reset interface draws over the scene covers the middle of a 390x844 phone at that point of the journey. The same scenario passes on desktop, and passed before this branch (C-190's browser run, O-078).

## Evidence

- Run: `npm run check:browser`, 2026-11-21T04:08:52Z; `docs/evidence/browser-20261121T040852Z/smoke/results.json`: `{"label": "synthetic-journey", "size": "phone", "ok": false, "failures": ["no free point on the scene to zoom in from"]}`; 17 of 18 loads passed.
- Sequence (`packages/astraeus-site/tools/validate/browser-smoke.mjs:110-117,155-205`): follow-path checks, then `closeMarkerChecks` (resizes to 375x667, opens timeline marker-group pop-ups, presses items, `closeInfoQuietly`, resizes back to 390x844), then `nearSaturnChecks`: `seekToReady`, `pickBody("saturn")` (through the menu's object picker), `waitForBodySettled`, `freeCanvasPoint` -> null.
- `driver.mjs:833-840` `freeCanvasPoint` tests `document.elementFromPoint` at the centre, 0.4/0.6 and 0.3/0.7 of the canvas. Candidates the checker could not rule out by reading: a phone sheet occupant (story panel at the flyby, card, About) or the menu or timeline layer left raised after the marker-group pop-ups and the resize; the areas grid gives area children `pointer-events: auto` (T-329).

## Proof Needed

- Diagnose what covers the canvas (positions only, no screenshot), fix the interface or, if the cover is intended, the driver, and add a fast-suite case for the cause.
- The smoke step passes for every view at both sizes in the next Full Check's single `npm run check:browser` run.
