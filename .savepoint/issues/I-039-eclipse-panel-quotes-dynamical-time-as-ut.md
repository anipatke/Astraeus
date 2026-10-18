---
id: I-039
title: The Earth–Moon eclipse panel gives the catalogue's dynamical time as UT
type: defect
status: open
source:
  kind: check
  check: C-071
  actor: {role: checker, session: o015-full-check-20261018}
  at: '2026-10-18T01:45:00Z'
tasks: [T-089]
checks: [C-071]
guardrail_ids: [PROV-01]
history:
  - at: '2026-10-18T01:45:00Z'
    actor: {role: checker, session: o015-full-check-20261018}
    kind: observed
    note: Found by the O-015 Full Objective Check against T-089 Done When 5 ("The eclipse time is checked against a published table") and PROV-01. The catalogue's greatest-eclipse column is Terrestrial Dynamical Time (TD), not UT.
    check: C-071
---

# I-039: The Earth–Moon eclipse panel gives the catalogue's dynamical time as UT

## Summary

The `red-moon` panel (`data/stories/earth-moon/panels.json`) opens at `2025-03-14T06:59:56Z`. Its details say "Greatest eclipse: 14 March 2025 at 06:59:56 UT", and both of its NASA catalogue source lines quote 06:59:56 as the greatest-eclipse time, one of them calling it UT. In NASA's catalogues that column is headed "TD of Greatest Eclipse" (Terrestrial Dynamical Time). The same source line gives Delta T as 75 s, so greatest eclipse in UT is about 06:58:41. The panel therefore states an exact time that is 75 seconds late and labels it with the wrong time scale.

## Evidence

- `https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html`, fetched by the checker on 2026-10-18. Column header "TD of Greatest Eclipse". Row "2025 Mar 14 | 06:59:56 | Total | 123 | 1.178 | 03h38m 01h05m".
- The panel's own third source (NASA Science) gives totality as 06:26 to 07:31 UTC. The midpoint of that is about 06:58:30, which fits 06:58:41 UT and not 06:59:56.
- `tests/storyStoriesAllDemos.test.ts:51-52` asserts the TD instant, labelled UT (`toBe(Date.parse("2025-03-14T06:59:56Z"))`, `toMatch(/06:59:56 UT/)`). The test repeats the builder's reading, so it is not an independent oracle.
- The effect on screen is negligible: Earth–Moon plays at 1 hour per second, so 75 s is about 0.02 s of playback. What is wrong is a stated exact figure and its source line. O-024 T-093 plans to remove the Earth–Moon story before launch.

## Proof Needed

1. Either the panel time and details give greatest eclipse in UT (about 06:58:41, computed as TD 06:59:56 minus Delta T 75 s, with the working in `details`), and the source lines say the catalogue time is TD; or the Earth–Moon story is removed (O-024 T-093) and this Issue is resolved with it.
2. The test asserts the UT instant derived from the catalogue's TD value and Delta T, not the TD value itself.
