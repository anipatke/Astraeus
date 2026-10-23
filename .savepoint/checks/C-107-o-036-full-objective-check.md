---
id: C-107
scope: {kind: objective, id: O-036}
result: NEEDS WORK
checked_by: {role: checker, session: o036-full-check-20261023}
executed_session: o036-builders-and-coordinator-20261023
checked_at: '2026-10-23T08:15:30Z'
health_snapshot: sha256:c7bf5a425b54541c2d5fef50ed2ca42e21527b03c6f376da22ee4a31af70f85a
reviewed:
  base_commit: 7498e7a3
  head_commit: 4dd1f8a6
  files: [packages/astraeus/src/api/, packages/astraeus/package.json, packages/astraeus/README.md, packages/astraeus/NOTICE, packages/astraeus-data/, packages/astraeus-data-jupiter/, packages/astraeus-data-saturn/, packages/astraeus-data-uranus/, packages/astraeus-data-neptune/, packages/astraeus-data-mars/, packages/astraeus-data-pluto/, packages/astraeus/src/assets/pictures.ts, packages/astraeus/src/assets/sky.ts, packages/astraeus/src/assets/bodies/venus.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus-site/src/registerData.ts, packages/astraeus-site/tools/validate/check-hello-scene.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus-site/tests/packagePacks.test.ts, packages/astraeus-site/tests/publishWorkflow.test.ts, tools/build-packages.mjs, tools/check-packs.mjs, tools/publish-packages.mjs, tools/build-example.mjs, .github/workflows/publish.yml, examples/hello-scene/, docs/NPM_PACKAGING.md, docs/RELEASING.md, docs/BROWSER_CHECKS.md, AGENTS.md, .savepoint/Design.md]
  dependencies: [package-lock.json]
issues: [I-077, I-078, I-079]
supersedes: null
---

# C-107: O-036 Full Objective Check

This is the mandatory Full Objective Check of O-036 at HEAD `4dd1f8a6` against base `7498e7a3`, with a clean tree. This session is independent: it did not plan, build, coordinate or mark any O-036 work. All four Tasks are `done` under owner check waivers (T-159 to T-162 `check_waiver`), and this Check reviews each of them. Times come from `date -u`.

