---
id: T-439
objective: O-090
title: Packaging, release and science guides by section
status: done
depends_on: [{task: T-438, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-439, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, docs/NPM_PACKAGING.md, docs/RELEASING.md, docs/ASTRONOMY_VALIDATION.md, docs/MOON_ORBITS.md, tools/publish-packages.mjs, tools/build-packages.mjs]
planned_writes: [docs/NPM_PACKAGING.md, docs/RELEASING.md, docs/ASTRONOMY_VALIDATION.md, docs/MOON_ORBITS.md, docs/README.md, tools/check-packs.mjs, packages/astraeus/data/ephemerides/README.md]
---

# Packaging, release and science guides by section

## Outcome

Owner plan step 4, specialist guides. The current release procedure is easy to find in RELEASING.md; one-time experiments and dated sizes in NPM_PACKAGING.md are marked as history with their date; package counts match the release config. Scientific docs describe the providers actually in use and keep provenance, frames, time scales, uncertainty, limitations and reproducibility; historical experiments are dated.

## User Check

None visual.

## Done When

| Item | Evidence |
|---|---|
| Package counts/lists in both guides match the release/publish config, or link to it | evidence quoting config |
| Current procedure first in RELEASING.md; history marked with dates | diff |
| Provider descriptions in ASTRONOMY_VALIDATION.md and MOON_ORBITS.md match source (provider files cited) | evidence |
| No provenance, frame, time-scale, uncertainty or limitation text lost (moved text listed) | table |
| Inbound links to edited headings still resolve | grep evidence |
| Before/after word counts | wc -w |

## Context Files

T-434 Technical Evidence; `docs/README.md`; `docs/NPM_PACKAGING.md`; `docs/RELEASING.md`; `docs/ASTRONOMY_VALIDATION.md` and `docs/MOON_ORBITS.md` by heading (headings first, then sections naming providers); `tools/publish-packages.mjs` and `tools/build-packages.mjs` header comments and package lists.

## Design References

Design `Planet positions from Horizons`, `Size budgets are split`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap). Scientific tolerances are neither loosened nor restated.

## Implementation Plan

1. Confirm package list and providers from tools and source.
2. Fix contradictions; mark history; reorder RELEASING so the current procedure leads.
3. Update docs/README.md owners if needed.

## Boundaries

Coordinator widening (T-434 C21/M13): the `check-packs.mjs:3` comment must say the code owns the pack limits (comment only); the doc links to the code. Never run the publish tool without --dry-run (AGENTS.md). Release notes, archive, spike reports and evidence untouched.

## Technical Verification

prettier on changed files.

## Technical Evidence

Builder session 2026-11-22 (coordinator orchestrate-g024-20261122). Step checks waived (`check_waiver`).

### Reads

Context Files: T-434 Technical Evidence tables C and M (rows C5, C6a, C16-C21, M6, M13); `docs/README.md`; `docs/NPM_PACKAGING.md`, `docs/RELEASING.md` (whole); `docs/ASTRONOMY_VALIDATION.md` headings plus lines 1-48, 88-140, 170-186; `docs/MOON_ORBITS.md` headings plus lines 1-10, 40-60; `tools/build-packages.mjs` `PACKAGES` (30-40); `tools/check-packs.mjs` lines 1-40.
Extra reads (logged): `packages/astraeus/data/ephemerides/README.md` (whole; C6a, added to planned_writes by the coordinator); `packages/astraeus/src/core/astronomyAdapter.ts` 1-25, `planetModels.ts` 1-62, `tools/import/planet-fits.mjs` header and grep (provider facts); `data/ephemerides/planets/planets.json` metadata keys only (`worstErrorKm`); `src/core/bodies/io.ts` 18-40, `planetMoons.ts` 1-8, grep of `jupiterMoons.ts` (what `data/orbits` still feeds); `docs/agents/browser-policy.md` grep `hello` (C18); `tools/gate-limits.json` grep (C19); `workflowParity.test.ts` 25-45, 155-175 and `browserExitPath.test.ts` 32-33 (consumers of RELEASING headings); repo grep for inbound links to the edited docs.

### Done When -> evidence

