---
id: C-040
scope: {kind: task, id: T-061}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261017-night}
executed_session: t061-builder-2026-10-16
checked_at: '2026-10-17T03:50:00Z'
reviewed:
  base_commit: c19aacf
  head_commit: cd40140
  files:
    - data/stories/apollo11/panels.json
    - tests/storyPanels.test.ts
    - tools/validate/browser-story-panels.mjs
  dependencies: [T-059]
issues: []
supersedes: null
---

# C-040: T-061 Task Check (Quick)

## Scope Lock

1. T-061 Done When 1–4 (panels in story data tied to anchors by id; every number sourced with honest badges; plain wording, two to four sentences; browser evidence of each panel opening in order). Dependency T-059 is CLEAR (C-038). Guardrails PROV-01, STYLE-09.
2. Out of scope: the owner's reading of the wording (owner_validation required).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 data, anchors by id | `data/stories/apollo11/panels.json`: 7 panels, six on anchors (A-02, A-11, A-20, A-LND, A-21, A-31) and splashdown on event E-30. No panel text in code. The unit test "gives the first demo story seven sourced panels, in mission order, that sit on its own anchors and objects" loads the real file. | file; `tests/storyPanels.test.ts:146` |
| DW2 numbers sourced, badges honest | Checker cross-check against `data/apollo11/normalised/anchors.json` (Mission Report MSC-00171 Table 7-II / 5-IV): A-02 320.95 km and 10.841 km/s (text "about 321 km", "about 10.84 km/s"); A-11 160.57 km → 111.31 km, 2.515 → 1.670 km/s (text 161 → 111 km, 2.51 → 1.67 km/s, 75:49:50.4 to 75:55:48.0); A-20 11.85 km, 1.696 km/s at 102:33:05.1; A-LND 102:45:39.9 at 0.67408° N, 23.47297° E; A-21 124:29:15.7, 18.52 km, 1.688 km/s. Each panel's source line names the table and anchor. All seven are badged observed: each figure is a printed table value, and the text says plainly where the drawn path is a reconstruction. | anchors.json; panels.json |
| DW3 wording | Two to three sentences per paragraph, factual, no exclamations or superlatives. | file |
| DW4 browser | "every Apollo panel opens in order on playback (tli-cutoff > loi > powered-descent > touchdown > ascent-docking > tei > splashdown)" in the checker's run; desktop shots for all seven, phone sheets for two. | night-check `story-panels.log`, `story-panels-out/apollo-*.png` |

## Gates (fresh, checker, frozen snapshot of the spike-04 tree that was then committed unchanged as 1eb8b05..cd40140, 2026-10-16 15:26–16:04Z, node v24.16.0)

- Runner `docs/evidence/night-check-20261016T152607Z/check-run.sh`; per-step command, time and exit in `summary.txt`; `tree-status.txt` records the tree it copied. The snapshot was committed in the five commits 1eb8b05, c19aacf, 64d1e32, 30e6201, cd40140 with no edits in between (committer report: `git status --porcelain` empty afterwards).
- `npm run typecheck`: exit 0. `npx vitest run`: 48 files, 896 passed, 1 skipped. `npm run build`: exit 0. `ASTRAEUS_PUBLIC_BUILD=1 npm run build` then `public-build-assets.mjs`: exit 0, 0 matches.
- `browser-public-showers.mjs` against `vite preview` of the public build: exit 0.
- Browser: all 22 `tools/validate/browser-*.mjs` scripts (spike02, spike03, shell, anchor-labels with an explicit fresh directory, synthetic ×5, marker-existing, sky, sky-map, sun, earth-moon, jupiter-io, showers perseids, showers geminids, showers-gmn, view-link, precision, lighting, story-panels) against vite :5451 serving the snapshot: 22/22 exit 0 with zero console errors (the two "console-error-lines=1" entries are each script's own "zero console errors" line).
- Fresh clone of spike-04 at cd40140 (no data/local): `npm ci`, typecheck, vitest (859 passed, 38 skipped for absent local data), public build plus `public-build-assets.mjs` (exit 0), plain build: all exit 0. The public dist holds the GMN Perseids and Geminids files, the HYG star file and both panels files.

## Issues Pass

All four criteria are Proven. No Issues, so no materiality actions are required.

## Owner validation still needed

T-061 requires the owner to read the seven panels.

## Observations

- I-031 (open, logged by this Task's builder): the touchdown and powered-descent panels name the same object, so their scene markers overlap. The timeline markers still open every panel.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
