---
id: T-261
title: Make looks public settings
objective: O-056
status: done
depends_on: [{task: T-260, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-261, reason: 'Owner said "Orchestrate o56" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o056-run-20261103}, recorded_at: '2026-11-03T10:16:23Z'}
planned_by: {role: planner, session: o056-planning-20261103}
---

# Make looks public settings

## Outcome

Every look the address or the Developer drawer can set today is a public setting with a default, set when building through `scene.setLook`, and the address only overrides it through one table (O-056 Success Condition 4, build half; API-06; review F11).

## User Check

Not owner-facing yet: the looks are unchanged at their defaults. The owner tries them in the example at the last step.

## Done When

- Public `LookInput` (all optional, each with a doc comment stating unit, range and default), covering the ten `addressOnly` parameters: `stars`, `milkyway`, `milkywaybrightness`, `sky`, `sunglow`, `sunglowscale`, `sunbrightness`, `markerpx`, `featurepx`, `loadfade`. Names carry units (API-04, e.g. `markerSizePx`, `loadFadeSeconds`); exact names recorded in Technical Evidence.
- `Scene.setLook(look: LookInput): this` replaces the whole look (verb grammar), checks each value at the call (`bad-look`, a new documented `SceneErrorCode`, or an existing code if one fits; README error table regenerated with `npm run api:errors`), and is frozen after mount like every mutator.
- One table (in `src/app/`, next to `address.ts`) maps each address parameter to its `LookInput` key and parser; every current look reader (`App.tsx` `brightnessFromSearch`, `bodyDraw.ts` marker sizes, `SkyView.ts`, the load fade) reads the scene's look with the address override from that table, so no reader parses the address itself. Precedence: address (when `address` is on) over `setLook` over default.
- `apiSettings.allowlist.json`: `addressOnly` is empty and each parameter is in `public` mapped to `Scene.setLook` (or the `LookInput` member); `tools/api-rules.mjs` finds the parameters through the table if it reads them by name today.
- The look lock (`computedLook.test.ts`) passes unchanged at defaults (no `npm run look:lock` regeneration); a test shows a set look and an address override each reach the reader.
- **Surface:** `npm run api:lock` regenerated and the lock diff limited to the members this step adds; CHANGELOG (Unreleased) and the README API tables updated in the same change; `apiSurface`, `apiRules` and `allowlistGrowth` tests pass (no allowlist group grows).
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/app/address.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/bodyDraw.ts`, `packages/astraeus/src/app/SkyView.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/assembleScene.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus-site/tests/apiSettings.allowlist.json`, `tools/api-rules.mjs`, `packages/astraeus/tests/addressRule.test.ts`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)` (settings mapping); `Interfaces and Data Flow` ("Views fixes for a multi-probe app (O-052" item 2, the address door).

## Guardrails

API-01, API-02, API-04, API-05, API-06, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, STYLE-02, STYLE-07, STYLE-10, CODE-01, API-03.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. List every look reader and its address parameter; write the one table.
3. Add `LookInput`, `setLook`, its checks and error code; carry the look on the definition to the readers.
4. Point every reader at the table; empty `addressOnly`.
5. Tests; lock, README, CHANGELOG; gates.

## Boundaries

Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files. No renames of existing members and no removal of `toDefinition` (O-057). No live setter yet (next step). Default looks do not change.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus the named `check:*` scripts. No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads: none beyond Context Files (plus `packages/astraeus/tests/apiImports.test.ts` and `packages/astraeus-site/tests/apiTypeLint.allowlist.json`, to learn why the first lint run failed; and the existing look tests, updated to the new readers).

| Done When | Evidence |
|---|---|
| Public `LookInput` with doc comments | `src/api/look.ts`: `LookInput` { `starBrightness`, `milkyWay`, `milkyWayBrightness`, `skyVisible`, `sunGlow: SunGlowLook { sizePx, brightness, scale }`, `markerSwapRadiusPx`, `featureMinBodyPx`, `loadFadeSeconds` }, unit, range and default on each. `sunGlow` is nested because flat `sunGlowBrightness`/`sunGlowScale` break the API-04 unit lint and the unitless list may only shrink; nested `brightness` and `scale` are already on it. |
| `Scene.setLook(look): this`, checks, `bad-look`, frozen after mount | `scene.ts` `setLook` (`#editable()`), `src/api/lookInput.ts` `checkedLook`, new `SceneErrorCode` `bad-look`, README error table regenerated (`npm run api:errors`). `tests/look.test.ts`: 8 bad-look cases, replace-whole-look, frozen after `markMounted`. |
| One table in `src/app/` next to `address.ts`; readers read the scene's look | `src/app/look.ts`: `LOOK_FIELDS` (path, address param, range/kind) and `resolveLook(base, search)` (address over set look over default). `App.tsx` builds `runtime.look` once; `skySettingsOf`, `markerSettingsOf`, `glowLookOf`, `featureMinBodyPxOf`, `bootFadeSeconds(look)` read it. The `*FromSearch` parsers are gone from `SkyView.ts`, `bodyDraw.ts`, `FeatureMarkers.ts`, `bootLoader.ts`. |
| `addressOnly` empty; `public` mapped | `apiSettings.allowlist.json`: `addressOnly: []`, ten params in `public` (`LookInput.x`, `SunGlowLook.x`). `api-rules.mjs` unchanged: it finds the params through `rawParam(search, param: LookParam)` (union type). `apiSettings` test passes. |
| Look lock unchanged; set look and address reach reader | `computedLook.test.ts` passes, baseline not regenerated. `tests/look.test.ts` table-driven over all ten looks: default, set look, address over set look; bad address value keeps the set look and warns. |
| Surface | `npm run api:lock` (diff: `Scene.setLook`, `LookInput`, `SunGlowLook`, `bad-look`); CHANGELOG Unreleased and README (API table, address table note) updated. `apiSurface`, `apiRules` pass. **`allowlistGrowth` fails** (see below). |
| Gates | Owner decision 2026-11-03 (asked by the coordinator, "Fix the check"): `allowlistGrowth` first failed because `public` grew 7 to 17 (the ten `addressOnly` params moving). The check was fixed rather than approved: `allowlistGrowth.test.ts` no longer counts the `public` section (resolved mappings, not breaks); `addressOnly` keeps the per-group rule. Table-driven cases added: new `public` entry passes; `addressOnly` to `public` move passes; new `addressOnly` without approval fails; with owner approval passes. After the fix: `npm run lint` pass, `npm run typecheck` pass, `npm run build` pass, `npm test`: 207 files, 2577 passed, 2 skipped, no failures. No browser run. |

## Drift Notes

Record architecture deltas here; T-264 reconciles them into Design.md.

- `LookInput`/`SunGlowLook` are declared in `src/api/look.ts` (the public-type rule), the table in `src/app/look.ts`; `apiImports.test.ts` ALLOWED gained `app/look` (api's `setLook` check reads the table's ranges so they are written once).
- Precedence for the load fade is address, then `setLook`, then the value saved from the Developer drawer, then 0.6. The Milky Way start is address, then `setLook`, then `setSwitches` `on`, then off.
- `?loadfade=<not a number>` now falls through to the saved/default value (it used to force the default).
- `resolveLook(base, search)` is the single resolver; the live `setLook` (T-262) should call it with a new base and `runtime.look` becomes the state it updates (today `runtime.look` is computed once per mount).
- Rule change (owner 2026-11-03): `allowlistGrowth.test.ts` excludes the `public` section from growth counting (`UNCOUNTED_SECTION`); `approvedPublic` is now moot. Design.md's "Allowlist growth counted per finding" paragraph mentions `public` settings entries and must be reconciled in T-264.
