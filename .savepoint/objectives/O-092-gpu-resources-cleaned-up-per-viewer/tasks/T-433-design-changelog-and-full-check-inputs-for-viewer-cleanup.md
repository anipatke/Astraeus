---
id: T-433
title: Design, changelog and Full Check inputs for viewer cleanup
objective: O-092
status: done
depends_on: [{task: T-427, requires: clear}, {task: T-428, requires: clear}, {task: T-429, requires: clear}, {task: T-430, requires: clear}, {task: T-431, requires: clear}, {task: T-432, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-433, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "Carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:52:00Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: integration
planned_reads: [.savepoint/Design.md, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, docs/agents/browser-policy.md, docs/agents/verification.md, docs/agents/build.md]
planned_writes: [.savepoint/Design.md, packages/astraeus/CHANGELOG.md]
---

# Design, changelog and Full Check inputs for viewer cleanup

## Outcome

Design and the changelog describe how viewers now clean up after themselves, every drift note from drafts 02–06 is accounted for, and the Full Check has what it needs: the engine size after all merges, the list of tests that prove each success condition, and the browser command and extra gates the diff calls for under the O-094 rules.

## User Check

None visual. The owner reads the 0.10.0 changelog lines.

## Done When

- `.savepoint/Design.md` under `Good guest` gains one item (7) in the existing style: no GPU picture is shared between viewers (each dot, anchor and halo material makes its own; body pictures are cloned per use from the page cache, and a failed one is retried at the next mount); every view that makes GPU objects has `dispose`, called when its viewer or view set goes, held by `tests/viewDisposal.test.ts` and its scan; picture-load wake-ups are one reference-counted hook on three's default loading manager (`app/loadingWakes.ts`); context loss is handled by three's own renderer (`tests/contextLoss.test.ts`); planet-series and star-file loads are retried after a failure; the two-viewer browser step (`two-viewers`, `journey-two-viewers.mjs`, full tier, added to a Full Check by its browser-policy row). Each of drafts 02–06's drift notes is listed in Technical Evidence as reflected there or as not architectural, with a reason (project rule: deferred Design reconciliation).
- `packages/astraeus/CHANGELOG.md`: in the `## 0.10.0 (proposed)` section (~5; read only that top section, project rule "read docs by section"), short plain `- Fixed:` lines in the style the section uses, above its `### Breaking changes in 0.10.0` subheading: two viewers on one page no longer affect each other when one is removed; GPU memory is freed when a viewer is removed; a failed planet, star or body-picture load is tried again on the next load or mount. No API change is listed because there is none.
- `packages/astraeus/README.md` is checked by heading for any statement about shared pictures, unmount or context loss (`rg -n -i 'dispose|unmount|context' packages/astraeus/README.md`); a now-false statement is reported to the coordinator, not edited here (O-090 owns README trims).
- Technical Evidence holds, for the Full Check:
  - engine size from `npm run check:pack` on the merged head, against the limit (1,838,000 B raw) and the O-092 start (1,826,428 B at C-211 unless O-092 started later; sum of drafts 02–05 allowances 900 B against about 11.5 KB headroom);
  - a table from each Objective success condition to its test file and case names, or browser step and assertion;
  - the Full Check's commands under the O-094 rules (`docs/agents/verification.md`, `docs/agents/browser-policy.md` "Browser tiers", `docs/agents/build.md`): `quality_gates` with `npm test` (not `test:full`); `npm run check:pack` (engine size); `npm run check:three-newest` (this Objective changes three usage: texture clones, sprite geometry clones, disposal, and pins three's renderer source; build.md runs it for such Objectives); one browser command, `npm run check:browser -- --tier quick --step look-out --step two-viewers --skip-examples` (`look-out` because `dotMaterial.ts`, `PointsView.ts` and `KeplerPoints.ts` are Shaders paths, and `assets/sky.ts` star loading plus any `SkyView.ts`/`SkyFiguresView.ts` change are Sky paths; `two-viewers` by draft 01's policy row; no other full-tier step's paths are touched unless the merged diff says otherwise, which this item re-checks with `git diff --stat` against the O-092 base; examples skipped because no packaging, `examples/` or public API file changes, re-checked against `api-surface.lock.json`); `check:engine-alone` not run (no engine import, `package.json` or build config change; re-check the diff).
- Gates per `docs/agents/verification.md`.

## Context Files

- `.savepoint/Design.md` under `Good guest`
- `packages/astraeus/CHANGELOG.md` (the newest section only: `grep -n '^## '` first)
- Drift Notes and Technical Evidence of drafts 01–06

## Design References

`.savepoint/Design.md` under `Good guest`.

## Guardrails

API-07, STYLE-07, TEST-03.

## Implementation Plan

1. Collect drafts 01–06's drift notes and evidence.
2. Write the Design item and changelog lines.
3. Measure size on the merged head; write the success-condition table.
4. Gates.

## Boundaries

Docs only. No README edits (report only). No browser run: the Full Check runs its one browser command (browser policy).

## Technical Verification

`npm run check:pack` once on the merged head. Prettier check on the two changed docs (builder rule 7); no tests change.

## Technical Evidence

Extra reads: Objective.md Decisions and Success Conditions; Technical Evidence, Drift Notes and Coordinator of T-427..T-432; `packages/astraeus/CHANGELOG.md` lines 1-46 (0.10.0 section); `.savepoint/Design.md` Good guest. README check: `rg -n -i 'dispose|unmount|context'` hits only handle/`mount` API rows (unmount, `ready` rejecting with `not-mounted`); a second `rg` for shared pictures/textures and context loss found nothing, so no README statement is false.

| Done When | Evidence |
|---|---|
| Design item (7) under Good guest | `.savepoint/Design.md` Good guest item (7) |
| Changelog lines above Breaking changes | three `- Fixed:` lines in `packages/astraeus/CHANGELOG.md` 0.10.0 section; no API line |
| README checked | above; nothing to report |
| Engine size | `npm run check:pack` on this head: 1,827,398 B raw (limit 1,838,000; C-211 start 1,826,428: +970 B, planned allowance 900 B, exceeded by 70 B, cap not near), 523,686 B gzip (limit 527,000); pass |
| Success-condition table | below |
| Full Check commands | below |

Drift note accounting (each reflected in Design item (7) unless marked):
- T-428 no shared GPU picture: reflected. T-429 every view has dispose / viewDisposal: reflected. T-430 loadingWakes hook: reflected. T-432 context loss by three's renderer / contextLoss.test.ts: reflected.
- T-431 retry of planet-series, star loads: reflected (T-428 body-picture retry also).
- T-427 two-viewer page and `two-viewers` step, plus the allowed stale-delete warnings in the last scenario: reflected. 200 ms wait before restore and `SYNTHETIC_KEYS` entry: not architectural (browser tooling).
- I-204 10 s waitFor default and I-203 drawer wait helper: reflected as test support in item (7).

Success conditions -> evidence:
| Condition | Evidence |
|---|---|
| Harm confirmed on a real two-viewer page today | T-427 before-fix runs (second unmount left WebGL delete warnings, or a canvas still present); `journey-two-viewers.mjs` |
| dispose table test; two viewers, unmount one, other keeps drawing | `tests/viewDisposal.test.ts` (11 rows, two-view row, scan), `sceneViewsDisposalDom.test.ts`, `bodyViewDisposalDom.test.ts`; browser `two-viewers` scenario 2 |
| Textures per viewer (owner "Own copies" replaces ref counts); loading-manager hooks per viewer | `tests/ownedPictures.test.ts` (3 cases), `bodyTextureOwnedDom.test.ts` (2), `loadingWakes.test.ts` (4 + either-order case) |
| Context loss restore can fire | `tests/contextLoss.test.ts` (2 cases), `glowAndHooksDom.test.ts` restore-wake case; browser `two-viewers` scenario 3 |
| Failed loads cleared, retry tests | `tests/planetSeriesRetry.test.ts` (3), `starCatalogueRetry.test.ts` (2), `bodyTextureOwnedDom.test.ts` failed-URL case |

Full Check commands (O-094 rules): `quality_gates` with `npm test` (not `test:full`); `npm run check:pack`; `npm run check:three-newest` (three usage changed: clones, disposal, renderer-source pin); `npm run check:browser -- --tier quick --step look-out --step two-viewers --skip-examples` (look-out: dotMaterial/PointsView/KeplerPoints Shaders paths, assets/sky.ts Sky path; two-viewers by its policy row; examples skipped: no packaging, `examples/` or public API change, to be re-checked against `api-surface.lock.json` and `git diff --stat` from the O-092 base); `check:engine-alone` not run (no engine import, package.json or build config change; the Check re-checks the diff).

Gates: `npx prettier --check .savepoint/Design.md packages/astraeus/CHANGELOG.md` clean; `npm run check:pack` pass. No tests changed, so no vitest or eslint run. Files changed: `.savepoint/Design.md`, `packages/astraeus/CHANGELOG.md`, this Task file.

## Drift Notes

None.

## Coordinator (gates)

Docs-only Task: Prettier clean on Design.md and CHANGELOG.md; `check:pack` pass (1,827,398 B raw / 523,686 B gzip). The code gate ran at the last wave (npm test 337 files, 5481 passed). Set done by the orchestrating session (owner: "I mark them as they pass", O-038; G-024 decision 7; owner 2026-11-22 "Carry on").
