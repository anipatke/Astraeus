---
id: T-162
title: Show a tiny example app and write the release guide
objective: O-036
status: planned
depends_on: [{task: T-161, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o036-planning-20261023}
---

# Show a tiny example app and write the release guide

## Outcome

A tiny app outside the demos installs the packed `astraeus` (and optionally `astraeus-data`) and draws a scene through the public API; the API, the 0.1 preview promise, a changelog and a release procedure are written; the owner has looked at the example.

## User Check

Open the example on its preview address (given at hand-off), at desktop and phone size: Earth and the Moon draw, a trajectory follows, the time can be set. Read the API page and the release guide.

## Done When

- `examples/hello-scene/` (outside the workspaces) installs the packed tarballs (not workspace links), builds with Vite and draws a small scene in about 20 lines through `Scene` ... `mount`; a root script builds it.
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

Pending execution.

## Drift Notes

None yet.
