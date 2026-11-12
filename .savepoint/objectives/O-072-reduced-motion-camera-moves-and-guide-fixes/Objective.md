---
id: O-072
title: Reduced-motion camera moves and guide fixes
status: in_progress
depends_on: [O-071]
release: G-019
priority: medium
rank: 4
---

# O-072: Reduced-motion camera moves and guide fixes

## Outcome

Camera moves a host asks for (`handle.setCamera`, a view switch's camera rule, the timeline's Go to framing) arrive at once when the visitor prefers reduced motion, as the README already promises; and the README states the contracts the Closest Calls review found missing or wrong.

## Why

G-019, Closest Calls F-12 (setCamera eased about 1.5 s and a view switch about 3 s with `prefers-reduced-motion: reduce`) and F-02, F-03, F-04, F-13, F-14, F-17. The owner chose to honour the existing setting rather than add a "jump" option.

## Success Conditions

Owner-confirmed 2026-11-12 (lean: one Task; owner asked whether each piece is really needed and reusable, and kept all of it except the browser step).

- With `prefers-reduced-motion: reduce`, every eased camera move arrives on the next frame: `handle.setCamera`, a view's camera rule, the timeline's Go to framing, and the visitor's own picks from the viewer (owner decision 1: every glide jumps, not only host moves). Without the setting nothing changes. Proven by a node test of the shared glide rule; no browser step (owner).
- README states: the ecliptic J2000 obliquity the engine uses, 84381.406" (IAU 2006), and its difference from JPL's 84381.448"; that times are whole Unix milliseconds and what a fractional one throws; a provider's `stateAt(timeUtcMs, center?)` contract (when `center` is passed and what the returned State must then hold, plus `Float64Array` positions and `orientation: null`); the orbit camera's 45° vertical field of view; which colour an elements body's orbit line, dot and label take; path anchor labels off by default and shown by the `labels` switch; and the camera's reduced-motion behaviour.
- The fractional-time throw is a plain `RangeError`, not a `SceneError`: recorded as an Issue (API-05 gap), not fixed here.
- CHANGELOG `Unreleased` entry and `docs/release-notes-0.9.1.md` prepared for the owner; no version bump, tag or publish.

## Architectural Considerations

The reduced-motion read already lives in `src/app/skyFigures.ts` (`prefersReducedMotion`); reuse it for the camera ease (STYLE-07). Every scripted camera move (focus tween `transition`, target distance, azimuth, elevation) settles in one place, `resolveCamera` in `src/app/CameraController.tsx`, called once per frame from `src/app/sceneFrame.ts`; the rule goes there, so no request path needs its own branch. README tables are checked against the API (API-07).

## Boundaries

**In scope:** reduced motion for eased camera moves; the named README fixes; 0.9.1 notes.
**Out of scope:** a new camera option; error-type changes beyond recording an Issue; publishing.
