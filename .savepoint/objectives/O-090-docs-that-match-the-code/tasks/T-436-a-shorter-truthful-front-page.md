---
id: T-436
objective: O-090
title: A shorter, truthful front page
status: done
depends_on: [{task: T-435, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-436, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, README.md, package.json, docs/DONOR_PROVENANCE.md, docs/ASTRONOMY_VALIDATION.md]
planned_writes: [README.md, packages/astraeus-site/assets.html, packages/astraeus-site/index.html]
---

# A shorter, truthful front page

## Outcome

Owner plan step 3, root README. It keeps the product, demos, the provenance principle (observed / modelled / illustrative), setup and links; drops the obsolete roadmap including "Later: package the engine"; replaces the asset and science inventory with links to the owning docs; states the workspaces and the planet/moon providers truthfully (or links to their owner), with no hard-coded counts that drift.

## User Check

A newcomer can clone and run the site from the root README alone.

## Done When

| Item | Evidence |
|---|---|
| Root-README contradictions from the T-434 list fixed (workspace count, VSOP87A vs the providers actually used, roadmap/status) | before/after table checked against package.json workspaces and provider source |
| Roadmap section gone or reduced to a link to the changelog | diff |
| Asset/science inventory replaced by links; every removed passage has a home (named doc) or a recorded reason | table |
| Setup commands verified against package.json scripts | evidence |
| Every relative link in README.md resolves | link-check command recorded |
| Before/after word count | wc -w |

## Context Files

T-434 Technical Evidence; `docs/README.md`; `README.md`; `package.json`; provider source as needed to confirm (log the read); `docs/DONOR_PROVENANCE.md` and `docs/ASTRONOMY_VALIDATION.md` headings only, to confirm link targets.

## Design References

Design `Planet positions from Horizons`, `Core layers and demos`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap).

## Implementation Plan

1. Confirm workspace list and providers from source.
2. Rewrite in place: keep product, demos, provenance, run, develop; the checks section stays as T-435 left it; collapse "Assets, science and credits" to a short credits list with links; drop "Status and roadmap".
3. Check links.

## Boundaries

Coordinator widening (T-434 C6c): correct the VSOP87 provider claims in the site copy of `assets.html` (lines ~267, ~278) and `index.html` (~253) to the Horizons fits; text only, no layout change. README.md only. Credits and licence acknowledgements are kept (shortened, not removed). No new demos or claims.

## Technical Verification

prettier; link check; no tests.

## Technical Evidence

### Reads

Context Files: T-434 Technical Evidence (tables C, M), `docs/README.md`, `README.md`, root `package.json`, headings of `docs/DONOR_PROVENANCE.md` and `docs/ASTRONOMY_VALIDATION.md`. Extra reads, logged: `packages/*/package.json` name/private (workspace truth); `packages/astraeus/src/core/planetModels.ts` 50-60, `astronomyAdapter.ts` 1-30, `planetSeries.ts` VSOP mention line 55, `tools/import/horizons-moons.mjs` header (provider truth for C2-C4, C6c); `.savepoint/Design.md` `### Planet positions from Horizons` and the grep line of `### Size budgets are split` (link target, quality-decision home); `tools/check-public-build.mjs` and `load-budget.mjs` headers (C23 command truth); `packages/astraeus-site/tests/gateLimits.test.ts` 165-185 (README elapsed-time rule); `packages/astraeus-site/assets.html` 240-282 and `index.html` 253 (C6c widening); `packages/astraeus/README.md` `## ` heading list (link target).

### Before/after (contradictions)

| # | Before | After | Checked against |
|---|---|---|---|
| C1/C24 | "five npm workspaces", 5-row table | No count: engine, `astraeus-data` + `astraeus-data-*` (published), `astraeus-demo-*` + `astraeus-site` (private), `examples/` | root `package.json` `workspaces: ["packages/*"]`; `ls packages` (13); each `package.json` `private` |
| C2/C3 | "like the planets from VSOP87"; table "VSOP87A via orb.js"; credit "VSOP87, Bretagnon & Francou 1988" | Planets and moons from Horizons curve fits; Earth/Sun/Moon from orb.js; link to Design `Planet positions from Horizons`; VSOP87 citation dropped (no runtime use: only a history comment in `planetSeries.ts`) | `planetModels.ts:55-58`, `astronomyAdapter.ts:16`, `horizons-moons.mjs:2` |
| C4 | mermaid "ephemerides (orb.js)" | "orb.js (Earth, Sun, Moon), JPL Horizons fits (planets, moons)" | as C2 |
| C6c | site: index tag "VSOP87", "Planet theory"; assets 249 credit, 267 "VSOP87A full series via orb.js", 278 "VSOP87A · two-body Kepler" / "Bretagnon & Francou 1988" | "JPL Horizons" tag and "JPL Horizons fits"; credit without VSOP87; row "The planets / Curve fits to JPL Horizons / within 1 km from 1950 to 2045"; "JPL Horizons fits · two-body Kepler", lic "JPL Horizons". Text only, same markup | as C2; `planetSeriesSpan()` 1950-2045 |
| C13/C14 | Roadmap: "Next: put the demos live", "Later: package the engine", "the view from the ground" | Section removed; engine README and changelog linked; "experiment built in spikes" kept as one line under Built with | live links in README; `packages/astraeus/package.json` 0.9.5 on npm |
| C22 | Page-size table dated 2026-10-21 (stale limits) | Links to `load-budget.mjs` and `viewLimits.json`, plus the print command | `load-budget.mjs` |
| C23 | `node .../public-build-assets.mjs dist` | `npm run check:public-build` | root `package.json` script; `tools/check-public-build.mjs:1-4` |

