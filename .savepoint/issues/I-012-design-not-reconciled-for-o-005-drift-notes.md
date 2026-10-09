---
id: I-012
title: Design.md not reconciled for O-005 Task drift notes
type: drift
status: open
source:
  kind: check
  check: C-007
  actor: {role: checker, session: o005-check-claude-20261010}
  at: '2026-10-09T21:35:00Z'
tasks: [T-018, T-019, T-020, T-022]
checks: [C-007]
history:
  - at: '2026-10-09T21:35:00Z'
    actor: {role: checker, session: o005-check-claude-20261010}
    kind: observed
    note: Found by the O-005 Full Objective Check against T-020 Done When 6 and O-005 success condition 12.
    check: C-007
  - at: '2026-10-09T22:12:23Z'
    actor: {role: executor, session: codex-g003-spike03-repair-20261010}
    kind: repair_attempted
    note: Reconciled Design.md with T-018/T-019/T-022 shell, app, type and rendering changes and current browser scripts. See Repair Attempt below; Issue awaits independent Full Check verification.
---

# I-012: Design.md not reconciled for O-005 Task drift notes

## Summary

T-020 Done When 6 and O-005 success condition 12 require `.savepoint/Design.md` to be reconciled to the implemented shell. The T-020 edit updated the Architecture sentence, the Codebase Map (`src/shell/`, `src/app/`, `src/mission/apollo11.ts`, `tools/validate/`, the Spike 03 note) and the Known open items. It did not reconcile the drift that earlier Tasks explicitly deferred to this step:

- T-018: the app now starts in TrueScale, and the True/Readable choice moved from developer tools to the viewer toolbar.
- T-019: `ExperienceConfig` gained per-object `description`, `provenance` and `knownLimitations`, plus `eventProvenance`. `TrackedBody.provenance` passes trajectory provenance through. `src/app/ephemerisProvenance.ts` supplies Earth/Moon ephemeris provenance. `AstraeusShell` takes `scaleId`, `onScaleChange` and `metricsFor`.
- T-022: `TrackedReadout.positionKm`, `TrackedBody.positionDiscrepancies` and `MissionConfig.journey` were added. The NASA anchor markers changed from square points to a round sprite in `src/app/TrackedBodyView.ts`.

"Interfaces and Data Flow" still describes only the core. It has no flow from experience configuration and clock snapshot into the shell, and no flow from shell callbacks to the clock, camera request, selection and scale policy. A search of Design.md finds none of the items above.

## Evidence

- `git diff .savepoint/Design.md` (T-020 working-tree edit); `.savepoint/Design.md:32-34` (Interfaces and Data Flow).
- Drift Notes: T-018 (TrueScale default), T-019 (three bullets ending "Design.md not yet reconciled"), T-022 (anchor marker restyle and the app-type additions, both "reconcile in Design.md at T-020").

## Proof Needed

Design.md describes these things, briefly and without duplicating `docs/ASTRAEUS_SPIKE_03.md`:
- the shell data flow (ExperienceConfig, snapshot and callbacks; selection and camera presets; the scale choice mapped to the unchanged `ScalePolicy`);
- the default True scale;
- object/event provenance and known limitations sourced from generated data;
- the app-layer type additions;
- the anchor-marker sprite.

Each T-018/T-019/T-022 drift note is either reflected or explicitly marked as not architectural.

## Repair Attempt — 2026-10-09

`.savepoint/Design.md` now records the T-018 default `true-scale` and viewer-toolbar scale choice; the `ExperienceConfig`/`ClockSnapshot`/callback flow between the app and `AstraeusShell`; scale IDs mapping to the unchanged `trueScale` and `readableScale` policies; object and event provenance plus known limitations from generated/app data; T-022's `TrackedReadout.positionKm`, `TrackedBody.positionDiscrepancies` and `MissionConfig.journey`; and the generated round anchor sprite. It also names the current browser-validation scripts in the Codebase Map and Current Technical State. The T-018/T-019/T-022 fields are described as implemented app/shell contracts, while time-ranged provenance and future Readable-scale radii remain open items.

This repair is recorded at 2026-10-09T22:12:23Z. A fresh independent Full Objective Check remains required to verify reconciliation; this Issue remains open for that Check.
