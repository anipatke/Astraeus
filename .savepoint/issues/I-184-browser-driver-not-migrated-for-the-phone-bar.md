---
id: I-184
title: The browser driver is not migrated for the phone bar, so the planets phone and look-out journeys fail
type: defect
status: resolved
source:
  kind: check
  check: C-191
  actor: {role: checker, session: check-o079-20261121}
  at: '2026-11-21T04:14:23Z'
tasks: [T-326, T-327]
checks: [C-191, C-192]
guardrail_ids: [TEST-01]
severity: medium
resolution:
  disposition: verified
  check: C-192
  actor: {role: checker, session: recheck-o079-20261121}
  at: '2026-11-21T05:06:30Z'
  reason: 'C-192 CLEAR: driver.mjs reads and chooses both switch forms (readSwitchGroup, switchShowsActive) and reveals the Developer cog through withRevealed, restoring the menu; the single check:browser run (2026-11-21T04:58:25Z, docs/evidence/browser-20261121T045825Z) passes planets-phone (phone journey) and look-out at desktop and phone; browserDriverPhoneBar.test.ts cases fail against the HEAD~1 driver.'
history:
  - at: '2026-11-21T04:14:23Z'
    actor: {role: checker, session: check-o079-20261121}
    kind: observed
    note: 'C-191: npm run check:browser steps planets-phone and look-out exit 1. (a) On a 375 px phone the nine-planet picker is the fit rule''s compact <select>; driver.mjs experienceSwitchState and chooseSwitchOption only read and press [data-switch-value] buttons. (b) On a phone the Developer cog sits in the closed menu drawer; driver.mjs developerOpen/openDeveloper query getByRole("button", { name: "Developer mode" }) without revealing the menu and time out after 30 s.'
    check: C-191
  - at: '2026-11-21T04:42:13Z'
    actor: {role: executor, session: repair-o079-c191-20261121}
    kind: repair_attempted
    note: 'Repair (driver only for the interface; one site host fix). driver.mjs: readSwitchGroup reads either form (buttons [data-switch-value]/aria-pressed, or the compact <select data-switch-param> options/selected), experienceSwitchState uses it and reports compact; chooseSwitchOption presses the button or selectOption()s the compact select and waits on switchShowsActive (either form). New withRevealed(page, locator, act): reveals the control (opens the menu when hidden), acts, and closes the menu again when it was closed; developerOpen reads the cog through it and toggleDeveloper presses it through it (pressDeveloperNow unchanged). driver.d.mts declares the new exports. Fast suite: packages/astraeus-site/tests/browserDriverPhoneBar.test.ts, case 1 (both switch forms read and chosen; markup as SwitchControl.tsx draws it, since the site may not import engine source, ARCH-03) and case 2 (stand-in phone page whose cog is hidden until the menu opens: read and press reveal first and restore the menu; an open menu stays open). Against the old driver 6 of these cases fail. Browser, own dev server on :5491 (not the owner preview), scratch evidence: journey-planets-phone.mjs run 1 got past the switch and failed at chooseMoon (bar title intercepting Io in the moons sheet: the phone sheet cap was ignored, the I-185 cause, fixed in areas.css); run 2 PASS (phone; place io:ra-patera, 3 markers). journey-look-out.mjs run 1 (after the cog fix) passed desktop and got past the cog on the phone, failing at step 1: the site''s trace control at top 60px overlapped the new bar row (ends at 66px); fixed in packages/astraeus-site/src/skyTraceControl.ts (top 72px with a story panel open). Run 2 passed desktop and the story steps on the phone, then FAILED at checkSkyTrace: closed trace control overlaps the open switch panel. Diagnosis (positions only): checkSkySwitches leaves the switch panel and the phone menu drawer open (openSwitchPanel opens both, by design: displaySwitchPlaces says left open); with no story panel the trace control sits at 36% (about 240-298px) and the drawer''s switch panel spans 292-446px. Stopped per the two-failure rule; look-out phone is UNVERIFIED. Proposed fix needing a decision: make toggleDisplaySwitch/displaySwitchOn restore the menu and switch panel as withRevealed does (also used by check-hello-scene and check-hello-sky), or move the site control. Gates green: lint, typecheck, build, npm test (284 files, 4401 passed), check:engine-alone, check:pack.'
    check: C-191
  - at: '2026-11-21T04:51:54Z'
    actor: {role: executor, session: repair-o079-c191-20261121}
    kind: repair_attempted
    note: 'Follow-up repair (coordinator decision: driver route; the site trace control is not moved again). driver.mjs: new withSwitchesRestored(page, act) records whether the menu and the switch panel were open, runs the action, then closes the switch panel (closeSwitchPanel, by its toggle) and the menu again when each was closed. displaySwitchOn, toggleDisplaySwitch, displaySwitchPlaces and switchPanelFit (every driver helper that opens the switch panel) run through it, so no helper leaves the panel or a phone menu open beyond the action asked. New fast cases in packages/astraeus-site/tests/browserDriverPhoneBar.test.ts (stand-in phone page whose switch panel lives in the menu): each of the four helpers from a closed menu ends with panel and menu closed; a read and a press still act on the panel switch; an open menu and panel stay open. Browser, own servers (dev :5491, example previews :5492/:5493 after node tools/build-example.mjs), each run once, scratch evidence: journey-look-out.mjs PASS desktop and phone; check-hello-scene.mjs (HELLO_STORY=1, hello-scene) PASS desktop and phone; check-hello-sky.mjs PASS desktop and phone; browser-smoke.mjs all views 18/18 PASS. journey-planets-phone.mjs passed earlier (before this restore change; it calls no switch-panel helper). Not changed: other reveal-based driver helpers (pickBody, view buttons, scale, camera entries and similar) can still leave a phone menu open after a read; most presses close it through data-closes-drawer. Making all of them restore touches scripts outside this run list (journey-views, meteor-shower), so it is left for a decision. Gates green: lint, typecheck, build, npm test (284 files, 4407 passed), check:engine-alone, check:pack.'
    check: C-191
  - at: '2026-11-21T05:06:30Z'
    actor: {role: checker, session: recheck-o079-20261121}
    kind: rechecked
    note: 'C-192: Proof Needed met; closed as verified.'
    check: C-192
