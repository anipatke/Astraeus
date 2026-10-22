---
id: T-147
title: Retire the old browser scripts and update the rules
objective: O-038
status: done
depends_on: [{task: T-143, requires: clear}, {task: T-144, requires: clear}, {task: T-146, requires: clear}, {task: T-145, requires: clear}]
owner_validation: {required: true}
check_waiver:
  task: T-147
  reason: 'owner asked for one full fresh check at the end of O-038 instead. Owner quote: "orchestrate the delivery of O-38. ask clrifying questions front, one full (new) chek at the end"'
  actor: {role: owner, session: o038-orchestration-20261023}
  recorded_at: '2026-10-23T00:00:00Z'
planned_by: {role: planner, session: o038-planning-20261023}
lane: close
---

# Retire the old browser scripts and update the rules

## Outcome

Only the smoke check and the two journeys remain as browser scripts. Every other browser script, the on-request folder and the engine and demo set commands are deleted (git history keeps them). `docs/BROWSER_CHECKS.md` maps every scenario of every retired script to its new home, and the project rules say: run `npm run check:browser` once at a Full Objective Check; no per-Task browser runs; no demo sets.

## User Check

Read the new short `docs/BROWSER_CHECKS.md` and the browser lines in AGENTS.md's Astraeus Project Rules; say whether they read right.

## Done When

