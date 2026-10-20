---
id: I-053
title: Pluto's view opens on a phone with Charon at the left edge, out of view, so the planets browser set fails
type: defect
status: open
source:
  kind: check
  check: C-092
  actor: {role: checker, session: o033-full-recheck-20261020}
  at: '2026-10-20T14:25:30Z'
tasks: [T-118, T-121]
checks: [C-092]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-10-20T14:25:30Z'
    actor: {role: checker, session: o033-full-recheck-20261020}
    kind: observed
    note: 'Found by the one planets demo run of the O-033 Full Objective recheck C-092 at HEAD ff1d8d80 (docs/evidence/demo-planets-20261020T141653Z). The outer-planets script passed every desktop scenario and the phone clock, switch, Saturn and place-press scenarios, then failed on the phone Pluto view. Not rerun and not repaired, by the owner rule and the checker role.'
    check: C-092
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
