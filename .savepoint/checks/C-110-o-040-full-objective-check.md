---
id: C-110
scope: {kind: objective, id: O-040}
result: NEEDS WORK
checked_by: {role: checker, session: o040-full-check-20261023}
executed_session: g011-overnight-20261023
checked_at: '2026-10-23T11:32:30Z'
health_snapshot: sha256:7c1ae0f9425c3d727374421dd7b3db7456b88293496764917a55de6e8f153133
reviewed:
  base_commit: 22730b18
  head_commit: f4ecd17e
  files: [packages/astraeus/package.json, package.json, package-lock.json, tools/build-packages.mjs, tools/check-packs.mjs, tools/build-example.mjs, examples/hello-scene/package.json, examples/hello-react/package.json, examples/hello-react/index.html, examples/hello-react/src/main.jsx, examples/hello-react/.gitignore, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/api/prepared.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/bodies.ts, packages/astraeus/src/core/scalePolicy.ts, packages/astraeus/src/core/state.ts, packages/astraeus/src/assets/licence.ts, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus-site/tools/site/api-reference.mjs, packages/astraeus-site/tools/site/api-reference.d.mts, packages/astraeus-site/tests/apiReference.test.ts, packages/astraeus-site/tests/publicBuild.test.ts, packages/astraeus-site/vite.config.ts, packages/astraeus-site/index.html, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tools/validate/runner.mjs, packages/astraeus-site/tools/validate/check-hello-scene.mjs, docs/BROWSER_CHECKS.md, .savepoint/Design.md]
  dependencies: [react@19.3.1, react-dom@19.3.1, '@react-three/fiber@9.8.2', three@0.169.0, '@types/react@19.3.0', '@types/react-dom@19.3.0']
issues: [I-080, I-081]
supersedes: null
---

# C-110: O-040 Full Objective Check

First Full Objective Check of O-040 (T-163, T-164, T-165). Diff baseline `git diff main...o040-react` (merge base `22730b18`, the O-040 planning commit; head `f4ecd17e`, tree clean at start). This session is independent: it did not plan, build, coordinate or repair any of the three Tasks. It ran every gate itself, planted its own faults in the pack check, wrote its own throwaway component probes (deleted afterwards) and read `/api` over HTTP from its own dev and preview servers. Times are `date -u`.

**Verdict: NEEDS WORK.** The product work holds: React 19 peers, the `AstraeusScene` component, the `hello-react` example (browser step passes at desktop and phone) and the `/api` page all do what the Objective promises. Two required gates are red, both reproducible, both introduced by O-040:

1. **I-080** — `npm run test:full` fails twice in a row: the new `apiReference.test.ts` listing case times out (6.5 s against 5 s) under coverage. The health snapshot blocks clearance for the same reason and no coverage report was written.
2. **I-081** — `npm run check:browser` exits 1: `public-build-assets` finds the Perseids showers page 3,636 B over its raw limit (10,073,636 vs 10,070,000) after the React 19 move. It passed on main (C-108 run).

Both are small, contained repairs. Every success condition is otherwise proven; see the coverage table.

## Owner Context (as given to this Check)

- The owner waived the per-step Task Checks for this run ("Keep going, looks in the morning", 2026-10-23). Each Task carries a `check_waiver`; the coordinator marked T-165 done under that instruction.
- Owner looks: T-163 "looks fine" (2026-10-23T10:54:59Z), T-164 "looks fine" (2026-10-23T11:00:13Z). **T-165's look at `/api` is deferred to the morning and is outstanding owner validation.** No Check result substitutes for it.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (no lanes used; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria and gates.** O-040 Success Conditions SC1 (React 19 and peers; demos unchanged, owner's look), SC2 (component, same viewer, cleanup, ready/error, `mount` unchanged), SC3 (React example from the packed tarballs plus a `check:browser` step, no screenshots), SC4 (`/api` generated from the public types and doc comments, every `.` export, short examples, README and npm page link, a fast check failing on an undocumented export). Task Done When lists of T-163, T-164, T-165, including T-165's Design reconciliation. Guardrails named by the Tasks: ARCH-01 to ARCH-04, PROV-02, TEST-01, TEST-03, CODE-01, CODE-02, STYLE-05, -07, -09, -10. Release gates: AGENTS.md Build full gate (lint, typecheck, build, `test:full`, `check:engine-alone`, `check:pack`, `check:browser` once) plus `savepoint health check O-040`.
2. **Changed files and public entry points.** The 41 files of the diff (listed in `reviewed.files`, plus Task records and router). Entry points: `astraeus` `.` (`AstraeusScene`, `AstraeusSceneProps`, `mount`, all others unchanged in shape); the published manifest; `tools/check-packs.mjs`, `tools/build-example.mjs`, `tools/build-packages.mjs`; site `/api` (build asset and dev middleware); `run-browser.mjs` steps.
3. **Relied-on runtime.** React 19 / react-dom 19 / Fiber 9 in the host app; Vite build and preview; npm pack/install of the tarballs; TypeScript 6 compiler API (`typescript6`); Vercel static serving of `dist/api/index.html` (assumed, not exercisable here).
4. **Axes.** Public surfaces x input shape (scene new/same, data, callbacks, bad scene, data failure, non-Error rejection) x state (pending, ready, rebuilt, unmounted before/after ready, StrictMode) x representations (source manifest, published manifest, packed tarball, built page, dev page) x environment (fast suite, coverage suite, dev server, preview, public build). Text classes, colour/no-colour sinks: not applicable (no text-width or terminal output in scope).
5. **Admission boundary.** An Issue must break a named criterion, guardrail or release gate on a supported path, be introduced or touched by O-040, and have a credible consequence. Anything else is an observation.

