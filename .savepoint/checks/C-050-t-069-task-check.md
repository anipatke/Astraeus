---
id: C-050
scope: {kind: task, id: T-069}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t069-builder-20261017
checked_at: '2026-10-17T12:20:00Z'
reviewed:
  base_commit: 83e73cb
  head_commit: 83e73cb
  files:
    - src/app/AstraeusScene.tsx
    - src/app/LayeredRender.tsx (new)
    - src/app/sceneTargets.ts (new)
    - src/app/sceneCamera.ts (new)
    - src/app/sceneBodies.ts (new)
    - src/app/sceneLights.ts (new)
    - src/app/sceneSky.ts (new)
    - src/app/sceneDebug.ts (new)
    - src/app/sceneHooks.ts (new)
    - src/app/experienceDefinition.ts
    - src/app/renderCoordinates.ts
    - src/core/elementsBody.ts
    - src/core/fieldReaders.ts (new)
    - src/core/orbitGroup.ts
    - src/core/listedOrbitGroup.ts
    - src/experiences/showers/showerDefinition.ts
    - src/experiences/showers/showerSettings.ts
    - src/experiences/showers/showerBasics.ts, showerStream.ts, showerStreamText.ts, showerPaths.ts, showerActivity.ts, showerBodies.ts (new)
    - src/shell/metrics.ts
    - tests/showersMeasured.test.ts
    - tests/showersMeasuredGeminids.test.ts (deleted)
    - docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md
  dependencies: ['T-066 (C-047 CLEAR, owner pick recorded)', 'T-067 (C-048 CLEAR)', 'T-068 (C-049 CLEAR)']
issues: []
supersedes: null
---

# C-050: T-069 Task Check (Quick)

## Scope Lock

1. T-069 Done When 1–5 for the owner's ticked candidates C1, C2, C3, C4, C5, C7, C8: each done or returned with a reason, nothing outside them restructured; behaviour preserved, with before/after health figures; C1 split into named single-job parts with scene behaviour proven by pictures and the full scene scripts; no engine contract change; gates, lite and touched full scripts with zero console errors. Guardrails ARCH-01, ARCH-02, ARCH-04, TEST-01, TEST-03, STYLE-01, STYLE-02, STYLE-07, STYLE-10, CODE-01.
2. Uncommitted work on `o017-simplify` at `83e73cb`: 13 tracked files changed (+404/-1184) plus 15 new source files and one deleted test file.
3. Out of scope: C6, C9, C10 (not ticked); `src/app/PointsView.ts` (T-073); Design.md map (T-072).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 only ticked rows | `git status` lists only files named by C1–C5, C7, C8 plus the candidates page and Task file. `src/app/PointsView.ts` unchanged (`git diff --stat` empty). No shell file except `metrics.ts` (C8). | git |
| DW2 behaviour preserved, figures | Builder's per-candidate before/after table (lizard, jscpd) in the Task and `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md` "T-069 results"; raw files `lizard-src-before/after.csv`, `jscpd-*-before/after.json`. `src/` duplicated lines 63 to 13; functions over CCN 20 from 5 to 3. Changed test: C7 merges the two measured-shower suites into one parametrised suite (25 to 27 tests, scenario map in the Task). C2 and C4 are stated as readability changes with no line saving. | `docs/evidence/o017-t069-browser-20261016T232625Z/` |
| DW3 C1 split | `AstraeusScene.tsx` 542 to 298 lines; frame steps moved to `sceneTargets`, `sceneCamera`, `sceneBodies`, `sceneLights`, `sceneSky`, `sceneDebug`, `sceneHooks` (22–152 lines each) and `LayeredRender.tsx`. Pictures: 20 after-pictures within the 0.024% tolerance against T-066 (worst 0.0231%); an isolated pre-C1 capture shows C1 alone at worst 0.0194%. Builder ran 21 scene scripts, all exit 0; the one `error-lines=1` (story-panels) is the line "ok  zero console errors", a counter false positive. Checker re-ran lite (26/26, 0 failed), `browser-earth-moon`, `browser-jupiter-io`, `browser-sun`: all exit 0, no console-error lines. | `o017-t069-after-*`, `o017-t069-preC1-*`, `docs/evidence/c050-20261017T000529Z/` |
| DW4 no contract change | Checker grep of the `src` diff for `interface|type` State, Trajectory, Provenance, TimelineEvent, ScalePolicy: none (only a moved `type Provenance` import). | git diff |
| DW5 gates | Checker: `npx tsc --noEmit` exit 0; `npx vitest run` 48 files, 879 passed; `npm run build` exit 0; public build exit 0; validator `ok: true`, `selfProof: true`, synthetic exclusion ok. | `docs/evidence/c050-20261017T000529Z/` |

## Issues Pass

DW1–DW5 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. Several new `scene*.ts` and `shower*.ts` files open straight with imports, where older files carry a one-line purpose comment (STYLE-08 is about why-comments, so advisory only). Worth a line each in T-072.
2. Lizard still reads `AstraeusScene` and `SceneContents` as one block (CCN 54), overstating the frame callback; the health number for this file stays approximate.
3. Design.md Components map needs the new files; deferred to T-072 by the Task's Drift Notes.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [ ] STYLE-08 **Comments explain why** (advisory: see Observation 1)
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
