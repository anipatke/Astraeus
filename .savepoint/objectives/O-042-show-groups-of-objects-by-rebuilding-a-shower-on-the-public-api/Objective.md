---
id: O-042
title: Show groups of objects by rebuilding a shower on the public API
status: planned
depends_on: [O-041]
release: G-011
---

# O-042: Show groups of objects by rebuilding a shower on the public API

## Outcome

A developer adds a group of many objects (for example meteor dots or asteroids) as one thing, with its look and data, through the public API, driven by rebuilding a meteor shower story on it.

## Why

G-011 (owner, 2026-10-23): grow the public API to cover the story layer so the package is worth installing. Same approach as O-041: a real consumer decides what the group API needs.

## Success Conditions

To be settled with the owner when this Objective is planned in detail.

## Architectural Considerations

Additions go through the public API in `packages/astraeus/src/api/` as a thin layer over the existing engine (O-036 decision); anything not exported there stays internal. ARCH-01 to ARCH-05 and PROV-01, PROV-02 apply; a new public capability is proven on a made-up configuration (ARCH-03) and in the packed example, not only by a demo. Each new public call is added to the API reference page set up in O-040.

## Boundaries

**In scope:**
- Public groups on the existing points layer, their tests, the rebuilt shower and its reference entries
- Renaming `packages/astraeus/src/experiences/showers/showerChoice.ts` (a generic list switch the planets demo also uses) to a generic name and place, with any shower-only part moving to the showers demo, so the engine names no shower code (owner, 2026-10-24: "yes add them to the plans")

**Out of scope:**
- New group kinds the engine does not already draw; shower data in the engine (it stays with its demo); the shower stutter (owner, 2026-10-23: dropped)