## Acceptance Coverage

| Criterion | Classification | Evidence |
|---|---|---|
| SC1 React 19 installed, matching types | Proven | `npm ls`-level versions in T-163 evidence match `package-lock.json`; typecheck, lint, build, `npm test` pass |
| SC1 four libraries are peers, not dependencies, in the published manifest | Proven | `packages/astraeus/dist/package.json` after `check:pack`: peers `react`/`react-dom` `>=19 <19.4`, fiber `>=9.8.2 <10`, three `>=0.169.0 <1`; `dependencies` only `@lizard-isana/orb`; no `devDependencies` |
| SC1 / T-163 check-packs fails on a bundling manifest | Proven (by this Check) | Planted faults, below: 5 of 5 named cases fail. No repository test plants them (observation 1) |
| SC1 demos look and behave as before | Proven (headless) + owner look given | `check:browser` smoke, planets-phone, meteor-shower, smoke-public-showers exit 0, 0 error lines; owner "looks fine" on T-163 |
| SC2 component renders the same `App` and definition as `mount` on one path | Proven | `prepared.ts` `prepareScene` is the only scene-to-definition path in both (`mount.ts:34`, `AstraeusScene.tsx:45`) |
| SC2 ready, error, rebuild on new scene, cleanup | Proven | `publicApi.test.ts` "AstraeusScene" block (5 cases) plus 4 independent probes below |
| SC2 `mount` unchanged | Proven | Existing `publicApi.test.ts` "mount" cases pass; signature and return unchanged; `hello-scene` browser step passes |
| SC3 React 19 example from tarballs, outside workspaces | Proven | `examples/hello-react/package.json` (devDependencies only, no workspace link), root `workspaces: ["packages/*"]`; built by `tools/build-example.mjs` inside `check:browser` |
| SC3 browser step proves it draws, no screenshots | Proven | `docs/evidence/browser-20261023T112923Z/hello-react/results.json`: ok, desktop `earthPx` 7.789, `orbitInView` 108; phone 7.216, 31; errors []; driver guard test passes in `npm test` |
| SC4 `/api` served, generated from types and doc comments, every `.` export | Proven | 50 exports collected = 50 names in `index.ts`; `dist/api/index.html` 24,544 B; dev `/api`, `/api/`, `/api?x=1` 200 with the page; public build requires `api/index.html` and measured it |
| SC4 short examples | Proven | `@example` on `Scene`, `mount`, `AstraeusScene`, asserted by the third apiReference case |
| SC4 README and npm page link | Proven | README link above the API table; `homepage: https://astraeus.anipatke.com/api/` in the published manifest; home page nav `api/` |
| SC4 fast check fails on an undocumented export | Proven in the fast suite; gate red on the full suite | Made-up-entry case passes; but the file's listing case times out under `test:full` (**I-080**) |
| T-165 load-budget and public-build checks know the new page | Proven | `api/index.html` page set and `REQUIRED_PAGES`; its own set passes |
| T-165 Design reconciled for the drift notes | Proven | `Design.md` O-036 packaging row and O-040 paragraph account for T-163 peers, T-164 component, `prepareScene`, `hello-react`, and the reference page, each reflected |
| Release gate `test:full` | **Issue** | I-080 |
| Release gate `check:browser` | **Issue** | I-081 |
| Owner look at `/api` (T-165 User Check) | Outstanding owner validation | Deferred to the morning; not a technical criterion of this Check and not satisfied by it |

