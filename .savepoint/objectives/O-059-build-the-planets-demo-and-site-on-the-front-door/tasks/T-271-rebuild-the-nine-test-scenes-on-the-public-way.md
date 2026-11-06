---
id: T-271
objective: O-059
title: Rebuild the nine test scenes on the public way
status: done
depends_on: [{task: T-270, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
check_waiver: {task: T-271, reason: 'Owner said "orchestrate O-59" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o059-run-20261106}, recorded_at: '2026-11-06T17:15:05Z'}
---

# Rebuild the nine test scenes on the public way

## Outcome

The made-up scenes on the local preview are built with `Scene`, so they prove the public features on scenes that are not our demos.

## User Check

`npm test` passes; each scene the note keeps opens from a public `Scene` builder.

## Done When

Each scene the note keeps builds through public calls; each dropped or moved one is recorded with where its proof now lives; browser scripts that open them are updated; no check loses its proof that the engine is not tied to our demos (ARCH-03). Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus/src/synthetic/syntheticDefinition.ts`, `packages/astraeus/src/synthetic/syntheticRingDefinition.ts`, `packages/astraeus/src/synthetic/syntheticListedDefinition.ts`, `packages/astraeus/src/synthetic/syntheticEccentricDefinition.ts`, `packages/astraeus/src/synthetic/syntheticProbeDefinition.ts`, `packages/astraeus/src/synthetic/syntheticViewsDefinition.ts`, `packages/astraeus/src/synthetic/syntheticJourneyScene.ts`, `docs/BROWSER_CHECKS.md`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, ARCH-03, TEST-01, TEST-03.

## Implementation Plan

1. Rebuild scene by scene. 2. Point tests and browser scripts at the new builders. 3. Record any drop or move.

## Boundaries

No new test scenes. The site's own wiring changes in the next step.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-11-07 on branch o059-front-door (builder session; no commit, no browser run).

**Extra reads (all inside the Context Files budget plus these):** `packages/astraeus-site/src/main.tsx` (the DEFINITIONS wiring this step edits); `packages/astraeus/src/api/{scene,group,activity,planCamera,story,sceneReads}.ts` (public shapes the builders use); `packages/astraeus-site/tests/{packageBoundaries,allowlistGrowth,publicBuild}.test.ts` and `tools/validate/public-build-assets.mjs` (count, SYNTHETIC_KEYS, `checkNoSyntheticExperiences`); `packages/astraeus/package.json` exports (to confirm `astraeus/api/*` is not a public path).

**What changed.** Builders in `packages/astraeus-site/src/synthetic/`: `syntheticScene`, `syntheticRingScene`, `syntheticBeltScene`, `syntheticListedScene`, `syntheticEccentricScene` (rebuilt on `Scene`), `syntheticProbeScene`, `syntheticViewsScene`, `syntheticJourneyScene` (moved; `toDefinition` dropped, builders are functions), `madeUpOrbits` (seeded orbit spread and made-up elements records). `main.tsx` `SYNTHETIC` map points at them and calls `.toDefinition()` (stop-gap to T-272); `synthetic-bare` removed. `SYNTHETIC_KEYS` drops `synthetic-bare`; `checkNoSyntheticExperiences` reads the site folder. New `tests/syntheticScenes.test.ts` + `tests/fixtures/syntheticScenesBefore.json` (the five old definitions' facts, captured before switching). `DEEP_IMPORT_COUNTS["astraeus-site"]` 91 -> 83 (measured). `docs/BROWSER_CHECKS.md` gains the made-up-scenes paragraph. `packages/astraeus/src/synthetic/` and every test importing it are untouched.

**Where proof lives for dropped or moved scenes.** `synthetic-bare`: dropped from the preview; its bodiless proof stays in engine-fixture tests `experienceDefinition` ("offers a bare synthetic variant") and `compositions` ("bare" rows), which use `src/synthetic/syntheticDefinition.ts`. `synthetic-probe`, `-views`, `-journey`: moved unchanged, same addresses; browser steps `smoke` (probe, journey) and `views` open them as before and need no edit; DOM proof stays in engine tests on the engine copies (`syntheticViews`, `syntheticJourney`, `publicApiSunPaths`) and is repeated on the site copies by `syntheticScenes.test.ts`. The five rebuilt scenes' ARCH-03 proof stays in the engine tests (`syntheticRing`, `listedOrbitGroup`, `experiencePlugIn`, `syntheticStoryAnchors`, `sunCentred`, `longOrbitPaths`, `bodyMarkers`) until O-057, and now also in `syntheticScenes.test.ts` on public builders.

**Fidelity comparison (old fixture definition vs new `Scene`, 5 rebuilt scenes).** Identical: events (ids, times), timeline span, speeds, opening clock rate, story panel ids, contact window (id, span, peak, unit, 7 samples, 2 provenance spans), marker path (97 samples, 12 anchors `mark-1..12`), group ids and member counts (10,000 / 10,000 / 3,000), colours of groups, belt and eccentric camera reach (`maxFocusDistance` 400,000 / far 1,000,000 and 4,000,000 / 12,000,000), eccentric scales (`true-scale`, `solar-system`), Earth enlarge 200. Differences accepted, each with its reason: (1) Earth, Moon, Sun cards gain the catalogue's orientation known-limitations and the Sun colour; the Sun marker size 10 (`visualOverrides`) and the `sceneCenter` entry are not public (centre is the scene's first body). (2) Every body and group gets a Focus preset; Follow is kept only where it was via `setFollowChoices`; the old `sun-view` preset is `focus-sun`. (3) The far path, listed parent and eccentric orbit are now bodies on made-up elements (`addBodyFromElements`), so each has a menu entry and card beside its orbit line; lines start at periapsis (listed parent's line now spans its whole 5.5-year period and starts before 2030 because its start is a true anomaly of 100 degrees; far path ends ~17 days later than the old 9.5 years). (4) Where each dot sits along its orbit is the group's own even spread shuffled by seed, not the old fixture's per-member draw; orbit shapes are the same (same base, spread, seed). (5) The marker's card loses its contact-rate row (a rate readout belongs to a group, per the note); the window's own information shows the rate. (6) Earth's year line spans 365.25 days, not 365.256363 (34 s). (7) Scene layers now list `tracked-bodies` first for the ring, belt, listed and eccentric scenes (bodies from elements and catalogue bodies are drawn through that layer).

**Moved scenes' one change.** The probe needed the ecliptic-to-equator rotation, which it took from the engine's inside; it now reads the engine's own rotation through the public API (a path in the ecliptic plane given three unit vectors, asked where they land), so no second obliquity constant and no private import.

**Gates (2026-11-07):** `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass (also `ASTRAEUS_PUBLIC_BUILD=1`; the INEFFECTIVE_DYNAMIC_IMPORT warning for planetSeries in main.tsx is gone); `npm test` 221 files, 2916 passed, 2 skipped (the known happy-dom AbortError noise printed at teardown); `npm run check:engine-alone` pass. Public-build assets check (`node packages/astraeus-site/tools/validate/public-build-assets.mjs dist`): `synthetic.ok` true with the new folder's module names, `syntheticSelfProof` true; overall `ok: false` from `loadBudget` only, with the same 8 page problems and byte sizes at the unchanged baseline (stashed and re-measured): not caused by this step.

**Done When, item by item**

| Done When item | Evidence |
|---|---|
| Each scene the note keeps builds through public calls | `syntheticScenes.test.ts` "keeps what its fixture showed" x5 and "the three moved scenes" x3 (each calls `scene.check()`); builders import only from `astraeus` and local files (`packageBoundaries` count falls 91 -> 83, no builder deep-imports) |
| Each dropped or moved one is recorded with where its proof now lives | Evidence paragraph above; `docs/BROWSER_CHECKS.md` made-up-scenes paragraph; drop of `synthetic-bare` held by `publicBuild.test.ts` "lists the same entry keys main.tsx mounts" |
| Browser scripts that open them are updated | `browser-smoke.mjs` (probe, journey) and `journey-views.mjs` open unchanged addresses for the three moved scenes; the five rebuilt scenes have no browser script; `docs/BROWSER_CHECKS.md` updated (no browser run) |
| No check loses its proof that the engine is not tied to our demos (ARCH-03) | Engine fixtures and every test on them untouched (suite green); `syntheticScenes.test.ts` adds the same on public builders; `packageBoundaries` boundary tests green |
| Public builds leave the scenes out | `publicBuild.test.ts` entry-key and chunk checks; public-build assets `synthetic.ok` true |
| Site deep-import count does not rise, and falls | `DEEP_IMPORT_COUNTS["astraeus-site"]` 83 (was 91), measured by `packageBoundaries.test.ts`; `allowlistGrowth` green |

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.

- Section 6 of the note says the Sun-centred scenes use `addTrajectory` or `addBodyFromElements` for the far path; built on `addBodyFromElements` with made-up records (`classification: "indicative"` with a statement that it is made up, as `stateOfBodies.test.ts` does). The eccentric scene keeps the belt group as it did (the note's list omits it). No change to Design.md needed; deferred to T-273 reconciliation: none.
- `main.tsx` still takes `createViewsHost` from the engine fixture `astraeus/synthetic/syntheticViewsDefinition` (the one remaining synthetic deep import) because the link type is not public until the site mounts through `mount` (T-272 removes it, and the `ViewerLink` need with it).
- The journey builder stays synchronous and needs the planet series loaded first (the site's top-level `loadPlanetSeries`); a `Scene.load()` on a scene holding the planets does the same publicly (used in the new test).
- Pre-existing, not caused here: public-build `loadBudget` fails (unlisted `scene`/`storyPanels`/`moonListText` chunk imports and size limits on four pages) with identical numbers before and after this step; belongs to T-272/T-273 (trap 8 of the note).

