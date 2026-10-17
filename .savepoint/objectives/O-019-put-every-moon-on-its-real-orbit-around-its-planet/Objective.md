---
id: O-019
title: Put every moon on its real orbit around its planet
status: planned
depends_on: []
release: G-005
---

# O-019: Put every moon on its real orbit around its planet

## Outcome

Every moon brought in by O-018 sits at its real position on its real orbit around its parent planet, turned the right way so its tagged features face where they really do, with the parent planets as real bodies. Each planet's system can be viewed like Jupiter–Io today: Jupiter with Io, Europa, Ganymede and Callisto; Saturn with Mimas, Enceladus, Tethys, Dione, Rhea, Titan and Iapetus; Neptune with Triton; Pluto with Charon. The first public release waits for this Objective.

## Why

Owner, 2026-10-17: "what it doesnt probably have is orbits, correct positions etc. which we need to enrich", and the launch waits for orbits. Planetary Explorer's moons move on circular display orbits at arbitrary speeds with no epoch (donor `docs/astraeus-extraction-audit.md` §3); Astraeus already places Io from published elements checked against JPL Horizons, so the same path can enrich every moon.

## Success Conditions

1. **Each moon has a real state source.** Published mean orbital elements (JPL Solar System Dynamics planetary satellite mean elements, with their epoch and reference plane) propagated about the parent's mass through the existing two-body provider, or a better published source where two-body is not good enough; each source cited (PROV-01). One state source per body, defined once (ARCH-05).
2. **Accuracy is measured and stated.** Each moon is compared with JPL Horizons at several dates; the largest error is stated in body diameters and as a fraction of orbit size, and each moon is classified the way Io is (within one diameter, or an "approximate demonstration" with the figure in its known limitations). Retrograde Triton and distant, inclined Iapetus are named cases.
3. **Correct facing.** Each synchronously rotating moon keeps the right face toward its planet, using the IAU rotation model where one is published (the generic tidal-lock wrapper Design already names as a candidate to lift "when a third moon arrives"); features from O-018 therefore sit on the correct side, checked for at least one moon per system against a published view.
4. **Parent planets are real bodies.** Saturn and Neptune from the existing planet series (VSOP87A); Pluto from published elements; each with its traced map, its orientation and its own Horizons comparison. Saturn's rings, if drawn, use the ring fact-sheet edges (C-045 tracing) and are labelled.
5. **System views.** Each system mounts through the existing composition and scale machinery, centred on its planet, with presets, labels and the marker rule; no system or moon names in generic code (ARCH-01); any new generic capability proven on made-up configuration first (ARCH-03).
6. **Checks.** Configured gates, the lite browser check, a browser check per system at desktop and phone sizes with zero console errors, the public build within the load budget, and the owner's look.

## Architectural Considerations

- The planet series and the two-body provider exist; new work is data and wiring unless a moon needs a better propagator, which returns to the owner as a finding.
- Orbits are scientific State; the system views' scale and layout are presentation (ARCH-02).
- Moon element data lives with the bodies or as story data, not in the shell.

## Owner Decisions — 2026-10-17

1. **Enrich the Planetary Explorer moons with real orbits and correct positions.**
2. **The first public release waits for this Objective** (chosen over launching with globes first).

## Boundaries

**In scope:**
- The 13 donor-mapped moons beyond our Moon, their parents (Jupiter exists; Saturn, Neptune, Pluto), orientation, accuracy checks, system views, tests.

**Out of scope:**
- Phobos and Deimos and small moons; Uranus and its moons; perturbation theory beyond what accuracy requires; meteor or story content for these systems.

## Dependency Note — 2026-10-17

Owner, 2026-10-17: "I really want to speed this up, can we run any of the other work in parallel in worktrees". The Objective-level wait on O-018 is removed so the orbit research can start now; every Task that draws or places a moon names its O-018 Task dependency itself.
