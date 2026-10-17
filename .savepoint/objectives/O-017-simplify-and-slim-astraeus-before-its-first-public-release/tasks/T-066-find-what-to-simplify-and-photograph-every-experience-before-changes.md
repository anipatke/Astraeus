---
id: T-066
title: Find what to simplify and photograph every experience before changes
objective: O-017
status: done
depends_on: []
owner_validation: {required: true, accepted_check: C-047, scope: [C1, C2, C3, C4, C5, C7, C8], accepted_by: {role: owner, session: owner-chat-20261017}}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Find what to simplify and photograph every experience before changes

## Outcome

A ranked list of simplification candidates, with evidence and an effort estimate for each, that the owner picks from; the "before" numbers for O-017 Success Condition 8; and a committed set of "before" pictures of every real experience that later Tasks compare against.

## User Check

Read the ranked list (a short page in `docs/`): for each candidate you see what it is, why it is a candidate, how much code it touches and what it would save. Tick the ones you want done in the "simplify the code you picked" Task.

## Done When

1. Ranked list in `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`, built from: the official code-health snapshot `sha256:f56641d2…` (complexity: `LayeredRender` CCN 138 in `src/app/AstraeusScene.tsx`, `validatePathSpec` 45, the other functions over 20; duplication with `docs/evidence/` and generated data excluded so the figure reflects source code), unused exports and unused files (a one-off scan, tool named in the evidence), dependencies no longer imported, and settled options still in code. Each row: file and function, the signal, the proposed simplification, lines touched, risk, and whether it belongs to another O-017 Task (CAMS/Yale, switches, load size, checks) so nothing is planned twice.
2. Before numbers recorded in the same page: `src/` lines and files per folder, `tests/` and `tools/` lines, number of address switches the app reads, first-load size per page from the public build, full test time and full browser run time (from `docs/evidence/objective-check-20261016T190443Z/summary.txt`).
3. "Before" pictures: every real experience (Apollo 11, Earth–Moon, Jupiter–Io, Perseids, Geminids) and the site pages at desktop 1440×900 and phone 390×844, from the public build, at fixed view links and times so the "after" run can reproduce them exactly. Written to a fresh `docs/evidence/o017-before-<UTC>/` with the exact command; the capture tool is reusable by the comparison Task (extend `tools/validate/capture-site-pictures.mjs` or add a small script beside it).
4. Health config: propose (not apply) adding `docs/evidence/**` and `data/**/generated/**` to the duplication exclusions in `.savepoint/health/config.json`; the owner applies it (the file is the owner's).

## Context Files

`docs/evidence/objective-check-20261016T190443Z/summary.txt`, `.savepoint/health/snapshots/f56641d260354efa44847d7a9201066bd9f6aed3678747da84cb9cf1a51cb8dd.json`, `.savepoint/health/config.json`, `src/app/AstraeusScene.tsx`, `src/app/experienceDefinition.ts`, `src/main.tsx`, `package.json`, `tools/validate/capture-site-pictures.mjs`, `vite.config.ts`.

## Design References

Design.md Components/Codebase Map; "Public site and launch".

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-02, STYLE-07, CODE-01.

## Implementation Plan

1. Measure the before numbers.
2. Build the candidate list from the snapshot and scans; mark overlaps with the other O-017 Tasks.
3. Capture the before pictures with fixed views and times.
4. Write the page and the evidence; no production code changes.

## Boundaries

Analysis and pictures only: no change to `src/`, tests, data or the health config.

## Technical Verification

Every number traceable to a command recorded in the evidence. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session o017-t066 (Sonnet 5.5), 2026-10-16/17 UTC (clock 20:2x to 20:55Z). Stage path: build (measure, scan, write tool) -> test (gates, reproducibility run) -> audit (ready for a Check; not a pass).

Files created: `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`; `tools/validate/capture-experience-pictures.mjs`; `docs/evidence/o017-before-20261016T205125Z/` (20 pictures, `manifest.json`, `first-load.json`, `scans/`). Files changed: this Task file only. No change to `src/`, tests, data, `.savepoint/health/config.json` or the router.

Extra reads (beyond Context Files), with reasons:
- `agent-skills/savepoint-task/SKILL.md`, `AGENTS.md`, router, Objective: not extra reads.
- `tools/validate/diff-screenshots.mjs` (head): to reuse it for the reproducibility comparison.
- `src/app/viewLink.ts`, `src/app/App.tsx`, `src/app/bodyDraw.ts`, `src/app/SkyView.ts`, `src/app/lighting.ts` (excerpts): to enumerate the address switches the app reads.
- `src/experiences/earth-moon/earthMoonExplorer.ts`, `src/experiences/jupiter-io/jupiterIo.ts`, `data/showers/{perseids,geminids}.json` (heads): to pick fixed views and times.
- `src/assets/sky.ts`, `src/experiences/showers/*.ts` (grep lines): CAMS/Yale touch points for the overlap column.
- `docs/evidence/objective-check-20261016T190443Z/public-build-assets.json` (head): to see what the asset check lists.
- Whole-tree reads were counts and greps only (`wc`, `grep`, `lizard`, `jscpd`, the scan script), no file was opened for editing.

Per-criterion outcomes:
1. Ranked list: PASS. `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md` section 1 (10 ranked rows C1-C10, each with file and function, signal, proposed simplification, lines touched and saving, risk, owning Task) plus a table of rows owned by T-067/T-068/T-070/T-071 (X1-X5), dependencies (none unused), settled options. Built from snapshot `sha256:f56641d2...` figures (complexity 138 / 45 / others over 20; duplication 40.2%) and fresh scans. Note recorded in the page: lizard fuses `LayeredRender` with the rest of `AstraeusScene.tsx` (lines 169-574), so the 138 is `SceneContents`, not the 30-line `LayeredRender`. Duplication measured on source: `jscpd src` 0.43%, `tests` without fixtures 1.4%, `tools` 8.0% (commands in the page and `scans/`). Unused exports/files: one-off node scan `scans/scan-unused.mjs` (no `ts-prune`/`knip` installed; nothing installed): 5 unused exports, 12 test/tool-only, 266 exports never imported by another `src/` file, 0 unreachable `src/` files. Limit: the scan matches names by word, so it can over-count use, never under-count; the 5 unused are certain.
2. Before numbers: PASS. Same page section 3: `src/` 14,552 lines in 122 files with per-folder table; `tests/` 13,196 lines (76 files); `tools/` 10,461 lines (56 files); 21 address switches (listed); first-load size per page from the public build (index 630,024 B; assets 551,506 B; app Apollo 4,046,212 B; earth-moon 3,678,856 B; jupiter-io 3,809,334 B; perseids 10,922,682 B; geminids 13,692,592 B; gzip figures too); full test time 30 s and full browser run 37 min 51 s over 23 scripts, both from `docs/evidence/objective-check-20261016T190443Z/summary.txt`. Limit: first-load is "bytes fetched to 4 s after the scene settles", measured with the preview server (no compression); index/assets pictures load lazily so their figure is the page as captured.
3. Before pictures: PASS. `docs/evidence/o017-before-20261016T205125Z/`: 20 PNGs (Apollo 11 overview and Moon close-up, Earth-Moon wide and close, Jupiter-Io wide and close, Perseids, Geminids, `index.html`, `assets.html`; each at 1440x900 and 390x844) from a fresh public build (`ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir <scratch>`, served with `vite preview --outDir <scratch> --port 5460 --strictPort`; ports 5301/5302/5303/5310 untouched). Command (run 20:51:25-20:53:07Z, exit 0, console and page errors 0, Chromium 147.0.7727.15, Node v24.16.0): `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js node tools/validate/capture-experience-pictures.mjs --out docs/evidence/o017-before-20261016T205125Z --port 5460`. Fixed `&view=` and `&t=` per picture are in `VIEWS` (one list, top of the tool) and in `manifest.json`; the tool takes `--out`, `--port`, `--url`, `--only`, refuses a non-fresh `--out`, refuses a port that already answers, stops its server (SIGKILL; an explicit `process.exit` was needed because the child server keeps the process alive) and deletes the scratch build; afterwards port 5460 is free and no `/tmp/astraeus-public-*` is left. Reproducibility: a second full run (trial, scratch) differed by at most 0.024% of pixels per picture, max level difference 52 at single label/ring-edge pixels (`scans/repro-diff-vs-trial.json`, via `tools/validate/diff-screenshots.mjs`): T-072 must compare with a tolerance. Story panels cannot auto-open (needs playback); panels and the info panel are closed; the Developer button is hidden. Not photographed: made-up experiences (T-068 removes them from the public build). Limit: headless software GL, desktop and phone sizes only, one fixed view per picture; not the owner's visual judgement.
4. Health config proposal: PASS. Page section 2 gives the exact `--ignore` and `exclusions` additions (`docs/evidence/**`, `data/**/generated/**`); not applied. Extra note: `tests/fixtures/**` (Horizons text) would also remove 925 duplicated lines; owner's call.

Gates (ordinary handoff, `scans/gates.txt`): `npm run typecheck` exit 0 (20:54:51-52Z); `npm run build` exit 0 (20:54:52Z); `npm test -- --reporter=default --reporter=junit --outputFile.junit=<scratch>/gate-junit.xml` exit 0, 49 files, 906 passed and 1 skipped (907), 20:54:52-20:55:24Z. The junit output went to a scratch path because the tracked `junit.xml` would otherwise be rewritten (a file outside this Task's scope). No scene-affecting source changed, so the browser validation scripts were not run (the new tool is not part of the rendering path); lint is not configured (`lint: null`).

Limitations: no Task Check requested or waived here; nothing owner-visual was judged; "lines saved" in the page are estimates; `lizard` and the new capture tool have not been run by a second session.

## Drift Notes

- `tools/validate/capture-experience-pictures.mjs` is a new tool beside `capture-site-pictures.mjs` (the Task allowed either). T-071 (tools) should know it exists and keep it; T-072 uses it.
- Lizard's CCN 138 for `LayeredRender` is the whole rest of `AstraeusScene.tsx` (a parser artefact); the Design note and the Objective's wording about `LayeredRender` should say `SceneContents` when T-072 reconciles Design.
