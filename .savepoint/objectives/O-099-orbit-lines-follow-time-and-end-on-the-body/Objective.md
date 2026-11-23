---
id: O-099
title: Orbit lines follow time and end on the body
status: done
depends_on: []
release: G-026
last_check: C-216
priority: high
rank: 1
---

# O-099: Orbit lines follow time and end on the body

## Outcome

Every `kind: "orbit"` line (planet Sun-orbit lines and composition moon lines) is drawn by the body-set rule: samples on a fixed time grid covering one turn around the display time, re-sampled when the display time leaves the middle of the sampled turn, plus a finely sampled head, also on a fixed grid, whose last segment ends on the body's live place. The grid-and-head maths is one shared pure module used by both `PathView` orbit lines and `OrbitSetView`.

## Why

G-026 Why. Owner decisions 1 and 2.

## Success Conditions

- A test that fails on 0.10.0: for Earth, Mars and Jupiter at true scale, the distance from the body's true position to its drawn line stays under 0.05 planet radii across one turn from the opening time and across 120 days at 3 years on and 5 years before (the bound replaces today's 0.9 to 14 radii).
- A moon composition line (the Moon, Io) meets the same bound against its own radius.
- Zoomed out the lines look as before: the same turn length, colour, look and end fade; a re-sample moves no point that stays in the span (grid property, tested).
- `OrbitSetView`'s existing tests pass unchanged after it calls the shared module.
- Per-frame cost: no new per-frame source evaluations beyond the body's live place (fine points are cached on their grid); a frame-time check at the belt's scale (tens of thousands of points plus three planet lines) shows no regression against 0.10.0.
- A browser check at true scale, close zoom on Earth with time playing: the line stays on the planet across a few simulated days, at 1440x900 and 390x844.
- Known-limitations wording and doc comments describe the new rule; CHANGELOG 0.10.1 `Fixed` entry; no API lock change.

## Design Confirmation

Owner chose fix B + C on 2026-11-23 after reading the findings page and the plain-language explanation; the design summary was confirmed in the same session (plan-g026-20261123).

## Architectural Considerations

- The rule stays in `src/app/` (presentation of State; ARCH-02): the line reads the same source that places the body, never the reverse.
- Per-frame work stays a named stage (CODE-02); fine head points are computed only when the display time crosses a fine-grid step, as `OrbitSetView` does.
- The osculating-ellipse fallback (Uranus and Neptune past the planet series) keeps its ellipse for the far line; it is re-osculated at the display time when re-sampled, and its head comes from the same ellipse source, so its known-limitations text still states that the ellipse leaves the series' positions.
- A planet line drawn from published elements (`given` sampling, eccentric-anomaly spacing) keeps eccentric spacing for the far line; the head applies to it too.

## Boundaries

**In scope:** the shared grid-and-head module, `PathView` orbit lines, `OrbitSetView` calling the module, `api/sunOrbit.ts` wording and turn span, tests, CHANGELOG, belt note.

**Out of scope:** trajectory paths' sampling, any public API change, any look change.

## Closure

Full Objective Check C-215 (NEEDS WORK only for a host network drop in `synthetic-journey`) superseded by C-216 CLEAR on 2026-11-23. Marked done by the coordinator on the owner's instruction "looks good, push and publish once check is done" (2026-11-23). C-216's observation on the Uranus/Neptune re-fit wording was applied to the CHANGELOG and the `addBody` `orbit` doc comment before merge.