---

# I-184: The browser driver is not migrated for the phone bar, so the planets phone and look-out journeys fail

## Summary

O-079 promises migrated browser checks and T-327 promises the journeys pass at both sizes. Two phone-bar changes from T-326 were not carried into the shared site driver:

1. A long picker (planets: nine options) is drawn on a phone as the fit rule's compact native `<select>` (`shell/SwitchControl.tsx` `CompactSwitch`, note section 4 step 6). The driver reads and presses only switch buttons.
2. On a phone every engine control, the Developer cog included, sits in the menu drawer, which hides its content while closed. The driver looks the cog up by role without opening the menu.

## Evidence

- Run: `npm run check:browser`, 2026-11-21T04:08:52Z, `docs/evidence/browser-20261121T040852Z/summary.txt`.
- (1) `planets-phone ... exit=1`; `planets-phone/results.json`: `AssertionError: Mercury is the open planet` (actual undefined) at `journey-planets-phone.mjs:16`. `packages/astraeus-site/tools/validate/driver.mjs:1167-1175` `experienceSwitchState` maps `[data-switch-value]` and `aria-pressed`; `:1177-1184` `chooseSwitchOption` clicks `[data-switch-value="..."]`. The compact form (`SwitchControl.tsx:15-27`) renders `<select data-switch-param>` with plain options. The new `switchInBarRow` assertion passed (the select carries `data-switch-param`).
- (2) `look-out ... exit=1`; `look-out/results.json`: desktop passed; phone failed with `locator.getAttribute: Timeout 30000ms exceeded ... waiting for getByRole('button', { name: 'Developer mode' })` at `driver.mjs:501` (`developerOpen`) from `openDeveloper` (`:502-503`) from `waitForCameraReading` (`:1936`), called at `journey-look-out.mjs:231`.
- No fast-suite test runs the driver against either phone form.

## Proof Needed

- In `driver.mjs` only (browser policy): the switch read and choice handle both forms (buttons and compact select); the Developer toggle is revealed (menu opened) before it is read or pressed on a phone, and the menu is restored afterwards as `reveal` callers expect.
- `journey-planets-phone.mjs` and `journey-look-out.mjs` pass at both sizes in the next Full Check's single `npm run check:browser` run.
- A fast-suite case (for example in the site's driver or guard tests) covers each of the two cases so the trap fails a test next time.
