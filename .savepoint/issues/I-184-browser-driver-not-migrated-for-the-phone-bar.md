---
id: I-184
title: The browser driver is not migrated for the phone bar, so the planets phone and look-out journeys fail
type: defect
status: open
source:
  kind: check
  check: C-191
  actor: {role: checker, session: check-o079-20261121}
  at: '2026-11-21T04:14:23Z'
tasks: [T-326, T-327]
checks: [C-191]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-11-21T04:14:23Z'
    actor: {role: checker, session: check-o079-20261121}
    kind: observed
    note: 'C-191: npm run check:browser steps planets-phone and look-out exit 1. (a) On a 375 px phone the nine-planet picker is the fit rule''s compact <select>; driver.mjs experienceSwitchState and chooseSwitchOption only read and press [data-switch-value] buttons. (b) On a phone the Developer cog sits in the closed menu drawer; driver.mjs developerOpen/openDeveloper query getByRole("button", { name: "Developer mode" }) without revealing the menu and time out after 30 s.'
    check: C-191
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
