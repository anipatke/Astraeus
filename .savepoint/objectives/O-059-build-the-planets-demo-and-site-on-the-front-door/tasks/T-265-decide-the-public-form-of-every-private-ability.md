---
id: T-265
objective: O-059
title: Decide the public form of every private ability
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
check_waiver: {task: T-265, reason: 'Owner said "orchestrate O-59" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o059-run-20261106}, recorded_at: '2026-11-06T09:42:27Z'}
---

# Decide the public form of every private ability

## Outcome

One note lists every engine internal the planets demo and the site use, in source and tests, and gives each its destination: public feature (with its proposed name and shape), moved into the site or demo, moved into the engine's tests, or deleted. Later steps build from this note instead of guessing.

## User Check

Open `docs/architecture/o059-public-forms.md`: every row names one internal ability and where it goes, in plain words, with no row left open.

## Done When

Every deep import counted for `astraeus-demo-planets` and `astraeus-site` maps to a row. The note settles: the public shape of moon dots, the moon family panel, tagged places and the picker; where the places data lives and how the demo reaches it without `astraeus/data/*`; how fit errors, moon list facts and `moonSourceTitles` reach the demo; scene centre, desktop pictures, info card facts, items left out of the menu; page heading, loading cover and in-page address changes; which of the nine made-up scenes rebuild, which drop or move; which tests move into the engine. Each proposed name passes API-04 and ARCH-06 by reading.

## Context Files

`.savepoint/objectives/O-059-build-the-planets-demo-and-site-on-the-front-door/Objective.md`, `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-demo-planets/src/experiences/planets/planetDefinition.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`, `Experience plug-in boundary`.

## Guardrails

API-01, API-04, API-06, ARCH-01, ARCH-03, ARCH-06.

## Implementation Plan

1. List deep imports per package, split by source, tests and tools.
2. Group them by ability and give each a destination.
3. Write proposed public signatures for the four new features, following the verb grammar.
4. Record any ability with no clean public form as an open gap and return REPLAN REQUIRED; do not invent one.

## Boundaries

Research only: no code changes. No renames of existing names (O-057).

## Technical Verification

Compare the note's rows against a fresh deep-import listing; no gates needed for a docs-only step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Docs-only step. Stage audit means ready for a Check, not passed.

**Per criterion (Done When):**

- Every deep import maps to a row: MET. Fresh listing by a scratch script using the `deepImportCounts` rule: planets 65 src + 58 tests + 0 tools = 123; site 17 src + 75 tests + 0 tools = 92; both equal `DEEP_IMPORT_COUNTS`. The script that writes Appendix A exits on any unmapped import; it mapped all 215 across 37 files. A second listing diffed empty against the first.
- Public shape of moon dots, moon family panel, tagged places, picker: MET, note section 2 (`addBodySet`, `setMoonPanel`, `addPlaces`, `setPicker` with `pick`, `setPick`, `onPick`).
- Places data home and how the demo reaches it without `astraeus/data/*`: MET, section 4 (`astraeus-data`, retargeted literal globs, Jupiter-only unchanged).
- Fit errors, moon list facts, `moonSourceTitles`: MET, section 4 table (lists and fit errors to `astraeus-data-<planet>`, parser to the demo, `sources` option).
- Scene centre, desktop pictures, info card facts, items left out of the menu: MET, sections 3 and 5 (S32 to S35). Scene centre needs no new setting: it is the first body.
- Page heading, loading cover, in-page address changes: MET, S26 to S28.
- Which of the nine scenes rebuild, drop or move: MET, section 6 (5 rebuild, 3 move, `synthetic-bare` dropped: `Scene` refuses a bodiless scene).
- Which tests move into the engine: MET, section 7 (T1 to T22), including how each resolves under `check:engine-alone`.
- Each proposed name passes API-04 and ARCH-06 by reading: MET, section 9, against `UNIT_SUFFIX`, `TIME_LIKE` and the `unitless` list in `apiTypeLint.allowlist.json`. By reading only; no lint was run on code that does not exist yet.

No ability needed REPLAN REQUIRED.

**Verified from the brief:** `alternates` and `developerSections` are unset by every definition (grep across `packages`). `data/bodies` does not ship: `packages/astraeus/dist/data` (built 2026-11-03, version 0.7.0) holds ephemerides, moons, orbits, rings only, and `tools/build-packages.mjs` compiles only imported JSON. Brief corrected: planets tests 58 (not 56), site src 17 (not 15).

**Commands:** read-only `grep`, `sed`, `git`, plus scratch scripts; `savepoint resume`. `npm pack --dry-run` in `packages/astraeus` returned no usable JSON, so packaging rests on `dist` and the build script. Configured gates (lint, typecheck, build, test) not run: the Task's Technical Verification says none are needed for a docs-only step, and no code changed.

**Files changed:** `docs/architecture/o059-public-forms.md` (new); this Task; `Objective.md` (status).

**Files read:** the Task's Context Files (`Design.md` under the named sections, `experienceDefinition.ts`, `api/index.ts`, `main.tsx`, `planetDefinition.ts`, `packageBoundaries.test.ts`), `docs/agents/verification.md`.

**Extra reads, logged at handoff rather than before each read (a slip against the skill's order):** to trace each ability to its code: `packages/astraeus/src/api/{scene,mount,AstraeusScene,viewerHandle,data,assembleScene,planBodies,planCamera,group,look,switches,bodies,activity,story}`; `src/app/{bodySet,listSwitch,addressNavigation,catalogueItem,bodyMetrics,sceneBodySets}`, `App.tsx` and `sceneFrame.ts` by search; `src/shell/{moonFamilies,MoonFamilyPanel,bodyFeatures,SwitchControl,experience,bootLoader,objectModel,viewCamera}`, `AstraeusShell.tsx` by search; `src/assets/{moonCatalogue,compositions}` and catalogue files; `src/core/{ephemerisGroup,provenance,elementsBody}`, `core/bodies/{listedMoons,listedMoonBodies,planetMoons,moonSystem}` in part; `src/synthetic/*`. For the demos and site: `astraeus-demo-planets/src/experiences/planets/*`, `astraeus-site/src/*`, `astraeus-site/tools/validate/{public-build-assets,load-budget,driver}` by search, outlines of the site and planets test files. For data and gates: `astraeus-data*/package.json`, `astraeus-data-jupiter/src/index.ts`, `tools/{build-packages,check-packs,check-engine-alone,api-rules}.mjs`, `apiTypeLint`, `apiSettings`, `apiOutsideTypes` allowlists, `tests/{addressRule,apiImports}.test.ts`, `vitest.setup.ts`, `tests/domSetup.ts`, `tests/scenePlacement.ts`. Owner memory notes on moon data, story data, Jupiter-only, modularity and faithful ports.

**Limitations:**

- Parity traps (note section 8) come from reading code, not from running old and new side by side; T-270's comparison must prove them. The `tidalLockNote` default is the one most likely to differ per moon.
- Elements members for `addBodySet` assume a new group over the two-body adapter can serve the `EphemerisGroup` shape, including `memberLoadedFromUtcMs`. Not prototyped.
- `setStartView` was judged needed from reading `AstraeusShell` preset handling; not run.
- Test splits in section 7 were decided from `describe`/`it` outlines and import lists, not full reads of each test.
- The owner's look is not involved in this step.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective.

Deferred to T-273 (AGENTS.md "Deferred Design reconciliation"), from `docs/architecture/o059-public-forms.md`:

- Places data moves to `astraeus-data` and moon lists and fit errors to `astraeus-data-<planet>`: the codebase map and asset architecture need updating; the published `astraeus-data` no longer holds pictures only.
- Moon list parsing leaves the engine for the demo.
- `packages/astraeus/src/synthetic/` stays as engine fixtures while the preview scenes live in `packages/astraeus-site/src/synthetic/`.
- `onFirstFrame` is a new signal beside `ready`.
- The Objective's "Every other private ability" lists scene centre as needing a home: it is already public as the first body, so no setting is added.
