---
id: T-419
title: One selection owner per viewer
objective: O-089
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-419, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T03:09:26Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: selection-store
planned_reads: [packages/astraeus/src/app/App.tsx, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/api/viewerSelection.ts, packages/astraeus/tests/interfaceHeaders.test.ts]
planned_writes: [packages/astraeus/src/shell/selection/selection.ts, packages/astraeus/tests/selectionStore.test.ts, packages/astraeus/tests/interfaceHeaders.test.ts]
---

# One selection owner per viewer

## Outcome

A plain module (no React, no DOM) holds one viewer's selected object and the rules that today are split between `App` and the shell: who may change it, the host-call order rule (a host `setSelected` waits for the shell and the shell's own older choice must not undo it), the "host cleared it" flag that turns off the fallback, and the move report. React reads it through `useSyncExternalStore` (draft 03 wires it in). This is the "selection" module the viewer-interface note planned in section 9.

## User Check

None visual. Nothing changes on screen until draft 03 wires it in.

## Done When

- New `packages/astraeus/src/shell/selection/selection.ts` with a two-line header comment: its one job, and that it must not touch placement, panels, the camera or React (note section 9 ~402: "`selection`: never touches placement"). It exports `createSelection(start: string)`, returning one store per call (no module-level state, API-03), and the type `SelectionOrigin = "visitor" | "move"`, now defined here (today `AstraeusShell.tsx` ~211). Draft 03 makes `AstraeusShell.tsx` re-export it so the one definition is this one. The contract (names may differ; the behaviour may not):
  - `snapshot()`: a frozen `{ id, ask? }` that stays the same object between writes, as `useSyncExternalStore` needs. `subscribe(listener)` returns the stop function.
  - `id()`: the selected id (`""` means none).
  - `choose(id, origin)`: the shell's own paths (menu, pick, preset, event, fallback, view rule). It is ignored while a host ask waits (today `App.tsx` ~734). Otherwise, when the id changes, it updates, notifies subscribers and calls every `onMove(listener)` listener with `(id, origin)`. A non-empty id clears the host-cleared flag (today `AstraeusShell.tsx` ~548).
  - `ask(id, quiet)`: a host `setSelected`, or a story panel's `select` with `quiet: true`. The id takes effect at once (a read straight after shows it, as `App.tsx` ~710 does now). It records the ask and sets host-cleared to `id === ""`. It calls no `onMove` listener (the link reports a host change itself, `viewerSelection.ts` `setSelected`), and it notifies subscribers even when the id is unchanged, so the shell still opens the card.
  - `takeAsk()`: returns the waiting ask (`{ quiet }`) once and clears it. The shell calls it after its own view rules in the same effect.
  - `hostCleared()`: true from a host clear until something is selected again.
- New `packages/astraeus/tests/selectionStore.test.ts`, node only, one table across every input kind (`choose` visitor and move, `ask` with an id, with `""` and with `quiet`, `takeAsk`). It checks:
  - which writes notify subscribers and which call `onMove`;
  - that `snapshot()` keeps its identity between writes and changes on each write that matters;
  - the order rule (a `choose` between `ask` and `takeAsk` changes nothing; after `takeAsk` it applies);
  - the host-cleared flag through clear, choose `""`, then choose an id;
  - that two stores from two `createSelection` calls never see each other's writes;
  - that a stopped listener hears nothing.
- `interfaceHeaders.test.ts` scans `selection` with the other rule folders: `"selection"` is added to the folder list (~14). That is the only change; the new header must pass it.
- Engine size: nothing imports the module yet, so the first-open total is unchanged (draft 03 measures the wired cost).
- Handoff gates are focused (builder rule 7): `npm run typecheck`, ESLint and `prettier --check` on the changed files, and the Technical Verification test list. No full `npm test` or `npm run lint`.

## Context Files

