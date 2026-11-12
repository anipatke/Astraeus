---
id: O-072
title: Reduced-motion camera moves and guide fixes
status: planned
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

To be settled when this Objective is detailed. Planner's outline: one shared reduced-motion rule for every eased camera move (with a node test of the rule and one browser step); README: ecliptic J2000 obliquity 84381.406" (IAU 2006) and its difference from JPL's 84381.448"; `stateOf` and other times take whole Unix milliseconds, and what a fractional value throws (if it is not a `SceneError`, record an Issue for the API-05 gap rather than widening this Objective); a provider's `stateAt(timeUtcMs, center?)` contract (when `center` is passed, what the returned State must hold); the orbit camera's 45° vertical field of view; which colour an elements body's orbit line, dot and label take; path anchor labels off by default and the `labels` switch. CHANGELOG; 0.9.1 release notes prepared for the owner.

## Architectural Considerations

The reduced-motion read already lives in `src/app/skyFigures.ts` (`prefersReducedMotion`); reuse it for the camera ease (STYLE-07). README tables are checked against the API (API-07).

## Boundaries

**In scope:** reduced motion for eased camera moves; the named README fixes; 0.9.1 notes.
**Out of scope:** a new camera option; error-type changes beyond recording an Issue; publishing.
