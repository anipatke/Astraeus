---
id: T-321
objective: O-076
title: Offer the Milky Way picture on its own
status: done
depends_on: [{task: T-320, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-321, reason: 'Owner said "orchestrate o76" (orchestrate O-076) under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: plan-o076-20261116}, recorded_at: '2026-11-16T09:29:54Z'}
planned_by: {role: planner, session: plan-o076-20261116}
---

# Offer the Milky Way picture on its own

## Outcome

A sky-only app imports `milkyWaySource` from `astraeus-data/milky-way` and its build copies the Milky Way picture alone, not the moon and Venus maps (Zodiac review F-06); `astraeus-data`'s main export is unchanged.

## User Check

None required; proven by a packed build. The owner may open the hello-sky example as today.

## Done When

- The Milky Way picture and its licence record live in their own module (for example `src/milkyWay.ts`), imported by `src/pictures.ts` so `PICTURES["milky-way"]` and `dataSource` are byte-for-byte the same values as 0.9.1.
- New subpath `astraeus-data/milky-way` in both `exports` and `x-publish.exports` (types and import), exporting `milkyWaySource: DataSource` (`name: "astraeus-data/milky-way"` or similar, `provides: []`, `pictures: { "milky-way": ... }`) and the picture record. Passing it in `mount(..., { data: [milkyWaySource] })` gives the sky its Milky Way exactly as `dataSource` does.
- Proof on a packed build: `examples/hello-sky` installs `astraeus-data` (add it to `EXTRA_PACKAGES` in `tools/build-example.mjs`), imports `milkyWaySource` and passes it to `mount`; a check (in the existing example/pack tooling or a test over hello-sky's built output) fails if any `.jpg` other than the Milky Way is emitted. `measure:example hello-sky` stays within its limit (pictures are not counted; report the number).
- Node consumer: `check:node-consumer` (or a test) imports `astraeus-data/milky-way` under Node without error, as the main export does; `check:pack` file lists accept the new file.
- README section for the subpath; CHANGELOG `Unreleased`; configured gates pass. Peer stays `>=0.9.0 <0.10.0`.

## Context Files

- `packages/astraeus-data/src/pictures.ts`
- `packages/astraeus-data/src/index.ts`
- `packages/astraeus-data/package.json`
- `packages/astraeus-data/README.md` (headings via grep; read the one about using the package)
- `packages/astraeus-data/CHANGELOG.md` (top only)
- `tools/build-example.mjs`
- `tools/check-packs.mjs` (the file-list rules only)
- `tools/check-node-consumer.mjs`
- `examples/hello-sky/src/main.js`
- `examples/hello-sky/package.json`
- `.savepoint/objectives/O-076-constellation-data-and-0-9-2-notes/Objective.md`

## Design References

Design `Public API shape (G-016, owner 2026-11-01)`; `Current Technical State` (package exports and Node twins). Objective O-076 `Design Decisions` D3.

## Guardrails

PROV-02, API-01, API-07, TEST-01..03.

## Implementation Plan

1. Move the Milky Way record into its own module; re-import it in `pictures.ts`.
2. Add the subpath entry file and both `exports` maps; make sure the build (`tools/build-packages.mjs`) emits it with types.
3. Wire hello-sky to it and add the emitted-pictures check; run `check:pack`, `check:node-consumer`, `measure:example hello-sky`.
4. README, CHANGELOG.

## Boundaries

No new package, no change to `dataSource`, `PICTURES` or any picture file, no engine change, no browser run (the browser gate at the Full Check covers hello-sky).

## Technical Verification

Focused tests while iterating; configured gates at handoff plus `npm run check:pack`, `npm run check:node-consumer` and `npm run measure:example hello-sky`. Evaluated later under `agent-skills/references/check-method.md`. Hello-sky now draws the Milky Way; the Full Check's one browser run covers it.

## Technical Evidence

Cases: `packages/astraeus/tests/milkyWaySource.test.ts` (2: the subpath source is the Milky Way alone, `provides: []`, name `astraeus-data/milky-way`; its picture is the same object, licence included, as `PICTURES["milky-way"]` and `dataSource.pictures["milky-way"]`); `packages/astraeus-site/tests/measureExample.test.ts` (2 new: the emitted-pictures check). Existing tests untouched in setup (`skyPicture.test.ts` passes).

Emitted-pictures proof: `tools/measure-example.mjs` now, for `hello-sky`, fails when the build emits any `.jpg` that is an `astraeus-data` picture (names read from `packages/astraeus-data/src/textures`) other than `milky-way`; it ran on the packed build: "pictures: only milky-way emitted" (the engine's own 2k planet pictures are not astraeus-data's and are not checked). `examples/hello-sky/dist/assets` holds `milky-way-*.jpg` and the engine's own 2k planet maps, no moon or Venus-8k map.

Gates: lint pass; typecheck pass; build pass; test 265 files / 4047 passed, 2 skipped (first run had 1 failure, the API-01 surface lock, fixed by listing the subpath in `packages/astraeus/CHANGELOG.md` and `npm run api:lock`); `check:pack` pass (astraeus-data 125 files of 130, 35.57 MB packed of 39, 36.17 unpacked of 39); `check:node-consumer` pass (12 tests, now packs astraeus-data and imports `astraeus-data` and `astraeus-data/milky-way` under Node); `measure:example hello-sky` first-open 1,775,626 raw / 511,211 gzip bytes (pictures not counted), no limit changed.

Files changed: `packages/astraeus-data/src/milkyWay.ts` (new), `src/pictures.ts`, `package.json` (exports and x-publish.exports), `README.md`, `CHANGELOG.md` (the package's own changelog, new Unreleased section); `packages/astraeus/CHANGELOG.md` (Unreleased entry the surface lock requires), `packages/astraeus/api-surface.lock.json`; `examples/hello-sky/src/main.js`; `tools/build-example.mjs`, `tools/check-node-consumer.mjs`, `tools/measure-example.mjs` and `.d.mts`; the two test files above. No picture or licence file changed; `PICTURES` and `dataSource` values are the same objects as before.

Extra reads: `packages/astraeus-site/tests/measureExample.test.ts` and `tools/measure-example.mjs` (where the build-output check lives), `tools/build-packages.mjs` heads (jpg rewrite). No browser run.

## Drift Notes

Record the new subpath and the hello-sky change for Design reconciliation before the Full Objective Check.

Deferred to the O-076 integration/notes Task: new subpath `astraeus-data/milky-way` (`milkyWaySource`, `src/milkyWay.ts`; `PICTURES` re-uses its record) for Design `Public API shape` and `Current Technical State` (package exports and Node twins). `examples/hello-sky` now installs `astraeus-data` and mounts with `{ data: [milkyWaySource] }`, so it draws the Milky Way (the Full Check browser run covers it). `tools/measure-example.mjs` gained the emitted-pictures check; `check-node-consumer` now also packs `astraeus-data`.

- Coordinator (2026-11-16T09:39:42Z): accepted (the emitted-pictures check covers astraeus-data's pictures only, as the engine's own planet maps legitimately ship; api lock rerun for the new subpath). Gates pass (lint, typecheck, build, test 265 files / 4047 passed / 2 skipped; check:pack, check:node-consumer, measure:example hello-sky 1,775,626 B raw / 511,211 B gzip first open, "pictures: only milky-way emitted"); marked done per the owner's "orchestrate o76".
