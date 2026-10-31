---
id: T-212
title: Prove Uranus's moons on the packed package and write it up
objective: O-049
status: in_progress
stage: audit
depends_on: [{task: T-211, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-212, reason: 'Owner said "orchestrate O49"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o049-run-20261031}, recorded_at: '2026-10-31T12:36:46Z'}
planned_by: {role: planner, session: probe-feedback-3-20261031}
---

# Prove Uranus's moons on the packed package and write it up

## Outcome

The packed package adds Miranda, Ariel, Umbriel, Titania and Oberon in a 1986 Sun-first scene with `astraeus-data-uranus` and draws them and their orbit lines; checked in a browser and by the owner; docs and Design reconciled (I-122).

## User Check

Open `localhost:5490/app.html?experience=synthetic-journey` (or the synthetic Uranus scene the step names): pick Uranus in January 1986 and zoom in; its five main moons show as grey spheres with orbit lines; labels read Miranda, Ariel, Umbriel, Titania, Oberon.

## Done When

- A synthetic scene (made-up path, no mission data; ARCH-01, ARCH-03) near Uranus in 1986 adds the five moons with `{ orbit: true }`; a browser case reads that they draw (driver readouts, no screenshots).
- `npm run check:node-consumer` adds Miranda and Titania with `{ orbit: true }` on the packed package.
- One `npm run check:browser` passes.
- README, CHANGELOG `Unreleased`, API reference agree; every earlier drift note reflected in `.savepoint/Design.md` or marked non-architectural with a reason.
- Owner look on `localhost:5490`, recorded before the Full Objective Check.

## Context Files

`packages/astraeus/src/synthetic/syntheticJourneyScene.ts`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `tools/check-node-consumer.mjs`, `.savepoint/Design.md`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` (sections touched by this Objective's drift notes).

## Guardrails

ARCH-01, ARCH-03, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Synthetic 1986 Uranus scene; browser case; node-consumer case.
3. Docs; Design reconciliation.
4. One `npm run check:browser`; leave the owner look to the coordinator.

## Boundaries

No new pictures or mission data.

## Technical Verification

Lint, typecheck, build, test gates, `check:node-consumer`, then one `npm run check:browser`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Started 2026-10-31: `status: in_progress` / `stage: build` set first; router not edited (brief). Final stage `audit` (ready for a Check; not passed). Step check waived by the run rules (owner look and Full Objective Check follow).

Per criterion:
- Synthetic scene near Uranus in 1986: `src/synthetic/syntheticJourneyScene.ts` now passes Uranus on 24 January 1986 (made-up straight legs Saturn -> Uranus -> 170 AU; no mission data or names; ARCH-01, ARCH-03) and adds `addBody(uranus, { orbit: true })` and `"miranda"`, `"ariel"`, `"umbriel"`, `"titania"`, `"oberon"` each `{ orbit: true }`, by id (the listed-moon rule). Site `journeyData.ts` hands the `astraeus-data-uranus` chunks (planet and five moons) to `toDefinition`. Test `tests/syntheticJourney.test.ts` ("adds Uranus's five main moons by id with orbit lines, and passes Uranus in January 1986"; events now three; 170 AU end kept).
- Browser case (`browser-smoke.mjs`, `nearUranusChecks` inside `journeyChecks`, readouts only, no screenshots): at 1986-01-24 with Uranus picked all five moons are in the scene (`as` not "none"), `<id>-orbit` paths visible for all five, and each moon, picked and approached, draws as a sphere with radius over 20 px in view; labels read. Passed in the final `npm run check:browser` smoke step (synthetic-journey desktop and phone ok). Finding on the way: the moons are true size, so at Uranus's closest zoom they show as 1 to 3 px markers; hence the case approaches each moon.
- Real defect found and fixed by the first browser run (page error `unknown body "miranda"`): `compositionPathLayer` in `src/app/PathView.ts` read the global catalogue, so an orbit line for a scene-local listed moon threw at mount. It now takes the scene's catalogue (`sceneHooks.ts` passes `runtime.catalogue`). Guard added (strategic fix): `tests/sceneCatalogueReach.test.ts` fails if any `src/app` file other than `sceneFraming.ts` and `sceneLayout.ts` (parameter defaults) imports the built-in catalogue unaliased, and proves a composition path for Miranda needs the scene catalogue.
- `npm run check:node-consumer` pass: adds Miranda and Titania with `{ orbit: true }` on the packed package (Titania's line span 8.706 d), `listedMoons('uranus')` lists the five, and a Miranda without `astraeus-data-uranus` throws naming it.
- Docs: CHANGELOG `Unreleased` line added; README and API reference already carry `addBody` by id and `listedMoons` (T-211) and agree; no new public API in this step.
- Design reconciliation: all drift notes of T-210 and T-211 are in `.savepoint/Design.md` as the paragraph "Every listed moon addable (O-049, I-122)" after the O-048 paragraph: `core/bodies/listedMoons` and `orbitPeriodDays` (T-210); the scene catalogue extension, `toDefinition` passing `catalogue`, `installData` taking it, `MOON_SYSTEMS` move, optional `MoonSystem.position`/`worstM`, `early` flag and `listedMoons(planet?)` (T-211); the Io/Europa period difference (T-210; kept as a rule for any later Jovian use). The T-212 scene change and the PathView fix are non-architectural (a scene and a missed catalogue argument; guarded by the new test).

Commands run (final state): `npm run lint` clean; `npm run typecheck` clean; `npm run build`; `npm test` 162 files, 2029 passed, 1 skipped; `npm run check:node-consumer` pass; `npm run check:browser` four times (see Limitations): the final run `docs/evidence/browser-20261031T123014Z`, 2026-10-31: smoke (all views, synthetic-journey included) pass, smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-addresses pass; `public-build-assets` FAILS on the public load budget only: `app.html (Apollo 11)` is 4,486,131 B raw against the 4,470,000 limit (gzip within 2,900,000); not raised (owner decision).

Files read: Task, Objective via brief, T-210 and T-211 evidence, Context Files (syntheticJourneyScene.ts, browser-smoke.mjs, check-node-consumer.mjs, Design.md, browser-policy.md). Extra reads (path, reason): `packages/astraeus-site/src/journeyData.ts` (data sources for the journey), `tests/syntheticJourney.test.ts` (existing journey test), `src/app/PathView.ts`, `sceneCamera.ts`, `sceneHooks.ts` (the unknown-body error), `src/assets/catalogue.ts` (where the message comes from), `packages/astraeus-data-uranus` index and folders (which chunks exist), the failed runs' logs under /tmp/astraeus-check-logs-*.

Files changed: packages/astraeus/src/synthetic/syntheticJourneyScene.ts; src/app/PathView.ts; src/app/sceneHooks.ts; tests/syntheticJourney.test.ts; new tests/sceneCatalogueReach.test.ts; packages/astraeus-site/src/journeyData.ts; packages/astraeus-site/tools/validate/browser-smoke.mjs; tools/check-node-consumer.mjs; packages/astraeus/CHANGELOG.md; .savepoint/Design.md; this Task. New evidence folder docs/evidence/browser-20261031T123014Z (three failed earlier run folders, cited nowhere, removed).

Limitations: `check:browser` ran four times, not once: runs 1 to 3 failed on a real engine defect (fixed) and then on my own case being wrong about moon size (corrected); the budget failure was the same in all four. The final run is not fully green because of the load budget alone. Appearance not judged (owner look pending). Orbit-line and sphere checks are readouts, not a look at the picture. The Uranus moons are grey spheres by the listed-moon rule; no pictures (boundary).

- Owner look (2026-10-31T12:36:46Z, session o049-run-20261031): the owner opened `localhost:5490/app.html?experience=synthetic-journey`, went to the made-up Uranus pass, saw the five orbit lines and picked each of the five moons, and answered "Looks good, run final check".
- Owner decision (2026-10-31T12:36:46Z): Apollo 11 public-page raw load budget raised 4,470,000 → 4,490,000 B ("Raise to 4.49 MB"); gzip limit unchanged. The four check:browser runs above all failed only on this budget; the Full Objective Check reruns it.

## Drift Notes

- None new architecture. Reconciled into Design.md (paragraph "Every listed moon addable (O-049, I-122)"): T-210 notes (lookup, `orbitPeriodDays`, Io/Europa period difference) and T-211 notes (scene catalogue extension, `toDefinition`/`installData`, `MOON_SYSTEMS` move, `early`, `listedMoons`). Non-architectural: the Uranus pass in the synthetic journey and the `compositionPathLayer` catalogue argument (guarded by tests/sceneCatalogueReach.test.ts).
