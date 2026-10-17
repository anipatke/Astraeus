---
id: T-083
title: Drive every browser check through one shared interface driver
objective: O-020
status: done
depends_on: [{task: T-079, requires: clear}, {task: T-080, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Drive every browser check through one shared interface driver

## Outcome

Every browser check script talks to the app through one shared driver module (set the scale, play, pause, step to the next or previous event, pick a body, open info, open a story panel, set the speed, seek, open and close a drawer, read the time). Only the driver knows what the buttons look like, so an interface change edits one file, not every script.

## User Check

Change a button's look in one place and only the driver needs updating; the full run still passes.

## Done When

1. Owner, 2026-10-17, on T-079 touching 17 browser scripts for one top-bar change: "if this is meant to be re-usable set of assets...why it it updating so many files, feels like a terrible design", then "yes add that step PLEASE". The cause: each script finds and clicks interface elements itself, by visible text, with the same code copied across scripts.
2. A driver module under `tools/validate/` (building on T-079's `shellScale.mjs` and `harness/`), one function per user action and per readout listed in the Outcome, finding elements by accessible name or a stable `data-testid` only, never by visible text or layout.
3. Every script in `tools/validate/` and `tools/validate/on-request/` uses the driver for every interface interaction; a test or lint step fails if a script outside the driver calls `getByRole`, `getByText`, `locator(...)` on shell controls, or `page.click` on them (scene canvas and data-attribute readouts excepted, stated in the rule).
4. No scenario lost: each script's pass/fail scenarios are unchanged, the trimmed full run passes, and a probe proves the point: renaming one control's visible label touches only the driver and the full run still passes.
5. AGENTS.md project rule "Browser regression maintenance" gains one line: browser scripts interact with the interface only through the shared driver.
6. Gates and the full run on the final tree.

## Context Files

`tools/validate/` (all scripts), `tools/validate/shellScale.mjs`, `tools/validate/harness/`, `tools/validate/run-full.sh`, `docs/BROWSER_CHECKS.md`, `AGENTS.md` (project rules section only).

## Design References

Design.md validation tooling; `docs/BROWSER_CHECKS.md`.

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-07 (one source of truth).

## Implementation Plan

1. Inventory every interface interaction across the scripts; design the driver's functions.
2. Move scripts onto it, one area at a time, running each script after its move.
3. The guard against direct interaction; the rename probe; the full run.

## Boundaries

Test tooling only; no app or engine change except adding a `data-testid` where an accessible name is ambiguous.

## Technical Verification

Configured gates, the guard, the rename probe, the full run. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (executor handoff, 2026-10-17)

**Built.** `tools/validate/driver.mjs` is the one module that knows the interface (about 190 exports: one per user action and readout; areas in `docs/BROWSER_CHECKS.md`, "The interface driver"). It finds elements by accessible name or role, by a stable `data-*` attribute (`data-camera-preset`, `data-related-object`, `data-scale-*`) or `data-testid`; the few controls with none of those use the `HOOK` table at the top of the file. No app change (no `data-testid` was needed). `tools/validate/shellScale.mjs` is folded in and removed. All 23 scripts that touch the interface moved (18 in `tools/validate/` including `browser-scale-menu` and the two picture capture scripts, and the 5 on-request scripts); `load-budget`, `public-build-assets`, `contact-sheet`, `diff-screenshots` never touch the interface.

**Done When 3, the guard.** `tools/validate/driver-guard.mjs` (+ `.d.mts`), run by `tests/browserDriverGuard.test.ts` (4 tests: no violations across both folders, coverage list, 10 bad lines caught, 7 allowed lines pass). Exceptions stated in the rule: the scene canvas (`canvas`, `getByTestId`), `[data-...]` readouts, `new Array(n).fill(0)`; `mouse.move/down/up/wheel` on the canvas is not flagged. `OPT_OUT` is empty. Rule line added to AGENTS.md "Astraeus Project Rules" and `docs/BROWSER_CHECKS.md`.

**Done When 4, scenarios.** None dropped. Three equivalent substitutions, mapped in `docs/BROWSER_CHECKS.md`: (1) the unreachable "compact camera picker" branch (no `.object-camera-picker` exists in `src` since T-079) replaced by `chooseCamera(page, presetId)`, which clicks the same button the scripts always took; callers pass preset ids; spike02/spike03 evidence JSON echoes ids rather than labels. (2) `browser-sky`'s unreachable "Camera mode" select branch removed; its button requests became `pressFirstControlNow(kind)`, so Apollo's "Earth–Moon overview" is now also pressed (probeChecks 5). `on-request/browser-marker-existing` likewise. (3) `browser-synthetic` clicks the window band using the box measured at click time.

**Rename probe.** App label "Developer mode" renamed to "Diagnostics cog" in `src/shell/TopBar.tsx` (aria-label and title). Before the driver edit: `browser-shell.mjs` failed (TimeoutError on the developer toggle). After editing one line of `tools/validate/driver.mjs` (the `developerButton` name) and no script: `browser-shell` (13 s), `browser-anchor-labels` (11 s), `browser-view-link` (30 s), `browser-synthetic-ring` (33 s) passed; the four scripts and `grep` show no script names the label. Both files then restored from copies (`git diff src` empty).

**Script runs on the migrated tree** (dev server port 5495, scratch evidence, one at a time, quiet machine): view-link, scale-menu, earth-moon, jupiter-io, shell, anchor-labels, lite (26/26), spike02, spike03, sky, synthetic, synthetic-ring, synthetic-listed, story-panels, showers perseids and geminids (ASTRAEUS_LIGHT=1), and the five on-request scripts: all exit 0, zero console errors. Two defects found by running and fixed in this Task: an undefined `layer` reference in `browser-anchor-labels`, and three `apolloPhone.ui...` call sites in `browser-story-panels` produced by my bulk edit. A `tsc --checkJs` pass for undefined names (TS2304/TS2552) over both folders is clean.

**Gates.** `npx tsc --noEmit` exit 0; `npx vitest run` 58 files, 943 passed, 1 skipped; `npm run build` succeeded (existing chunk-size warning).

**Full run** (`tools/validate/run-full.sh docs/evidence/o020-t083-full-20261017T071132Z`, 2026-10-17, node v24.16.0, headless Chromium via the donor playwright-core): 20 steps, every exit=0, error-lines=0, total 525 s. Summary: `docs/evidence/o020-t083-full-20261017T071132Z/summary.txt`. Pictures differ from the O-017 baseline by design (compared, not asserted).

**Extra reads.** None beyond Context Files, plus `src/shell/{ObjectControls,TimelineBar,InfoPanel,TopBar}.tsx`, `src/app/App.tsx` and the experience definitions to learn the accessible names and `data-camera-preset` ids (reason: the driver must name them correctly), and `tests/publicBuild.test.ts` header for the mjs import pattern.

**Note for the I-035 merge.** `tools/validate/browser-orbit-look.mjs` (other worktree) will fail the guard test when merged. Move it onto the driver as the docs say: orbit-look toggles and sliders become `TOGGLES`/`SLIDERS` entries and `pressToggle`/`setSlider` calls; nothing else.

**Notes for the owner.** `docs/evidence/o020-t083-full-...` (33 MB) is new untracked evidence. Nothing is staged or committed.

## Owner Completion — 2026-10-18

Marked done on the owner's standing instruction for O-020 ("Yes, for all clear interface steps"), after Quick Task Check C-062 CLEAR.
