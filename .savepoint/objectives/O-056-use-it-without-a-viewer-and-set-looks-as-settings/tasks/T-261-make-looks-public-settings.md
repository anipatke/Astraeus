---
id: T-261
title: Make looks public settings
objective: O-056
status: planned
depends_on: [{task: T-260, requires: clear}]
owner_validation: {required: false}
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

Pending execution.

## Drift Notes

Record architecture deltas here; T-264 reconciles them into Design.md.
