# Project gates and tooling

Gate commands beyond or alongside `quality_gates` in `.savepoint/config.yml`. Evidence and reuse rules are in the [verification policy](verification.md).

- Hand-off gates (`quality_gates` in `.savepoint/config.yml`): `npm run lint`, `npm run typecheck`, `npm run build` and `npm test` (with the junit reporter). Run the build under the shared build lock when other sessions run.
- Full gate: `npm run test:full` (Vitest with coverage, plus `junit.xml`) for Full Objective Checks and migration or platform-sensitive hand-offs; it writes a fresh `coverage/coverage-final.json`. The fast `npm test` does not.
- Lint gate: `npm run lint` is ESLint with one rule, `complexity` at 20, over `packages` and `tools` (`eslint.config.js`; Guardrails CODE-01). typescript-eslint refuses TypeScript 7, so `tools/lint/use-typescript6.cjs` and the npm `overrides` in `package.json` point it at a TypeScript 6 parser; do not remove them until typescript-eslint supports TypeScript 7.
- Engine-alone gate: `npm run check:engine-alone` (about 20 s) copies `packages/astraeus` and the shared config into a scratch folder with no demo or site, links the installed dependencies, then type-checks, lints and tests it there; anything that reaches outside the copy fails. It checks the engine source; `check:pack` checks the compiled build. Run it at each Full Objective Check and when the engine's boundary changes.
- Browser gate: `npm run check:browser` (about 230 s; timing history in the O-060 note) once per Full Objective Check, as the Astraeus Project Rules say; its scripts share `packages/astraeus-site/tools/validate/harness.mjs` and `driver.mjs` (map in `docs/BROWSER_CHECKS.md`). The two journey sizes of the `smoke` step run side by side in one browser, by the owner's choice (O-060, 2026-11-07); that makes the time depend on the machine, which the owner accepted.
- Timed gates and time limits (O-060): `tools/gate-limits.json` is the one file that states every limit, in seconds of wall clock. `npm run check:gates` (`tools/time-gates.mjs`) runs lint, typecheck, build, test, test:full, check:engine-alone, check:pack, check:node-consumer and check:react-consumer one after another (or only those named: `npm run check:gates -- lint test`) and prints each time against its limit; `check:browser` prints each step and the total against theirs in its summary. A run over a limit prints a `WARNING:` line and never changes the exit code; only a failing gate does (`packages/astraeus-site/tests/gateLimits.test.ts` plants a limit to prove it). A limit is the slowest measured time plus room for ordinary variation (history: [O-060 gate timings](../architecture/reconciliation-history.md#o-060-gate-timings-moved-from-docsagentsbuildmd-2026-11-12)); when a gate grows past its limit, look at why before raising the number. The table must state the file's numbers (a test checks):

| Gate | Limit |
|------|------|
| `lint` | 15 s |
| `typecheck` | 20 s |
| `build` | 15 s |
| `test` | 65 s |
| `test:full` | 105 s |
| `check:engine-alone` | 40 s |
| `check:pack` | 30 s |
| `check:node-consumer` | 15 s |
| `check:react-consumer` | 25 s |
| `check:browser` | 320 s |
- Package gates (O-036): `npm run build:packages` writes each of the nine publishable packages (`astraeus`, `astraeus-data`, `astraeus-data-{jupiter,saturn,uranus,neptune,mars,pluto,constellations}`) to `packages/<name>/dist`; `npm run check:pack` builds them and checks contents and sizes (part of every O-036 hand-off); `npm run check:react-consumer` (O-053 T-230, needs network, about 6 s) installs the packed engine into a scratch app so npm resolves React from the peer ranges; it fails if the install fails, the installed React is not 19.x, or `AstraeusScene` does not render on the server. It prints the installed 19.x and the registry's newest, and when they differ it passes only if a dependency other than `astraeus` (today `@react-three/fiber`) caps React below the newest, naming it (the release workflow runs it after `check:pack`); `npm run build:example` builds `examples/hello-scene`, `hello-react`, `hello-planets` and `hello-sky` (which also installs the constellations package) from the packed tarballs (`node tools/build-example.mjs hello-planets` builds one; serve one with `npx vite preview examples/hello-planets --port 5483`). `node tools/publish-packages.mjs --dry-run` shows what a release would publish; never run it without `--dry-run`, and never `npm publish` (the GitHub release workflow publishes, `docs/RELEASING.md`).
- Health scanners (`.savepoint/health/config.json`), one line each:
  - jscpd measures duplicated lines over code only; it skips `docs/evidence`, `tests/fixtures`, `data`, `tools/archive`, import data and caches, `coverage`.
  - lizard measures function complexity over the same code; same skips. `.claude` hooks are not skipped (11 rows of about 5500; left as measured, the owner may add the exclusion).
  - coverage counts `src` and the non-browser `tools` only (`test.coverage` in the root `vitest.config.ts`), refreshed by `npm run test:full` at each Full Objective Check before `savepoint health check`.
