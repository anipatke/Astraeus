---
id: I-048
title: Saturn, Uranus, Neptune and Pluto open without their own tagged places
type: defect
status: open
source:
  kind: check
  check: C-091
  actor: {role: checker, session: o033-full-check-20261020}
  at: '2026-10-20T14:03:15Z'
tasks: [T-118]
checks: [C-091]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-10-20T14:03:15Z'
    actor: {role: checker, session: o033-full-check-20261020}
    kind: observed
    note: 'Found by the O-033 Full Objective Check C-091 at HEAD 9d1707bc: the planets builder shows centre places (Mercury, Venus, Earth, Mars do), but the four outer planet settings files list only their mapped moons in bodyFeatures, so none of the four planets'' own package places is shown.'
    check: C-091
  - at: '2026-10-21T01:20:00Z'
    actor: {role: executor, session: o033-repair-builder-20261021}
    kind: repair_attempted
    note: 'Repaired: the planet places rule is one function (src/experiences/planets/surfacePlace.mjs, isSurfacePlace: has latitude and longitude, no ringRadius/moonRadius) used by the builder''s placement in planetDefinition.ts (extends T-119''s skip-without-position rule). Saturn, Uranus, Neptune and Pluto now list their centre in bodyFeatures (settings) and load its package (systems). Shown counts: Saturn 3, Uranus 9, Neptune 9, Pluto 12; Jupiter unchanged. Tests: tests/planetSystems.test.ts per-planet own-places test (centre listed, ids equal the rule over the package, counts), tests/planetDefinition.test.ts made-up planet with ring, inner-moon and position-less entries; tests/planetSwitchInner.test.ts and the Jupiter view-equality test still pass. tools/validate/browser-outer-planets.mjs presses Pluto''s Sputnik Planitia (not run, per owner rule: the recheck runs the planets set once). Gates: typecheck, build, npm test 87 files 1246 passed. Browser steps unverified.'
---

# I-048: Saturn, Uranus, Neptune and Pluto open without their own tagged places

## Summary

O-033 Success Condition 1 says "Each planet in the switcher opens centred on itself with its tagged places (package features carried bit for bit)"; the Objective Outcome says "Each planet opens centred on itself with its tagged places from Planetary Explorer"; T-118's Outcome says picking Saturn, Uranus, Neptune or Pluto "opens that planet with its tagged places", and its User Check asks the owner to "tap a place on Titan and on Pluto". The builder supports places on the centre (T-119 added it; Mercury, Venus, Earth and Mars use it), but the four outer planet settings files never name their own centre, so their places are not drawn. Jupiter is the same but is held unchanged by Success Condition 6, so it is out of this Issue.

## Evidence

- `data/planets/pluto.json` line 42: `"bodyFeatures": ["charon"]`; `data/bodies/pluto/features.json` has 16 entries, 12 with a latitude and longitude away from 0/0 (Sputnik Planitia 25/-5, Tombaugh Regio, Cthulhu Macula, Elliot, Edgeworth and Oort craters, Wright Mons, ...).
- `data/planets/saturn.json` line 80, `uranus.json` line 36, `neptune.json` line 43: bodyFeatures name only mapped moons (Uranus: `[]`). Packages: Saturn 20 entries (3 with a real position: North Polar Hexagon, Great White Spot, South Polar Vortex; 17 rings and inner moons at 0/0), Uranus 19 (9 away from 0/0), Neptune 19 (9 away from 0/0, e.g. Great Dark Spot -22/310).
- Checker probe (temporary vitest file, removed after the run) building every planet's definition from its settings and system: centre places shown: earth 20, mars 30, mercury 16, venus 19; jupiter 0, saturn 0, uranus 0, neptune 0, pluto 0.
- `tools/validate/browser-outer-planets.mjs` presses a place on Titan and on Charon, none on Pluto, so the planets browser set cannot catch this; `tests/planetSystems.test.ts` "builds its view from its settings file and system alone" compares bodyFeatures with the settings file, so it passes either way.

## Expected

Each of Saturn, Uranus, Neptune and Pluto opens with its own package places, or the Objective records an owner or planner decision to leave a planet's own places out (for example the gas giants' ring and inner-moon entries that sit at 0/0, which would draw markers on the equator at longitude 0).

## Actual

None of the four planets shows any of its own places; Pluto's 12 surface places are absent although Pluto is a mapped solid body.

## Proof Needed

1. Pluto's view shows its places (at least the 12 with positions), with a test that its bodyFeatures include the centre and that every placed package entry becomes a marker; a browser scenario (or the existing script extended) presses one Pluto place.
2. For Saturn, Uranus and Neptune: either their placed entries are shown (with the 0/0 ring and moon entries handled by a recorded rule), or an explicit decision recorded on the Objective says why a gas giant's own places stay out.
3. Configured gates pass; the planets browser set is rerun only by the owner's rule for that change.
