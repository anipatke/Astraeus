---
id: I-011
title: Spike 01/02 browser checks neither re-run nor superseded by named equivalents
type: verification
status: open
source:
  kind: check
  check: C-007
  actor: {role: checker, session: o005-check-claude-20261010}
  at: '2026-10-09T21:35:00Z'
tasks: [T-020]
checks: [C-007]
history:
  - at: '2026-10-09T21:35:00Z'
    actor: {role: checker, session: o005-check-claude-20261010}
    kind: observed
    note: Found by the O-005 Full Objective Check against T-020 Done When 4 and O-005 success condition 10.
    check: C-007
  - at: '2026-10-09T22:12:23Z'
    actor: {role: executor, session: codex-g003-spike03-repair-20261010}
    kind: repair_attempted
    note: Repaired and ran the current-shell Spike 01/02 and anchor-label scripts plus the neighboring responsive validation. Results are isolated under docs/evidence/regression-spike01-02/ and docs/evidence/spike03/; see Repair Attempt below. No browser errors; Issue awaits independent Full Check verification.
---

# I-011: Spike 01/02 browser checks neither re-run nor superseded by named equivalents

## Summary

T-020 Done When 4 requires that "Spike 01/02 browser and unit evidence still holds (the existing scripts re-run or are superseded with named equivalents)". O-005 success condition 10 also asks that browser checks report no console errors. Neither condition is met in the repository:

- `tools/validate/browser-spike02.mjs` fails at its first shell-replaced step. It clicks `Follow Columbia (CSM)` without first selecting Columbia, and it reads the `Pause`/`Play` buttons by their old names.
- `tools/validate/browser-anchor-labels.mjs` waits for `UTC date and time` without opening Developer mode, and so times out.
- T-020's evidence says that `browser-shell.mjs` and `browser-spike03.mjs` do not repeat the all-event jump, the four-rate measurement or the follow/rebasing continuity track. Neither covers the six-time True/Readable readout pairs, the Spike 01 USNO phase readouts or the anchor-label toggle.

`.savepoint/Design.md` (Current Technical State) still cites `browser-spike02.mjs` as the browser validation for these behaviours. The project's "scene-affecting fuller gate" (AGENTS.md, Astraeus Project Rules) therefore has no runnable script for them.

The behaviour itself holds. In C-007, a check-session probe that was not committed re-expressed every Spike 02 and anchor-label check against the current shell and developer UI:
- all six scale pairs are identical;
- all 30 event jumps land on their own timestamps;
- rates are about 1×, 100×, 1,000× and 10,000×, with occasional low readings that are harness click latency and that repeat runs did not reproduce;
- the 100× follow track is continuous;
- USNO lunar illumination is 50.1 / 0.2 / 50.1 / 99.8 %;
- anchor labels show 0 when off, 40 when on, and hide again when toggled off;
- there were zero console errors.

What is missing is the repeatable, named evidence that the criterion asks for, not working behaviour.

## Evidence

- `tools/validate/browser-spike02.mjs:21,30,37` (old button names and preset click without selection); `tools/validate/browser-anchor-labels.mjs:15-17`.
- T-020 Technical Evidence, "Legacy browser scope" paragraph; T-018 and T-019 Limitations.
- C-007 "Fresh gates and browser evidence" section (probe results, 2026-10-09T21:29Z–21:33Z UTC).

## Proof Needed

Update `browser-spike02.mjs` and `browser-anchor-labels.mjs` to drive the current shell and Developer mode, or replace them with named scripts that do. Selection then preset, `Pause playback`/`Play` in `.controls`, and the developer `UTC date and time` seek are enough. The scripts must cover:
- the six-time True/Readable readout pairs;
- camera independence;
- all 30 event jumps;
- the four rates;
- the 100× follow continuity track;
- the four USNO phase readouts;
- the anchor-label toggle.

Run them at 1280×800 with zero console errors, and record the command, time and result. Decide explicitly whether the run may overwrite the committed `docs/evidence/spike02*` files, or write elsewhere. Update the Design.md browser-validation sentence to name the current scripts.

## Repair Attempt — 2026-10-09

The current-shell regression scripts are restored and their outputs are isolated from historical Spike 02 evidence. At 2026-10-09T22:08:15Z, this command passed at 1280×800:

```sh
PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_URL=http://127.0.0.1:5199/ node tools/validate/browser-spike02.mjs
```

It confirmed 6/6 identical True/Readable telemetry pairs; 6/6 camera presets left UTC and spacecraft readouts unchanged; all 30 event jumps landed on matching timeline timestamps; configured 1×, 100×, 1,000× and 10,000× playback measured 0.95×, 94.7×, 945.6× and 9,481.7×; 30 continuity samples covered a progressing 100× follow; the four USNO illumination values matched 50.1%, 0.2%, 50.1% and 99.8%; and console/page errors were empty. Results are saved at `docs/evidence/regression-spike01-02/browser-spike02-results.json`.

At 2026-10-09T22:08:41Z, the same runtime and URL with `node tools/validate/browser-anchor-labels.mjs` passed at 1280×800: the label layer started hidden with 0 labels, showed 40 labels when enabled, and returned to hidden/0 after the second toggle, with no console/page errors. Results and screenshots are under `docs/evidence/regression-spike01-02/anchor-labels/`. Neither run writes to `docs/evidence/spike02*`.

The neighboring responsive validation at 1440×900, 1280×800, 768×1024 and 390×844 passed at 2026-10-09T22:11:54Z with zero page/console errors and screenshots at the default True scale (`docs/evidence/spike03/browser-results.json`). `.savepoint/Design.md` names all four current browser scripts and their distinct scopes. A fresh independent Full Objective Check remains required to verify the repair; this Issue remains open for that Check.
