---
id: I-053
title: Pluto's view opens on a phone with Charon at the left edge, out of view, so the planets browser set fails
type: defect
status: resolved
source:
  kind: check
  check: C-092
  actor: {role: checker, session: o033-full-recheck-20261020}
  at: '2026-10-20T14:25:30Z'
tasks: [T-118, T-121]
checks: [C-092, C-093]
guardrail_ids: [TEST-01]
severity: medium
resolution:
  disposition: verified
  check: C-093
  actor: {role: checker, session: o033-targeted-recheck-20261020}
  at: '2026-10-20T14:36:30Z'
history:
  - at: '2026-10-20T14:25:30Z'
    actor: {role: checker, session: o033-full-recheck-20261020}
    kind: observed
    note: 'Found by the one planets demo run of the O-033 Full Objective recheck C-092 at HEAD ff1d8d80 (docs/evidence/demo-planets-20261020T141653Z). The outer-planets script passed every desktop scenario and the phone clock, switch, Saturn and place-press scenarios, then failed on the phone Pluto view. Not rerun and not repaired, by the owner rule and the checker role.'
    check: C-092
  - at: '2026-10-20T14:29:59Z'
    actor: {role: executor, session: o033-repair-i053-20261021}
    kind: repair_attempted
    note: 'Repaired: data/planets/pluto.json startView distance 12 to 20 (settings only; azimuth and elevation unchanged; no scene, camera, controls or UI code changed; Jupiter untouched). New tests/planetOpeningFraming.test.ts is pure geometry (45 deg vertical fov, worst case over all directions of Charon at 19,596 km, radius 606 km, from Pluto): Charon uses 1.43 of the half-width at 390x844 with distance 12 (out of view, the failure) and 0.84 at distance 20 (0.24 at 1280x800); Pluto itself stays centred. Saturn (160, rings to 140,180 km), Uranus (60, epsilon ring) and Neptune (80, Adams ring) pass the same test at both aspects unchanged. Gates: typecheck, build, npm test (88 files, 1250 passed, 1 skipped) pass. No browser script run. Proof Needed 1 and 2 met by settings and test; Proof Needed 3 (one clean planets run) is for the recheck. Issue left open.'
  - at: '2026-10-20T14:36:30Z'
    actor: {role: checker, session: o033-targeted-recheck-20261020}
    kind: rechecked
    note: 'Recheck C-093 (CLEAR) at HEAD 5a68b0a4: Proof Needed 1-3 met. Pluto distance 20 in settings, Jupiter unchanged; tests/planetOpeningFraming.test.ts fails at the old distance (independent recompute 1.430 of half-width at phone, 0.839 now); outer-planets browser run passed Pluto and Charon in view at 390x844 and 1280x800 (docs/evidence/demo-planets-outer-20261020T143138Z, exit 0). Verified.'
    check: C-093
---

# I-053: Pluto opens on a phone with Charon off the left edge

## Summary

O-033 Success Condition 9 asks the planets demo set to pass at phone and desktop sizes; T-118 Done When 4 states each planet's opening framing, "Pluto 12 at 20 deg showing Pluto and Charon"; the owner's standing rule for UI is phone layout first. In the recheck's one run of `npm run check:demo -- planets`, `browser-outer-planets.mjs` opened `app.html?experience=planets&planet=pluto&sky=off` at 390 x 844 and the scene's own readout put Charon's centre just left of the view (`x` -0.001 as a share of the width, `inView` false). At 1280 x 800 the same scenario passed. With the shared window's opening time fixed, this happens on every phone open of Pluto without `t`.

## Evidence

- Command: `npm run check:demo -- planets`, 2026-10-20 14:16:53Z to 14:23:18Z (384 s). `docs/evidence/demo-planets-20261020T141653Z/summary.txt`: `outer-planets | exit=1 | 14:21:03-14:23:04 | 121s | error-lines=0`; every other step exit 0 with 0 error lines; set result FAILED.
- `outer-planets.log`: `AssertionError [ERR_ASSERTION]: phone: charon is drawn as a sphere in view ({"id":"charon","as":"sphere","radiusPx":8.972,"x":-0.001,"y":0.702,"inView":false,"glow":null})` at `tools/validate/browser-outer-planets.mjs:117:14`, in the phone pass (`run("phone", { width: 390, height: 844 })`, line 136).
- `data/planets/pluto.json` lines 53-58: `startView` focus pluto, azimuth 0, elevation 20, distance 12 (Earth radii), one value for every screen shape. Charon sits about 19,600 km (about 3.1 Earth radii) from Pluto, and a portrait phone's horizontal field is much narrower than a laptop's.
- The phone Uranus scenario after it (rings and 28 dots) did not run.

## Expected

On a phone, Pluto's opening view shows Pluto and Charon both in view (T-118 Done When 4), and the planets set's outer-planets step exits 0 at both sizes.

## Actual

Charon's centre is at the left edge of the phone view (about half of it off screen; the scene reports it out of view); the browser set fails.

## Proof Needed

1. Pluto's opening view keeps Pluto and Charon in view at 390 x 844 and at 1280 x 800 (for example a framing that holds the pair at a portrait aspect), stated in settings, with no change to Jupiter's view (Success Condition 6).
2. A unit test or the browser scenario that fails when Charon is out of view at the phone size.
3. One run of the planets set (owner rule: once for the repair) with every step exit 0 and 0 error lines, evidence directory recorded.
