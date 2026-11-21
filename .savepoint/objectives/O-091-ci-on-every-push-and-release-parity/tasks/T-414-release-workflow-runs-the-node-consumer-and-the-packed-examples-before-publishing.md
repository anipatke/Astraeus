---
id: T-414
title: Release workflow runs the Node consumer and the packed examples before publishing
objective: O-091
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-414, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T23:30:07Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: release
planned_reads: [.github/workflows/publish.yml, docs/agents/build.md, docs/RELEASING.md, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tools/validate/harness.mjs, packages/astraeus-site/tools/validate/playwright.mjs, tools/check-node-consumer.mjs, tools/build-example.mjs, tools/publish-packages.mjs]
planned_writes: [.github/workflows/publish.yml]
---

# Release workflow runs the Node consumer and the packed examples before publishing

## Outcome

The release workflow (`.github/workflows/publish.yml`) runs `npm run check:node-consumer` and the four packed-example browser steps (`hello-scene`, `hello-react`, `hello-planets`, `hello-sky`) before anything is published, its OIDC permission is scoped to the publishing job, and its actions are referenced as PLAN.md decision 3 sets (AH-36: Claude F-18 "add example steps to release", Gemini PKG-03 "skips check:node-consumer … check:browser"; Gemini SEC-05).

## User Check

None visual. A manual "Run workflow" (dry run) on GitHub shows the new steps green before the dry-run publish step (draft 05 runs it).

## Done When

- `publish.yml` steps, in order (existing ones unchanged in text unless named here): checkout, setup-node (24, registry URL), npm version check, `npm ci`, lint, typecheck, build, test, `check:engine-alone`, `check:pack`, **new** `npm run check:node-consumer` (name: "Check a Node test can import the packed engine"), `check:react-consumer`, **new** browser install `npx playwright-core install --with-deps chromium` (name says it installs the Chromium the browser checks launch; `playwright-core` is the locked devDependency, `package.json` `playwright-core` 1.59.1, so the browser matches the library), **new** `npm run check:browser -- --step hello-scene --step hello-react --step hello-planets --step hello-sky` (name: "Check the four packed examples in a browser"; `--step` is O-086's repeatable flag), then the publish step **unchanged** (`--dry-run` on a manual run, `--tag "$TAG"` on a release).
- Permissions (SEC-05): workflow-level `permissions: contents: read` only; `id-token: write` (with `contents: read`) moves to `jobs.publish.permissions`. Comment kept that trusted publishing needs it.
- Actions per PLAN.md decision 3 (default SHA pins with a `# vX.Y.Z` comment, SHAs looked up with `git ls-remote` and recorded; the same SHAs as draft 01 for the same tag).
- Header comment (`publish.yml:1–3`) lists what the workflow checks before publishing, including the two new checks.
- No full browser tier in the workflow (PLAN.md decision 10: the Objective names the example steps; the full tier stays the owner's local release step from O-086 `docs/RELEASING.md` step 4).
- Local proof (nothing published): in a fresh clone of this branch on Node 24 (as draft 01 makes it), run every `run:` line of the workflow in order up to and including the dry-run branch of the publish step, i.e. `node tools/publish-packages.mjs --dry-run`, never the `--tag` branch and never `npm publish`. `npx playwright-core install --dry-run chromium` is run instead of the real install when the browser is already in `~/.cache/ms-playwright` (record its output: it proves the command exists in 1.59.1 and names the same `chromium-<rev>` the harness uses). The browser step obeys the one-browser-job rule (nothing else running); step times recorded against `tools/gate-limits.json`.
- YAML parses (as draft 01); `actionlint` if available.
- Gates per `docs/agents/verification.md`.

## Context Files

- `.github/workflows/publish.yml` (whole)
- `packages/astraeus-site/tools/validate/browser-steps.mjs` (the `example` steps and `--step` handling; O-086 draft 07)
- `packages/astraeus-site/tools/validate/playwright.mjs` (how `playwright-core` is loaded; read only)
- `docs/agents/build.md` (Package gates bullet: `check:node-consumer`, `build:example`, publish dry-run rule)

## Design References

`.savepoint/Design.md` `Decisions` > `O-053 checks (Guardrails API-01 to API-07)` (the "Honest versions and docs" bullet names what the release workflow runs).

## Guardrails

SEC-01, API-07, STYLE-07, STYLE-10. Project rule: never `npm publish`, never `tools/publish-packages.mjs` without `--dry-run`.

## Implementation Plan

1. SHA lookup (shared with draft 01; reuse its values if it has run).
2. Edit `publish.yml`: permissions move, two checks, browser install, example steps.
3. Fresh-clone local run, dry-run publish only.
4. Parse check; gates.

## Boundaries

Only `publish.yml`. `check:three-newest` is added to this workflow by draft 04 (after draft 03 creates it). No change to `tools/publish-packages.mjs`, the browser scripts, `check-node-consumer.mjs` or docs (draft 04). No upload-artifact or cache steps. Do not run the workflow on GitHub (draft 05).

## Technical Verification

Fresh-clone run of every workflow command in order with the publish step's dry-run branch; one browser job (the four example steps). Handoff `quality_gates`.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
