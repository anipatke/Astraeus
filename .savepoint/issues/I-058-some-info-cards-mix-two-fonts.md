---
id: I-058
title: Some planet and moon information cards mix two fonts
type: defect
status: resolved
source:
  kind: report
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  at: '2026-10-21T22:45:00Z'
severity: medium
resolution:
  disposition: escalated
  actor: {role: planner, session: o039-planning-20261022}
  at: '2026-10-22T10:45:00Z'
  reason: Owner asked for one repair Objective for the five owner-reported defects before O-038 (2026-10-22).
escalated_to: O-039
history:
  - at: '2026-10-21T22:45:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner, on the preview during O-037: "Some of the planet and moon info cards have two diff fonts". Not yet investigated; which cards and which parts not yet named.'
  - at: '2026-10-21T22:55:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner named one: "Charon has two different font". Coordinator read: the information panel deliberately sets its subtitle and every fact value in monospace (src/shell/style.css:47 .info-panel-subtitle, :52 .info-panel-facts dd), the rest in the UI font; so a card whose subtitle or fact values are words rather than figures reads as two fonts. Charon''s mapped-moon text has no unusual characters. Not confirmed on the page; to settle with the owner whether the data font is wanted.'
  - at: '2026-10-21T23:40:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner: "charon is only one example, check all the cards, looks untidy".'
  - at: '2026-10-21T23:40:00Z'
    actor: {role: executor, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Read-only audit of every card (docs/evidence/map-audit-20261021/card-fonts.md): all 403 tagged-place cards set a words subtitle in monospace ("dark polar region on Charon") and 391 also set sentence rows in monospace (997 detail rows, about 658 prose: Fun Fact, naming notes); every moon and planet card with facts mixes words in monospace (Family "Inuit group", Size with "(estimated from brightness)", "115 moons in the JPL Horizons list of 18 October 2026"); Diameter is a figure on 30 cards and words on 32. Sun, Mercury, Venus and Earth cards have no facts. No inline styles, code elements, italics or weight differences. Cause: src/shell/style.css:47 and :52 set the subtitle and every fact value in 12px ui-monospace. Smallest fix: one font throughout (drop those two font rules, add tabular-nums), one file, every card changes; alternative is a figure flag on facts across five files.'
  - at: '2026-10-21T23:50:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner: "in planetary eplorer they fun facts, origin etc. appeared as little fact cards, we havent carried this over". The repair should port the donor''s fact-card presentation for place details (Fun Fact, origin and the like) faithfully, per the donor rule, rather than only changing fonts.'
  - at: '2026-10-22T10:45:00Z'
    actor: {role: planner, session: o039-planning-20261022}
    kind: escalated
    note: 'Repair promoted into O-039 (G-007), planned 2026-10-22 with the owner''s decisions recorded there.'
---

# I-058: Some planet and moon information cards mix two fonts

## Summary

Some information cards for planets and moons show text in two different fonts. Not investigated yet: likely a part of the card (imported description, details or sources) styled differently from the rest.

## Evidence

Owner report on the preview, 2026-10-21. Out of scope for O-037 (G-007 boundary).

## Proof Needed

Name the cards and the element whose font differs and why; every card uses the shell's one text style; a test or browser readout confirms the computed font family is the same across a card's sections; the owner confirms on the preview.