## Coverage Matrix

| Surface | Cell | Result |
|---|---|---|
| `AstraeusScene` | first render, ready once, wrapper `className`/`style` | passed (repo test) |
| | scene that cannot be built (missing data package) | passed: `onError(SceneError)`, nothing drawn (repo test) |
| | empty `new Scene()` | passed: same `SceneError` class `mount` throws (probe 3) |
| | data load rejects with an Error | passed (repo test) |
| | data load rejects with a non-Error (`"plain string"`) | passed: wrapped as `Error("plain string")` (probe 3) |
| | same scene, new callbacks | passed: no rebuild; latest callback is the one held (repo test, probe 2) |
| | new scene while the first is still loading; first resolves late | passed: no `onReady` for A, one for B, viewer drawn (probe 1) |
| | unmount before data loads | passed: no draw, no `onReady` (repo test) |
| | rejection arriving after unmount | passed: no `onError` (probe 2) |
| | StrictMode double effect | passed: viewer drawn (probe 4); a second `prepare()` starts and is discarded, not a defect |
| | real canvas | passed headless only (`hello-react` step); not in the pretend page by design |
| `mount` | unchanged signature, bad element, ready/unmount | passed (existing repo tests) |
| published manifest | peers present, not dependencies, no devDependencies | passed (dist manifest, `check:pack`) |
| `check-packs` peer guard | react as dependency / three missing from peers / fiber moved to dependencies / no peer block / devDependencies kept | passed: each fails with a named problem (planted) |
| | `optionalDependencies` or `bundleDependencies` carrying a peer | not caught (observation 2; not a path the build writes) |
| `build-example.mjs` | both examples / one by name | passed (both, inside `check:browser`; per-name path read, not run) |
| browser runner | one preview port per example, both steps | passed (ports 5481, 5482; both steps exit 0) |
| `/api` generator | every export documented / made-up undocumented entry | passed (fast suite) |
| | under coverage load | **Issue I-080** |
| | anchors and ids | observation 3 (duplicate `id="scene"`, ids with spaces) |
| `/api` serving | dev `/api`, `/api/`, `/api?x=1` | passed (HTTP 200, page) |
| | `vite preview` `/api/` | passed; `/api` without slash falls back to the app shell (observation 4) |
| | Vercel `/api` and `/api/` | unverified here (external host); owner's look on the public build covers it |
| public build | all page sets and whole build | **Issue I-081** (showers page only); `api/index.html` 24,544 / 6,647 B within 100,000 / 30,000 |
| public addresses | no retired links | passed |
| engine boundary | engine alone | passed (`check:engine-alone`) |

### Finite External-Boundary Matrix

| Cell | Classification |
|---|---|
| Configured vs actual target | npm tarballs from `packages/astraeus/dist`, installed with `--no-save`; previews on 5481/5482; verified in the runner logs |
| Startup, discovery, reuse ordering | runner builds the examples once, serves each, waits for each URL; passed |
| Connection refused / unavailable | runner throws "example build failed" on a non-zero build; read, not forced |
| Success / non-success responses | dev `/apifoo` falls through to the SPA (200); `/api` variants as above |
| Redirects | none in scope (no redirect configured) |
| Timeout / cancellation | gate timeouts are I-080's subject; runner timeouts unchanged from O-038 |
| Malformed response | not applicable (static HTML) |
| Retry, cleanup, partial side effects | `buildOne` removes `.packs` and the installed `astraeus` before each install; the example installs are `--no-save --no-package-lock`; tree clean after the run apart from the new evidence folder and snapshot |
| Secret-safe output | no secrets in scope |

### Workflow And Side-Effect Lock

| Order | Operation | Side effect | Failure owner / final state | Oracle |
|---|---|---|---|---|
| 1 | `build-packages.mjs astraeus` | writes `packages/astraeus/dist` (manifest without `devDependencies`) | throws, command fails | dist manifest read directly |
| 2 | `npm pack` per example | `.packs/*.tgz` (git-ignored) | throws | runner logs |
| 3 | `npm install --no-save` tarball in each example | example `node_modules` (git-ignored) | throws | `git status` clean |
| 4 | `vite build` per example | `examples/<name>/dist` (git-ignored) | throws | preview served |
| 5 | `vite build` site with `apiReference` plugin | `dist/api/index.html` | build fails if the generator throws | file present, page read |
| 6 | `check-packs` | none (dry-run pack) | non-zero exit with problems | planted faults |

