---
id: I-188
title: The catalogue browser journey fails on every run, so the browser gate is red and the catalogue page has no browser proof
type: defect
status: open
source:
  kind: check
  check: C-193
  actor: {role: checker, session: check-o080-20261121}
  at: '2026-11-21T06:47:10Z'
tasks: [T-335, T-336]
guardrail_ids: [TEST-01]
checks: [C-193]
severity: medium
history:
  - at: '2026-11-21T06:47:10Z'
    actor: {role: checker, session: check-o080-20261121}
    kind: observed
    note: 'C-193: first real run of journey-catalogue.mjs (check:browser, docs/evidence/browser-20261121T064004Z) exits 1 after 2 s at journey-catalogue.mjs:35 for the first part (panel); every later assertion never ran.'
    check: C-193
  - at: '2026-11-21T06:56:24Z'
    actor: {role: executor, session: repair-o080-c193-20261121}
    kind: repair_attempted
    note: 'Repair (executor): the journey''s shown-code assertion now calls holdsAddLines(code, addLines) from new tools/validate/catalogue-lines.mjs (+ .d.mts): the add lines must be a run of consecutive code lines, each compared without its leading space (journey-catalogue.mjs:36). Fast proof in astraeus-site tests/shelfCatalogue.test.ts (additions only): per example, holdsAddLines(source, addPartsStatement(source)) is true and source.includes(addPartsStatement(source)) is false (the old mistake); a holdsAddLines table refuses changed, reordered, split and empty add lines. With the helper swapped for the old plain includes, 8 cases fail; restored, 44/44 pass. Not run: npm run check:browser (left to the recheck, per the coordinator), so fit, Run button size, one viewer at a time and every example starting at 1280x720 and 375x667 remain unverified in a browser. Gates after the last edit: lint, typecheck, build exit 0; npm test 288 files, 4542 passed, 2 skipped.'
---

# I-188: The catalogue browser journey fails on every run, so the browser gate is red and the catalogue page has no browser proof

## Summary

O-080 "Proof and docs" requires the site browser driver and a journey to cover the catalogue page at 375x667 and 1280x720, and the Full Check's browser gate must pass. The new journey was written without a browser run and its first content assertion is wrong, so `npm run check:browser` fails on every run and none of the journey's page checks (fit, overlap, Run button size, one viewer at a time, every example starts, both sizes) have ever executed.

## Evidence

- `npm run check:browser` (2026-11-21 06:40-06:46 UTC): every step exit 0 except `catalogue`, exit 1 in 2 s. `docs/evidence/browser-20261121T064004Z/catalogue/results.json`: "panel: the shown code is the code that runs (it holds the add line as written)" at `packages/astraeus-site/tools/validate/journey-catalogue.mjs:35`.
- Cause: `src/catalogue/sourceLines.ts` `addPartsStatement` returns the statement left-aligned (indent stripped, as its doc comment says), while `[data-part-code]` shows the example's full indented text; `entry.code.includes(entry.addLines)` therefore fails for every multi-line, indented statement. Checker probe over all six `src/catalogue/examples/*.ts`: `source.includes(addPartsStatement(source))` is false for all six. The page behaviour is as designed; the journey's assertion is wrong.
- `tests/shelfCatalogue.test.ts` checks the statement's shape only, so the fast suite does not catch the mismatch.

## Proof Needed

- The journey's "shown code is run code" assertion compares like with like (for example the add lines against the shown code with each line's leading space removed), and a fast case fails on the current assertion's mistake.
- One `npm run check:browser` run (at the next Check) passes the `catalogue` step at both 1280x720 and 375x667, so fit, Run button size, one viewer at a time and every example starting are proven in a browser.
