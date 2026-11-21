---
id: O-093
title: Units, constants and tooling that catch slips
status: planned
depends_on: [O-082, O-084]
release: G-024
priority: low
rank: 12
---

# O-093: Units, constants and tooling that catch slips

## Outcome

Unit and frame slips at the riskiest internal boundaries stop compiling, physical constants live in one place, Earth and Moon accuracy tests are as tight as the real error allows, presentation code and scaffolding leave the science core and engine source, and a formatter plus the React hooks lint rules keep diffs reviewable.

## Why

AH-21 (all three): ms, s, days, km and AU are all `number`; `AU_KM` and J2000 are defined three times; three orbital-element schemas. AH-46: Earth/Moon tests allow 100 km while the real error is about 6 km; three TT−UTC models. AH-22: about 880 lines of UI vocabulary in `core/`, `src/synthetic` ships in the engine. AH-44: one active lint rule, no formatter, long lines. All three auditors advise against a full dimensional-type framework.

## Success Conditions

- Light nominal types at 2–3 boundaries (UTC ms vs TDB seconds; EQJ vs render vectors), proved by a deliberate slip that fails typecheck.
- One constants module; no duplicate definitions.
- Earth/Moon tolerances tightened to about the measured error with margin; the Moon model's limits noted in provenance.
- UI modules out of `core/`; scaffolding out of engine `src/`; pack size measured.
- A formatter applied in one mechanical commit; React hooks rules on with existing suppressions reviewed.

## Architectural Considerations

ARCH-02, ARCH-04, STYLE rules. Horizons fits at 1 km unchanged.

## Boundaries

**In scope:**
- The named types, constants, tolerances, moves and tooling.

**Out of scope:**
- A dimensional-analysis framework; storing planets as EQJ km (next data regeneration).