## Probes (independent of the repo's tests)

- **Peer guard, planted** (`checkPacks({ build: false, only: ["astraeus"] })` on a temporarily edited `packages/astraeus/dist/package.json`, restored byte-for-byte, `cmp` confirmed): baseline ok; react as dependency fail; three missing from peers fail; fiber moved to dependencies fail (two problems); no peer block fail (four problems); devDependencies kept fail; react-dom in `optionalDependencies` ok (not caught); react in `bundleDependencies` ok (not caught); peer range `""` ok (not caught).
- **Component** (a throwaway `packages/astraeus/tests/zzCheckerProbe.test.ts`, deleted after one run; 4 of 4 pass): deferred `prepare()` for scene A then B; rejection after unmount with a swapped callback; empty scene and a string rejection; StrictMode.
- **`/api` over HTTP** (own dev server on 5598, own `vite preview` on 5599, both stopped): dev `/api` 200 page, `/api/` 200 page, `/api?x=1` 200 page; preview `/api/` 200 page, `/api` 200 app shell.
- **Generator** (`collectExports()` on the real entry): 50 exports, none undocumented; the page's ids include `scene` twice and `draw it`, `data packages`, `scale and state`.

## Adversarial Pass

- Another public path bypassing the shared definition path? No: `mount` and `AstraeusScene` both call `prepareScene`; `Scene.toDefinition` is the only builder.
- Overlapping or post-failure transitions? Scene switch during load, unmount during load, rejection after unmount: all guarded by the effect's `open` flag (probes 1, 2).
- Representation change bypassing the peer rule? Source manifest keeps the peers as devDependencies for the workspace; `build-packages.mjs` strips `devDependencies`; the guard catches the realistic regressions. Unusual dependency fields slip past (observation 2).
- Tests using their own calculation? The doc-comment test uses the generator under test; its made-up entry gives an independent expected list (`forgotten`, `AlsoForgotten`). The browser step reads the scene's own readouts, not the component's state.
- A new export missing from the page? It would still be listed (under "Other exports") and the doc test would demand a comment; grouping is manual by design (Design.md says so).

## Verify File Reality

Every file named in the three Tasks' evidence and drift notes exists at `f4ecd17e` (`src/api/AstraeusScene.tsx`, `prepared.ts`, `tools/site/api-reference.mjs` and `.d.mts`, `tests/apiReference.test.ts`, `examples/hello-react/*`, the runner and step files). The builders' scratch browser evidence for the `hello-react` step alone was deliberately not kept under `docs/evidence` (T-164 says so). No phantom files.

## Gates (this session, fresh, on `f4ecd17e`)

| Command | Time (UTC) | Result |
|---|---|---|
| `git diff --check main...o040-react` | 11:32 | clean |
| `npm run lint` | 11:25:03-11:25:06 | pass |
| `npm run typecheck` | 11:25:06-11:25:10 | pass |
| `npm run build` | 11:25:10-11:25:12 | pass (`dist/api/index.html` 24,544 B) |
| `npm run test:full` (1st) | 11:25:12-11:26:13 | **fail**: 1 failed, 1576 passed, 1 skipped (120 files); `apiReference.test.ts` listing case timed out (6548 ms); I-080 |
| `npm run test:full` (2nd, reproducibility) | 11:26:29-11:27:30 | **fail**: same case (6496 ms) |
| `npm test` | 11:27:30-11:28:04 | pass: 120 files, 1577 passed, 1 skipped |
| `vitest run apiReference.test.ts` alone | 11:28 | pass |
| `npm run check:engine-alone` | 11:28:14-11:28:31 | pass (16.8 s) |
| `npm run check:pack` | 11:28:31-11:28:44 | pass; `astraeus` 6.99 MB packed, 411 files |
| `savepoint health check O-040` | 11:29 | snapshot `sha256:7c1ae0f9…153133` (created), **blocks clearance**: tests 1 failing (I-080); coverage collection failure (no report, because the full run failed); complexity, duplication, vulnerabilities no blocking finding |
| `npm run check:browser` (once) | 11:29:23-11:31:08 | **exit 1**: smoke, smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-addresses exit 0 with 0 error lines; `public-build-assets` exit 1 (I-081). Evidence `docs/evidence/browser-20261023T112923Z/`; logs `/tmp/astraeus-check-logs-jA6erF/`. No screenshots |

