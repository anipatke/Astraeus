---
id: C-203
scope: {kind: objective, id: O-086}
result: NEEDS WORK
checked_by: {role: checker, session: check-o086-orchestrator-20261122}
executed_session: orchestrate-g024-20261121 (Sonnet builders for T-382..T-393)
checked_at: '2026-11-21T21:57:36Z'
reviewed:
  base_commit: f6380874
  head_commit: 3b9f7dd2
  files: []
  dependencies: []
issues: [I-192]
unmet: [browser-full-tier]
supersedes: null
---

# C-203: O-086 Full Objective Check

Run by the orchestrating session under G-024 decision 7; it planned and reconciled Design but did not build T-382..T-393. Full tier (O-086 changes the browser runner, steps and packaging gates).

**Result: NEEDS WORK** on one item: the full browser tier fails at look-out phone step 3 (I-192), a defect introduced by T-390's switch to handle camera reads. Every other gate and criterion passes.

## Gates (this session)

- `lint` 0 (6 s); `typecheck` 0; `build` 0; `test:full` 0: 316 files, 5116 passed, 3 skipped (57 s, was 91 s); Node 22 `vitest run`: 316 files, 5116 passed.
- `check:engine-alone` pass (240 files, 3901 passed); `check:pack` pass (20 s, now with the example build, engine budget and self-proof); `check:public-build` pass (4 s); `check:node-consumer` pass; `check:react-consumer` pass; `measure:example` 1,834,360 / 524,845 B (unchanged).
- `npm run check:browser -- --tier full`: exit 1 only at `look-out` (I-192); every other step exit 0; total 287 s (limit 450); evidence `docs/evidence/browser-20261121T215119Z`.

## Coverage (summary)

Tiers, `--step`, `--list` (T-388), public-build gate (T-389), pack rules on scratch inputs with `check:pack` self-proof (T-382), Apollo hash gate (T-383), scoped preload (T-384), finder bands byte-identical (T-385), guidance (T-386), Vitest moves and RETIRED list (T-387, T-392), polls (T-391), timings and limits (T-393): proven by the Tasks' red-first evidence and this run's gates. Sky camera from the handle (T-390): **Issue I-192**.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-192 look-out reads mid-glide | High (3 of ~6 runs) | Medium (full tier unreliable) | Medium | Fix now: driver waits for a settled pose |