- Retired scripts, `run-engine.mjs`, `run-demo.mjs`, `tools/validate/on-request/` and the scale-menu harness page (if nothing else uses it) are deleted; `check:engine` and `check:demo` are removed from `package.json`; nothing else imports them (search recorded).
- `docs/BROWSER_CHECKS.md` holds: how to run the one command, the smoke and journey contents, the driver and readouts sections kept, and a retired-scripts table mapping each scenario to a test file and case, "smoke", a journey, or "owner's look on the preview", with nothing unmapped (built from the three earlier steps' evidence).
- AGENTS.md (outside the Savepoint block): the Build section's browser line and the Browser checks rules name only `npm run check:browser`, once per Full Objective Check, no per-Task runs, no demo sets. `agent-skills/references/check-method.md` is checked for set names; if it names none, record "no change needed"; if it does, record an Issue suggestion rather than editing the packaged skill.
- Design.md reconciles the drift notes from the screen-parts and browser-command steps (pretend page; one browser command), and the browser lines in the `tools/validate/` row and Current Technical State.
- The fast suite time and one fresh `npm run check:browser` time are recorded, the latter only if scripts changed since the three timed runs; otherwise those runs are reused (one run per change rule). Configured gates pass.

## Context Files

`docs/BROWSER_CHECKS.md`, `AGENTS.md`, `CLAUDE.md`, `package.json`, `tools/validate/runner.mjs`, `tools/validate/run-browser.mjs`, `tools/validate/driver-guard.mjs`, `tests/browserDriverGuard.test.ts`, `agent-skills/references/check-method.md`, `.savepoint/Design.md`, plus the Technical Evidence of this Objective's four earlier steps.

## Design References

Design: the `tools/validate/` row; Current Technical State, browser validation paragraph.

## Guardrails

TEST-01, TEST-03; AGENTS.md Astraeus Project Rules on browser regression maintenance and historical evidence preservation (cited run folders stay).

## Implementation Plan

1. Gather the four earlier scenario maps; find any scenario none of them covers and stop with REPLAN REQUIRED if one cannot be mapped.
2. Delete the retired files and set commands; fix imports and the driver guard's file list.
3. Rewrite `docs/BROWSER_CHECKS.md` with the mapping table.
4. Update the AGENTS.md project rules and Build lines; check `check-method.md`.
5. Reconcile Design.md.
6. Run gates; ask the owner to read the new rules.

## Boundaries

No change to what visitors see. Cited evidence folders under `docs/evidence/` stay. No editing of packaged skills. No screenshots.

## Technical Verification

Configured gates at hand-off; browser run reuse per the one-run-per-change rule. The Full Objective Check runs `npm run check:browser` once. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built on the main checkout, branch `o038-browser-checks`. Task Check waived (see `check_waiver`); the Full Objective Check covers this. **Owner read still owed:** the owner reads `docs/BROWSER_CHECKS.md` and the AGENTS.md browser lines after the Full Objective Check ("Check first, you read after"); this Task is left at `audit`, not done.

**Per criterion.**
1. Deleted (`git rm`, 37 files): 25 `browser-*.mjs` scripts, `browser-lite.mjs`, `run-engine.mjs`, `run-demo.mjs`, `on-request/` (7 files), `harness/scale-menu.html` and `.tsx`. `check:engine` and `check:demo` removed from `package.json`. Kept: `browser-smoke`, `journey-planets-phone`, `journey-meteor-shower`, `run-browser`, `runner`, `harness`, `driver` (+ `.d.mts`), `driver-guard`, `playwright`, `load-budget`, `public-build-assets`, `public-addresses`. `browser-lite` is used by nothing since smoke replaced it, so it went too. The driver's `scaleMenu` (only the deleted menu script used it) was removed; `driver-guard.mjs` no longer reads `on-request/`; `tests/browserDriverGuard.test.ts` now expects `browser-smoke.mjs` and `journey-planets-phone.mjs`. Cited folders under `docs/evidence/` untouched.
   Search recorded (grep over the tree minus `node_modules`, `.git`, `dist`, `coverage`, `docs/evidence`, `tools/archive`): every live hit for a deleted name was in the deleted scripts themselves, in `docs/BROWSER_CHECKS.md` (rewritten), `README.md` (check commands, edited), `package.json` (edited), `tests/browserDriverGuard.test.ts` (edited), `tools/validate/driver.mjs` and `driver-guard.mjs` (edited), `AGENTS.md` (edited), `.savepoint/Design.md` (edited), or prose in historical records (`.savepoint/objectives`, `checks`, `issues`, `health/snapshots`, `docs/ASTRAEUS_SPIKE_0*.md`, `docs/O017_RESULTS.md`, `docs/ASTRONOMY_VALIDATION.md`, `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`: history, left as written). Comment-only mentions in test names (`tests/dom*.test.ts`, `demo*.test.ts`, `orbitLook`, `sceneFrame`, `sceneBodies`, `sceneTransforms`, `planetSystems`, `publicBuild`) name the old script they replaced and import nothing. `scale-menu` in `ScaleControl.tsx` and the stylesheets is the CSS class. No import of a deleted file remains (lint, typecheck, build and tests pass).
2. `docs/BROWSER_CHECKS.md` rewritten: how to run, what the smoke and journeys hold, the fast-test note, a retired-scripts table (every script mapped to fast test files and cases, S, J or O; line-by-line maps stay in T-143, T-144 and T-146 evidence), the named cases for the rows T-146 left file-level (viewUp, startCamera, publicBuild, moonOrbits, core, clickOpensInfo; T-144: frameStats, phoneLayout, infoProvenance), harness (fixed for the remaining scripts), driver and readouts sections kept. Unmapped scenarios: 0. Retired measuring tool `probe-phone-frames` asserted nothing: mapped to "none; owner's look".
3. AGENTS.md outside the Savepoint block (the Build browser line is inside the file's marker lines but is the project-owned Build section; edited as asked): Build line now names only `npm run check:browser`, once per Full Objective Check; the Browser checks rules say one command, once per Full Objective Check, never twice for one change (owner quote kept), no per-Task runs unless the Task changes the browser scripts or runner, no demo sets; the evidence-retention path says `browser-<stamp>`. The Codebase Map row for `src/synthetic/` still says "feed the engine browser set"; it sits in the managed block, so I left it for the owner (stale wording, harmless). `agent-skills/references/check-method.md` checked for `check:engine`, `check:demo`, "engine set", "demo set", `browser-` script names: none (its one browser mention, line 168, is generic: "when scoped code relies on ... browser runner"). **No change needed; no Issue.**
4. Design.md: the `tools/validate/` row rewritten to the one command; Current browser validation line, the precision paragraph and the synthetic row updated; new O-038 paragraph accounts for each deferred note (pretend page; `shareViewLink` move; `vitest.setup.ts` path fix; scene sums as unit cases; demo rules against real data; one browser command) and names the M7 case.
5. Times: fast suite 29.9 s (vitest Duration; 110 files, 1500 passed, 1 skipped; was 1499 plus the new M7 case). One fresh `npm run check:browser` ran because the kept driver and the guard changed after T-145's three runs: 44 s, `docs/evidence/browser-20261022T203701Z` (smoke 27 s, planets-phone 8 s, meteor-shower 5 s, public checks 1 s, 0 error lines). Gates: `npm run lint` pass; `npm run typecheck` pass; `flock /tmp/astraeus-build.lock npm run build` pass (chunk-size warning only); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` pass. No `test:full`, no health check, no screenshot. No server of mine left running (the owner's preview on 5490 was already up and is untouched).

**M7 (T-146 row).** Proven: new case in `tests/domMoonPanel.test.ts`, "the moons sheet and the information panel (browser-moon-panel M7) never show together on a wide screen: opening one closes the other". It mounts the real `AstraeusShell` on Jupiter's experience through `tests/domSetup.ts`, opens the moons sheet, picks Io (information opens, sheet closes), opens the sheet again (information closes). No `src/` change. The overlap itself remains the owner's look.

**Files read beyond the Context Files (for the M7 case, rows and search).** `src/shell/AstraeusShell.tsx` (the rule), `tests/domSetup.ts`, `tests/domMoonPanel.test.ts`, `tests/viewUp|startCamera|publicBuild|moonOrbits|core|clickOpensInfo|frameStats|phoneLayout|infoProvenance.test.ts` (case names only), `README.md`, `tools/validate/driver.mjs`.

**Files changed.** `tests/domMoonPanel.test.ts`, `tests/browserDriverGuard.test.ts`, `tools/validate/driver.mjs`, `tools/validate/driver-guard.mjs`, `package.json`, `README.md`, `AGENTS.md`, `docs/BROWSER_CHECKS.md`, `.savepoint/Design.md`, this Task, 37 deleted scripts, the new run folder.

**Limitations.** The mapping table groups scenarios by script; the line-level maps live in the earlier Tasks' evidence. Several driver functions are now unused by any kept script (the driver is kept whole as the Done When asks). Owner read pending.

Needed Issues or Tasks: none.

## Drift Notes

Reconciles the screen-parts and browser-command drift notes into Design.md.
