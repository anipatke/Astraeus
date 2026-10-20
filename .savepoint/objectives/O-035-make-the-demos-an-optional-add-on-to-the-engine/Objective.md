---
id: O-035
title: Make the demos an optional add-on to the engine
status: planned
depends_on: [O-034]
release: G-007
---

# O-035: Make the demos an optional add-on to the engine

## Outcome

A developer can take the Astraeus engine and shell without the Apollo 11, Showers and Jupiter-Io demos and their data; the demos are an add-on the public site opts into.

## Why

Owner, 2026-10-20: "consider someone looking this up and wanting to re-use it, the demos should be optional maybe? I know we built them for our site". Owner chose "Checks now, demos next": O-034 first.

## Success Conditions

To be detailed when planned. Starting point: the app entry and public build choose demos as configuration; the engine builds, tests and runs its checks with no demo present.

## Architectural Considerations

ARCH-01, ARCH-04; planet and moon data stays core, shower and Apollo data are demo add-ons (owner, earlier decisions recorded in Design).

## Boundaries

**In scope:** how demos are packaged and mounted.

**Out of scope:** changing what the demos show; publishing to a package registry unless the owner asks.
