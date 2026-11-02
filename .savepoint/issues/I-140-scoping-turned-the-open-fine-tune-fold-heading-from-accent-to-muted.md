---
id: I-140
title: Scoping turned the open Fine-tune fold heading from accent to muted
type: defect
status: open
source:
  kind: check
  check: C-144
  actor: {role: checker, session: o055-check-20261102}
  at: '2026-11-02T10:45:00Z'
tasks: [T-256, T-257]
checks: [C-144]
guardrail_ids: [API-03, TEST-01]
severity: low
history:
  - at: '2026-11-02T10:45:00Z'
    actor: {role: checker, session: o055-check-20261102}
    kind: observed
    check: C-144
    note: 'C-144 probe P-STYLE-1 (computed styles of the rendered App under the main-branch sheets vs the HEAD sheets) finds exactly one changed look in every layout and both bundle orders: an open nested Developer-drawer fold heading is #fc6323 on main and #c7bdb3 on HEAD.'
---

# I-140: Scoping turned the open Fine-tune fold heading from accent to muted

## Summary

O-055 Success Condition 7 and T-256 Done When ("Cascade kept ... each listed case is resolved so the computed value is as before") promise the look is unchanged. One cascade winner flipped. In the Developer drawer, an open nested fold heading (for example "Fine-tune" under the orbit settings, `Collapsible ... nested` in `App.tsx`) was accent orange on main and is muted grey now.

On main, `.hud .collapsible-nested .collapsible-toggle { color: var(--ui-muted) }` (specificity 0,3,0) lost to controls.css `.astraeus-shell button[aria-expanded="true"]:not(.ui-bare) { color: var(--control-accent) }` (0,3,1). On HEAD, the rewritten `.astraeus-shell .hud .collapsible-nested .collapsible-toggle` (`packages/astraeus/src/app/style.css:53`, 0,4,0) beats it (`packages/astraeus/src/shell/controls.css:81`).

The builders' throwaway specificity model reported "0 flips" because it never paired these two rules. Its subject-overlap test counted the class inside `:not(.ui-bare)` as a class the subject must have (`cascade.mjs` `subject()`), so the two subjects looked disjoint. Any other rule that pairs with a `:not(.class)` subject was skipped in the same way.

## Evidence

- Probe: `docs/evidence/check-o055-20261102/probes/cascade.probe.test.ts`, run with `npx vitest run --config docs/evidence/check-o055-20261102/vitest.probe.config.ts cascade`. Outputs are `docs/evidence/check-o055-20261102/cascade-*.txt`, one per layout (desktop, phone, embedded desktop, embedded phone), bundle order (site, mount) and definition (synthetic, listed). In every synthetic-definition file, the only differences outside the intended `html`/`body`/root-background moves are the four lines `... button.ui-row.collapsible-toggle ... | color: "#fc6323" -> "#c7bdb3"`. The listed-definition files have none, because that definition has no nested fold.
- The flip comes from specificity alone, so a real browser computes the same result. The owner's look ("looks OK", 2026-11-02) did not name this fold, and `check:browser` reads no computed colour in the Developer drawer (`controlStyles` in `driver.mjs` skips `.developer-tools` and is not called by any step).

## Proof Needed

- An open nested fold heading in the Developer drawer computes the same colour as on main: either `:where()` on the rewritten rule's first class (as at the other 31 sites), or an explicit owner decision that muted is the intended look, recorded here.
- A kept, repeatable test fails on this flip and on any other computed-style change between the main-branch sheets and the tree. One way is a computed-style comparison of the rendered App, like P-STYLE-1, made a repo test that reads the base sheets with `git show`. The test must cover a `:not()` subject, so the static model's blind spot cannot hide a flip again.
