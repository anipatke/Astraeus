---
id: O-043
title: Raise coverage honestly and lighten a consumer's bundle
status: planned
depends_on: [O-042]
release: G-011
---

# O-043: Raise coverage honestly and lighten a consumer's bundle

## Outcome

The public API is thoroughly tested and coverage reads 80% or more on code that matters to a developer, with an honest, recorded decision on whether the data-import tools count. An app that imports `astraeus` downloads less code than with 0.1, measured before and after on the packed example; parts a developer does not use (site screens, developer panels) are left out of their app.

## Why

G-011 (owner, 2026-10-23): grow the public API to cover the story layer so the package is worth installing. Coverage is 73.7% (official check, 2026-10-23), most of the gap in import tools and 3D drawing hooks; most of a consumer's download is three.js and React, which stay, so the win is what the engine leaves out.

## Success Conditions

To be settled with the owner when this Objective is planned in detail.

## Architectural Considerations

Additions go through the public API in `packages/astraeus/src/api/` as a thin layer over the existing engine (O-036 decision); anything not exported there stays internal. ARCH-01 to ARCH-05 and PROV-01, PROV-02 apply; a new public capability is proven on a made-up configuration (ARCH-03) and in the packed example, not only by a demo. Each new public call is added to the API reference page set up in O-040.

## Boundaries

**In scope:**
- Tests, the coverage scope decision, before-and-after bundle measurements on the example, making unused engine parts drop out

**Out of scope:**
- Changing a scientific source (the orb Earth data) without the owner's choice; replacing three.js or React
