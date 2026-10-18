---
id: O-025
title: Show Jupiter with all its known moons
status: planned
depends_on: [O-020]
release: G-005
---

# O-025: Show Jupiter with all its known moons

## Outcome

The Jupiter demo shows every known moon of Jupiter where NASA places it: Io, Europa, Ganymede and Callisto as full textured worlds with their Planetary Explorer pictures and tagged places, and every other moon as a small grey dot that becomes a small grey ball up close, named on hover, tap or zoom.

## Why

Owner, 2026-10-18 (G-005 Launch Definition of Done): "we expand Jupiter to ALL its moons, objects for the ones we have skinned, either simple labels or small grey balls (or what we think they look like) for the rest."

## Confirmed Decisions (owner, 2026-10-18)

1. Four textured moons (Io, Europa, Ganymede, Callisto) from the O-018 import (T-077); their verified coordinates and tagged places carried bit for bit (owner rule: never "corrected").
2. The rest: grey dots, a grey ball when close, names on hover, tap or zoom (owner chose over all-labelled and best-guess looks).
3. Positions exact from NASA JPL Horizons tables for every moon (owner chose over approximate published orbits); this takes the O-019 T-078 finding (mean elements fail for some moons) for Jupiter.

## Success Conditions

1. Every moon Horizons lists for Jupiter at build time is present, with its name and source; the count and the table date are recorded and shown in the information panel and the details.
2. Positions from Horizons-sampled tables across the demo's window, checked against Horizons at sample dates (as Io was, C-022/C-023).
3. The four textured moons show their tagged places as the Planetary Explorer import defines them.
4. Small moons stay visible as dots at any distance (pixel floor), become grey balls at their real size up close, and names appear on hover, tap or zoom without cluttering the view.
5. Data size within the public load budget (tables compressed or streamed); scene performance on a phone holds (one chunk of work per frame, as the showers do).
6. Browser checks through the shared driver; full run passes; owner look.

4. **Date window** (owner, 2026-10-18, "yes"): keep January 2000 as the start (the Io stories fit) and extend the window to a year so the outer moons' orbits show.
5. **Name** (owner, "yes"): "Jupiter and its moons".

## Open Questions (to settle when this Objective is planned)

- Which of the four big moons' orbits and stories change (the Io stories stay).

## Boundaries

**In scope:** Jupiter's moons, their data, look, names and checks.

**Out of scope:** other planets' moons (O-018, O-019 beyond Jupiter); rings; Juno or other spacecraft.
