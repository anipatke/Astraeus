---
id: T-258
title: Write the good-guest notes and show the owner
objective: O-055
status: planned
depends_on: [{task: T-257, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o055-planning-20261102}
---

# Write the good-guest notes and show the owner

## Outcome

The README and CHANGELOG tell app makers how a viewer now behaves on their page, Design.md describes O-055 as built, the package checks pass, and the owner has looked at the site on the preview at phone and desktop sizes, ready for the Full Objective Check (O-055 Success Conditions 7 and 8).

## User Check

Owner-facing. With the preview on `localhost:5490`, the owner looks at the site at 375x667 and 1280x720: each demo's top bar, timeline, info panel, story panel, moons panel, phone drawers and the Developer drawer look as before and do not collide; the embedded portfolio view looks as before. The owner says whether it passes; no screenshots.

## Done When

- `packages/astraeus/README.md`: a "Several viewers on one page" section (each viewer keeps its own data, pictures, ids and styles; give each element a size; Escape and panels stay inside their viewer; panel sizes follow the browser window, so a small viewer keeps the desktop layout); the sizing note under `mount` says the viewer styles nothing outside its element; `developerTools` rows present (from T-253).
- `packages/astraeus/CHANGELOG.md` Unreleased opens with one O-055 migration paragraph for app makers, beside O-054's: the viewer no longer styles `html`, `body` or `#app` (size the element yourself); the Developer drawer is hidden unless `developerTools: true`, and the "Copy view link" button lives in it; element ids are generated (do not select viewer parts by id); a viewer draws pictures only from the packages passed to it; moon data now loads for every scene. The per-step lines stay below it.
- `.savepoint/Design.md` reconciled: `Interfaces and Data Flow` gains a short "Good guest (O-055)" paragraph (moon chunks loaded per request into one shared store; pictures carried on the definition; ids from `useId`; the loading cover handed in by the site; Escape and markers scoped; styles under `.astraeus-shell`); the codebase map names the new tests; the `O-053 checks` CSS bullet says the isolation allowlist is empty; each earlier O-055 step's Drift Notes entry is accounted for here as reflected in Design.md or non-architectural, with a reason (AGENTS.md, Deferred Design reconciliation).
- `packages/astraeus-site/tests/apiIsolation.allowlist.json` has no breaks; no entry naming `O-055` is left in any O-053 allowlist (`grep -l '"O-055"' packages/astraeus-site/tests/*.allowlist.json` prints nothing).
- `npm run test:full`, `npm run check:pack`, `npm run check:node-consumer` and `npm run check:engine-alone` pass (results recorded); `npm run check:react-consumer` passes when the network is reachable (else recorded as not run); `node tools/build-example.mjs hello-scene` and `hello-react` build from the packed tarball. No browser run (that is the Full Objective Check's one `check:browser`).
- **Owner look recorded:** the owner's verdict from the User Check, with actor and time, in Technical Evidence. A look problem goes back to the step that caused it as a repair before the Full Objective Check.
- **Nothing public moved here:** `git diff --exit-code -- packages/astraeus/api-surface.lock.json` is empty after this step's edits; `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence.

## Context Files

`packages/astraeus/README.md` under the `mount` section, `Page address` and the options tables, `packages/astraeus/CHANGELOG.md` under `Unreleased`, `.savepoint/Design.md` under `Components/Codebase Map`, `Interfaces and Data Flow` and `O-053 checks (Guardrails API-01 to API-07)`, `packages/astraeus-site/tests/apiIsolation.allowlist.json`, `docs/agents/browser-policy.md`, and the Drift Notes of every earlier O-055 step.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-055 Objective under `Success Conditions` and `Architectural Considerations`; `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F1, F3).

## Guardrails

API-01, API-03, API-07, TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. README section and sizing note; CHANGELOG migration paragraph.
3. Reconcile Design.md and account for every deferred drift note.
4. Run the full and package checks and the example builds.
5. Start the preview on `localhost:5490` and ask the owner for the look; record the verdict.

## Boundaries

No new API or code change except a repair the owner's look asks for (routed to the causing step). Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`) plus the full and package checks above. No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Owner validation per `docs/agents/verification.md`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here.
