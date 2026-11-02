---
id: T-252
title: Give each viewer its own pictures
objective: O-055
status: done
depends_on: [{task: T-251, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-252, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o055-run-20261102}, recorded_at: '2026-11-02T09:10:30Z'}
planned_by: {role: planner, session: o055-planning-20261102}
---

# Give each viewer its own pictures

## Outcome

A viewer draws a data package's pictures only when that package was passed to it, and the page-wide picture book is gone, so two viewers with different packages each draw their own looks in whatever order they load (O-055 Success Condition 3 and Architectural Considerations; API-03; DATA-01).

## User Check

Not owner-facing as a step: one viewer with its packages draws exactly the pictures it drew before, which the DOM tests and the Full Objective Check's browser run prove. The owner's one look is at T-258.

## Done When

- Every read point of the book is listed in Technical Evidence before the change and each is moved off it; the planner found: `withPicture` (`src/assets/pictures.ts`, used by `assets/bodies/listedMoons.ts`, `galileanMoons.ts`, `io.ts`, `planetSystemMaps.ts`), the Venus large variant (`assets/bodies/venus.ts`, `pictureOf("venus-8k")`), the Milky Way tiles (`assets/sky.ts`, `milkyWayTiles`), the rights check in `assets/catalogue.ts`, and `describeBody` in `app/bodyDraw.ts`. More than these, or a read that cannot reach the viewer's definition without a change of State, returns REPLAN REQUIRED.
- A body look names its picture (for example `picture: "titan"`, the Venus desktop variant by name) instead of a getter over a global map; the `ExperienceDefinition` a viewer draws carries the pictures of its own packages (from `installData` for `mount` and `AstraeusScene`), and the draw code resolves names there, the way `desktopTextures` already travels from the definition to `BodyView`. The texture rights check runs on the pictures a viewer is given. `registerPictures`, `pictureOf`, `registeredPictures` and `clearPictures` are removed; the site (`packages/astraeus-site/src/registerData.ts`, `main.tsx`) and any demo definition hand their pictures in through the definition instead (the site's deep-import count falls; lower `DEEP_IMPORT_COUNTS` to match).
- Paths, each a row of one table-driven test (new `packages/astraeus/tests/viewerPictures.test.ts`, or extend `pictureList.test.ts`): a sphere body texture; a listed moon; a ring or system map that uses a picture; the Venus large variant; the Milky Way; each with its package passed (picture used) and without it (flat colour or no Milky Way, as today when unregistered). `vitest.setup.ts` no longer registers pictures globally; tests that relied on it pass pictures in, each edit recorded.
- The pictures placeholder of `packages/astraeus/tests/twoViewers.test.ts` becomes a real case per pairing: viewer A with `astraeus-data`'s pictures and viewer B without; B draws no picture of A's, in both load orders.
- CHANGELOG Unreleased gains one line (pictures come only from the packages passed to that viewer). The public surface does not change (the removed functions were never on the front door): `git diff --exit-code -- packages/astraeus/api-surface.lock.json` is empty; `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/assets/pictures.ts`, `packages/astraeus/src/assets/catalogue.ts`, `packages/astraeus/src/assets/sky.ts`, `packages/astraeus/src/assets/bodies/venus.ts`, `packages/astraeus/src/app/bodyDraw.ts`, `packages/astraeus/src/app/BodyView.tsx`, `packages/astraeus/src/app/experienceDefinition.ts` under `ExperienceDefinition`, `packages/astraeus/src/api/data.ts`, `packages/astraeus/src/api/assembleScene.ts`, `packages/astraeus/vitest.setup.ts`, `packages/astraeus-site/src/registerData.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts` under `DEEP_IMPORT_COUNTS`, `packages/astraeus/tests/twoViewers.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` and `Asset architecture (O-014)`; the O-055 Objective under `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F1, F3).

## Guardrails

ARCH-02, API-01, API-03, DATA-01, PROV-02, TEST-01, TEST-03, STYLE-02, STYLE-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. List every read of the picture book; stop with REPLAN REQUIRED if the list is materially longer than the planner's.
3. Give looks a picture name; carry the viewer's pictures on the definition; resolve at draw time and in the sky.
4. Move the rights check; remove the book; hand the site's and demos' pictures in.
5. Table test, two-viewer case, test-setup edits; CHANGELOG line; gates.

## Boundaries

Pictures only. No new public member; `DataSource.pictures` keeps its shape. Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the Full Objective Check's one `npm run check:browser` proves the site still draws its pictures. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

### Read points of the picture book (listed before the change)

1. `withPicture` (assets/pictures.ts): used by `bodies/listedMoons.ts`, `galileanMoons.ts`, `io.ts`, `planetSystemMaps.ts` -> looks now carry `picture: "<name>"`.
2. Venus large variant (`bodies/venus.ts`, `pictureOf("venus-8k")` getter) -> `desktopPicture: "venus-8k"` on the look.
3. Milky Way tiles (`assets/sky.ts` `milkyWayTiles`, `MILKY_WAY_PICTURE`, `SkyView`) -> `milkyWayPicture(pictures)`; `SkyView` takes `pictureSet`.
4. Rights check (`assets/catalogue.ts`): the catalogue still checks the engine's own textures; the pictures a viewer is given are checked in `installData` (`picturesProblem`, `bad-data`).
5. `describeBody` (`app/bodyDraw.ts`) -> takes the viewer's `pictures`; `BodyView`/`SceneBody`/`SceneRuntime` carry them.
6. NOT in the planner's list, found by grep: `astraeus-demo-planets/src/experiences/planets/planetDefinition.ts` read `catalogue.get(moon.id).visual.texture?.url` for the moon panel discs. Handled in the same change (the demo imports `PICTURES` from `astraeus-data`, hands it in as its definition's `pictures`, and builds the panel urls from it); no State change needed, so no REPLAN.

### Entry paths (each covered)

- `mount` data -> `assembleScene` -> definition `pictures` (twoViewers: mount+mount, mount+AstraeusScene).
- `<AstraeusScene data>` -> same builder (twoViewers: AstraeusScene+AstraeusScene).
- Hand-built definitions (site, planets demo): `definition.pictures` -> App `buildRuntime` -> `SceneRuntime.pictures` -> `BodyView` and `SkyView`.
- Each of the five picture paths with and without the package: `viewerPictures.test.ts` table.

### Gates (2026-11-02)

- `npm run lint`: clean. `npm run typecheck`: clean. `npm run build`: built. `npm test`: 194 files, 2409 passed, 3 expected fail, 9 todo, 1 skipped.
- `npm run check:pack`: pass. `npm run check:react-consumer`: pass.
- `git diff --exit-code -- packages/astraeus/api-surface.lock.json` after `npm run api:lock`: empty. apiSurface/apiRules/allowlistGrowth/packageBoundaries tests: 40 passed.
- twoViewers.test.ts + viewerPictures.test.ts run 10 times in a loop: 10 of 10 passed.
- DEEP_IMPORT_COUNTS astraeus-site lowered 94 -> 93 (registerData.ts deleted). No allowlist entry added. No browser run.

### Test edits recorded

- `vitest.setup.ts` no longer registers pictures. Tests that read `visual.texture` of pictured bodies now resolve through the pictures: jupiterIo, planetMoonSystems, textureLicence (`textureOf(visual, PICTURES)`), publicApi (rewritten registers-test into a definition test plus a rights-refusal test), sky/skyPicture (`pictureSet: milkyWayPicture(PICTURES)`), demo-planets mapOrientation/jupiterMoonsScene, demo-showers venusMap (describeBody given PICTURES; 8k variant built from `PICTURES["venus-8k"]`), site assetsPageCredits/assetsSections (licence via the named picture). No expectation weakened; scenePin/viewerLinkPin unchanged (a definition without pictures omits the key).
- New: `packages/astraeus/tests/viewerPictures.test.ts`; `twoViewers.test.ts` placeholder T-252 is now real (both load orders, three pairings).
- CHANGELOG Unreleased entry added.


## Drift Notes

Record architecture deltas here; T-258 reconciles them into Design.md.

- (T-258) Design "Asset architecture (O-014)": the page-wide picture book is gone. `BodyVisual` gains `picture` and `desktopPicture` (names); `ExperienceDefinition.pictures` carries a viewer's pictures from `data` (assembleScene) or hand-built (site, planets demo) to `BodyView` (`describeBody(..., pictures)`) and `SkyView` (`pictureSet`). `installData` no longer registers pictures; it checks their rights.
- (T-258) The planets demo imports `PICTURES` from `astraeus-data` and hands it in on its own definition (also feeds the moon panel's disc urls); the site merges `PICTURES` under every definition in `main.tsx`.
