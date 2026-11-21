---
id: T-414
title: Release workflow runs the Node consumer and the packed examples before publishing
objective: O-091
status: done
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

Files changed: `.github/workflows/publish.yml` only (plus this Task file).

SHAs (git ls-remote, lightweight tags, so the listed commit is the tag target): actions/checkout v7.0.1 = 3d3c42e5aac5ba805825da76410c181273ba90b1 (the `v7` tag points at the same commit); actions/setup-node v7.1.0 = 949feb2413d6458794dcd2491c4babbbce0c15c1 (`v7` tag same). T-413 had not recorded SHAs when I looked, so these are the newest v7.x.y lookups; T-413 must use the same.

| Done When | Evidence |
|---|---|
| Steps in order, new node-consumer, Chromium install, four example steps, publish step unchanged | `publish.yml` diff; the React step moved after the node-consumer step (text unchanged); publish step untouched |
| Permissions: workflow `contents: read`; `id-token: write` on `jobs.publish.permissions` with comment | `publish.yml` lines 10-20; YAML parses (python yaml.safe_load) |
| Actions SHA-pinned with `# vX.Y.Z` | see SHAs above |
| Header comment lists the checks | line 4 added |
| No full browser tier | only `--step` x4 |
| Local proof | Fresh clone of branch (Node 24.16.0, npm 12.2.1) with the edited publish.yml copied in, every `run:` line in order under flock: npm ci 5s, lint 12s, typecheck 11s, build 3s, test 32s, check:engine-alone 26s, check:pack 25s, check:node-consumer 6s (limit 15), check:react-consumer 6s, `npx playwright-core install --dry-run chromium` (run inside the clone after npm ci, so it used the locked 1.59.1: names Chrome for Testing 147.0.7727.15, chromium v1217, `~/.cache/ms-playwright/chromium-1217`, which is installed), check:browser four steps exit 0: hello-scene 16s/25, hello-react 2s/10, hello-planets 3s/15, hello-sky 18s/35, total 66s, error-lines 0; `node tools/publish-packages.mjs --dry-run` rc=0 (all packages "already on npm", skipped; nothing published). All within `tools/gate-limits.json`. |
| YAML parses / actionlint | yaml ok; actionlint not installed |
| Gates | Run in the fresh clone (HEAD + this publish.yml), all passed as above. Not rerun in the main checkout because T-413/T-415 edit it concurrently. |

Extra reads: none beyond planned. Limitations: the `--with-deps` install itself was not run (dry-run only; apt on GitHub runner untested here); on GitHub the browser steps run on ubuntu-latest, not verified until T-417. The clone is at /tmp/claude-1000/t414.


## Drift Notes

None (workflow-only change; check:three-newest still to be added by T-415/T-416 per the Task Boundaries).

## Coordinator (gates)

Set done by the orchestrating session after the combined handoff gates passed with T-413, T-414 and T-415 together (owner: "I mark them as they pass", O-038; G-024 decision 7; owner 2026-11-22 "I am remote now, add park the check and move on"): lint and Prettier clean, typecheck clean, `npm test` 324 files, 5319 passed, 2 skipped; `npm run check:pack` pass, engine 1,836,378 B raw (cap 1,838,000).
