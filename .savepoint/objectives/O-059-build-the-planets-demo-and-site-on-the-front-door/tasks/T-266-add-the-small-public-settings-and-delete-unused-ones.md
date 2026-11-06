---
id: T-266
objective: O-059
title: Add the small public settings and delete unused ones
status: done
depends_on: [{task: T-265, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
check_waiver: {task: T-266, reason: 'Owner said "orchestrate O-59" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o059-run-20261106}, recorded_at: '2026-11-06T10:02:46Z'}
---

# Add the small public settings and delete unused ones

## Outcome

The small abilities the note marks public (such as scene centre, desktop pictures, info card facts and items left out of the menu) are public settings with defaults, and `alternates` and `developerSections` are gone.

## User Check

Read the README API tables: each new setting is listed with its default. A short made-up scene in a test uses each one.

## Done When

Each setting is reachable from `astraeus`, tested on a made-up scene (ARCH-03), in the surface lock, README and CHANGELOG; the deleted fields have no reader left; the planets demo and site still build. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/assembleScene.ts`, `packages/astraeus/src/api/planBodies.ts`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/DeveloperSettings.tsx`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-02, API-04, API-06, ARCH-01, ARCH-03, ARCH-06, TEST-01, TEST-03.

## Implementation Plan

1. Add each setting from the note, one at a time, with a test. 2. Delete `alternates` and `developerSections` and their drawing code. 3. Run `npm run api:lock`; update README and CHANGELOG.

## Boundaries

Only the settings the note names. No moon, place or picker features (later steps). The demos are not rebuilt here.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built by the T-266 builder (stage audit; no Task Check requested, no waiver recorded; Task not marked done).

Read (Context Files): docs/architecture/o059-public-forms.md (sections 3, 8, 11 only), packages/astraeus/src/api/{scene,assembleScene,planBodies}.ts, src/app/{experienceDefinition,App,DeveloperSettings}.tsx, README.md, CHANGELOG.md. Extra reads (path, reason): src/api/{planCamera,sceneReads,look,lookInput,viewerHandle,viewerLink,viewerLooks,AstraeusScene,mount,index,listeners,viewerZones}.ts and src/app/{look,liveLook,sceneFrame,AstraeusScene,viewerPort,catalogueItem}.ts(x), to wire the settings; tools/api-rules.mjs (read only) and packages/astraeus-site/tests/{apiRules.test.ts,apiSettings.allowlist.json}, because the surface rules failed on the new names; tests that read the deleted fields.

Done When, per criterion:
- Each setting reachable from `astraeus`, tested on a made-up scene (ARCH-03): listed, facts, sources, labelPriority, orbit lap, setBodyReadouts, setReach farEarthRadii, setStartView, setFollowChoices, SceneBodyRead.texture/listed/facts in packages/astraeus/tests/smallSettings.test.ts; desktopPictures in tests/desktopPictures.test.ts and tests/look.test.ts; onFirstDraw (mount handle, AstraeusScene prop, link) in tests/firstDraw.test.ts and tests/lifecycle.test.ts (handle member table). Both embedding paths: Scene calls reach both through toDefinition; handle members come from one viewerHandleOf; the prop is tested.
- In the surface lock, README, CHANGELOG: `npm run api:lock` run; apiSurface, apiRules (README tables, API-04 type lint, API-06 settings map) and allowlistGrowth tests pass.
- Deleted fields have no reader left: `alternates`, `developerSections`, `DeveloperSection`, the Data group of UnderTheHoodSettings and the "This demo" group are gone from src/; their tests removed or trimmed (developerSettingsDom, Apollo and Showers rebuildComparison, Showers tests). Grep finds only history text (CHANGELOG, a fixture JSON, docs/architecture notes).
- Planets demo and site still build: `npm run build` passes; the full test suite (both demos and the site) passes.

Commands run: npm run lint (clean), npm run typecheck equivalent `npx tsc --noEmit` (clean), npm run build (pass), vitest run of the whole workspace (210 files, 2633 passed, 2 skipped), npm run check:engine-alone (pass), npm run check:pack (pass), npm run api:lock.

Limitations: no browser run (not allowed). `onFirstDraw` fires one animation frame after the first frame is drawn, as the cover fade does; proved with the stubbed canvas, not a real WebGL frame. `desktopPictures` was proved at the App/runtime level (what reaches the scene's runtime and what `look` reads), not by loading a larger picture.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.

Drift (for the owner and the integration Task T-272 or later):
1. LookInput.desktopPictures needed an address parameter because the looks table (src/app/look.ts) maps every look to one; it is `?desktop=on|off`, mapped to `LookInput.desktopPictures` in the API-06 settings map (apiSettings.allowlist.json `public`, not `addressOnly`). README address table updated.
2. SceneCamera gained the read getters `farEarthRadii`, `pose` and `followChoices` (the class's getters are its public surface; `far` was refused by the unit rule, so it carries the unit).
3. `setFollowChoices` plus an opening `camera.follow` of an unlisted object throws `bad-camera` at build, so the start preset can never name a missing Follow button (not in the note).
4. The `orbit` lap form is refused for a body that circles the Sun or has no parent (`no-orbit`), and `setReach` refuses a `farEarthRadii` below the reach (`bad-camera`): the note did not say; both are guards.
5. `facts` and `listed` already existed on the internal ExperienceObject; `SceneBodyRead.texture` is `visual.texture` only (the engine's own picture), absent for a picture named from a data package.
6. Coordinator decisions (follow-up): the public name is `onFirstDraw` (the API-04 `frame` rule is unchanged from main); `?desktop=on|off`, the three SceneCamera getters and the extra guards are accepted.
