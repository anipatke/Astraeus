---
id: O-035
title: Make the demos an optional add-on to the engine
status: planned
depends_on: [O-034]
release: G-010
---

# O-035: Make the demos an optional add-on to the engine

## Outcome

One repository, split inside: the engine and shell become their own package, and the Apollo 11, Showers and Jupiter-Io demos (with their data) and the public site become separate packages that use it. A developer can delete the demos and the site and still build, test and run the engine's checks.

## Why

Owner, 2026-10-20: "consider someone looking this up and wanting to re-use it, the demos should be optional maybe? I know we built them for our site", then "make option 2 the next objective" (one repository split into engine, demos and site packages). Owner chose "Checks now, demos next": O-034 first.

## Success Conditions

To be detailed when planned. Starting points:
1. The engine package builds and tests with no demo present; the O-034 engine check set runs against it.
2. Demos and the site depend on the engine package only through its declared entry points.
3. Each demo's data and its licences and credits live with that demo; the public-build licence gate still passes for the site.
4. The public site looks and behaves as before.

## Architectural Considerations

ARCH-01, ARCH-04; planet and moon data stays core, shower and Apollo data are demo add-ons (owner decisions recorded in Design). Package layout (for example npm workspaces) is a planning decision.

## Boundaries

**In scope:** repository layout, package boundaries, how demos are mounted, build and deploy wiring.

**Out of scope:** changing what the demos show; publishing to npm (O-036).
