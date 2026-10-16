---
id: C-042
scope: {kind: task, id: T-063}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261017-night}
executed_session: t063-builder-2026-10-16
checked_at: '2026-10-17T04:20:00Z'
reviewed:
  base_commit: 30e6201
  head_commit: cd40140
  files:
    - tools/validate/capture-site-pictures.mjs
    - data/showers/perseids.json
    - src/experiences/apollo11/apollo11Definition.tsx
    - tools/validate/browser-showers.mjs
    - tools/validate/browser-sun.mjs
    - tools/validate/browser-synthetic-eccentric.mjs
    - site/apollo-moon.jpg
    - site/apollo-phone.jpg
    - site/apollo-provenance.jpg
    - site/perseids-gmn.jpg
    - site/readme/perseids-year.gif
    - public/share/apollo-moon.jpg
  dependencies: []
issues: []
supersedes: null
---

# C-042: T-063 Task Check (Quick)

## Scope Lock

1. T-063 Done When 1–3 (a capture script that builds the public version, serves it and captures every site picture at the owner's angles using startView; pictures replaced in site/, site/readme/, public/share/, unused no-sky fallbacks removed; a list of every picture with command and time). Guardrails PROV-01, TEST-01, and the project's historical-evidence rule.
2. Reviewed at cd40140 plus the uncommitted repair to `tools/validate/capture-site-pictures.mjs` and the final re-shoot (to be committed together after this Check).
3. Out of scope: the owner's look at the pictures.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 build, serve, capture at the owner's angles | First review found the script built and served nothing and never checked what it was shooting; sent back before this record. Now it runs `ASTRAEUS_PUBLIC_BUILD=1 npm run build`, serves `vite preview` on 5406, waits for `app.html`, captures, and stops the server in `finally` and on SIGINT/SIGTERM. Bypass probe: `ASTRAEUS_URL` pointed at a dev server on 5416 exits 1 with a plain message and captures nothing (the check rejects `/@vite/client` and requires a built `/assets/` script). Angles: Perseids `view=sun,100,40,250000` = `look.startView` in perseids.json; Apollo `startView earth,0,70,130` in apollo11Definition.tsx; phone `view=moon,270,50,214`. | `docs/evidence/o016-t063-capture-20261016T161406Z/` (capture.log, refusal.log); `o016-reshoot-20261016T160600Z/capture.json` |
| DW2 pictures replaced | The five pictures and the GIF (40 frames, 1.91 MB) were re-shot from the final public build at 2026-10-16T16:06Z, exit 0, 0 errors; the share copy was written too. The checker viewed all four JPEGs: the HYG sky, the Perseid ribbon with planet and comet orbits, the Apollo figure of eight with the touchdown panel open, the Moon close-up with provenance, and the phone layout. A second run from the repaired script matches (apollo-moon and perseids-gmn pixel-identical; the others within render noise, RMSE ≤ 0.0023). No no-sky fallback files remain in site/. | reshoot `capture.log`; `compare-sheet.png`; `ls site` |
| DW3 picture list | `capture.json` and `capture.log` list each picture with URL, viewport, time and size; the run command is in the T-063 evidence. | evidence |

## Gates (fresh, checker, frozen snapshot of the spike-04 tree that was then committed unchanged as 1eb8b05..cd40140, 2026-10-16 15:26–16:04Z, node v24.16.0)

- Runner `docs/evidence/night-check-20261016T152607Z/check-run.sh`; per-step command, time and exit in `summary.txt`; `tree-status.txt` records the tree it copied. The snapshot was committed in the five commits 1eb8b05, c19aacf, 64d1e32, 30e6201, cd40140 with no edits in between (committer report: `git status --porcelain` empty afterwards).
- `npm run typecheck`: exit 0. `npx vitest run`: 48 files, 896 passed, 1 skipped. `npm run build`: exit 0. `ASTRAEUS_PUBLIC_BUILD=1 npm run build` then `public-build-assets.mjs`: exit 0, 0 matches.
- `browser-public-showers.mjs` against `vite preview` of the public build: exit 0.
- Browser: all 22 `tools/validate/browser-*.mjs` scripts (spike02, spike03, shell, anchor-labels with an explicit fresh directory, synthetic ×5, marker-existing, sky, sky-map, sun, earth-moon, jupiter-io, showers perseids, showers geminids, showers-gmn, view-link, precision, lighting, story-panels) against vite :5451 serving the snapshot: 22/22 exit 0 with zero console errors (the two "console-error-lines=1" entries are each script's own "zero console errors" line).
- Fresh clone of spike-04 at cd40140 (no data/local): `npm ci`, typecheck, vitest (859 passed, 38 skipped for absent local data), public build plus `public-build-assets.mjs` (exit 0), plain build: all exit 0. The public dist holds the GMN Perseids and Geminids files, the HYG star file and both panels files.
- Fresh after the last edits (2026-10-17, working tree with the T-063 script repair and T-064 page edits uncommitted): `npm run typecheck` exit 0; `npx vitest run` 49 files, 906 passed, 1 skipped; `ASTRAEUS_PUBLIC_BUILD=1 npm run build` exit 0; `public-build-assets.mjs` exit 0 with 0 matches (`docs/evidence/night-check2-20261016T161608Z/`). No scene, camera, control or UI code changed after the full browser run.

## Issues Pass

All three criteria are Proven (DW1 after the pre-record repair). No Issues, so no materiality actions are required.

## Owner validation still needed

T-063 requires the owner's look at the pictures on the front page, the assets page and the README.

## Observations

- The production check proves a production build, not specifically a public one. Today they are identical because no texture is local-only; the script header says so.
- The opening views moved two browser scripts (browser-showers, browser-sun) onto explicit `&view=` loads for their geometry checks, with a new plain-load assertion for the opening angle; the eccentric script's wait grew from 2.5 s to 6 s after measuring the Overview ease.

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