**Verdict: NEEDS WORK** (two medium Issues, one low). The core works end to end. `mount` with real moon data draws Titan with its map from packed tarballs, in both Vite build and dev. The demos and the public site are unchanged in content. The publish workflow is safe, and `npm ci` works on a clean clone. Two promises on the npm front page do not hold for a real consumer: webpack 5 cannot build the package (I-077), and a positions package is inlined into the consumer's entry script (I-078). The AGENTS.md map was not updated, although the evidence says it was (I-079).

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (none used; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. Success Conditions SC1 to SC6 and Confirmed Decisions 1 to 7 of O-036; the Done When items of T-159 to T-162; Guardrails ARCH-01/02/04, PROV-01/02, DATA-01, TEST-01/03, SEC-01; the Astraeus Project Rules (browser checks once, no screenshots, driver only).
2. Public entry points: `Scene` (`addBody`, `addTrajectory`, `setTime`, `setScale`, `camera.follow`), `mount`, `SceneError`, ready-made bodies, `DataSource` (`astraeus-data*` `dataSource`), published `exports`. Tools: `build-packages`, `check-packs`, `publish-packages`, `build-example`, `publish.yml`.
3. Relied-on behaviour: the consumer bundler resolving the compiled dist (Vite, and webpack 5 because the README promises it), npm pack/view/publish `--dry-run`, and GitHub Actions trigger semantics, read from the workflow text.
4. Matrix below; Parcel and esbuild are marked unverified or not applicable.
5. An Issue must break an SC, a Confirmed Decision, a Guardrail, or a written promise that SC5 requires, through a supported consumer or release path.

## Coverage Matrix

| Row | Cell | Result | Evidence |
|---|---|---|---|
| SC1 API | definition contents, defaults, provider and sample trajectories, named errors, mount/unmount, follow on open | Proven | `publicApi.test.ts` passes (part of test:full); code read of `api/scene.ts` and `mount.ts` |
| SC1 API | real browser, engine only (no data) | Proven | `check:browser` step `hello-scene` passes on desktop and phone |
| SC1 API | real browser, moon with data packages (independent scenario) | Proven | Scratch Vite app with packed `astraeus` + `astraeus-data` + `astraeus-data-saturn`: `ready` = ok, `titan` drawn as a sphere in view and picked, `titan-4k` and `saturn-2k` pictures fetched, 2 `.bin` chunks fetched, Saturn moves relative to Titan over a 4-day seek, 0 errors. The same result under the `vite` dev server |
| SC1 API | missing data, unknown body, bad time, duplicate id, no-orbit | Proven | Unit cases in `publicApi.test.ts` |
| SC1 demos unchanged | demos and site | Proven | Browser smoke and journeys pass; public build pictures and data identical by content hash to a base build of 7498e7a3 (70 files) |
| SC2 packages | contents and size check | Proven | `check:pack` passes for all 8 packages; `packagePacks.test.ts` plants offenders |
| SC2 packages | "optional, only download what you use" | **Issue I-078** | Saturn package inlined into the consumer entry script (14.9 MB, 5,321 data URLs) |
| SC3 install-ready | compiled ESM + `.d.ts`, exports `.` and `./style.css` only | Proven | `dist/package.json` and the files; consumer import resolves under Vite |
| SC3 install-ready | webpack 5 (promised in the README) | **Issue I-077** | 9 "fully specified" errors |
| SC3 install-ready | Parcel (promised) | Unverified, and not admitted separately | Same extensionless imports; folded into I-077's Proof Needed |
| SC4 example | packed tarballs, draws, browser step, owner look | Proven | `hello-scene` step passes; owner verdict recorded in T-162 |
| SC5 written down | README API matches the code exports; 0.1 promise; CHANGELOGs; RELEASING | Proven, except the bundler claim (I-077) and the download claim (I-078) | Read against `api/index.ts`; RELEASING steps match the workflow and script |
| SC5 / T-162 | AGENTS.md and Design describe the packages | Design proven; **AGENTS Issue I-079** | Diff of AGENTS.md |
| SC6 publish | release-only real publish; manual run is a dry run | Proven | `publish.yml` `if [ "$EVENT" = "release" ]`; dry-run mode adds no `--provenance` |
| SC6 publish | tag and version guard | Proven | Clean clone `--tag v0.2.0` refuses all 8 and publishes nothing |
| SC6 publish | skip existing versions | Proven by code and test | `isPublished` via `npm view` (E404 means not published); `planFor` tests |
| SC6 publish | no token; OIDC; provenance | Proven | `permissions: id-token: write`; no `secrets.`/`NPM_TOKEN`; `--provenance` |
| SC6 publish | `npm ci` on a clean clone | Proven | `git clone` + `npm ci` (229 packages), then typecheck, build, check:pack and `npm test` all exit 0 |
| SC6 publish | full dry run | Proven | Clean clone `--dry-run`: 8 × "not on npm yet", `+ name@0.1.0 (dry-run)` |
| PROV-01/02 | credits travel with moved pictures | Proven | `astraeus-data/src/pictures.ts` records plus NOTICE; engine NOTICE lists only what it ships; `assetsPageCredits.test.ts` reads `PICTURES`; `public-build-assets` ok |
| ARCH-04 | engine alone | Proven | `check:engine-alone` pass |
| Public site | file list 99 → 93 | Proven as explained in T-161 | Name diff against the base public build: exactly `ephemerisProvenance.js` and 5 outer-moon index chunks removed (never fetched); load budget ok |

External boundary (npm registry, GitHub Actions, bundlers): configured target registry.npmjs.org was reached for `npm view` (404 on a never-published package returns "publish"). A non-404 failure throws, so nothing is published. Partial publish followed by a re-run skips published versions. Timeout and cancellation: the job has a 60 min timeout and the script stops at the first failed publish. The output carries no secret (there is none). The actual GitHub runner was not exercised; this is unverifiable here by design (SC6 says "proven by a dry run").

## Workflow And Side-Effect Lock (publish)

| # | Operation | Side effect | Failure → final state |
|---|---|---|---|
| 1 | checkout, `npm ci` | none external | job fails, nothing sent |
| 2 | lint, typecheck, build, test, engine-alone | none | job fails, nothing sent |
| 3 | `check:pack` (builds every `dist`) | local files | job fails, nothing sent |
| 4 | plan: read dist versions, `npm view` each | registry read | a refusal or a view error stops before any publish |
| 5 | publish engine first, then 7 data packages | **externally visible from the first success** | a later failure leaves earlier packages published; a re-run skips them (verified in code) |

## Gates (fresh, this session)

| Gate | UTC | Result |
|---|---|---|
| `npm run lint` | 08:05:07-08:05:09 | pass |
| `npm run typecheck` | 08:05:09-08:05:14 | pass |
| `npm run build` | 08:05:14-08:05:15 | pass |
| `npm run test:full` (first) | 08:05:38-08:06:40 | 1 timeout at 5000 ms in `pointsLookAhead.test.ts` (not in the diff; the same load flake as C-106) |
| `npm run test:full` (rerun, alone) | 08:07:13-08:08:16 | pass: 119 files, 1567 passed, 1 skipped; fresh coverage and junit |
| `npm run check:engine-alone` | 08:06:40-08:06:54 | pass |
| `npm run check:pack` | 08:06:54-08:07:06 | pass (sizes match T-161 within 0.02 MB) |
| `savepoint health check O-036` | 08:08:19 | snapshot above; "does not block clearance"; all instances report no finding |
| Public build + `load-budget.mjs dist` + `public-build-assets.mjs dist` | 08:12:38-08:12:42 | pass: 93 files, 24,870,860 B; then normal `npm run build` restored at 08:12:48 |
| `npm run check:browser` (once) | 08:13:07-08:14:29 | pass, 7 steps incl. `hello-scene`; evidence `docs/evidence/browser-20261023T081307Z/` |
| `git diff --check 7498e7a3..HEAD` | 08:05 | clean |

Nothing was published and nothing was pushed. The owner's servers on :5490, :5491 and :5496 were left running. The scratch consumer, webpack and clone probes were all outside the repository.

## Adversarial Pass (notes)

- Representation switch (source vs compiled): the demos use `.ts` source exports, and consumers get compiled `dist`. The consumer path was exercised independently of `build-example` (it used the data packages too) and exposed I-077 and I-078.
- Bypass: `addBody("titan")` by id still carries `requires` (`readyMade`), and without data `mount` throws `missing-data` (unit test). The pictures package alone does not satisfy a moon (`provides: []`).
- Sky: the Milky Way picture is off by default (owner decision 2026-10-15), so a consumer passing `astraeus-data` sees it only after turning it on. Behaviour is as designed.
- API honesty: the Idea sketch's calls exist as written. `addTrajectory` takes `{ id, samples | provider+bounds }` rather than a ready-made `apollo11`, which is documented. The 0.1 promise matches the published `exports` (`.` and `./style.css`).

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-077 webpack 5 build fails | Medium (webpack is common; the README invites it) | Medium (install fails at once; a workaround exists) | Medium | Fix now: emit `.js` extensions (small change in `build-packages.mjs`), or narrow the README |
| I-078 positions chunks inlined | High for anyone using a positions package with default Vite | Medium (Saturn: +9.6 MB gzip before first draw; still correct) | Medium | Fix now, or document the setting and correct the README |
| I-079 AGENTS map stale, evidence overclaims | High (every agent reads it) | Low | Low | Combine with the I-077/I-078 repair |

## Observations (non-blocking)

- README says `astraeus-data` is "about 35 MB"; measured 38.6 MB packed.
- `publish.yml` prints the npm version but does not enforce npm ≥ 11.5.1 for trusted publishing. Node 24 currently ships npm 11.x (local 11.13.0).
- `mount` called twice on one element would create a second React root (React warns). This is not a promised use.
- The first `test:full` hit the known load-sensitive `pointsLookAhead.test.ts` timeout again (see C-106).

## Owner Validation

T-159 and T-162 owner verdicts are recorded in their Tasks. No further owner look is needed for this Check. A repair of I-078 that changes the example's build would be proven by the browser step at the recheck. The rule is never to run it twice for one change, so it is run once for the new change.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: the diff covers 9,416 files, almost all of them `git mv` data renames (9,275 R). The code change is about 2,700 lines and is reviewable.
