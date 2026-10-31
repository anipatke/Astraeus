---
id: O-048
title: Keep near planets visible and show their rings
status: done
depends_on: [O-047]
release: G-014
priority: high
---

# O-048: Keep near planets visible and show their rings

## Outcome

In an app on the public API, planets and moons near the camera draw correctly at every zoom on a real graphics card, even in a scene whose far plane reaches hundreds of AU; Jupiter, Saturn, Uranus and Neptune show their rings by default; any catalogued moon can draw its orbit line; an event can name its object so "Go to" frames it; and labels stay steady at fast playback.

## Why

G-014, findings I-117 to I-121 from the probe app on 0.5.0 (owner, 2026-10-31: add to G-014, include all three extras). I-117 and I-118 block the app's milestone. I-117 is a regression of the 0.5.0 I-114 reach rule that headless software rendering did not show.

## Success Conditions

Settled with the owner, 2026-10-31 (session probe-feedback-2-20261031): same Goal; all five findings. Standing rule: strategic fix first.

- **Depth precision (I-117, must).** The engine renders with a logarithmic depth buffer (three.js `logarithmicDepthBuffer`), so depth precision no longer depends on the far/near ratio; every custom shader (the star field, the GPU-placed dots, any `onBeforeCompile` patch) carries the log-depth chunks, and a test fails if a custom shader in `src/app/` lacks them. The I-114 whole-path reach stays. If a measured cost (frame time or a shader that cannot carry log depth) is unacceptable, the builder returns REPLAN REQUIRED with reversed-Z as the alternative.
- **Rings by default (I-118, must).** Each ringed planet's rings are part of its one catalogue definition (ARCH-05), drawn whenever the planet is in a scene, with their recorded source; the demos stop attaching them separately and draw as before.
- **Every moon's orbit line (I-119).** `addBody(moon, { orbit: true })` works for any catalogued moon by one rule (period from the catalogue's mean elements, drawn about its planet), not a list of names; the Moon and Io draw as before.
- **Go to frames the event's object (I-120).** `addEvents` events may name an `object` already in the scene (checked with `bad-event`); "Go to" seeks and frames it the way `lookAt` does; events without one seek as before.
- **Steady labels (I-121).** A label that wins an overlap keeps it until it is clearly beaten (a stated margin or hold time), so labels do not flicker at fast playback; the selected object's label still always wins (I-108).
- **Proof.** Made-up configurations (ARCH-03); a test of depth mode and shader chunks; the synthetic journey zoomed in near Saturn with the whole-path reach shows Saturn, its rings and moons. One `npm run check:browser`; **one owner look on `localhost:5490` in a GPU browser** before the Full Objective Check (headless software rendering missed I-117).
- **Documentation.** README rows, CHANGELOG `Unreleased`, Design reconciled.

## Architectural Considerations

ARCH-01 (no mission names), ARCH-02 (depth, labels and framing never change State), ARCH-03, ARCH-05 (rings and moon periods defined once in core), ARCH-06 (Go to framing from the event's named object, never a default body), PROV-01/PROV-02 (ring data source recorded). Thin `src/api/` layer over the engine.

## Boundaries

**In scope:**
- I-117 to I-121; their README, CHANGELOG, API reference and example lines.

**Out of scope:**
- New ring data or ring looks; mission data; publishing a release.
