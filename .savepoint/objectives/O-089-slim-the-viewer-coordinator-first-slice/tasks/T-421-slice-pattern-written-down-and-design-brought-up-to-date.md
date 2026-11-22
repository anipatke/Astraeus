---
id: T-421
title: Slice pattern written down and Design brought up to date
objective: O-089
status: done
depends_on: [{task: T-418, requires: clear}, {task: T-420, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-421, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T03:09:26Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: integration
planned_reads: [packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/DeveloperDrawer.tsx, packages/astraeus/src/shell/selection/selection.ts, packages/astraeus/src/shell/AstraeusShell.tsx, docs/agents/browser-policy.md, docs/BROWSER_CHECKS.md]
planned_writes: [docs/architecture/viewer-interface.md, .savepoint/Design.md]
---

# Slice pattern written down and Design brought up to date

## Outcome

The way this Objective took one behaviour out of the coordinator is written in `docs/architecture/viewer-interface.md` as a short recipe, so later Objectives move one slice each (the Objective's fourth success condition). Design and the note describe the code as built. The browser tiers ran once, green, for the Full Objective Check to reuse.

## User Check

None visual. A contributor can read the note's new subsection and know, step by step, how to move the next behaviour (story playback or camera fallback) out of `App` and the shell.

## Done When

- `viewer-interface.md` section 9:
  - The module tree shows `shell/selection/` (`selection.ts`: one viewer's selection, read with `useSyncExternalStore`) and `app/DeveloperDrawer.tsx` (on demand).
  - The `AstraeusShell.tsx` line no longer says selection is kept there; camera-preset logic still is.
  - The sentence (~394) "the planned `selection/` folder … were not done in O-079" is corrected: selection is done (O-089); the per-part folder split is still not.
- A new subsection under section 9, "Move one behaviour out of the coordinator (the slice pattern, O-089)", gives numbered steps checked against the code (the I-187 style):
  1. A plain per-viewer module under `src/shell/<behaviour>/`, with the header rule, no React and no module-level state.
  2. `App` creates it per scene and hands it to the shell as one prop.
  3. The shell reads it with `useSyncExternalStore`, and its own paths call the module.
  4. Host calls write the module at once and leave an ask the shell takes after its own rules, in one effect, never a serial prop.
  5. The scene reads it through a getter on `SceneControls`, never a written copy.
  6. The host publish hangs off the module's move listener.
  7. Tests: a node table for the module, a both-paths table pinned on the base before the move, and the existing lifecycle, two-viewer and host-order suites unchanged.
  8. Engine size: measure before and after, and pay for growth by moving on-demand code out of the first-open chunk where possible (the drawer move is the example).

  It names the next candidates: story playback, camera fallback with `pickRequest`, then the mirrored settings. It names the files to read: `selection/selection.ts`, `tests/selectionStore.test.ts`, `tests/selectionOwner.test.ts`.
- `.savepoint/Design.md`, each drift note from drafts 01 to 03 shown as reflected or not architectural (with the reason):
  - `Host calls land in order`: the host selection order now goes through the selection module's ask, taken after the view rule.
  - `Viewer interface`: one line naming the selection module.
  - `Good guest` item 3: where the drawer code lives.
  - `Current Technical State`: new figures only if the size or gate figures it quotes changed.
- Figures recorded in evidence:
  - `App.tsx` and `AstraeusShell.tsx` line counts on the base and now, and the `App` function's span;
  - the shell's prop count, 46 on the base and now;
  - the `useState` count in `App`, base and now;
  - the final first-open raw and gzip totals (`npm run measure:example`) against the limit (1,838,000 B raw / 527,000 B gzip; base 1,836,426 B raw / 525,714 B gzip at C-208) and the headroom left for O-092 (about 900 B planned).
- Browser: one full-tier run, `npm run check:browser -- --tier full`. The tier is not a choice here: the Objective's diff touches `packages/astraeus/src/shell/`, a layout path in `docs/agents/browser-policy.md` ("Browser tiers"), so the Full Objective Check needs the full tier, and this run is made last on the final code so that Check can reuse it (as C-206 and C-207 reused Task runs). Record the command, the run folder `docs/evidence/browser-<stamp>/` (it keeps only `summary.txt` and each step's `results.json`), the head commit, the time, the exit code and each step's result. Run it only after drafts 01 and 03 are merged and no other browser job (or the owner's draft 05 look, if the preview slows) is on the machine.
  - If a step fails because the drawer or selection DOM changed, stop. The coordinator returns the `driver.mjs` repair to draft 01 or draft 03, and this Task reruns only the failed steps (`npm run check:browser -- --step <name>`, repeatable) and records both folders.
  - If draft 05 leads to a code repair after this run, the run no longer matches the head; say so in evidence so the Full Objective Check reruns the tier rather than reusing a stale run.
- Gates: focused for this Task (builder rule 7): `npx prettier --check` on the two docs and the `ls` path check below. The full gate (`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:full`) is the coordinator's wave-3 run, not this builder's; record its result here if the coordinator hands it over, else mark it as the coordinator's.

## Context Files

- `docs/architecture/viewer-interface.md` under `9. Module structure and contributor guide` (whole section)
- `.savepoint/Design.md` under `Host calls land in order`, `Viewer interface`, `Good guest`
- `packages/astraeus/src/shell/selection/selection.ts`, `packages/astraeus/src/app/DeveloperDrawer.tsx` (to check the recipe against the code)
- The drafts 01-03 Drift Notes and Technical Evidence (as created Tasks)
- `docs/agents/browser-policy.md` ("Browser tiers", "Historical evidence preservation" and "Evidence retention" bullets; O-086 is merged)

## Design References

`.savepoint/Design.md` under `Viewer interface`, `Host calls land in order`, `Good guest`; `docs/architecture/viewer-interface.md` under `9. Module structure and contributor guide`.

## Guardrails

TEST-03, STYLE-07, STYLE-08, STYLE-10.

## Implementation Plan

1. Read drafts 01-03's drift notes and the code they produced.
2. Write the section 9 changes and the slice subsection, checking each step against the files named.
3. Reconcile Design.
4. Collect the figures.
5. Run the full browser tier once (no other browser job on the machine) and record the run directory.
6. Prettier check on the two docs; the coordinator runs the full gate.

## Boundaries

Docs and Design only, plus the one browser run. No code change, no README change (public API unchanged), no CHANGELOG entry (nothing a host or visitor sees changed). No new Objective or Issue unless a real gap is found (follow `issue-capture.md`).

## Technical Verification

`npm run check:browser -- --tier full` once (failed steps only rerun with `-- --step <name>` after a repair); `npx prettier --check docs/architecture/viewer-interface.md .savepoint/Design.md`; a check that every path the new subsection names exists (`ls`). No full `npm test`/`npm run lint` by the builder; the full gate is the coordinator's.

## Technical Evidence

Extra reads (beyond Context Files): `packages/astraeus/src/app/App.tsx` and `src/shell/AstraeusShell.tsx` by grep only (selection wiring, `pickRequest`, the 100 ms interval; both in planned_reads); `.savepoint/Design.md` line 134 and `## Current Technical State` (to see whether size/gate figures it quotes changed); `git ls-files` to confirm two paths the recipe names. Base for figures: `9e31cb2a` (O-089 plan commit, before T-418).

| Done When | Evidence |
|---|---|
| §9 tree shows `shell/selection/` and `app/DeveloperDrawer.tsx` (on demand) | `docs/architecture/viewer-interface.md` §9 tree: two new entries |
| `AstraeusShell.tsx` line no longer says selection kept there; camera-preset still is | same tree line: "camera-preset logic still here; the selection is the viewer's store, handed in as one prop" |
| "planned `selection/` folder … not done in O-079" corrected | now: per-part split still not done; `selection/` built in O-089. The `selection` header bullet widened to match the module header (placement, panels, camera, React) |
| New subsection, 8 numbered steps checked against code, next candidates, files to read | `### Move one behaviour out of the coordinator (the slice pattern, O-089)` at the end of §9; each step checked against `selection.ts`, `App.tsx` (useMemo per runtime, `ask`, `onMove`, getter in `initialSceneControls`), `AstraeusShell.tsx` (`useSyncExternalStore` with server snapshot, `choose`, `applyAskedCard(selection.takeAsk(), …)`, `createSelection` re-export); names story playback, camera fallback with `pickRequest`, mirrored settings; reads `selection/selection.ts`, `tests/selectionStore.test.ts`, `tests/selectionOwner.test.ts` |
| Every path the subsection names exists | `ls` of 17 named paths: all present (first run caught `tests/packageBoundaries.test.ts` and `tools/validate/engine-budget.mjs` living under `packages/astraeus-site/`; the note now names those full paths) |
| Design `Host calls land in order` | `selectRequest`/`updateSelectedObject` sentence replaced by the selection module's `ask`, taken last in the view-switch effect after the fallback and view rule |
| Design `Viewer interface` one line | new `**Selection** (O-089)` bullet naming `shell/selection/selection.ts` and pointing to the §9 slice pattern |
| Design `Good guest` item 3 | names `app/DeveloperDrawer.tsx`, one on-demand component loaded through `app/developerPanels.tsx` |
| Design `Current Technical State` | unchanged: it quotes no engine-size or test-count figure that changed (line 134 quotes only the limit, unchanged; browser tier times ~320 s still match this run's 310 s) |
| Figures | below |
| Browser full tier once | below: exit 0, all 12 steps pass |
| Gates | `npx prettier --check docs/architecture/viewer-interface.md .savepoint/Design.md`: clean. Full gate is the coordinator's wave-3 run |

Figures (base `9e31cb2a` -> now `4727f062`, src unchanged since):
- `App.tsx` 1,574 -> 1,174 lines; `App` function span lines 392-1574 (1,183 lines) -> 358-1174 (817 lines).
- `AstraeusShell.tsx` 924 -> 920 lines.
- Shell `Props` fields: 46 -> 44 (the Task text expected "46 on the base and now"; T-420 removed three selection props and added `selection`, so 44 is the as-built figure).
- `useState` calls in `App`: 42 -> 36.
- `npm run measure:example` first-open total: 1,826,428 B raw / 523,400 B gzip (limit 1,838,000 / 527,000; C-208 base 1,836,426 / 525,714). Headroom 11,572 B raw / 3,600 B gzip, so O-092's ~900 B fits. `DeveloperDrawer` on-demand chunk 24,898 B raw.

Browser: `npm run check:browser -- --tier full`, head `4727f062` (working tree differs only in the two docs and this file), 2026-11-22T03:26:27Z-03:31:37Z, exit 0, total 310 s (limit 450 s). Evidence: `docs/evidence/browser-20261122T032627Z/` (summary.txt + per-step results.json). Steps, all exit 0, error-lines 0: smoke 44 s, synthetic-journey 67 s, smoke-public-showers 5 s, planets-phone 12 s, meteor-shower 16 s, views 21 s, look-out 72 s, catalogue 6 s, hello-scene 12 s, hello-react 3 s, hello-planets 4 s, hello-sky 22 s. If T-422 leads to a code repair after this run, the run no longer matches the head and the Full Objective Check must rerun the tier.

Drift notes from T-418..T-420, accounted for:
- T-418 drawer as one on-demand component: reflected (Design Good guest item 3; note §9 tree and slice step 8). `docs/evidence/o043-bundle-baseline.md` line 54 is historical, unchanged.
- T-419 `selection/` not built: reflected (note §9 sentence and tree).
- T-420 host selection order: reflected (Design Host calls land in order). Selection lives in a module: reflected (Design Viewer interface bullet; note §9).
- T-420 `initialObjectIdOf` without a src caller: non-architectural (dead helper, no design rule depends on it); recorded as a removal candidate at the end of the slice subsection; no code deleted (still used by `experiencesContract`, `publicApiSunPaths`, `publicApiOpeningSelection` tests).
- T-420 coordinator `createSelection` re-export from the shell (ARCH-03 count): reflected in slice step 2.
- T-420 server snapshot for `useSyncExternalStore`: reflected in slice step 3.
- T-420 story-panel select reports nothing to `onSelect`: reflected in slice step 6 (unchanged from base).
- T-420 `domSetup.ts` `MountOptions.selection`: test wiring, non-architectural.
- PLAN question 6, 10 Hz playing re-render: noted in the subsection's next-candidates paragraph as the playback slice's job.

Files changed: `docs/architecture/viewer-interface.md`, `.savepoint/Design.md`, this Task file. No code, README or CHANGELOG change.

## Drift Notes

None: this Task reconciles drafts 01-03 (see above).

## Coordinator (gates)

Docs-only Task: Prettier clean on both docs; the full browser tier ran green on head 4727f062 (evidence `docs/evidence/browser-20261122T032627Z/`, 12 steps exit 0). Set done by the orchestrating session (owner: "I mark them as they pass", O-038; G-024 decision 7; owner 2026-11-22 "carry on orchestrating G-024"). If the T-422 owner look forces a code repair, the Full Check reruns the tier.
