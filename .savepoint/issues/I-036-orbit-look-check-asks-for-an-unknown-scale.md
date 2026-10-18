---
id: I-036
title: The orbit-look browser check asks for an unknown scale, so its Readable case tests True
type: defect
status: resolved
source:
  kind: report
  actor: {role: checker, session: o017-orchestrator-check-20261017}
  at: '2026-10-18T05:00:00Z'
checks: [C-078]
resolution:
  disposition: verified
  check: C-078
  actor: {role: checker, session: o020-full-check-20261018}
  at: '2026-10-18T09:55:00Z'
  reason: 'orbit-look loads scale=readable-scale on Earth-Moon through loadAddress, which throws when a scale is not offered or not in force (tests/browserDriverScale.test.ts), and asserts currentScale; fresh full run passes. Proven by C-078 (CLEAR).'
history:
  - at: '2026-10-18T05:00:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Found by the T-085 builder (Drift Note): tools/validate/browser-orbit-look.mjs loads `scale=readable`, which is not a scale id (`readable-scale` is), so its "desktop-readable" case silently renders True scale and never checks the orbit look under Readable.'
  - at: '2026-10-17T22:00:00Z'
    actor: {role: executor, session: i036-i037-builder-20261017}
    kind: repair_attempted
    note: 'Executor stopped (owner pause). Done: driver loadAddress/assertScaleInUse throw when a scale is not offered or not in force (tests/browserDriverScale.test.ts); browser-orbit-look now loads earth-moon with scale=readable-scale and asserts currentScale. Single run of browser-orbit-look passed. tsc, vitest, build and driver guard passed. Remains: the final run-full (not run) and a Check.'
  - at: '2026-10-17T21:40:00Z'
    actor: {role: executor, session: o020-orchestrator-20261018}
    kind: repair_attempted
    note: 'Merged into o018-o019 (merge of o020-i036-i037). Full run docs/evidence/o020-i036-i037-full-20261017T212213Z in the lane at db92b3b: 22/22 exit 0, error-lines 0, 668 s; orbit-look desktop-readable now loads Earth-Moon with scale=readable-scale through driver loadAddress and asserts currentScale. On the merged head: tsc 0, driver guard pass, vitest 960 passed 1 skipped (tests/browserDriverScale.test.ts 3 tests). Orchestrator review: the guard runs only through loadAddress; other scripts that put scale= in an address ask for true-scale, which every experience offers. Left open for verification in the O-020 Full Objective Check.'
  - at: '2026-10-18T09:55:00Z'
    actor: {role: checker, session: o020-full-check-20261018}
    kind: rechecked
    check: C-078
    note: 'orbit-look loads scale=readable-scale on Earth-Moon through loadAddress, which throws when a scale is not offered or not in force (tests/browserDriverScale.test.ts), and asserts currentScale; fresh full run passes. Proven by C-078 (CLEAR).'
---

# I-036: The orbit-look browser check asks for an unknown scale

## Summary

`tools/validate/browser-orbit-look.mjs` (added by I-035, moved onto the driver in 9249daa) builds its "desktop-readable" case with the address `scale=readable`. The app accepts only scale ids such as `readable-scale` and falls back to the experience's default, so the case passes without ever rendering Readable.

## Proof Needed

1. The case selects Readable through the driver (`chooseScale`) or a valid `scale=readable-scale` address on an experience that offers it (Earth–Moon; Apollo is True only after T-085), and asserts the scale actually in use is Readable before checking the orbit look.
2. A guard or test fails when a check asks for a scale the experience does not offer, so a silent fallback cannot hide a case again.
3. The full run passes.
