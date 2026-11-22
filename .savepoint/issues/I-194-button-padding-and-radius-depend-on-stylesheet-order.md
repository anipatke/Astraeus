---
id: I-194
title: Button padding, radius and height depend on stylesheet order (site vs mount)
type: defect
status: resolved
source:
  kind: report
  actor: {role: executor, session: orchestrate-g024-20261122}
  at: '2026-11-21T22:59:26Z'
tasks: [T-410]
checks: [C-207]
guardrail_ids: []
severity: medium
resolution:
  disposition: verified
  check: C-207
  actor: {role: checker, session: check-o088-20261122}
  at: '2026-11-22T02:28:16Z'
  reason: 'C-207 CLEAR: computedLook bundle-order test passes for padding, radius and min-height in all 4 layouts x 2 definitions and fails on the pre-fix style.css; the site-order look is unchanged against the retired baseline; the owner look passed ("5Y", O-088 Decisions, 2026-11-22).'
history:
  - at: '2026-11-21T22:59:26Z'
    actor: {role: executor, session: orchestrate-g024-20261122}
    kind: observed
    note: 'T-410 builder: a bundle-order test (site order vs mount order, elements keyed by ancestry path) fails in all 8 computedLook scenarios; the existing computed-look.baseline.json already holds both orders and they differ. Mount order vs site order: buttons and .collapsible-toggle (button.ui-row.collapsible-toggle, .setting-buttons buttons, others) get padding 0px 12px and radius 999px (pill) instead of 6px 8px and calc(12px / 2); min-height 30px vs 36px on phone and embedded layouts. Likely equal-specificity rules in app/style.css (.hud .collapsible-toggle, .hud .setting-buttons button) and the shell sheets, so source order decides. Computed by happy-dom; not yet confirmed in a real browser. Draft checks at /tmp/claude-1000/T-410-draft-computedLook.test.ts.'
  - at: '2026-11-21T23:09:26Z'
    actor: {role: executor, session: build-t410-20261122}
    kind: repair_attempted
    note: 'T-410 (owner: Make both like the site): app/style.css drawer control rule now :where(.hud) button|input|select with :is() on the subject (0,1,2), beating controls.css generic rules in either bundle order; bundle-order test (8 cases) passes, was red on HEAD. Awaiting owner look on localhost:5490 and a Check.'
  - at: '2026-11-22T02:28:16Z'
    actor: {role: checker, session: check-o088-20261122}
    kind: rechecked
    note: 'C-207: Proof Needed met; closed as verified.'
    check: C-207
---

# Button padding, radius and height depend on stylesheet order

## Problem

Design `Good guest` item (6) says both bundle orders give the same look. They do not for button padding, corner radius and (on phone/embedded) min-height: an embedder who mounts the viewer gets pill-shaped, differently padded buttons compared with the site.

## Proof Needed

A computedLook bundle-order test compares site order and mount order element by element and passes for padding, border radius and min-height in every layout and definition; the owner confirms the intended button look on localhost:5490.

## Repair Routing

Owner decision pending (T-410 parked): fix the stylesheet so both orders agree (which look is intended?), or narrow the check.
