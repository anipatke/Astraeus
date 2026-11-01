---
id: T-229
title: Check names, units, errors, settings and page isolation
objective: O-053
status: done
depends_on: [{task: T-228, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-229, reason: 'Owner said "orchestrate 053" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o053-run-20261101}, recorded_at: '2026-11-01T05:40:02Z'}
planned_by: {role: planner, session: api-review-20261101}
---

# Check names, units, errors, settings and page isolation

## Outcome

The API rules on shape, errors, settings and isolation have checks in the normal test run, each with a shrinking allowlist of today's breaks (Guardrails API-03, API-04, API-05, API-06; O-053 "Public-type lint", "Errors", "Settings mapping", "Viewer isolation scans").

## User Check

Not owner-facing; the owner sees the result at the end of the Objective.

## Done When

- **Public-type lint (API-04)** over the built public declarations: a numeric field carries a unit suffix (Km, KmS, Deg, Px, Ms, Seconds, EarthRadii, …) unless on the unitless allowlist; `centre` is banned; time-like fields are typed `TimeInput`; spans use `{ start, end }`; frame fields are named `plane`; no `unknown` or `any` reachable from the root. Today's breaks (review principle 5/6 list: `MoonPositions.centre`, pacing `from`/`to`, bare-second `within`/`ramp`, Earth-radii fields, panel `at.utc`, `frame` in the elements record, `StoryPanelsInput.panels: unknown[]`, and any others the lint finds) on an allowlist, each naming its finding and Objective.
- **Errors (API-05):** a scan fails on a `throw` in `packages/astraeus/src/api/` that does not throw a `SceneError` (allowlist: `api/data.ts` RangeError, O-054) and on code recognising an error by its message text (allowlist: `scene.ts` `message.startsWith`, O-056). The README gains an error table generated from `SceneErrorCode` (code and one-line meaning from the code's doc comment) and a test keeps it in sync.
- **Settings mapping (API-06):** a test lists every setting read through `packages/astraeus/src/app/address.ts` and fails when one has no public setting key; today's address-only settings allowlisted for O-056.
- **Isolation scans (API-03):** an id-literal scan over `src/shell/` and `src/app/` and a CSS selector scan over `src/app/style.css` (every selector under the viewer's root class; no `:root`, `html`, `body`, `#app`); today's cases allowlisted for O-055.
- Each check shown failing on a planted break and passing on the tree; allowlists are data next to their checks, one entry per break with reason, finding and Objective; a test fails if an allowlist entry no longer matches a real break (so fixed entries must be removed).

## Context Files

`.savepoint/Guardrails.md` under `Public API`, `docs/architecture/api-review-2026-11-01.md`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/api/data.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/app/address.ts`, `packages/astraeus/src/app/style.css`, `packages/astraeus/tests/addressRule.test.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

API-03, API-04, API-05, API-06, TEST-01, TEST-02, TEST-03, STYLE-07; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Type lint over built declarations (reuse the T-228 surface collection where it fits).
3. Throw and message-match scan; generated README error table and sync test.
4. Settings mapping test (reuse the `addressRule.test.ts` scan approach).
5. Id and CSS scans; stale-allowlist test; planted-break proofs.

## Boundaries

No behaviour change; do not fix allowlisted breaks.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`), plus `check:pack` where the check needs packed output. No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built under `orchestrate 053` (Task check waived by the run rules; the mandatory Full Objective Check still applies). Files read: the Context Files; extra reads: `docs/agents/verification.md`, `docs/agents/build.md`, `tools/api-surface.mjs`, `packages/astraeus-site/tests/apiSurface.test.ts` and `apiOutsideTypes.allowlist.json` (reuse of the T-228 pattern), `packages/astraeus/src/api/{pathProvenance,sunOrbit,viewerLink,story,group}.ts` and `src/app/{viewLink,viewUp,bodyDraw,SkyView,App}.tsx|ts`, `src/shell/{storyPanels,bootLoader}.ts` (to classify throw sites and address readers).

Files changed: `tools/api-rules.mjs` + `tools/api-rules.d.mts` (new: the five checks), `tools/api-surface.mjs` + `.d.mts` (exports `OPTIONS`, `isOwnFile`, `privateName`), `packages/astraeus-site/tests/apiRules.test.ts` (new), allowlists `apiTypeLint|apiErrors|apiSettings|apiIsolation.allowlist.json` (new, next to the tests), `packages/astraeus/src/api/errors.ts` (a doc comment per `SceneErrorCode` member, no code change), `packages/astraeus/README.md` (new "Errors" section with the generated table), `packages/astraeus/api-surface.lock.json` (regenerated: only the comments inside the `SceneErrorCode` signature), `packages/astraeus/CHANGELOG.md` (one Unreleased line), `package.json` (`api:errors` script), this Task.

Per Done When:

- Public-type lint (API-04): `publicTypeBreaks()` in `tools/api-rules.mjs` walks every type reachable from the root with the compiler (same read as the surface lock), rules `unit`, `centre`, `time`, `span`, `frame`, `loose`. Test "finds no public type break beyond the allowlist". Allowlist `apiTypeLint.allowlist.json`: 30 `unitless` field names (permanent, reason each), 9 `exceptions` (hits that are not breaks, reason each), 41 `breaks` (reason, finding F4/F5/F7, Objective O-057). The review's named breaks are asserted present (test "names today's breaks from the API review": `MoonPositions.centre`, pacing `from`/`to`, `within`, `ramp`, both `labelReach`, panel `at.utc`, `ElementsBodyRecord.frame`, `StoryPanelsInput.panels`). Panel `at.utc` cannot be read from a type (the input is `unknown[]`), so the lint also reads `shell/storyPanels.ts` for the ISO-Z-only parse.
- Errors (API-05): `errorBreaks()` (AST + type checker) over `src/api/`: a `throw` whose value is not a `SceneError` (a rethrow of what was caught is not judged), and `.message` used with startsWith/includes/match/test/exec/===. `apiErrors.allowlist.json`: data.ts RangeError (O-054), scene.ts `message.startsWith` (O-056), plus two the review did not list: pathProvenance.ts `throw new Error` (caught and re-wrapped by planSpans) and sunOrbit.ts `/no full turn|do not cover/.test(error.message)` (both O-054, F8). README error table generated from the `SceneErrorCode` doc comments by `npm run api:errors`; test "keeps the README error table equal to the one generated" plus a test that every code has a one-line meaning.
- Settings mapping (API-06): `addressParameters()` finds every parameter the viewer reads from the address text (17: featurepx, labels, loadfade, loop, markerpx, milkyway, milkywaybrightness, scale, show, sky, stars, sunbrightness, sunglow, sunglowscale, t, up, view; resolved through `.get(name)` callers and literal-union parameters). `apiSettings.allowlist.json`: `public` maps 7 to a public `Export.member` (checked against the real surface) and 10 are `addressOnly` (F11, O-056).
- Isolation scans (API-03): `idLiteralBreaks()` over `src/shell` and `src/app` (36 fixed ids: JSX `id`/`aria-labelledby`/`aria-controls`, `getElementById`, `.id =`; a literal built on a `useId()` name passes) and `styleSelectorBreaks()` over `src/app/style.css` (every selector must start with `.astraeus-shell`, the shell root; no `:root`, `html`, `body`, `#app`): 100 selectors. All in `apiIsolation.allowlist.json` (F3, O-055).
- Failing on a planted break, passing on the tree, stale entries: each check has a synthetic sample test inside `apiRules.test.ts` (made-up api folder, shell folder, css text) and stale-entry cases. Plants on the real tree (script in scratchpad `plant.sh`, each reverted after; `git status` clean of plants), command `cd packages/astraeus-site && npx vitest run tests/apiRules.test.ts`, each gave "Tests 1 failed | 14 passed":
  - type lint: `readonly plantedCentre: number;` in `MountOptions` -> `type lint: new break centre MountOptions.plantedCentre` and `new break unit MountOptions.plantedCentre: plantedCentre`.
  - throw scan: `throw new Error("planted")` appended to api/mount.ts -> `errors: new break throw mount.ts: throw new Error("planted");`.
  - message scan: `e.message.includes("x")` appended -> `errors: new break message mount.ts: e.message.includes("x")`.
  - error table sync: one doc comment edited, README not regenerated -> `run npm run api:errors: expected ... to be ...`.
  - settings: `new URLSearchParams(search).get("plantedparam")` in app/viewUp.ts -> `address setting "plantedparam" has no public setting key; ...`.
  - id scan: `document.getElementById("planted-id")` in app/address.ts -> `ids: new break id app/address.ts: document.getElementById("planted-id")`.
  - css scan: `.planted {...}` and `body {...}` appended to style.css -> `selectors: new break selector .planted` (and `body`).
  - stale entry: removing `id="info-panel"` from shell/InfoPanel.tsx -> `ids: stale allowlist entry id shell/InfoPanel.tsx: id="info-panel"; delete it (F3, O-055)`.
  The plant run was repeated after the lint-complexity refactor with the same results.

Gates (all run fresh at the end): `npm run lint` pass (no errors; ESLint complexity 20 forced a refactor of ownerName, visit, id scan); `npm run typecheck` pass; `npm run build` pass (earlier in the session, before the lock/CHANGELOG-only edits); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 181 files passed, 2225 passed, 1 skipped, 0 failed (15 new tests in apiRules.test.ts). Not run: `check:pack`, browser checks, `test:full`, `check:engine-alone` (not required for hand-off; the lint and the new checks read the source tree only).

Limitations: the type lint reads the root entry with the compiler (like the T-228 lock), not `dist/*.d.ts`, so it needs no build and sees the same declared types. The CSS scan covers `src/app/style.css` only, as specified; `src/shell/*.css` is not scanned. A rethrow of a caught value is assumed to be a SceneError or an internal error the caller sees; it is not judged. The "unitless" list matches by field name, so a future new field called `rate` or `value` would pass the unit rule.

## Drift Notes

- The review and Done When name `centre`/`frame`/pacing/`labelReach`/panel `at.utc`/`panels: unknown[]` as breaks; the lint finds 41 more or less (internal types such as `ExperienceDefinition`, `CameraReach`, `TextureRef` reach the root through leaks and are allowlisted under F7/O-057, they disappear when `toDefinition` and the other leaks go).
- Two breaks the review did not list were found and allowlisted: `pathProvenance.ts` plain `Error` (caught inside `planSpans`) and `sunOrbit.ts` message-text match (O-054, F8). O-054's list should include them when it is planned.
- Every `SceneErrorCode` member gained a doc comment so the README table can be generated; the lock's `SceneErrorCode` signature text includes the comments, so the lock was regenerated (set of codes unchanged). A reviewer may prefer the lock to strip comments; deferred.
- The `public` settings map (`apiSettings.allowlist.json`) names `FollowView.up`, `TimelineInput.loop` and `AddBodyOptions.showLabel` as the public keys for `up`, `loop` and `labels`; `view` is mapped to `MountedScene.setCamera`. If O-056 introduces a settings object, these entries move to it.
- Design.md architecture notes: none beyond the above; no Design change proposed.
