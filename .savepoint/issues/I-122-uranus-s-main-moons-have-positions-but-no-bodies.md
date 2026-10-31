---
id: I-122
title: "Uranus's main moons have positions but no bodies"
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: probe-feedback-3-20261031}
  at: '2026-10-31T11:46:57Z'
severity: high
resolution:
  disposition: escalated
  actor: {role: planner, session: probe-feedback-3-20261031}
  at: '2026-10-31T11:51:33Z'
  reason: 'Repair promoted into O-049 (owner: one rule for every moon with data, under G-014).'
escalated_to: O-049
history:
  - at: '2026-10-31T11:46:57Z'
    actor: {role: planner, session: probe-feedback-3-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.5.1 from npm, public API only), pasted by the owner. Blocks its Voyager 2 Uranus flyby view (its T-009, paused).'
  - at: '2026-10-31T11:47:22Z'
    actor: {role: owner, session: probe-feedback-3-20261031}
    kind: owner_decision
    note: 'Owner chose "One rule for every moon with data" (any moon a data package holds becomes addable) and "Add to G-014, plan now".'
  - at: '2026-10-31T11:51:33Z'
    actor: {role: planner, session: probe-feedback-3-20261031}
    kind: escalated
    note: 'Escalated to O-049 (Make every listed moon addable).'
---

# I-122: Uranus's main moons have positions but no bodies

## Summary

`astraeus-data-uranus` 0.5.1 holds positions for Miranda, Ariel, Umbriel, Titania and Oberon back to 1950 (the 0.5.0 changelog lists them as fitted), but the engine has no catalogue body for any of them, so `scene.addBody("miranda")` throws `not a catalogued body`. The public API has no way to add a moon from a data package's positions. Triton (Neptune) works because it is catalogued.

## Evidence

- Probe app report against 0.5.1: Sun-first scene with `uranus` and `astraeus-data-uranus` passed to `mount`; `addBody("miranda")` (and the other four) → `SceneError: addBody("miranda"): not a catalogued body (known: sun, earth, moon, mercury, venus, mars, jupiter, io, europa, ganymede, callisto, saturn, uranus, neptune, pluto, phobos, deimos, mimas, enceladus, tethys, dione, rhea, titan, iapetus, triton, charon, swift-tuttle)`.
- `packages/astraeus-data-uranus/README.md:12`: "This system has no ready-made moon bodies yet; the positions are for scenes that read them."
- Same gap, wider (coordinator, 2026-10-31): the 0.5.0 changelog lists Hyperion and Phoebe (Saturn) and Nereid (Neptune) as fitted from 1950 too, and none of them is in the catalogue list above; the data packages also hold many smaller moons with positions but no body. A strategic fix is one rule from a data package's moon record to a catalogue body, not five hand-written entries.
- Report's own note, not an engine finding yet: Voyager 2 at Neptune came out 5.2 km off Horizons at 29,240 km, possibly 10-minute sampling on the tightest pass; the probe app will check before reporting.

## Proof Needed

- `addBody("miranda")` (and Ariel, Umbriel, Titania, Oberon) works in a Sun-first scene with `astraeus-data-uranus`, with radius, picture where the picture pack has one, and an orbit period so `{ orbit: true }` draws (I-119 rule); a test on the packed package covers it.
- The rule that makes them bodies says which moons it covers and why (data coverage, never a name list).
