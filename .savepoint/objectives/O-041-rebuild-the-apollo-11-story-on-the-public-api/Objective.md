---
id: O-041
title: Rebuild the Apollo 11 story on the public API
status: planned
depends_on: [O-040]
release: G-011
---

# O-041: Rebuild the Apollo 11 story on the public API

## Outcome

The Apollo 11 story is built using only what `npm install astraeus` offers. Each thing it cannot do becomes public API, expected: custom bodies (the spacecraft), pictures of your own with their credit, orbit lines for any body, timed events and story panels, and listening for events (time reached, object picked) in your own code.

## Why

G-011 (owner, 2026-10-23): grow the public API to cover the story layer so the package is worth installing. A real consumer drives the API by need instead of guesswork (STYLE-05), and proves it on a story people can see.

## Success Conditions

To be settled with the owner when this Objective is planned in detail.

## Architectural Considerations

Additions go through the public API in `packages/astraeus/src/api/` as a thin layer over the existing engine (O-036 decision); anything not exported there stays internal. ARCH-01 to ARCH-05 and PROV-01, PROV-02 apply; a new public capability is proven on a made-up configuration (ARCH-03) and in the packed example, not only by a demo. Each new public call is added to the API reference page set up in O-040.

## Boundaries

**In scope:**
- The public calls Apollo needs, their tests on a made-up configuration, the rebuilt Apollo story and its reference entries
- Moving `packages/astraeus/src/experiences/apollo11/spacecraftMetrics.ts` out of its Apollo-named engine folder to a generic place (e.g. `src/app/`), so the engine names no Apollo code (owner, 2026-10-24: "yes add them to the plans")

**Out of scope:**
- Groups of many objects (O-041 onward); chapters and narration; changing what the Apollo story shows. Whether the rebuild replaces the site's Apollo demo or sits beside it is decided when this Objective is planned
