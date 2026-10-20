---
id: I-049
title: The assets catalogue says Jupiter, Saturn, Uranus, Neptune and Pluto's places are shown in the app when they are not
type: defect
status: resolved
source:
  kind: check
  check: C-091
  actor: {role: checker, session: o033-full-check-20261020}
  at: '2026-10-20T14:03:15Z'
tasks: [T-120]
checks: [C-091, C-092, C-093]
guardrail_ids: [PROV-01, TEST-01]
severity: low
resolution:
  disposition: verified
  check: C-093
  actor: {role: checker, session: o033-targeted-recheck-20261020}
  at: '2026-10-20T14:36:30Z'
history:
  - at: '2026-10-20T14:03:15Z'
    actor: {role: checker, session: o033-full-check-20261020}
    kind: observed
    note: 'Found by the O-033 Full Objective Check C-091 at HEAD 9d1707bc. The generator decides "shown in the app" from planet ids and mapped moons, not from what each planet''s bodyFeatures shows.'
    check: C-091
  - at: '2026-10-21T01:20:00Z'
    actor: {role: executor, session: o033-repair-builder-20261021}
    kind: repair_attempted
    note: 'Repaired: tools/site/assets-sections.mjs takes shown from the planet settings'' bodyFeatures and counts surface places with the same isSurfacePlace rule as the builder; assets.html regenerated (Jupiter data-shown=no; Mars 30 of 32, Saturn 3 of 20, Uranus 9 of 19, Neptune 9 of 19, Pluto 12 of 16, with a note and data-shown-count). Test: tests/assetsSections.test.ts ''marks a body shown only when some planet''s settings list it'' (fails on a wrong mark or count); the generated-block and credits tests pass. Wording for Jupiter reads ''Not in the app yet'', not a note that Jupiter''s own places are deliberately out (Success Condition 6); noted for the checker.'
  - at: '2026-10-20T14:26:00Z'
    actor: {role: checker, session: o033-full-recheck-20261020}
    kind: rechecked
    note: 'Recheck C-092 at HEAD ff1d8d80: Proof Needed met. assets.html marks shown only bodies some planet''s bodyFeatures lists (Jupiter and Ceres no; Mars 30 of 32, Saturn 3, Uranus 9, Neptune 9, Pluto 12) with data-shown-count from the shared rule; tests/assetsSections.test.ts fails on a wrong mark or count; tests/assetsPageCredits.test.ts passes. Jupiter''s wording ''Not in the app yet'' is an owner wording question, not a defect. Left open only because C-092 is NEEDS WORK; verified closure needs a CLEAR Check.'
    check: C-092
  - at: '2026-10-20T14:36:30Z'
    actor: {role: checker, session: o033-targeted-recheck-20261020}
    kind: rechecked
    note: 'Recheck C-093 (CLEAR) at HEAD 5a68b0a4: generator, assets.html and tests unchanged since C-092, where Proof Needed was met; tests pass (88 files, 1,250 passed). Verified.'
    check: C-093
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
