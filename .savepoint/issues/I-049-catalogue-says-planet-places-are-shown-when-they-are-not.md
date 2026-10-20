---
id: I-049
title: The assets catalogue says Jupiter, Saturn, Uranus, Neptune and Pluto's places are shown in the app when they are not
type: defect
status: open
source:
  kind: check
  check: C-091
  actor: {role: checker, session: o033-full-check-20261020}
  at: '2026-10-20T14:03:15Z'
tasks: [T-120]
checks: [C-091]
guardrail_ids: [PROV-01, TEST-01]
severity: low
history:
  - at: '2026-10-20T14:03:15Z'
    actor: {role: checker, session: o033-full-check-20261020}
    kind: observed
    note: 'Found by the O-033 Full Objective Check C-091 at HEAD 9d1707bc. The generator decides "shown in the app" from planet ids and mapped moons, not from what each planet''s bodyFeatures shows.'
    check: C-091
---

# I-049: The assets catalogue says five bodies' places are shown in the app when they are not

## Summary

T-120 Done When 3 asks for "a tagged-places section per body (count, categories, sources, shown in the app or not ...)" generated from the packages. `tools/site/assets-sections.mjs` `shownInApp()` (lines 35-42) marks a body shown when it is a planet settings file's `id` or a mapped moon, not when a planet's `bodyFeatures` lists it. So `assets.html` says "Shown in the app" (`data-shown="yes"`) for Jupiter, Saturn, Uranus, Neptune and Pluto, whose own places the app never draws (see I-048; Jupiter's are left out by design, Success Condition 6). Mars says 32 places shown; the app draws 30 (two package entries have no position).

## Evidence

- `assets.html` line 1302-1304 (Pluto): `data-shown="yes"`, "16 places ... Shown in the app."; the same for `jupiter`, `saturn`, `uranus`, `neptune` (grep `data-places-body`).
- Checker probe building every planet definition: centre places shown for jupiter, saturn, uranus, neptune, pluto = 0; mars = 30 of 32.
- `tests/assetsSections.test.ts` only checks the page equals the generator output, so a wrong rule passes.

## Expected

"Shown in the app" is true only for a body some planet's `bodyFeatures` lists (and the count, or a note, reflects entries without a position).

## Actual

Five bodies are claimed shown that are not; Mars's shown count includes two entries that are not markers.

## Proof Needed

1. The generator takes "shown" from the planet settings' `bodyFeatures` (after I-048's repair, whichever planets then list their centre).
2. A test that fails when a body is marked shown but no planet's `bodyFeatures` lists it.
3. `assets.html` regenerated; `tests/assetsSections.test.ts` and `tests/assetsPageCredits.test.ts` pass.
