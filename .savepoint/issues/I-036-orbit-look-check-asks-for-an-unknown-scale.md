---
id: I-036
title: The orbit-look browser check asks for an unknown scale, so its Readable case tests True
type: defect
status: open
source:
  kind: report
  actor: {role: checker, session: o017-orchestrator-check-20261017}
  at: '2026-10-18T05:00:00Z'
history:
  - at: '2026-10-18T05:00:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Found by the T-085 builder (Drift Note): tools/validate/browser-orbit-look.mjs loads `scale=readable`, which is not a scale id (`readable-scale` is), so its "desktop-readable" case silently renders True scale and never checks the orbit look under Readable.'
---

# I-036: The orbit-look browser check asks for an unknown scale

## Summary

`tools/validate/browser-orbit-look.mjs` (added by I-035, moved onto the driver in 9249daa) builds its "desktop-readable" case with the address `scale=readable`. The app accepts only scale ids such as `readable-scale` and falls back to the experience's default, so the case passes without ever rendering Readable.

## Proof Needed

1. The case selects Readable through the driver (`chooseScale`) or a valid `scale=readable-scale` address on an experience that offers it (Earth–Moon; Apollo is True only after T-085), and asserts the scale actually in use is Readable before checking the orbit look.
2. A guard or test fails when a check asks for a scale the experience does not offer, so a silent fallback cannot hide a case again.
3. The full run passes.
