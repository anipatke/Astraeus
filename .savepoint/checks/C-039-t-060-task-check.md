---
id: C-039
scope: {kind: task, id: T-060}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261017-night}
executed_session: t060-builder-2026-10-16
checked_at: '2026-10-17T03:25:00Z'
reviewed:
  base_commit: 8ca87ec
  head_commit: cd40140
  files:
    - tools/data/fetch-hyg-stars.mjs
    - src/assets/stars/hyg-v42-naked-eye.json
    - src/assets/sky.ts
    - src/app/skyModel.ts
    - tests/hygStars.test.ts
    - tests/sky.test.ts
    - tools/validate/browser-sky.mjs
    - README.md
    - assets.html
    - docs/DONOR_PROVENANCE.md
  dependencies: []
issues: []
supersedes: null
---

# C-039: T-060 Task Check (Quick)

## Scope Lock

1. T-060 Done When 1–5 (HYG fetch tool, licensed star asset accepted by the public validator with Yale still rejected, position and magnitude check against Yale, credits in three places, sky script in both builds). Guardrails PROV-01, PROV-02, TEST-01.
2. Out of scope: the owner's look at the new sky (owner_validation required).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 fetch tool | Downloads `hygdata_v42.csv.gz` from astronexus, checks the page still names v4.2 under CC BY-SA 4.0, parses CSV as data, keeps V ≤ 6.5 (8,920 rows, Sun skipped). The shipped file's provenance header carries catalogue, version, source URL, page, archive, licence, licence URL and attribution (read directly). Parser tests cover quoted commas and doubled quotes, the 6.5/6.51 boundary, missing position or magnitude, a missing colour, and a header lacking needed columns. | `tests/hygStars.test.ts:67-95`; file header |
| DW2 asset licence, validator | `HYG_STAR_LICENCE` in `src/assets/sky.ts` equals the file's licence (test "records the licence (PROV-02)…"). The public build passes `public-build-assets.mjs` with 0 matches; the fresh-clone public dist contains `hyg-v42-naked-eye-*.json`; the Yale file lives only under the ignored `data/local/` and `?stars=yale` falls back to HYG when it is absent (test "loads HYG by default, and falls back…"). | gates; vitest |
| DW3 position and magnitude vs Yale | Tests: ≥98% of Yale stars pair within 30 arcsec; median under 1.5 arcsec, 99th percentile under 6, none over 20; five named stars within 3 arcsec and 0.5 mag of published J2000 values. These run only where the local Yale file exists (skipped in the fresh clone, run in the full gate). | `tests/hygStars.test.ts:26-41,141-150` |
| DW4 credits | README (lines 7, 97, 125, 149), assets.html (lines 154-160, 362) and DONOR_PROVENANCE (line 103) all credit HYG v4.2, astronexus, CC BY-SA 4.0, and state that the licence covers the star file only and the code stays MIT. | grep |
| DW5 sky in both builds | T-060's own run: `docs/evidence/o016-t060-20261016T110603Z/local-run.log` and `public-run.log`. The checker's full run: `sky` exit 0 on dev. | evidence |

## Gates (fresh, checker, frozen snapshot of the spike-04 tree that was then committed unchanged as 1eb8b05..cd40140, 2026-10-16 15:26–16:04Z, node v24.16.0)

- Runner `docs/evidence/night-check-20261016T152607Z/check-run.sh`; per-step command, time and exit in `summary.txt`; `tree-status.txt` records the tree it copied. The snapshot was committed in the five commits 1eb8b05, c19aacf, 64d1e32, 30e6201, cd40140 with no edits in between (committer report: `git status --porcelain` empty afterwards).
- `npm run typecheck`: exit 0. `npx vitest run`: 48 files, 896 passed, 1 skipped. `npm run build`: exit 0. `ASTRAEUS_PUBLIC_BUILD=1 npm run build` then `public-build-assets.mjs`: exit 0, 0 matches.
- `browser-public-showers.mjs` against `vite preview` of the public build: exit 0.
- Browser: all 22 `tools/validate/browser-*.mjs` scripts (spike02, spike03, shell, anchor-labels with an explicit fresh directory, synthetic ×5, marker-existing, sky, sky-map, sun, earth-moon, jupiter-io, showers perseids, showers geminids, showers-gmn, view-link, precision, lighting, story-panels) against vite :5451 serving the snapshot: 22/22 exit 0 with zero console errors (the two "console-error-lines=1" entries are each script's own "zero console errors" line).
- Fresh clone of spike-04 at cd40140 (no data/local): `npm ci`, typecheck, vitest (859 passed, 38 skipped for absent local data), public build plus `public-build-assets.mjs` (exit 0), plain build: all exit 0. The public dist holds the GMN Perseids and Geminids files, the HYG star file and both panels files.

## Issues Pass

All five criteria are Proven. No Issues, so no materiality actions are required.

## Owner validation still needed

T-060 requires the owner's look at the HYG sky on the public site.

## Observations

- The HYG archive has moved on to v4.4 (label and duplicate fixes only); the shipped file stays at v4.2, which the fetch tool pins.

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
