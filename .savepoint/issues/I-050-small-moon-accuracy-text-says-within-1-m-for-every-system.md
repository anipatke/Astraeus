---
id: I-050
title: Every small moon's position record says "within 1 m" of Horizons, though 18 moons' measured figures are 6 to 61 m
type: defect
status: open
source:
  kind: check
  check: C-091
  actor: {role: checker, session: o033-full-check-20261020}
  at: '2026-10-20T14:03:15Z'
tasks: [T-117, T-118]
checks: [C-091, C-092]
guardrail_ids: [PROV-01]
severity: low
history:
  - at: '2026-10-20T14:03:15Z'
    actor: {role: checker, session: o033-full-check-20261020}
    kind: observed
    note: 'Found by the O-033 Full Objective Check C-091 at HEAD 9d1707bc. The sentence was true for Jupiter (worst 0.99 m) and was carried into the generic builder for every system.'
    check: C-091
  - at: '2026-10-21T01:20:00Z'
    actor: {role: executor, session: o033-repair-builder-20261021}
    kind: repair_attempted
    note: 'Repaired: data/moons/fit-errors/<planet>.json (generated from each fit index by tools/import/moon-fit-errors.mjs: worst of the span, demo window and planet-centred figures per moon) is imported by the five non-Jupiter systems as fitErrorsM; the builder states each dot moon''s own figure (rounded up to 0.1 m, never below 1 m; a figure above 1 m adds that it includes the planet-centred check, part of which is Horizons'' own kernel difference) and throws if a moon has no figure. The group record states the worst of its dots. Jupiter''s system gives none and keeps its existing text. Tests: tests/planetSystems.test.ts ''states each dot moon''s own measured error, never less than the fit index''s worst figure'' (all four outer planets); tests/planetFitErrors.test.ts (files equal the indexes). Gates pass.'
  - at: '2026-10-20T14:26:00Z'
    actor: {role: checker, session: o033-full-recheck-20261020}
    kind: rechecked
    note: 'Recheck C-092 at HEAD ff1d8d80: Proof Needed met. Independent recursive scan of every worstM in each fit index: data/moons/fit-errors/<planet>.json covers every body (mars 3, saturn 293, uranus 29, neptune 17, pluto 6) and is never below the body''s worst figure (Daphnis 26.18 m, Neptune irregulars 61.43 m); tests/planetSystems.test.ts fails when a shown figure is below the index worst. Left open only because C-092 is NEEDS WORK; verified closure needs a CLEAR Check.'
    check: C-092
---

# I-050: Small-moon accuracy text says "within 1 m" for every system

## Summary

PROV-01: approximated data carries its published known limitations and is never presented as more exact than it is. O-033 Success Condition 2 asks every moon to be placed "from a cited curve fit with its measured error against Horizons". The generic builder gives every dot moon one accuracy sentence, `src/experiences/planets/planetDefinition.ts` line 72: "Positions reproduce Horizons to within 1 m." The measured figures in the shipped indexes are larger for 18 moons: Daphnis span fit 19.9 m and 26.2 m Saturn-centred (T-114 evidence: it missed the 1 m target), the Saturn ring moons (Janus, Epimetheus, Atlas, Prometheus, Pandora, Pan ...) about 6.4 m Saturn-centred, and Neptune's seven irregulars (Halimede, Psamathe, Sao, Laomedeia, Neso, S/2002 N5 ...) 61.4 m Neptune-centred. T-114 explains the planet-centred gaps as Horizons-internal kernel differences, not fit error, but the information panel states the 1 m figure without that distinction.

## Evidence

- `data/ephemerides/saturn-moons/index.json`, Daphnis `accuracy.span.worstM` 19.9131, `saturnCentredUtc.worstM` 26.1826; 11 Saturn moons and 7 Neptune moons have a planet-centred `worstM` above 1 (checker script over every index's `accuracy` blocks).
- Mapped moons use their own figure (`moonSystem.ts` `position(label, worstM)`), so only the dot moons are affected.

## Expected

Each dot moon's record states its own measured figure (as mapped moons do), or a system-level sentence that is true for every moon it covers, including the Horizons-internal planet-centred gaps.

## Actual

One "within 1 m" sentence for all 343 non-Jupiter dot moons.

## Proof Needed

1. The dot-moon accuracy text is per moon (from its index) or true for every moon in the view.
2. A test that fails when a shown accuracy figure is smaller than the index's worst figure for that moon.
