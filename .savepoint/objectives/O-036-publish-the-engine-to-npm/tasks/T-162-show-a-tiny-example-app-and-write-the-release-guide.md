---
id: T-162
title: Show a tiny example app and write the release guide
objective: O-036
status: done
depends_on: [{task: T-161, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o036-planning-20261023}
check_waiver:
    task: T-162
    reason: 'owner chose no per-step checks, one Full Objective Check at the end of O-036; quote: "Same as O-035 (Recommended)"; owner look given: "nah yall good bra"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T08:04:26Z"
---

# Show a tiny example app and write the release guide

## Outcome

A tiny app outside the demos installs the packed `astraeus` (and optionally `astraeus-data`) and draws a scene through the public API; the API, the 0.1 preview promise, a changelog and a release procedure are written; the owner has looked at the example.

## User Check

Open the example on its preview address (given at hand-off), at desktop and phone size: Earth and the Moon draw, a trajectory follows, the time can be set. Read the API page and the release guide.

## Done When

- `examples/hello-scene/` (outside the workspaces) installs the packed tarballs (not workspace links), builds with Vite and draws a small scene in about 20 lines through `Scene` ... `mount`; a root script builds it.
- `camera.follow` starts the scene already following its target (a small `App` start option; T-160 found `App` can only frame the target and offer the Follow button); a fast test proves it.
- `npm run check:browser` gains one step that opens the example and proves it draws through the scene's readouts via `tools/validate/driver.mjs` (no screenshots); the step map in `docs/BROWSER_CHECKS.md` is updated. The command itself runs once, at the Full Objective Check, not here.
- `packages/astraeus/README.md` becomes the npm front page: install, the 20-line example, the public API, what `astraeus-data` adds, the 0.1 preview promise and what counts as internal. `CHANGELOG.md` for both packages starts at 0.1.0.
- `docs/RELEASING.md`: the owner's step-by-step release (version bump, changelog, create the GitHub release; the workflow publishes), the one-time npm setup, and what to check after.
- `.github/workflows/publish.yml` runs on a published GitHub release: checkout, `npm ci`, configured gates and the pack check, then `npm publish --provenance` for `astraeus` and `astraeus-data` through npm trusted publishing (OIDC, `id-token: write`), skipping a package whose version is already on npm. Proven by a dry-run path (for example `workflow_dispatch` with `npm publish --dry-run`) and a fast test that reads the workflow file; never by a real publish. `docs/RELEASING.md` says how to link the packages to the repository on npm once, any first manual publish needed, and how to create a release.
- AGENTS.md Build lines and Design (Components, Interfaces, Current Technical State, the drift notes of the earlier steps) describe the packages and commands.
- The owner's look and verdict, in their words, are recorded.
- Configured gates, engine-alone and the pack check pass. No browser runs here.

## Context Files

`docs/NPM_PACKAGING.md`, `packages/astraeus/README.md`, `packages/astraeus/package.json`, `package.json`, `AGENTS.md`, `docs/BROWSER_CHECKS.md`, `.savepoint/Design.md`, `packages/astraeus-site/tools/validate/driver.mjs`, `packages/astraeus-site/tools/validate/runner.mjs`, and the previous steps' Technical Evidence.

## Design References

Design: Browser checks (O-038); Interfaces and Data Flow; Current Technical State.

## Guardrails

ARCH-04, TEST-01, TEST-03; AGENTS.md Astraeus Project Rules (owner judges looks on the preview, no screenshots, browser scripts use the shared driver).

## Implementation Plan

1. Pack both packages; create the example and install the tarballs into it.
2. Add the browser-check step through the driver; update the step map.
3. Write README, CHANGELOGs, RELEASING, AGENTS.md and Design updates.
4. Serve the example for the owner's look; record the verdict.

## Boundaries

No publishing; no demo or site changes; no CDN build. The browser command runs once at the Full Objective Check.

## Technical Verification

Configured gates, engine-alone and the pack check at hand-off; `npm run check:browser` once at the Full Objective Check. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-23 (builder, no commit; stage `test`, waiting for the owner's look).
- **Example:** `examples/hello-scene/` (outside the workspaces; `src/main.js` is 17 lines: `Scene` with `earth`, `moon`, a made-up 6-hour probe loop 120,000 km from Earth, `setTime`, `camera.follow("probe", { distance: 110 })`, `mount`). `npm run build:example` (`tools/build-example.mjs`) builds the engine, `npm pack`s `packages/astraeus/dist` into `examples/hello-scene/.packs/`, `npm install --no-save`s that tarball (a real copy in `node_modules`, not a workspace link; `package.json` stays clean) and runs `vite build`. `.packs`, `node_modules`, `dist` are git-ignored (checked with `git check-ignore`). The data packages are not used (the example needs no moon positions); a Jupiter moon example is in the README.
- **`camera.follow` opens following:** `ExperienceConfig.startCameraPresetId` (new, optional) makes `AstraeusShell` open with that preset in force and the target picked (`initialObjectId`, `initialObjectIdOf`); `Scene.toDefinition` sets it to `follow-target` when `camera.follow` was called. Fast tests in `packages/astraeus/tests/publicApi.test.ts` (definition field present or absent; shell opens with exactly the Follow button pressed, none without).
- **Browser step:** `packages/astraeus-site/tools/validate/check-hello-scene.mjs` (driver and harness only; `driver-guard.mjs` passes) added as the `hello-scene` step in `run-browser.mjs`; `runner.mjs` gained an `example` step kind (build once with `tools/build-example.mjs`, preview on port 5481). `docs/BROWSER_CHECKS.md` step map updated. The scene has no readout for a tracked path line, so the step asserts the probe is in the Object list and picked, the Follow preset is in force from the first frame, Earth and the Moon are drawn and in view, and the time starts at the `setTime` value and can be moved. `npm run check:browser` was NOT run; the new script alone was run once against the served example (desktop and phone: ok, zero errors; scratch results only).
- **Workflow:** `.github/workflows/publish.yml`: on `release: published` and `workflow_dispatch`; permissions `contents: read`, `id-token: write`; Node 24; `npm ci`, lint, typecheck, build, test, `check:engine-alone`, `check:pack`; then `tools/publish-packages.mjs --tag "$TAG"` on a release, `--dry-run` on a manual run. `tools/publish-packages.mjs` publishes each `packages/<name>/dist` with `npm publish --access public --provenance`, skips a version already on npm (`npm view`), refuses when the release tag differs from a package version, and in `--dry-run` runs `npm publish --dry-run` only. Proof: `node tools/publish-packages.mjs --dry-run` run here listed all eight as "not on npm yet" and dry-run published each (`+ name@0.1.0`, nothing sent); with `--tag v9.9.9` it refused all eight. Fast tests `packages/astraeus-site/tests/publishWorkflow.test.ts` (9 cases) read the workflow text (trigger, OIDC and no token, gate order, no direct `npm publish`, tag via env) and the plan and example shape. No real publish was run.
- **Pack check:** now compares each built package version with its source manifest (was a fixed 0.1.0, which would have blocked 0.1.1); `CHANGELOG.md` is allowed and shipped for `astraeus` and `astraeus-data`.
- **Docs:** `packages/astraeus/README.md` (npm front page: install, the example, API table, data packages, 0.1 preview promise, what is internal; the repository notes follow), `packages/astraeus/CHANGELOG.md` and `packages/astraeus-data/CHANGELOG.md` (0.1.0), `docs/RELEASING.md` (one-time setup incl. first manual publish and trusted-publisher entry, each release, after a release), `AGENTS.md` (Build lines, Codebase Map rows), `.savepoint/Design.md` (Components row, O-036 paragraph in Current Technical State accounting for each T-159 to T-161 drift note).
- **Follow-up from the owner's look ("why is the moon in an odd location" / "show both orbits for reference"):** the Moon was at its real place; its orbit is tilted to the probe circle. Added `addBody(body, { orbit: true })` (`AddBodyOptions`, new `no-orbit` SceneError code): it declares the engine's existing composition path (the same orbit line the Earth-Moon and Io scenes use) for the Moon (about Earth) or Io (about Jupiter); any other body, or a parent not in the scene, throws `no-orbit`. Tests in `publicApi.test.ts` (2 new). The example is `addBody(moon, { orbit: true })` (still 17 lines); README API table and CHANGELOG updated. The scene already has a `moon-orbit` path readout, so the `hello-scene` step now asserts it is visible and in view (script alone against :5496: ok, desktop and phone).
- **Gates (2026-10-23):** `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 119 files, 1567 passed, 1 skipped; `npm run check:engine-alone` pass; `npm run check:pack` pass (all eight packages within limits).
- **Owner's look (pending).** Example served at http://localhost:5496 (vite preview of `examples/hello-scene/dist`). Checklist, at desktop width and at phone width (about 375 px):
  1. Earth draws as a globe with its picture, and the Moon shows as a small dot or ball a little way off, at its real place for 2026-01-01.
  1b. The Moon's orbit is drawn as a ring through the Moon (tilted against the probe's circle).
  2. A circle (the probe's path) is drawn around Earth and the Follow button is already pressed; the camera stays centred on the probe as time runs.
  3. The time can be set: drag the timeline slider (on a phone, open the timeline drawer first) and the date and the probe move; pause and play work.
  4. Nothing overlaps on the phone layout and there is no page error.
  5. Read `packages/astraeus/README.md` and `docs/RELEASING.md`.

## Drift Notes

- The scene has no readout for a tracked trajectory's drawn line, so the browser step cannot assert the path itself (only its Object-list entry, the follow state and the bodies around it); adding a path readout for tracked bodies would be an engine change outside this Task.
- `tools/check-packs.mjs` pinned the version to 0.1.0; changed to compare with the source manifest so the first release bump does not fail the workflow's pack check.
- The example's build includes all planet pictures (about 6 MB) because the engine's catalogue imports them; per-body picture loading is not in scope.
- Moon definitions stayed in the engine (T-161 note) is reflected in Design.md; no further architectural notes are deferred.

**Owner's verdict (2026-10-23T08:04:26Z):** looked at the example on http://localhost:5496. Asked "why is the moon in an odd location" — the Moon is at its real place (about 361,000 km, 26.3 deg above the equatorial plane of the probe circle, near the 2025-26 major lunar standstill); owner chose "show both orbits for reference" and `addBody(moon, { orbit: true })` was added. Asked "is earth at the right angle.." — coordinator measured Earth's pole at EQJ (0.0025, 0, 1.0) and Greenwich at RA about 100 deg (GMST 6.7 h) at 2026-01-01T00:00Z, so the probe circle lies on the equator and Greenwich faces away from the Sun. Owner: "nah yall good bra".

