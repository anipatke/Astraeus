---
id: C-035
scope: {kind: task, id: T-056}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261016-night}
executed_session: t056-builder-2026-10-16
checked_at: '2026-10-16T11:52:00Z'
reviewed:
  base_commit: aea091d
  head_commit: 8130ff6
  files:
    - tools/data/fetch-meteoroid-orbits.mjs
    - src/experiences/showers/measuredOrbits.ts
    - src/experiences/showers/showerSettings.ts
    - src/main.tsx
    - data/showers/perseids.json
    - data/stories/perseids/gmn-iau-7.json
    - docs/ASTRONOMY_VALIDATION.md
    - tests/fetchMeteoroidOrbits.test.ts
    - tests/showersMeasured.test.ts
    - tools/validate/browser-showers-gmn.mjs
  dependencies: [T-038]
issues: []
supersedes: null
---

# C-035: T-056 Task Check (Quick)

## Scope Lock

1. T-056 Done When 1–6, as amended by the owner decisions recorded in the Task ("Owner decisions (2026-10-16, after the build)"): GMN is the Perseids default (owner chose "Global Meteor Network (Recommended)"), and a GMN copy ships with the demo ("Yes, ship it with the demo (Recommended)"). DW2's "default stays CAMS" and DW4's "does not ship" are superseded by those decisions, and are not unmet. Guardrails PROV-01, PROV-02, ARCH-01, TEST-01..03.
2. Out of scope: the owner's look at the GMN vs CAMS comparison images.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 fetch tool | Header-verified columns; it throws on shifted columns or wrong-width rows; unbound orbits dropped and counted; provenance header with both Vida citations, licence, files, SHA-256 | fetchMeteoroidOrbits.test.ts: "finds every column from the header rows…", "refuses a file whose columns are shifted…", "writes a file the app accepts, with licence, citations…". Shipped file header read directly. |
| DW2 source setting | `stream.source`, `?source=`; `src/main.tsx:38` accepts only cams, or gmn where the settings name it, and otherwise the settings default. Probe: `?source=bogus` gives the default; Geminids `?source=gmn` (no GMN entry at 8130ff6) gives CAMS; 0 errors. | probe1 |
| DW3 facts | GMN beside CAMS in ASTRONOMY_VALIDATION: Vg 58.63, busiest bin 140.0–140.5, minimum distance −0.09 d (−2.2 h), radiant 0.04° off | doc table; showersMeasured.test.ts GMN suite in full run |
| DW4 licence / shipping | Shipped copy CC BY 4.0. `isShippableLicence` refuses CAMS, no-licence and non-shipping licences. The production loader reads only `data/stories`. | "refuses to ship a CAMS file…"; measuredOrbits.ts:169-198 |
| DW5 screenshots | compare/ set present | docs/evidence/o011-t056-*/compare (PNGs local) |
| DW6 gates and browser | showers ×2 and showers-gmn exit 0 at HEAD, 0 errors; public-build probe draws the Perseids stream from the shipped copy | summary.txt; probes/pubper.png |

## Gates (fresh, checker, committed HEAD 8130ff6 in a clean worktree `/home/user/code/astraeus-check-8130ff6`, 2026-10-16 ~10:50Z, node v24.16.0)

- `npm run typecheck`: exit 0. `npm run build`: exit 0. `npx vitest run`: 45 files, 828 passed, 1 skipped (`docs/evidence/o011-check-20261016T105315Z/c-t.log`).
- `git diff --check f5a9273 8130ff6`: one blank line at EOF in docs/DONOR_PROVENANCE.md, and trailing whitespace in two committed vite logs. Cosmetic; observation only.
- Browser: all 21 `tools/validate/browser-*.mjs` scripts (spike02, spike03, shell, anchor-labels, synthetic ×5, marker-existing, sky, sky-map, sun, earth-moon, jupiter-io, showers perseids, showers geminids, showers-gmn, view-link, precision, lighting) against vite :5450 serving the worktree: 21/21 exit 0 with zero console errors. `docs/evidence/o011-check-20261016T105315Z/summary.txt` lists each command and time; `docs/evidence/o011-check-20261016T105315Z/check-run.sh` is the runner. (The single "console-error-lines=1" in showers-gmn is its own "ok, zero console errors" line.)
- Public build (`ASTRAEUS_PUBLIC_BUILD=1 vite build` of the worktree, `vite preview` :5451): index, assets, app and the Perseids, Geminids and Apollo demos load with zero console errors and no failed requests (`docs/evidence/o011-check-20261016T105315Z/probes/probe2.mjs` output). The public-build validator found no local data in the integration-time run, and in the coordinator's run on the same tree (no matches).

## Issues Pass

All criteria are Proven (DW2 and DW4 as amended by the owner). No Issues, so no materiality actions are required.

## Owner validation still needed

T-056 requires the owner's look at the GMN vs CAMS Perseids pictures.

## Observations

- At 8130ff6 the public build still listed the "Orbits from CAMS" switch, which drew nothing there. Captured in I-030 and repaired that night (production offers only the sources it ships).

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
