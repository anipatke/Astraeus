---
id: O-047
title: Show a historical probe journey end to end
status: done
depends_on: [O-046]
release: G-014
priority: high
---

# O-047: Show a historical probe journey end to end

## Outcome

An app on the public API can tell a 1977-1990 probe journey without workarounds: the main moons of Jupiter, Saturn, Uranus and Neptune and every planet are placed at dates back to 1950; every planet's orbit line and `camera.fitOrbit` work; playback paces itself (fast cruise, slow encounters) while a visitor's chosen speed still wins; a path can carry provenance by time span; the camera and labels hold at about 170 AU; and opening on a path selects it.

## Why

G-014, findings I-110 to I-115 from the probe app on 0.4.0 (owner, 2026-10-31: plan them together; all three blockers are needed for the app's next milestone, and the three extras go in the same batch).

## Success Conditions

Settled with the owner, 2026-10-31 (session probe-feedback-20261031): new Goal G-014; main moons extended back to 1950 (not app-supplied moon states); all three extras included. Standing rule: strategic fix first.

- **Historical moons (I-110).** The main moons (Jupiter: Io, Europa, Ganymede, Callisto; Saturn: Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Hyperion, Iapetus, Phoebe; Uranus: Miranda, Ariel, Umbriel, Titania, Oberon; Neptune: Triton, Nereid; with each system's planet) are fitted from JPL Horizons back to 1950-01-01 with the existing importer and accuracy rule. The ephemeris index records a span per body (smaller moons keep 2010-2030); the planet series (planets.json) is extended back to 1950 too. The README package table states each package's span and which bodies reach back; a scene time outside a loaded body's span fails once with a named error naming the body, package and span (no silent wrong position).
- **Outer-planet orbits (I-111).** `addBody(x, { orbit: true })` and `camera.fitOrbit(x)` work for every catalogued planet: periods come from the catalogue (one general rule, not a Saturn special case), so no turn search is needed for a body with a known period. A body that still cannot be drawn is refused at `toDefinition`, and any setup error reaches the host once through `ready` / `onError`, never repeated per frame.
- **Playback pacing (I-112, with I-099 and I-106).** `setTimeline` takes `pacing`: spans `{ from, to, rate }` and an event rule `{ near: { type, within }, rate }` using the existing timed events; speeds ramp smoothly between rates. A speed the visitor picks wins until they release it. The host can read and set time and rate and is told when they change (I-099, mount handle and `AstraeusScene`). The speed menu shows only the given rates, or the README states the added ones (I-106).
- **Provenance by span (I-113).** `addTrajectory` accepts provenance by time span, reusing the activity pattern; the shown label follows the current time; one provenance still works.
- **Far zoom (I-114).** A test and a browser case confirm a Sun-centred scene with a path reaching 170 AU frames whole, with bodies, path and labels drawn without clipping.
- **Opening selection (I-115).** Opening with `lookAt` or `follow` on a path or body selects it.
- **Proof.** Made-up configurations for every generic change (ARCH-03): a made-up probe with made-up events and spans. Moon accuracy measured at independent dates by the importer's verify step. `npm run check:node-consumer` and one `npm run check:browser` gain the new cases. One owner look on `localhost:5490` at the end, before the Full Objective Check.
- **Documentation.** README rows (spans, pacing, time control, provenance spans), doc comments, CHANGELOG `Unreleased`, data README tables; Design reconciled.

## Architectural Considerations

Thin `src/api/` layer over the engine (O-036). ARCH-01 (no mission names: the fixture is a made-up probe), ARCH-02 (pacing and selection never change State), ARCH-05 (periods live once in the catalogue), ARCH-06 (pacing and selection defaults come from the scene), PROV-01 (each body's span and accuracy stated). Moon and planet data stay in their packages; downloads per page stay per year, so a page loads only the years it shows. The index format gains per-body spans as a compatible addition (older indexes read as one shared span).

## Boundaries

**In scope:**
- I-110 to I-115; I-099 and I-106; their README, CHANGELOG, API reference and example lines.

**Out of scope:**
- Small moons before 2010; app-supplied moon states; probe or mission data; publishing a release.
