---
id: O-040
title: Drop the scene into a React app and start the API reference
status: planned
depends_on: [O-036]
release: G-011
---

# O-040: Drop the scene into a React app and start the API reference

## Outcome

A React developer writes one component (for example `<AstraeusScene scene={scene} />`) instead of calling `mount`, with the same behaviour. A developer API reference page lists every public call and option, generated from the public types so it grows with each later Objective.

## Why

G-011 (owner, 2026-10-23): grow the public API to cover the story layer so the package is worth installing. Done first because `mount` already renders React inside, so the component is small, and most Three.js developers use React; the reference grows with the API rather than being written at the end.

## Success Conditions

To be settled with the owner when this Objective is planned in detail.

## Architectural Considerations

Additions go through the public API in `packages/astraeus/src/api/` as a thin layer over the existing engine (O-036 decision); anything not exported there stays internal. ARCH-01 to ARCH-05 and PROV-01, PROV-02 apply; a new public capability is proven on a made-up configuration (ARCH-03) and in the packed example, not only by a demo. Each new public call is added to the API reference page set up in O-040.

## Boundaries

**In scope:**
- A plain React component alongside `mount`, its tests and a React example built from the packed package; the reference page, how it is generated and kept in step, a link from the README

**Out of scope:**
- Replacing `mount`; wrappers for other frameworks; tutorials beyond short examples
