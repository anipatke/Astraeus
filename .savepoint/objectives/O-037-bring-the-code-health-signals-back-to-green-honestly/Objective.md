---
id: O-037
title: Bring the code health signals back to green honestly
status: done
depends_on: []
release: G-007
priority: medium
exception: {requirements: [SC4, SC5, SC6, SC8], reason: 'Owner cut the browser sets at the O-037 Check ("Nope nope nope we cut down browser chevks", "Tests and health only, you look (Recommended)") and judged the scene and Io on the preview instead ("both fine"); owner left tools/validate/runner.mjs at lizard 27 for O-038 ("Leave it for the cut-down (Recommended)"); then "yes record it, then close the tidy-up". SC6: C-095 found four gifs left; the owner deleted them after C-095 (0 gifs remain, commit 275d7589), so it rests on that owner action rather than a fresh Check. Recorded by the agent on direct instruction; not a technical CLEAR.', owner: owner-chat-20261022, recorded_at: '2026-10-22T10:55:00Z', check: C-095}
---

# O-037: Bring the code health signals back to green honestly

## Outcome

The three red Code Health signals (complexity, duplication, coverage) measure the code and nothing else, are fresh at every Full Objective Check, and read Watch or better: the per-frame scene work is a pipeline of small named stages, the browser-check scripts share one harness, the evidence folder holds only what a record cites, and a lint gate catches a tangled function at Task hand-off instead of six Objectives later.

## Why

Owner, 2026-10-21: "Savepoint health checks are currently red on coverage, complexity and duplication. Do a detailed read only review of the code, find root causes, and provide recommendations on remediation. This will be folded into the post launch tidy up"; then "why the hell do we have so much evidence documentation"; then "create a new objective under the cleanup goal, break these recommendations down into tasks".

The review (2026-10-21, same session) found three different causes:

- **Duplication 46.2% is scan scope.** The scanners run over the whole repository, and `docs/evidence` holds 291 run folders (4,045 tracked files, 16,067 untracked screenshots, 2.6 GB). Real code duplication across TypeScript, TSX, JavaScript and CSS is 2.2%, mostly the twelve-line preamble repeated in 32 browser-check scripts and the retired `tools/archive`. The figure rose from 9.7% on 10 October to 46% in step with the evidence folder, not the code.
- **Complexity 95 is one callback, exaggerated by the tool.** Lizard cannot bound functions in JSX and reports lines 181 to 419 of `src/app/AstraeusScene.tsx` as one function. The real weight is the `useFrame` callback in `SceneContents`: 80 lines, 14 loops, 10 ifs, 16 null-coalescing operators, about 45 branch points. O-017 split this file (138 to 54); O-020 to O-033 added labels, story and feature markers, body sets, orbit sets, hover and picking back into the same callback (95). Six other functions sit over 20: `parseShowerSettings` (24), `AstraeusShell` (21), `OrbitSetView.sync` (21), `buildPlanetDefinition` (20), `runStep` in the check runner (27) and `parseHyg` (22); `linesOf` (26) is a mis-measure of a three-line generator.
- **Coverage 77.9% is five days old and its universe is undefined.** The test gate never runs with coverage, so every official snapshot since 16 October reused the same stale file while the report printed "Trend: steady". No `coverage.include` is set, so a Vitest upgrade moved the universe from the 195 files tests load to all 1,652 files: a fresh run gives 73.2%, counting 1,327 data files as covered and the Playwright-only `tools/validate/driver.mjs` (1,010 uncovered statements) as untested. Underneath, `src/core` is at 94.8%, `src/assets` 93.7%, `src/experiences` 86%; `src/app` 61.7% and `src/shell` 65.3% are React, three.js and DOM code the browser checks exercise and Vitest cannot see, plus three pure scene modules (`sceneCamera.ts`, `sceneTargets.ts`, `sceneBodies.ts`) at 0 to 10% that node tests can reach.

Evidence: scratch re-runs of `jscpd` and `lizard` with the project's own settings and `npx vitest run --coverage` on 2026-10-21 (HEAD 8016dd04); the snapshot history under `.savepoint/health/snapshots/`.

## Success Conditions

