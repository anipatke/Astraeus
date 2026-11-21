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
  - at: '2026-11-21T04:42:13Z'
    actor: {role: executor, session: repair-o079-c191-20261121}
    kind: repair_attempted
    note: 'Diagnosis (positions only, no screenshot; own dev server :5491, synthetic-journey at 390x844, Saturn picked through the menu): every probe point of freeCanvasPoint hit the Saturn information card. The card was 514 px tall (154-668 px) although the phone sheet cap is 50% of the viewer: the phone sheet places (left, right, developer, sheet) were align-self: end, so the place grew with its content and the card''s max-height: min(var(--sheet-max), 100%) had no definite height to resolve against; the whole cap dropped out (the moons sheet on planets-phone likewise grew to -241..474 px, under the bar). Fix (interface): areas.css phone sheet places are align-self: stretch with justify-content: flex-end, so the place fills the free row and the cap applies (card then 246-668 px = 422 px, 50cqh). The capped card still covers the canvas middle by design (a picked object''s card opens on a phone from the menu, as on main), and the eight probes all fell inside it (main passed by about 11 px at 0.3 height), so driver.mjs freeCanvasPoint also probes the band under the bar (FREE_POINT_PROBES adds 0.5/0.3/0.7 at 0.2 and 0.5 at 0.15, middle still first). Fast suite: packages/astraeus/tests/phoneSheetPlace.test.ts (the four phone places stretch and push to the end; the row is minmax(0, 1fr); each phone sheet caps against its place and scrolls) and the I-185 cases in packages/astraeus-site/tests/browserDriverPhoneBar.test.ts (a free point is found above a capped card; the middle is still tried first). Computed-look baseline regenerated with npm run look:lock (documented procedure for an intended look change): only justify-content: flex-end on the phone places and the glow gradients changed. Browser: ASTRAEUS_VIEWS=synthetic-journey node tools/validate/browser-smoke.mjs: desktop ok 76.8 s, phone ok 77.5 s (2/2). Other smoke views not run here (the re-check''s single check:browser covers every view at both sizes); planets-phone, which shares the cause, passes. Gates green.'
    check: C-191
  - at: '2026-11-21T04:51:54Z'
    actor: {role: executor, session: repair-o079-c191-20261121}
    kind: repair_attempted
    note: 'Follow-up verification: browser-smoke.mjs for all views on the own dev server (:5491), run once after the follow-up driver change: 18/18 loads pass (apollo11, planets, showers, showers-geminids, showers-perseids, synthetic-probe, synthetic-journey 76.8 s desktop / 77.4 s phone, index-page, assets-page; desktop and phone). Gates green (as in the I-184 entry of the same time).'
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