- `packages/astraeus/src/app/App.tsx` (selection today: ~696-740 `hostAttached`, `hostSelect`, `selectRequest`, `selectWith`, `hostSetSelected`, `hostSelectApplied`, `updateSelectedObject`; ~691 `read().selected` in `stateNow`)
- `packages/astraeus/src/shell/AstraeusShell.tsx` (selection today: ~465 state, ~538-597 the report effect, the `hostCleared` ref, the view-switch fallback and the host request effect, ~620-715 the choose paths)
- `packages/astraeus/src/api/viewerSelection.ts` (`setSelected`, `publish`: read only)
- `packages/astraeus/tests/interfaceHeaders.test.ts` (folder list ~14)

## Design References

`docs/architecture/viewer-interface.md` under `9. Module structure and contributor guide`; `.savepoint/Design.md` under `Host calls land in order`.

## Guardrails

API-03, ARCH-02, TEST-01, STYLE-02, STYLE-04, STYLE-05, STYLE-07.

## Implementation Plan

1. Write the table test from the contract above.
2. Write the module: a closure over `{ id, ask, cleared }` plus two listener sets. The snapshot object is replaced only on a write that changes `id` or `ask`.
3. Add `"selection"` to the header test's folders.
4. Focused test, then gates.

## Boundaries

No React import and no change to `App.tsx` or `AstraeusShell.tsx` (draft 03 wires it). No camera, panel or card logic in the module. No public export.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/selectionStore.test.ts packages/astraeus/tests/interfaceHeaders.test.ts`. Handoff (builder rule 7): `npm run typecheck`; `node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js <changed files>`; `npx prettier --check <changed files>`; the focused list above. No full `npm test`/`npm run lint`.

## Technical Evidence

Files changed: `packages/astraeus/src/shell/selection/selection.ts` (new), `packages/astraeus/tests/selectionStore.test.ts` (new), `packages/astraeus/tests/interfaceHeaders.test.ts` (added `"selection"` to the folder list). No extra reads.

| Done When | Evidence |
|---|---|
| Module with two-line header, `createSelection(start)`, `SelectionOrigin`, no module state, snapshot/subscribe/id/choose/ask/takeAsk/hostCleared/onMove | `selection.ts`; every behaviour exercised by `selectionStore.test.ts` |
| Table test across choose visitor/move, ask id/""/quiet, takeAsk: notify vs onMove, snapshot identity, order rule, host-cleared flag | 12-row `it.each` table in `selectionStore.test.ts` (passes) |
| Two stores independent; stopped listener silent; takeAsk once; snapshot identity stable | three separate tests in `selectionStore.test.ts` (pass) |
| `"selection"` in header test folders, new header passes | `interfaceHeaders.test.ts` passes, incl. `selection/selection.ts` row |
| Engine size unchanged | nothing imports the module (no wiring); not measured per brief |
| Focused gates | see below |

Gates: `npm run typecheck` clean; ESLint (TS6 wrapper) clean and `prettier --check` clean on the 3 files; `npx vitest run packages/astraeus/tests/selectionStore.test.ts packages/astraeus/tests/interfaceHeaders.test.ts`: 2 files, 52 tests passed.

Limitations: `takeAsk` clears the ask and replaces the snapshot but does not notify subscribers (the shell calls it inside its own effect; draft 03 should not rely on a re-render from it). `choose` of the current id is a no-op (no notify, no onMove).

## Drift Notes

Expected: section 9 of the note says the `selection/` folder was not built. Reconciled in draft 04.

## Coordinator (gates)

Set done by the orchestrating session after the combined wave gates passed with T-418 and T-419 together (owner: "I mark them as they pass", O-038; G-024 decision 7 "Orchestrate each objective to completion"; owner 2026-11-22 "carry on orchestrating G-024"): typecheck clean; `npm run lint` (ESLint + Prettier) clean; `npm test` 327 files, 5393 passed, 2 skipped. T-418 measured first-open engine 1,826,703 B raw / 523,401 B gzip (was 1,836,426 / 525,714; cap 1,838,000 raw).
