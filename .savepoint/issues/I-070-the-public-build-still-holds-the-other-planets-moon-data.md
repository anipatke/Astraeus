---
id: I-070
title: The public build still holds the other planets' moon data
type: defect
status: resolved
source:
  kind: check
  check: C-096
  actor: {role: checker, session: o039-full-check-20261022}
  at: '2026-10-22T11:19:28Z'
tasks: [T-136]
checks: [C-096]
severity: low
resolution:
  disposition: accepted
  actor: {role: owner, session: 8d73d3f8}
  at: '2026-10-22T11:23:39Z'
  reason: 'Owner accepted the unfetched moon data in the public build for now: "Accept it for now" (2026-10-22, coordinator question after C-096). Removing it needs a core change.'
history:
  - at: '2026-10-22T11:19:28Z'
    actor: {role: checker, session: o039-full-check-20261022}
    kind: observed
    check: C-096
    note: Found by the O-039 Full Objective Check; the T-136 builder named it as a deviation left for the owner, and no owner decision is recorded.
  - at: '2026-10-22T11:23:39Z'
    actor: {role: executor, session: 8d73d3f8}
    kind: owner_decision
    note: 'Owner, asked after C-096 whether to accept, remove now, or defer the 1.1 MB of unfetched moon data: chose "Accept it for now". Recorded by the coordinator on the owner''s direct instruction.'
---

# I-070: The public build still holds the other planets' moon data

## Summary

O-039 Success Condition 8 says the other eight planets' settings, maps and moon data are not in the public bundle. The settings, system chunks and outer-planet maps are gone, but each other planet's moon index chunk is still built: `saturn-moons` (908,105 B), `uranus-moons` (109,246 B), `neptune-moons` (65,949 B), `pluto-moons` (27,673 B) and `mars-moons` (13,933 B), about 1.1 MB in all. The public page never fetches them, because they are lazy imports of the core moon systems (`src/core/bodies/planetMoons.ts`). `NON_PUBLIC_PLANET_FILES` in `tools/validate/load-budget.mjs` leaves `-moons.js` out on purpose, so the public file check cannot fail on them. The Mercury, Venus, Mars and Earth maps also stay, but the showers and Apollo demos draw those planets, so that part is not a defect.

## Evidence

Public build `/tmp/o039-public-o8mS` (C-096, 2026-10-22T11:15:58Z), `ls assets | grep moons`. T-136 Technical Evidence, deviation 3; Design.md, Current Technical State, O-039 (public build planet list).

## Proof Needed

The owner accepts these unfetched files as they are (resolve as accepted), or a follow-up keeps the other planets' moon indexes out of a public build, and the public file check fails when one is present.