The public build and `public-build-assets` ran inside `check:browser`; not run separately. `npm run build:example` ran inside `check:browser` (both examples). Per the owner's rule the browser command is not to be rerun for this change; the recheck should reuse this run for every step but `public-build-assets`, and run the public build plus `public-build-assets.mjs` directly after I-081's repair.

## Code Health

Snapshot `sha256:7c1ae0f9425c3d727374421dd7b3db7456b88293496764917a55de6e8f153133`. Verdict "blocks clearance", caused by I-080 (failing test), not by a separate code finding. Coverage is a collection failure (Vitest wrote no report because the run failed), not a coverage measurement. The recheck needs a fresh official snapshot after a passing `test:full`.

## Issues

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-080 `apiReference.test.ts` times out under `test:full` | High (2 of 2 full runs) | Medium: full gate and health red, no coverage report; the doc guard itself works | Medium | Fix now: build the TypeScript program once per file (or a justified explicit timeout), then rerun `test:full` and health |
| I-081 showers page 3,636 B over its raw budget | High (every public build) | Low: 0.04 % over, gzip under, visitors unaffected; but `check:browser` is red | Low | Fix now with a measured, deliberate limit change (or a trim) recorded in `load-budget.mjs`, as T-098/T-120/T-152 did; owner or planner decides which |

`unmet`: none of the Success Conditions as behaviour; the unmet items are the release gates `test:full` and `check:browser` (I-080, I-081).

## Owner Validation Still Needed

- T-165: the owner's look at `/api` on `localhost:5490/api` and on the public build preview (phone width, nav links, home page link). Deferred to the morning; outstanding.
- T-163 and T-164 looks were given ("looks fine"). They carry forward unchanged unless the repairs touch the demos or the example; neither proposed repair should.

## Observations (non-blocking)

1. The new peer guard in `tools/check-packs.mjs` (`peerProblems`) has no repository test; this Check's planted faults are the only proof. A planted-manifest unit test beside `packagePacks.test.ts` would keep it honest (TEST-01 is met by this Check's scenario validation, not by a standing test).
2. The guard does not look at `optionalDependencies`, `bundleDependencies` or an empty peer range. `build-packages.mjs` never writes those, so it is not a supported regression path today.
3. `/api` page anchors: section `Scene` and class `Scene` both get `id="scene"`; section ids `draw it`, `data packages`, `scale and state` contain spaces (invalid HTML ids; browsers usually still jump). `BodyRef` appears under "Other exports" as well as in the bodies table. For the owner's look.
4. `vite preview` serves the app shell, not the reference, at `/api` without the slash; the home link uses `api/` and the dev server handles both. Vercel's handling of `/api` and `/api/` is assumed, not tried.
5. `packages/astraeus-site/tests/publishWorkflow.test.ts` "example app" checks only `examples/hello-scene` (manifest, `.gitignore`); `examples/hello-react`'s are checked by nothing but the build and browser step.
6. `.savepoint/Design.md` O-036 packaging row's file column still names only `examples/hello-scene/`; the O-040 paragraph covers `hello-react`. AGENTS.md's Codebase Map (owner-maintained, outside the managed block) has no `examples/hello-react` row.
7. T-165's API generator groups exports by a hand-written `SECTIONS` list; a new export appears under "Other exports" until named. Documented in Design.md as intended; it still appears and still must carry a doc comment.
8. T-163's builder needed `npm install --legacy-peer-deps` once (ERESOLVE) before a plain install succeeded; the lockfile now installs cleanly. A consumer on React 19.4 or later is outside the declared peer range `<19.4` (follows Fiber 9.8's own range).
9. T-165's `check_waiver.recorded_at` is `2026-10-23T00:00:00Z`, a date-only time; its actor session `g011-overnight-20261023` names the owner's overnight instruction.
10. The router still selects finished T-165 (`savepoint resume` warns); router changes are not this skill's to make.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** (component branches covered; peer guard branches covered only by this Check's probe, observation 1)
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** (`prepareScene` shared; `hello-react` reuses `check-hello-scene.mjs`)
- [ ] STYLE-08 **Comments explain why** — the 24 body doc comments (`bodies.ts`, e.g. `/** Mercury. */`) restate the name; they exist to satisfy the doc-comment test.
- [ ] STYLE-09 **Content lives in data** — the generator's page copy, CSS and `SECTIONS` grouping are inline in `api-reference.mjs` (about 60 lines of template).
- [x] STYLE-10 **Small diffs** (41 files across three Tasks, each Task's files coherent)