1. The duplication and complexity scanners in `.savepoint/health/config.json` exclude `docs/evidence`, `tests/fixtures`, `data`, `tools/archive`, the import tools' JSON data and the Horizons cache; the next official health check reports duplication at 3% or less on that scope.
2. Coverage is defined in `vite.config.ts` as source under `src` plus the Apollo, import, data and site tools, excluding `tools/validate`, `src/main.tsx` and declaration files (owner, 2026-10-21: "Count app source, not the browser tools"); a named full gate writes a fresh coverage report, and the Full Objective Check of this Objective records a fresh (not stale) coverage instance.
3. No function under `src` or `tools` exceeds cyclomatic complexity 20 as ESLint measures it, and the lint gate in `.savepoint/config.yml` enforces that rule at every Task hand-off (owner, 2026-10-21: "Add a lint gate with a complexity rule").
4. The per-frame scene work runs as named stage functions in a plain module, each with a node test; `src/app/AstraeusScene.tsx` keeps only React wiring; the three pure scene modules named above are tested; the engine browser set and the owner's look on the preview show no change in looks or behaviour.
5. The browser-check scripts open, collect errors and write results through one shared harness; `tools/archive` is gone; the four small repeats in `src` are merged. Both check sets exit 0 with zero console errors.
6. `docs/evidence` holds only the run folders a Check, Task, Issue or Design note cites (owner, 2026-10-21: "Prune to what records cite"); the screenshots are deleted; a run keeps `summary.txt` and `results.json` in the repository and writes logs outside it; the retention rule is in AGENTS.md's project rules.
7. AGENTS.md's Build section names the gates, the full gate, the health scanners and their scope; its Codebase Map is filled; Guardrails `CODE-01` carries a number for new code and a frame-pipeline rule exists; the packaged-skill suggestions (stale coverage reads as unknown, scope observations for the owner, trend only across fresh instances) are recorded as an Issue for Savepoint, not edited into the skills.
8. The health report after this Objective shows complexity and duplication at Watch or better and coverage fresh; typecheck, build, lint and test gates pass.

## Confirmed Decisions (owner, 2026-10-21)

1. **Evidence**: "Prune to what records cite": delete the untracked screenshots and every run folder no record names; keep the cited ones in place so the records' links hold.
2. **Coverage universe**: "Count app source, not the browser tools": `src` and the non-browser tools count, React and DOM files included; `tools/validate` is Playwright's and is left out.
3. **Complexity guard**: "Add a lint gate with a complexity rule": ESLint with a complexity limit of 20 becomes the configured lint gate.

## Planned Technical Decisions (planner, 2026-10-21)

- Scanner scope lives in the health config's `exclusions` and tool arguments; the Design document describes the scope in plain words.
- The fast test gate stays as it is; a separate `npm run test:full` runs Vitest with coverage and the JUnit report, and AGENTS.md's Build section names it as the full gate for Full Objective Checks so the health check reads a fresh report.
- The frame pipeline: a `sceneFrame.ts` module exporting stage functions (sync views, step and pose the camera, place bodies and views, publish readouts, update overlays, build the frame readout) over one frame context object; pointer listeners move to `scenePointer.ts`; the React component owns refs and effects only. New per-frame work is a new stage with a test, never inline.
- The browser harness: one `tools/validate/harness.mjs` that launches the browser with the project's flags, collects page and console errors, runs a script's checks at named viewports, writes `results.json` and sets the exit code; scripts keep their assertions and still touch the interface only through `driver.mjs`.
- The runner writes logs to a scratch folder outside the repository and prints its path; `summary.txt` and each step's `results.json` stay under `docs/evidence/<set>-<stamp>/`.
- ESLint runs with the TypeScript parser over `src`, `tests` and `tools`, rule `complexity` at 20 as an error, no style rules (STYLE rules stay advisory in Guardrails).

## Architectural Considerations

Behaviour-preserving throughout: every split is proven by the existing tests named per TEST-03 and, for the scene, by the engine browser set at the Objective Check. ARCH-02 and ARCH-04 hold: stage modules under `src/app` may import three.js types but no experience names (ARCH-01). The health scanners and gates are project tooling; the packaged skills under `agent-skills/` are not edited (suggestions become an Issue).

## Boundaries

**In scope:**
- `.savepoint/health/config.json` scope, `vite.config.ts` coverage, `package.json` scripts and the lint gate in `.savepoint/config.yml`
- `src/app/AstraeusScene.tsx` and new `src/app/sceneFrame.ts`, `src/app/scenePointer.ts`; the four named engine functions; tests for the pure scene modules
- `tools/validate/` harness, runner retention, `tools/archive` removal; `docs/evidence` pruning
- AGENTS.md Build, Codebase Map and project rules; Guardrails `CODE-01` and a frame-pipeline rule; Design reconciliation; one Issue for Savepoint

**Out of scope:**
- Any change to what the demos show, their looks or accuracy (G-007 boundary)
- Raising coverage of React and DOM wiring by adding a DOM test environment
- Packaging or the npm split (G-010); new demos (G-006)
- Editing the packaged skills under `agent-skills/`
