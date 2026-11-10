---
id: O-064
title: Look out from a body
status: in_progress
depends_on: [O-063]
release: G-018
priority: high
---

# O-064: Look out from a body

## Outcome

A camera that stands at a body's centre (Earth) and turns to look around the sky (drag to pan, zoom as field of view), using the existing `setCamera`, `camera` and `onCameraChange` shapes, and that can turn to a sky direction.

## Why

G-018: every sky story is seen from Earth; today the camera only orbits a target from outside it.

## Success Conditions

- A camera can stand at the centre of any body the scene holds (Earth is one; tests also use Mars, ARCH-03, ARCH-06) and look out: the visitor drags to pan the sky and pinches or wheels to zoom, zoom being the field of view (opening about 60 degrees tall, range about 5 to 100 degrees), never a camera move. The body stood in (its globe, label, glow, atmosphere and rings) is not drawn while looking out; every other body, label, marker and tap works as before. Directions are right in every scale (positions scale linearly; only drawn sizes differ, so readable scale shows the Moon larger than in life, a stated limit).
- The host (both embedding paths, API-02) can: open a scene looking out (`scene.camera`, and `setStartView` with a sky reading); `setCamera` to look out from a body, turned to a star-map direction (right ascension and declination in degrees, J2000 equatorial, the engine's EQJ frame) or toward an object, with an optional field of view; read `camera` and hear `onCameraChange` as a sky reading; bad input throws `bad-camera` at the call (API-04, API-05). The `up` choice (`equatorial` default, `ecliptic`) applies as it does today.
- The camera reading is either an orbit reading (today's fields) or a sky reading (body, direction, field of view); a saved reading put back with `setCamera` or `setStartView` restores either kind. The share link carries a sky reading (API-06: the address only overrides public settings).
- The visitor's camera menu offers "Look out from <body>" only for the bodies the scene lists (default none, so existing scenes are unchanged); Focus, Follow, Overview or an orbit `setCamera` returns to the orbit camera. Phone first: nothing collides at 375x667 or 1280x720.
- API lock, README and CHANGELOG updated (API-01, API-07); Design reconciled before the Full Objective Check; `npm run check:browser` once at the Full Check; the owner looks on `localhost:5490`.

## Decisions (owner, 2026-11-10, session o064-planning-20261110)

- **Who enters the sky view:** "App and visitor" — the app through the public API, the visitor through the camera menu for bodies the app lists.
- **How a sky spot is named:** "Star-map position or an object" — right ascension and declination, or an object to turn toward; no ecliptic-longitude input (an app converts itself).
- **Camera reading shape:** "Yes, two kinds of reading" — `camera` returns an orbit reading or a sky reading; a type-level change for apps that read `distance`, recorded in the CHANGELOG (Voyagers stays on 0.8.0).
- Planner defaults stated in the confirmed design: field of view opens at about 60 degrees, range about 5 to 100; the stood-in body is hidden; menu choices default to none.

## Architectural Considerations

The look-out camera is presentation only (ARCH-02): a new internal camera request and camera mode in `app/CameraController.tsx` and its frame stage (CODE-02), the field of view becoming camera state instead of the Canvas constant. Everything that reads `camera.fov` (markers, labels, body screens) already reads it per frame. The near plane today assumes a camera outside its focus (`0.1 * (distance - focusRadius)`) and must not go non-positive. The public pose types live in `api/viewerLink.ts`, the check in `api/viewerCamera.ts`, the opening in `api/planCamera.ts`, the parser in `core/startView.ts` (shared with the view link). No body name in `src/api/` (ARCH-06).

## Boundaries

**In scope:** camera, poses, host calls, both embedding paths, the camera menu entry, the share link, a made-up site scene for the owner's look.
**Out of scope:** a horizon or ground view; sky figures, lines and labels (O-065); Sun and Moon glow from inside (O-065); a view's camera rule that opens looking out (the host can call `setCamera` on a view change); ecliptic-longitude inputs.
