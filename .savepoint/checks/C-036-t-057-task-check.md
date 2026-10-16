---
id: C-036
scope: {kind: task, id: T-057}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261016-night}
executed_session: t057-builder-2026-10-16
checked_at: '2026-10-16T11:54:00Z'
reviewed:
  base_commit: a2f82e0
  head_commit: 8130ff6
  files:
    - index.html
    - assets.html
    - app.html
    - vite.config.ts
    - vercel.json
    - LICENSE
    - README.md
    - package.json
    - tools/validate/public-build-assets.mjs
    - tests/publicBuild.test.ts
  dependencies: []
issues: []
supersedes: null
---

# C-036: T-057 Task Check (Quick)

## Scope Lock

1. T-057 Done When 1–6 and Boundaries. Guardrails PROV-02, TEST-01.
2. Out of scope: deployment (the owner's), and the owner's look at the pages.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 multi-page | dist has index.html, assets.html, app.html; the validator requires all three; `src/main.tsx` behaviour is unchanged for the app | public build; publicBuild.test.ts |
| DW2 demo links | index.html links `app.html?experience=shower-perseids` and the Apollo default; the pages load in the public preview with 0 errors and no failed requests | probe2 |
| DW3 URL sweep | 19 scripts default to /app.html; all browser scripts pass at HEAD through ASTRAEUS_URL | summary.txt |
| DW4 vercel and validator | vercel.json `ASTRAEUS_PUBLIC_BUILD=1 npm run build`, output dist; the public dist lists no CAMS, Yale or data/local files | dist listing; validator |
| DW5 no CAMS-derived images | site/ images committed are Apollo shots and texture thumbnails. The two Perseids pictures and the README GIF were held back uncommitted by the orchestrator (they show Yale stars and their data source is unconfirmed); re-shoot is T-063. | git ls-files site; commit plan |
| DW6 gates and evidence | gates pass; site screenshots in docs/evidence/o011-t057-* (local PNGs) | Gates |

## Gates (fresh, checker, committed HEAD 8130ff6 in a clean worktree `/home/user/code/astraeus-check-8130ff6`, 2026-10-16 ~10:50Z, node v24.16.0)

- `npm run typecheck`: exit 0. `npm run build`: exit 0. `npx vitest run`: 45 files, 828 passed, 1 skipped (`docs/evidence/o011-check-20261016T105315Z/c-t.log`).
- `git diff --check f5a9273 8130ff6`: one blank line at EOF in docs/DONOR_PROVENANCE.md, and trailing whitespace in two committed vite logs. Cosmetic; observation only.
- Browser: all 21 `tools/validate/browser-*.mjs` scripts (spike02, spike03, shell, anchor-labels, synthetic ×5, marker-existing, sky, sky-map, sun, earth-moon, jupiter-io, showers perseids, showers geminids, showers-gmn, view-link, precision, lighting) against vite :5450 serving the worktree: 21/21 exit 0 with zero console errors. `docs/evidence/o011-check-20261016T105315Z/summary.txt` lists each command and time; `docs/evidence/o011-check-20261016T105315Z/check-run.sh` is the runner. (The single "console-error-lines=1" in showers-gmn is its own "ok, zero console errors" line.)
- Public build (`ASTRAEUS_PUBLIC_BUILD=1 vite build` of the worktree, `vite preview` :5451): index, assets, app and the Perseids, Geminids and Apollo demos load with zero console errors and no failed requests (`docs/evidence/o011-check-20261016T105315Z/probes/probe2.mjs` output). The public-build validator found no local data in the integration-time run, and in the coordinator's run on the same tree (no matches).

## Issues Pass

All criteria are Proven. No Issues, so no materiality actions are required.

## Owner validation still needed

The owner's look at the front page and the assets page, desktop and phone.

## Observations

- index.html and README.md reference `site/perseids-gmn.jpg` and `site/readme/perseids-year.gif`, which are deliberately uncommitted at 8130ff6, so a checkout of this commit shows broken images until T-063 lands.
- No link from the app back to the front page (DW2 allowed recording it as follow-up). It is not recorded in the Task evidence; noted here for T-064.
- README linked the Geminids demo, which drew nothing in the public build at this commit (I-030).

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
- [ ] STYLE-10 **Small diffs**: tonight's commits are large (aea091d 52 files, 721d95a 49 files), mostly evidence and shared-file batching by the orchestrator.
