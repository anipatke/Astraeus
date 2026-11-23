---
id: G-026
title: Orbit lines that stay on the body, for 0.10.1
status: planned
---

## Outcome

A body's orbit line stays on the body at any zoom, in any year of the timeline and at both scales: zoomed in to a few planet radii with time playing, the line no longer slides off and back (the straight-segment sag), and years from the opening time it no longer runs beside the planet (the fixed opening-year turn). Planet Sun-orbit lines and moon orbit lines (composition paths) follow the rule body-set lines already use: samples on a fixed time grid around the display time, re-sampled when time moves away, plus a finely sampled head that ends exactly on the body's live place.

## Why

Owner, 2026-11-23: "When I zoom really close into a planet, the orbit line wobbles. Not noticeable zoomed out." The belt app (`/home/user/code/belt`, on 0.10.0) traced and measured it; the planning session of 2026-11-23 confirmed both causes in the engine (`api/sunOrbit.ts` `TURN_SAMPLES = 361`; `app/PathView.ts` samples a fixed span once in its constructor) and re-measured with the engine's own code: peak planet-to-line gap in the first turn Earth 0.93, Mars 2.27, Jupiter 0.40 planet radii (sag); at 3 years on Earth 1.78, Mars 14.05 radii (drift). Ten times the samples cut the first-turn sag to 0.01 to 0.02 radii but left Mars 11 radii off at 3 years. A dense turn centred on the display time stays within 0.01 radii for half a turn either side. Findings page: https://claude.ai/artifact/S7ooqSfBDzKXudKzuuS2iM.

Owner decisions, 2026-11-23:
1. Fix B + C from the findings page: the line follows time (re-centred turn on a fixed grid) and a fine head ends on the body.
2. One rule for every orbit line, the body-set rule (`app/OrbitSetView.ts`, owner 2026-10-18: "every sample sits at a whole multiple of its path's fixed step"), shared rather than copied.
3. Its own Goal, released as 0.10.1, before G-025 (which then targets 0.11.0 unchanged).
4. Once released, the belt app upgrades and verifies it in a browser.

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine's orbit-line drawing (`kind: "orbit"` paths: planet Sun-orbit lines and composition moon lines), the shared grid-and-head rule with body-set lines, the orbit lines' known-limitations wording and the doc comments that say "one full turn from the opening time", tests, CHANGELOG 0.10.1, and a short note for the belt app.

**Out of scope:** any public API change; trajectory paths (`addTrajectory`) unless they share the code path unchanged (a same-symptom finding there becomes an Issue); the belt app's own code; the version bump and publishing (the owner's release steps).

## Belt verification after release

The belt app upgrades to 0.10.1 and checks in a browser, at true scale with time playing, focused on Earth, Mars and Jupiter at a few planet radii: the line stays on the planet across several simulated days at the opening year and at the timeline's ends (about 5 years either side); zoomed out the lines look as before; and, as a separate look, nothing moves while time is paused. It then drops any workaround and reports back.
