# Where each fact lives

One file or generated output owns each fact that tends to drift. Change the fact there. Every other doc links to the owner instead of copying the value. A doc that holds a copy because a test keeps it in step says so in the last column.

| Fact | Owner (change it here) | Docs that only point to it |
|---|---|---|
| Workspaces, package names and versions | `packages/*/package.json`, and the root `package.json` `workspaces` field | [root README](../README.md), [Design map](../.savepoint/Design.md#componentscodebase-map) |
| Packages published to npm | `PACKAGES` in [`tools/build-packages.mjs`](../tools/build-packages.mjs) | [RELEASING](RELEASING.md), [engine README](../packages/astraeus/README.md) "What `astraeus-data` adds" |
| Peer dependency ranges | `peerDependencies` in [`packages/astraeus/package.json`](../packages/astraeus/package.json) | engine README "Install", root README badges |
| Ordinary gate commands | `quality_gates` in `.savepoint/config.yml`, scripts in the root `package.json` | [project gates](agents/build.md), root README |
| Which checks a Task, a Full Check and a release run | [verification policy](agents/verification.md), [browser policy](agents/browser-policy.md) | build.md, [BROWSER_CHECKS](BROWSER_CHECKS.md), Design "Verification in tiers (O-086)" |
| Browser steps and their tiers | [`browser-steps.mjs`](../packages/astraeus-site/tools/validate/browser-steps.mjs); `npm run check:browser -- --list` prints them | BROWSER_CHECKS, build.md, Design |
| Time limits | [`tools/gate-limits.json`](../tools/gate-limits.json) (the one maintained source) | build.md and BROWSER_CHECKS tables are checked copies: `gateLimits.test.ts` fails when they differ |
| Measured timings | The dated run that measured them: `docs/evidence/browser-*/summary.txt`, [`test-cost/report.md`](evidence/test-cost/report.md) | Any doc quoting a time names the run and date, and keeps it apart from the limit |
| Browser commands, run results and finding the latest run | [BROWSER_CHECKS](BROWSER_CHECKS.md) "Running it" and "Where things live" | root README, build.md |
| Engine size budget | [`engine-budget.mjs`](../packages/astraeus-site/tools/validate/engine-budget.mjs) | Design "Size budgets are split", BROWSER_CHECKS |
| Page size budgets | [`load-budget.mjs`](../packages/astraeus-site/tools/validate/load-budget.mjs), planet view limits in `packages/astraeus-demo-planets/src/experiences/planets/viewLimits.json` | root README, Design |
| Package pack limits | `LIMITS` in [`tools/check-packs.mjs`](../tools/check-packs.mjs) | [NPM_PACKAGING](NPM_PACKAGING.md), Design |
| Public API surface | `packages/astraeus/src/api/index.ts` and its doc comments; `api-surface.lock.json` records it | The generated API page (`api-reference.mjs`); engine README tables, which `readmeApiBreaks` checks; the engine CHANGELOG |
| Error codes | `SceneErrorCode` doc comments in `packages/astraeus/src/api/errors.ts` | Engine README "Errors": the table between the `error-table` markers is written by `npm run api:errors` and tested |
| Planet and moon positions (providers) | `packages/astraeus/src/core/astronomyAdapter.ts`, `planetModels.ts`, the importers in `packages/astraeus/tools/import/` | Design "Planet positions from Horizons", root README, `packages/astraeus/data/ephemerides/README.md` |
| Planet accuracy figures | Engine README "What `astraeus-data` adds" (measured, [planet accuracy note](architecture/planet-accuracy-o063.md)) | root README, scientific docs |
| Release procedure | [RELEASING](RELEASING.md), run by `.github/workflows/publish.yml` and `tools/publish-packages.mjs` | build.md, NPM_PACKAGING; `workflowParity.test.ts` checks the RELEASING table |
| CI | `.github/workflows/ci.yml` | build.md, RELEASING |
| Architecture boundaries | Design "Boundaries" and `.savepoint/Guardrails.md`, enforced by `packageBoundaries.test.ts` and `layerRule.test.ts` | root README, engine README, [`architecture/`](architecture/) |
| Credits and licences | Each package's `credits/`, `licenses/`, `NOTICE` and picture licence records; the generated sections of the site's assets page | root README |

## Where history lives

Dated material is kept, not rewritten: release notes (`docs/release-notes-*.md`) and each package's CHANGELOG, old briefs in [`archive/`](archive/), earlier reconciliations and Design's full per-heading contract text as of 2026-11-22 in [`architecture/reconciliation-history.md`](architecture/reconciliation-history.md), and measured runs in dated `docs/evidence/` folders.
