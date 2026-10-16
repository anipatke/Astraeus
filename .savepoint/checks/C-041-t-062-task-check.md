---
id: C-041
scope: {kind: task, id: T-062}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261017-night}
executed_session: t062-builder-2026-10-16
checked_at: '2026-10-17T03:55:00Z'
reviewed:
  base_commit: 64d1e32
  head_commit: cd40140
  files:
    - data/stories/perseids/panels.json
    - data/showers/perseids.json
    - src/experiences/showers/showerSettings.ts
    - src/experiences/showers/showerDefinition.ts
    - tests/showers.test.ts
  dependencies: [T-059]
issues: []
supersedes: null
---

# C-041: T-062 Task Check (Quick)

## Scope Lock

1. T-062 Done When 1–5 (panels in Perseids story data; every figure sourced, illustrative badge where dot places are illustrative; plain wording; Geminids carry none but a test shows a settings file can; browser evidence). Dependency T-059 is CLEAR (C-038). Guardrails PROV-01, ARCH-01, STYLE-09.
2. Out of scope: the owner's reading and the Swift–Tuttle badge question.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 data, no code | `data/stories/perseids/panels.json` (3 panels) named by `story.panels` in `data/showers/perseids.json`. The shower wiring (`showerStoryPanels`) is generic: no shower or story wording in it. | files |
| DW2 sourced, badges | "A wide ribbon of dust": illustrative, and says the dots' places along their orbits are illustrative; 25,588 orbits matches ASTRONOMY_VALIDATION line 230. "Earth crosses the stream": observed; IAU MDC peak and radiant, AMS dates and ZHR 100, and GMN's −0.09 d (2.2 h) and 0.04° (C-035's figures). "Comet Swift–Tuttle": observed; 26 km, period 48,681.19 d, perihelion JD 2448968.4998 (1992 Dec 11) and aphelion 51.22 au all equal the JPL SBDB values archived in ASTRONOMY_VALIDATION line 170. Checker arithmetic: JD 2448968.5 + 48681.19 = 2497649.7, which is early 2126. | panels.json; ASTRONOMY_VALIDATION |
| DW3 wording | Plain and factual. | file |
| DW4 Geminids none, settings can carry panels | `data/showers/geminids.json` has no panels. Tests: "lets any shower file carry inline panels with no code…", "carries no panels unless the settings name them", "reads a panels file by the path the settings name", and "leaves out panels outside a narrowed (activity) span without throwing, but still rejects ones outside the full year". Bypass probe: `?span=activity` passes in browser-showers perseids. | `tests/showers.test.ts`; night-check showers-perseids |
| DW5 browser | "Perseids panels open in order on playback (stream-shape > earth-crossing > swift-tuttle)"; desktop and phone shots. | night-check `story-panels.log`, `story-panels-out/perseids-*.png` |

## Gates (fresh, checker, frozen snapshot of the spike-04 tree that was then committed unchanged as 1eb8b05..cd40140, 2026-10-16 15:26–16:04Z, node v24.16.0)

- Runner `docs/evidence/night-check-20261016T152607Z/check-run.sh`; per-step command, time and exit in `summary.txt`; `tree-status.txt` records the tree it copied. The snapshot was committed in the five commits 1eb8b05, c19aacf, 64d1e32, 30e6201, cd40140 with no edits in between (committer report: `git status --porcelain` empty afterwards).
- `npm run typecheck`: exit 0. `npx vitest run`: 48 files, 896 passed, 1 skipped. `npm run build`: exit 0. `ASTRAEUS_PUBLIC_BUILD=1 npm run build` then `public-build-assets.mjs`: exit 0, 0 matches.
- `browser-public-showers.mjs` against `vite preview` of the public build: exit 0.
- Browser: all 22 `tools/validate/browser-*.mjs` scripts (spike02, spike03, shell, anchor-labels with an explicit fresh directory, synthetic ×5, marker-existing, sky, sky-map, sun, earth-moon, jupiter-io, showers perseids, showers geminids, showers-gmn, view-link, precision, lighting, story-panels) against vite :5451 serving the snapshot: 22/22 exit 0 with zero console errors (the two "console-error-lines=1" entries are each script's own "zero console errors" line).
- Fresh clone of spike-04 at cd40140 (no data/local): `npm ci`, typecheck, vitest (859 passed, 38 skipped for absent local data), public build plus `public-build-assets.mjs` (exit 0), plain build: all exit 0. The public dist holds the GMN Perseids and Geminids files, the HYG star file and both panels files.

## Issues Pass

All five criteria are Proven. No Issues, so no materiality actions are required.

## Owner validation still needed

T-062 requires the owner to read the three panels, and decide one question: "next due in 2126" is a two-body figure (its source line says so) inside a panel badged observed. Modelled would be the stricter badge for that sentence.

## Observations

- The first T-062 run failed browser-showers at `?span=activity` (panels outside the narrowed window threw). Repaired the same night by validating against the full year and leaving out panels outside the visible span; the repair is covered by the test above and the checker's run.
- T-062's evidence directory `docs/evidence/o015-t062-20261016T121016Z/` holds only git-ignored files, so it is local to this machine.

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
