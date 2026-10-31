---
id: O-050
title: Follow a probe as one path
status: planned
depends_on: [O-049]
release: G-014
priority: high
---

# O-050: Follow a probe as one path

## Outcome

In an app on the public API, one `addTrajectory` can draw a flyby mission whose line is fixed to the Sun in cruise and to a planet or moon through each encounter. The app either lists the stretches or asks for them to be chosen automatically by sphere of influence. The probe is then one object for the object menu, the info card, the readouts and `camera.follow`, so following it from launch keeps it in view through every encounter (I-125). Close timeline markers can each be reached (I-126), and the docs say which moons have pictures (I-127).

## Why

G-014, open-requests summary from the Voyager probe app on 0.6.0 (2026-11-01, session probe-switch-20261101). `lineFixedTo` is one body per path, so the app splits Voyager 1 into five pieces and Voyager 2 into nine. The camera stops at the end of each piece, which shows "(Unavailable)", and the visitor picks the next piece by hand (blocks). The same gap affects any flyby or orbiter (Cassini, Juno, New Horizons, Galileo, Rosetta) and Apollo's lunar orbits drawn against the Moon. The two smaller requests ride along. The in-viewer scene switch (I-124) is the next Objective. The owner chose this one first because whole-probe paths make the views simpler.

## Success Conditions

Settled with the owner, 2026-11-01 (session probe-switch-20261101): "Add to G-014"; "One-path probes first"; "Both: listed and automatic"; design confirmed. Standing rule: strategic fix first.

- **Listed stretches (I-125, must).** `lineFixedTo` accepts a body id (unchanged), the string `"auto"`, or a list of `{ start, end, body }` (the shape of `provenanceSpans`). The list must be sorted, not overlapping and inside the path's span, and every body must be in the scene. A fault throws `bad-trajectory` naming the index. Where no stretch covers a time, the line is drawn against the scene centre (today's default). Each stretch's samples are drawn against its body at their own time and carried to that body's place at the clock time, so each stretch looks like today's piece fixed to that body.
- **Automatic (I-125, must).** `lineFixedTo: "auto"` builds the stretches from the path's own samples. At each sample the line is fixed to the innermost body in the scene whose sphere of influence (about its parent, from the body's GM and its parent's) holds the probe, else the scene centre. Consecutive samples on the same body merge into one stretch. Bodies without a GM in the catalogue are skipped, and the docs say so. No body is named in the rule (ARCH-01, ARCH-06).
- **One object.** A path with stretches is one object-menu entry, one info card, continuous readouts and one `camera.follow` target. Followed at fast playback from its start, the camera keeps the marker in view across every stretch boundary with no "(Unavailable)" and no selection by the visitor. Not wanted: a camera hand-over between separate paths.
- **Stacked timeline markers (I-126).** Event, panel and window-peak markers that would overlap on the timeline can each be reached and opened, on desktop (1280x720) and phone (375x667), with no overlapping markers or labels (standing rule: panels never collide, phone first). Five events within 5 hours on a multi-year timeline is the test case.
- **Picture docs (I-127).** The engine README (where `addBody` / `listedMoons` are described) and the `astraeus-data` README say which moons the picture pack has pictures for, and that every other listed moon (Uranus's five named) draws flat-coloured with the pack loaded. A test keeps that list in step with the pack's contents.
- **Proof.** Made-up configurations (ARCH-03): a synthetic flyby path with listed and with automatic stretches, and a Moon-orbit stretch drawn against the Moon, on the packed package (`check:node-consumer`), plus a synthetic browser scene. One `npm run check:browser`, then one owner look on `localhost:5490`, before the Full Objective Check.
- **Documentation.** README `addTrajectory` row and API reference, CHANGELOG `Unreleased` with the first-download size change, Design reconciled.

## Architectural Considerations

ARCH-01 and ARCH-06 (no body or mission names in the rule or defaults), ARCH-02 (line frame is presentation; State and `stateOf` are unchanged), ARCH-03, ARCH-05 (GM read from the one body definition), PROV-01 (stretch frames do not change provenance; `provenanceSpans` stay separate). The marker position (`TrackedBodyView.absolute`) already ignores the line frame, so following needs no camera change once the probe is one path. Line drawing stays in `TrackedBodyView`/`pathRules.ts`, with the frame resolved per stretch. Stretches are resolved once at build (listed) or at `prepare` (automatic, needs body states); never per frame beyond today's remap. Story data stays out of the engine.

## Boundaries

**In scope:**
- I-125, I-126 and I-127: `addTrajectory` `lineFixedTo` stretches and `"auto"`, line drawing per stretch, timeline marker spreading, the picture-pack docs, tests, README, CHANGELOG, API reference and example lines.

**Out of scope:**
- The in-viewer scene switch (I-124, next Objective); changes to the Voyager app; moving the Apollo 11 demo onto stretches; a camera hand-over between separate paths; new pictures; publishing a release.
