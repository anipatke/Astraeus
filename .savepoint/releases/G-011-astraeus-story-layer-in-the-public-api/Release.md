---
id: G-011
title: Astraeus story layer in the public API
status: done
---

## Outcome

A developer who installs `astraeus` from npm can build a story, not just a scene: their own bodies and pictures, groups of objects, an orbit line for any body, timed events and story panels, through the `Scene` and `mount` API or a plain React component, documented on an API reference page. The package is also healthier for them: test coverage at 80% or more and a lighter bundle in their app.

## Why

Owner, 2026-10-23: "we are binning the zodiac idea for now and focusing on grow the public API to cover the story layer so the package is worth installing". The 0.1 API (O-036) covers bodies and paths only; the story layer the Idea names (timeline, events, annotations) is internal. Earlier the same day the owner said consumability is "where the money is". The G-006 zodiac demo and its O-021 were deleted on the owner's choice ("Delete it").

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the public API, its types, tests, examples and reference page; the health items coverage to 80% and a lighter consumer bundle.

**Out of scope:** new demos, stories or assets beyond rebuilding existing ones on the public API (separate consumer projects, owner 2026-10-23); the Earth-based observer view; changes to what the public site's demos show; publishing a release (the owner's action through the GitHub release workflow); the shower stutter (owner, 2026-10-23: "Drop it from this goal").

**Risk (owner):** the work is invisible to site visitors, and API design is slow, careful work.

Shape (owner, 2026-10-23, "Your 4", replacing the six-piece list "Simple first, docs last"): the API grows by real need, driven by rebuilding existing stories on the public API. O-040 React component and the start of the reference page; O-041 Apollo 11 rebuilt on the public API (custom bodies, pictures, orbit lines, events, panels); O-042 a shower rebuilt on it (groups); O-043 honest coverage and a lighter consumer bundle.
