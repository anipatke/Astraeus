---
id: I-058
title: Some planet and moon information cards mix two fonts
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  at: '2026-10-21T22:45:00Z'
severity: low
history:
  - at: '2026-10-21T22:45:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner, on the preview during O-037: "Some of the planet and moon info cards have two diff fonts". Not yet investigated; which cards and which parts not yet named.'
  - at: '2026-10-21T22:55:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner named one: "Charon has two different font". Coordinator read: the information panel deliberately sets its subtitle and every fact value in monospace (src/shell/style.css:47 .info-panel-subtitle, :52 .info-panel-facts dd), the rest in the UI font; so a card whose subtitle or fact values are words rather than figures reads as two fonts. Charon''s mapped-moon text has no unusual characters. Not confirmed on the page; to settle with the owner whether the data font is wanted.'
---

# I-058: Some planet and moon information cards mix two fonts

## Summary

Some information cards for planets and moons show text in two different fonts. Not investigated yet: likely a part of the card (imported description, details or sources) styled differently from the rest.

## Evidence

Owner report on the preview, 2026-10-21. Out of scope for O-037 (G-007 boundary).

## Proof Needed

Name the cards and the element whose font differs and why; every card uses the shell's one text style; a test or browser readout confirms the computed font family is the same across a card's sections; the owner confirms on the preview.