### Removed passages and their homes

| Removed | Home or reason |
|---|---|
| Workspace table rows | `packages/*/package.json` (docs/README.md owner); engine README for the engine |
| Page-size table and measurement prose | `load-budget.mjs`, `viewLimits.json`, Design `Size budgets are split`; owner quality decision kept as one sentence |
| Assets table (14 rows) | Site assets page (generated sections) and package `credits/`, `NOTICE`, `licenses/`; comet/Phaethon row covered by the "Small-Body Database" credit |
| Long credit lines | Shortened, not removed; full wording on the assets page and in package credits. Saturn/Uranus/Neptune, Saturn-moon, Triton, Pluto, Charon credits added in short form from the assets page (were missing from README) |
| Status and roadmap | Obsolete (C13, C14); changelog linked |
| `?experience=jupiter-io` alias note, list of nine planets | Alias is a compatibility detail in the planets demo code; the planet switch is named |
| Data bullet counts (8,920 stars, 25,588/51,115 orbits, file paths) | Counts stay in the product sections and assets page; fetch commands kept |
| Spike 01/02 links | History; reachable from `docs/` and docs/README.md |
| `npm test` line in Develop | Already in `Running the checks` (T-435, unchanged) |

### Done When -> evidence

| Item | Evidence |
|---|---|
| Contradictions fixed (workspaces, providers, roadmap) | Before/after table above |
| Roadmap gone | `git diff README.md`: `## Status and roadmap` removed; changelog link |
| Inventory replaced by links; homes recorded | Removed-passages table above |
| Setup commands verified | `dev`, `build`, `typecheck`, `apollo11:reconstruct`, `check:engine-alone`, `check:public-build`, `check:browser`, `test` all present in root `package.json` scripts (printed with node); `engines.node >=22.12` matches "Node 22.12 or newer" |
| Relative links resolve | Python check of every `](path)` in README.md (non-http) with `os.path.exists`: 24/24 OK; Design anchor heading `### Planet positions from Horizons` exists (line 82) |
| Word count | `wc -w README.md`: 2369 before, 1487 after (-37%) |

### Commands

- `npx prettier --check README.md packages/astraeus-site/index.html packages/astraeus-site/assets.html`: pass (Markdown ignored).
- `npx vitest run packages/astraeus-site/tests/{assetsPageCredits,assetsSections,homePage,pageTitle,gateLimits}.test.ts`: 5 files, 64 tests passed (`gateLimits` keeps the README no-undated-elapsed-time rule green).
- `npm run typecheck`: exit 0. ESLint: no TS/JS changed.
- `grep -rn` for the changed site strings in `packages/astraeus-site/tests`, `tools`: no test reads them. `grep -ci vsop index.html assets.html`: 0, 0.

### Files changed

`README.md`, `packages/astraeus-site/index.html`, `packages/astraeus-site/assets.html` (text only), this Task file.

### Limitations

No browser run (text-only HTML change; owner judges on localhost:5490). `Running the checks` left byte-identical to T-435's version. VSOP87 remains in `docs/architecture/*`, `data/ephemerides/README.md` and `NOTICE` (T-438/T-439/owner per table C). The Design anchor link points into `.savepoint/`, which renders on GitHub but not on npm (root README is not packed).

## Drift Notes

None for Design: README and site now match Design `Planet positions from Horizons`. The VSOP87 citation was dropped from the assets page credits; `packages/astraeus/NOTICE` (C6b) still names VSOP87A and is the owner's decision.

## Coordinator (gates)

2026-11-22, coordinator (orchestrate-g024-20261122): Reviewed the README and site-copy diff. Verified the dropped VSOP87 credit: `planetSeries.ts:55` builds planets from Horizons fits since O-063 (VSOP87 remains only as orb.js type declarations), and Earth/Sun/Moon come from orb.js EPV00 and its lunar series, so no runtime VSOP87 claim is lost. Builder ran 5 site test files (64 passed) and typecheck. Marked done under the standing rule (owner, O-038: "I mark them as they pass") and the owner's "carry on orchestrating G-024".