| Item | Evidence |
|---|---|
| Package counts/lists match the config, or link to it | `tools/build-packages.mjs:30-40` `PACKAGES` = 9 names. RELEASING intro names the nine and says `PACKAGES` is the list that counts; the eight-package one-time setup is now headed "history: done 2026-10-23 for the first eight packages" (C16); "seven data packages" dated to that first publish (C17). NPM_PACKAGING gains a dated-note banner linking `PACKAGES` (nine), `LIMITS` and RELEASING; "publishes both" -> "publishes them all (nine packages today)" (C20). |
| Current procedure first in RELEASING; history dated | New order: intro (with a "Current procedure" line), Each release, After a release, Adding a package, One-time setup (history, 2026-10-23), What is checked where (kept last: `workflowParity` slices from its heading to EOF). "Each release" step numbers unchanged (`releaseBreaks.test.ts:30` cites "step 3"). |
| Providers match source (files cited) | ASTRONOMY_VALIDATION new section "Providers in use today" (table citing `astronomyAdapter.ts`, `planetModels.ts`, `planets.json`, `planet-fits.mjs`, `chebyshevEphemeris.ts`, `moonSystem.ts`, `sunCentredSources.ts`, `elementsBody.ts`, `iauRotation.ts`); "Selected provider" decision dated 2026-10-06 with a pointer; O-025 curve-fit paragraph dated and marked superseded. MOON_ORBITS: dated status paragraph (positions now Horizons fits; `data/orbits` still feeds rotation and period; `io.ts` two-body path). `data/ephemerides/README.md` `planets/`: all eight from Horizons since O-063 T-290, matching the `planet-fits.mjs` header and the `planetModels.ts` doc comment (C6a). |
| No provenance/frame/time-scale/uncertainty/limitation text lost | Table "Moved or changed text" below. All removals are replacements or moves into dated history; no tolerance restated or changed. |
| Inbound links to edited headings still resolve | `git grep` for `(RELEASING\|NPM_PACKAGING\|ASTRONOMY_VALIDATION\|MOON_ORBITS).md#` and `ephemerides/README`: no anchor links. Text references: RELEASING "What is checked where" (`workflowParity.test.ts`, `browserExitPath.test.ts`), "Adding a package" (`publish-packages.mjs:24`), "step 3" (`releaseBreaks.test.ts:30`); ASTRONOMY_VALIDATION "GMN section" and "Showers year section" (showers `panels.json`). All unchanged. Only renamed heading: RELEASING "One-time setup (before the first release)" -> "One-time setup (history: done 2026-10-23 for the first eight packages)", referenced nowhere. |
| Before/after word counts | `wc -w` (HEAD -> now): docs/README.md 519 -> 532; docs/NPM_PACKAGING.md 2276 -> 2412; docs/RELEASING.md 1381 -> 1496; docs/ASTRONOMY_VALIDATION.md 8409 -> 8681; docs/MOON_ORBITS.md 1980 -> 2073; packages/astraeus/data/ephemerides/README.md 1034 -> 1150; tools/check-packs.mjs 2593 -> 2606. Net growth: this Task fixes truth and dating, it does not trim; the added text is dating labels and present-state pointers. |

### Moved or changed text

| Where | Before | After |
|---|---|---|
| `data/ephemerides/README.md` `planets/` | Mercury-Neptune VSOP87A refits, Pluto Horizons; 1950 refit 0.86 km (Mars) / 0.79 km (Pluto) | Present: Horizons system-barycentre fits for all eight (method, ICRF -> ecliptic J2000 via Orb, TDB read as TT under 2 ms, span 1950-2045, `worstErrorKm` in the file, 1 km target, accuracy note path, rebuild and fixtures). Old method and figures kept in a dated "History" paragraph. |
| NPM_PACKAGING `Size limits for the pack check (step 3)` | Measured + limit columns | Measured column kept verbatim; limits owned by `LIMITS` (linked); the engine's first limit 12 MB / 14 MB / 450 kept as history in its row; the single-package proposed limit kept in its row. Other rows' limits equal the code (T-434 C21), so dropping the column loses no history. |
| RELEASING step 4 | "(about 5 minutes ...)" | Link to the limit in `agents/build.md` (C19: copied, undated timing) |
| RELEASING table row "example app" | "at a Full Objective Check" | "at every release; at a Full Objective Check only when the diff touches packaging, `examples/` or the public API" with a browser-policy link (C18, `browser-policy.md:18`) |
| `tools/check-packs.mjs:3` | "Limits come from docs/NPM_PACKAGING.md" | Limits owned here (`LIMITS`); the doc links to them and keeps the 2026-10-23 measurements (comment only; C21/M13) |

### Commands

- `npx prettier --check tools/check-packs.mjs`: pass (Prettier ignores Markdown in this repo).
- `node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js tools/check-packs.mjs`: pass, 0 problems.
- `npm run typecheck`: pass.
- `npx vitest run packages/astraeus-site/tests/packagePacks.test.ts packages/astraeus-site/tests/workflowParity.test.ts packages/astraeus-site/tests/releaseBreaks.test.ts`: 3 files, 52 tests passed (packagePacks covers check-packs.mjs; workflowParity reads the RELEASING table; releaseBreaks cites RELEASING step 3).
- No publish tool run, no browser run, no build (no tooling or entry change).

### Files changed

`docs/RELEASING.md`, `docs/NPM_PACKAGING.md`, `docs/ASTRONOMY_VALIDATION.md`, `docs/MOON_ORBITS.md`, `docs/README.md` (providers row names the new section), `packages/astraeus/data/ephemerides/README.md` (packed in npm), `tools/check-packs.mjs` (comment only), this Task.

### Limitations

- T-434 C5 (`docs/architecture/state-and-assets.md`) was already amended by T-438; not touched.
- `packages/astraeus/NOTICE` not touched (owner corrected it).
- The packed ephemerides README names `docs/architecture/planet-accuracy-o063.md` as a repository path (plain text), since `docs/` is not in the npm pack.
- Word counts grew; no trim target was set for these guides.

## Drift Notes

None: no architecture change. Design "Planet positions from Horizons" and "Size budgets are split" already match; this Task brought the guides and the packed ephemerides README in line with them.

## Coordinator (gates)

2026-11-22, coordinator (orchestrate-g024-20261122): Reviewed the report and file list; builder ran prettier/eslint/typecheck and vitest on packagePacks, workflowParity, releaseBreaks (52 passed). check-packs.mjs change is comment-only. packages/astraeus/data/ephemerides/README.md added to planned_writes for C6a (ships in the pack). Guides grew slightly with date labels; the Objective sets no percentage target. Marked done under the standing rule (owner, O-038: "I mark them as they pass") and the owner's "carry on orchestrating G-024".
