---
id: C-212
scope: {kind: objective, id: O-092}
result: CLEAR
checked_by: {role: checker, session: check-o092-20261122}
executed_session: orchestrate-g024-20261122 (T-427..T-433 builders, coordinator; I-203 and I-204 direct repairs)
checked_at: '2026-11-22T05:22:00Z'
health_snapshot: sha256:ef47fdf8875b903d2cb30a4d173d57bd5e1dceca91ea8cac2e7882113c73386f
reviewed:
  base_commit: 1ff4d658
  head_commit: eff5d038
  files: [packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/BodySetView.ts, packages/astraeus/src/app/BodyView.tsx, packages/astraeus/src/app/KeplerPoints.ts, packages/astraeus/src/app/PathView.ts, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/TrackedBodyView.ts, packages/astraeus/src/app/bodyDraw.ts, packages/astraeus/src/app/disposeOwned.ts, packages/astraeus/src/app/dotMaterial.ts, packages/astraeus/src/app/loadingWakes.ts, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/src/app/sceneHooks.ts, packages/astraeus/src/app/useBodyTexture.ts, packages/astraeus/src/assets/sky.ts, packages/astraeus/src/core/planetSeries.ts, packages/astraeus/vitest.waits.setup.ts, vitest.config.ts, packages/astraeus/tests/addressDom.test.ts, packages/astraeus/tests/appScreenDom.test.ts, packages/astraeus/tests/bodyTextureOwnedDom.test.ts, packages/astraeus/tests/bodyViewDisposalDom.test.ts, packages/astraeus/tests/bodyViewDom.test.ts, packages/astraeus/tests/contextLoss.test.ts, packages/astraeus/tests/developerDrawerFolds.test.ts, packages/astraeus/tests/disposalFixtures.ts, packages/astraeus/tests/glowAndHooksDom.test.ts, packages/astraeus/tests/helpers/developerDrawer.ts, packages/astraeus/tests/loadingWakes.test.ts, packages/astraeus/tests/ownedPictures.test.ts, packages/astraeus/tests/planetSeriesRetry.test.ts, packages/astraeus/tests/releaseSharedTextures.test.ts (deleted), packages/astraeus/tests/sceneViewsDisposalDom.test.ts, packages/astraeus/tests/starCatalogueRetry.test.ts, packages/astraeus/tests/viewDisposal.test.ts, packages/astraeus/tests/viewerIds.test.ts, packages/astraeus/tests/waitDefaults.test.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/src/synthetic/syntheticTwoViewers.ts, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/journey-two-viewers.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, tools/gate-limits.json, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, docs/agents/build.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
  dependencies: [three 0.169.0 (installed), three 0.180.0 (newest admitted, check:three-newest)]
issues: []
supersedes: null
---

# C-212: O-092 Full Objective Check

Fresh session; it did not plan, build, coordinate or repair any O-092 work, I-203 or I-204. Diff `1ff4d658..eff5d038` (`main` = `1ff4d658`), 61 files. T-427..T-433 are `done` with owner `check_waiver`s (step checks waived; this Check covers every Task). Owner decision "Own copies" (2026-11-22) replaces "reference-counted shared textures" in Success Condition 3; it is applied as the requirement.

**Result: CLEAR.** No GPU picture or geometry is shared between viewers any more; every view that makes GPU objects disposes them, nothing shared (three's page-wide sprite geometry included) is disposed; picture-load wake-ups survive any unmount order and give the page its callbacks back; failed planet-series, star-file and body-picture loads are retried; three's own renderer handles context loss, and the real two-viewer page proves the second viewer keeps drawing after the first goes and after a lost and restored context. All gates pass. I-203 and I-204 meet their Proof Needed and are closed as `verified`. No Issue opened.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (lanes advisory; not a feature under check; ignored)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: O-092 Success Conditions 1-5 (SC3 as amended by "Own copies"); T-427..T-433 Done When; Guardrails API-03, ARCH-03, ARCH-04, TEST-01..TEST-04; I-203 and I-204 Proof Needed; gates per `docs/agents/verification.md`, `build.md`, `browser-policy.md` (O-094 rules); engine cap 1,838,000 B raw.
2. Entry points: `dotMaterial`, `anchorSpriteTexture`, `createGlow`, `createMarker`; `dispose()` of PathView, PointsView, KeplerPoints, TrackedBodyView, BodySetView (+map), and the existing OrbitSetView/SkyView/SkyFiguresView/RingView; `disposeOwned`; `useSceneViews` and `BodyView` cleanups; `useBodyTexture`; `addLoadingWake` via `useDrawWakes`; `loadPlanetSeries`, `loadStarCatalogue`; `AstraeusScene` `<Canvas gl>`; the `synthetic-two-viewers` dev entry and `two-viewers` browser step; the Vitest wait default and drawer helper.
3. Relied-on dependency behaviour: three's `WebGLRenderer` context-loss/restore path, its per-renderer dispose listeners, `Sprite`'s shared geometry, `Texture.clone`/`needsUpdate`; r3f `useLoader` cache and `useLoader.clear`; Chrome `WEBGL_lose_context`.
4. Matrix below; not-applicable cells carry reasons.
5. Admission: an Issue needs a reproducible violation of an item in 1 through a supported path (a host mounting/unmounting viewers through `mount`/`AstraeusScene`, or the test runner).

## Coverage matrix

| # | Row (rule) | Cells | Evidence | Result |
|---|---|---|---|---|
| M1 | Pictures per material (SC3, T-428) | dot without map / with caller map / `map: undefined`; anchor per call; glow texture and geometry per sprite; not three's sprite geometry | `ownedPictures.test.ts` (3); source read `dotMaterial.ts` (`map: parameters.map ?? roundDotTexture()`), `bodyDraw.ts` `createGlow` geometry clone; no module-level texture/geometry/material left in `src` (grep) | pass |
| M2 | Two viewers isolated on disposal (API-03) | A disposed once and twice; B none; three's shared sprite geometry none | `ownedPictures` case 3, `viewDisposal` two-view row, `sceneViewsDisposalDom`, `bodyViewDisposalDom`; **independent probe** (scratch test, own traversal over material fields, not `disposalFixtures.owned`): A = Kepler-sized PointsView + TrackedBodyView + PathView with orbit look + glow + marker; A and B share no object; every A object heard `dispose` (>10 objects), B heard 0, three's `new Sprite().geometry` heard 0 | pass |
| M3 | Every view frees all it owns (SC2, T-429) | 11 table rows; dispose keeps arrays (StrictMode redraw); scan of `src/app` classes | `viewDisposal.test.ts`; four new `useSceneViews` effects + three `BodyView` effects read; shader uniforms of PointsView/KeplerPoints hold only numbers/vectors (no texture missed by `disposeOwned`) | pass |
| M4 | Body pictures (T-428) | two uses → two clones, version > 0; unmount disposes only own clone; failed URL cleared at unmount, not while mounted; loaded URL not cleared | `bodyTextureOwnedDom.test.ts`; source read | pass (observation O3) |
| M5 | Loading wakes (SC3, T-430) | A-then-B and B-then-A unmount; page callback before mount kept and restored (`toBe`); callback set while mounted not overwritten; restore wake per canvas | `loadingWakes.test.ts`; **independent probe**: interleaved add A, add B, remove A twice, add C, remove B, remove C → all four page callbacks restored by identity; a stale remover from the earlier generation called after a new install does not uninstall it | pass |
| M6 | Retry (SC5, T-431) | planet chunk rejects → caller rejects with original error, concurrent caller shares and rejects; retry; success once; stars `null` → retry; good once | `planetSeriesRetry.test.ts`, `starCatalogueRetry.test.ts`; **independent probe**: a retry issued from inside the first caller's `catch` starts a new load (the clearing branch is registered before the caller's, so it runs first), loads, and a later call does not import again | pass |
| M7 | Context loss (SC4, T-432) | three 0.169 and 0.180 prevent the default and listen for restore; `gl` is a plain options object; restore wakes the draw rule; real browser restore | `contextLoss.test.ts` (3) green on 0.169 (`npm test`) and 0.180 (`check:three-newest`); `glowAndHooksDom` restore case; browser `two-viewers` scenario 3 at both sizes | pass |
| M8 | Real two-viewer page (SC1, SC2) | layout at 1280x720 and 375x667; first unmount → one canvas drawing, no warning; lose/restore; second unmount → no canvas | browser run below, `two-viewers` exit 0 both sizes; T-427 before-fix runs record the harm (stale deletes / canvas left) | pass |
| M9 | Stale-delete allowance (T-427 coordinator) | allowed text, scenario, cause | Regex anchored to exactly `WebGL: INVALID_OPERATION: (delete\|deleteVertexArray): object does not belong to this context`, filtered only in the final assertion; scenarios 2 and 3 assert an empty warning list before it. Cause verified in `node_modules/three/src/renderers/WebGLRenderer.js`: `onContextRestore` (~671) calls `initGLContext()` (~284) which builds new `WebGLProperties`, `WebGLTextures`, `WebGLAttributes`, `WebGLBindingStates`, `WebGLGeometries`; listeners the old instances added (`WebGLGeometries.js` ~68 `onGeometryDispose`, `WebGLTextures.js` ~659 `onTextureDispose`) stay on the objects, so disposing after the restore makes the old instances delete pre-loss handles (buffers, textures, vertex arrays). The explanation holds; the warnings are three's, harmless, and do not mask a missed disposal. | pass |
| M10 | Test-setup limits | edits only where Tasks/Issues allowed | T-428's three named test edits match (releaseSharedTextures deleted; glowAndHooksDom import, afterEach call and shared-picture case; bodyViewDom import and call); I-203: viewerIds and developerDrawerFolds waits through the helper, addressDom/appScreenDom gain one preload line each (declared in I-203 history; no assertion or fixture changed); I-204: `vitest.waits.setup.ts` first in all three projects | pass |
| M11 | Design/CHANGELOG reconciled | Good guest (7); drift notes T-427..T-432 each accounted; 0.10.0 Fixed lines | Design.md item (7) read; T-433 accounting matches the drift notes; three `- Fixed:` lines above "Breaking changes in 0.10.0" | pass |
| M12 | Engine size | cap | `check:pack`: 1,827,398 B raw (limit 1,838,000), 523,686 B gzip (limit 527,000) | pass |
| — | Input-shape, text-class, output-sink, serialization axes | n/a | No parser, text rendering or serialization in scope; disposal and loading only | n/a |

## Gates (this session, sequential, wall clock, HEAD eff5d038)

Selection from the diff under the O-094 rules: `quality_gates` with `npm test`; `check:pack` (engine size); `check:three-newest` (three usage changed: clones, sprite geometry, disposal, renderer-source test); **`check:engine-alone` added** because `vitest.config.ts` changed (I-204), which `build.md` lists as a trigger (T-433 said no build-config change; corrected here); `check:public-build` added (cheap; `public-build-assets.mjs` changed). Browser: `look-out` (Shaders: `dotMaterial.ts`, `PointsView.ts`, `KeplerPoints.ts`; Sky: `assets/sky.ts` star loading), `two-viewers` (its policy row: `AstraeusScene.tsx`, `sceneHooks.ts`, `sceneContentsHooks.ts`, `bodyDraw.ts`, `dotMaterial.ts`, `useBodyTexture.ts`, view `dispose`s, `disposeOwned.ts`, `loadingWakes.ts`, `syntheticTwoViewers.ts`, `journey-two-viewers.mjs`); no `shell/`, camera, views, story or catalogue path; `--skip-examples` kept (no packaging path, `package.json`, `examples/`, `api/index.ts` or `api-surface.lock.json` change; `git diff --stat` on those paths is empty).

| Gate | Start (UTC) | Time | Result |
|---|---|---|---|
| `npm run lint` | 05:12:03 | 13 s | pass |
| `npm run typecheck` | 05:12:16 | 7 s | pass |
| `npm run build` | 05:12:23 | 7 s | pass |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 05:12:30 | 36 s | 337 files, 5481 passed, 2 skipped |
| `npm run check:pack` | 05:13:25 | 23 s | pass; engine 1,827,398 B raw / 523,686 B gzip |
| `npm run check:public-build` | 05:13:48 | 4 s | pass |
| `npm run check:engine-alone` | 05:13:52 | 31 s | pass: typecheck, lint, 259 files / 4330 passed, 1 skipped |
| `npm run check:three-newest` | 05:14:56 | 33 s | pass on three 0.180.0: 259 files / 4330 passed, 1 skipped (a first attempt at 05:14:23 failed at typecheck on this checker's own temporary probe file, copied while it briefly existed; the file was removed and the gate rerun; no product cause) |
| `npm run check:browser -- --tier quick --step look-out --step two-viewers --skip-examples` | 05:15:38 | 142 s (limit 295) | exit 0, 0 error lines: smoke 45 s, smoke-public-showers 5 s, planets-phone 12 s, look-out 70 s, two-viewers 6 s; evidence `docs/evidence/browser-quick-20261122T051538Z` |
| `git diff --check 1ff4d658..HEAD` | — | — | clean |

Extra runs for I-203/I-204 (05:18:09-05:19:07, with 8 busy-loop processes loading the machine): `viewerIds`, `developerDrawerFolds`, `twoViewers`, `waitDefaults` 4 files, 141 passed; a second full `npm test` 337 files, 5481 passed, 2 skipped (two consecutive green full runs). `waitDefaults.test.ts` under a scratch config without the setup file: the unnamed-wait case fails at 1005 ms, the named-timeout case passes (the test can fail).

## External-boundary and workflow lock

- Browser runner: configured and actual target the dev server and scratch public build the runner starts (logs `/tmp/astraeus-check-logs-Rd60PC`); one run, no other browser job on the machine; failure would be a non-zero step exit. Redirect/secret cells n/a (local servers, no credentials).
- Network loaders: failed fetch (stars `null`, planet chunk rejection, body picture stand-in) and later success are covered by M4/M6; the browser's own module-map caching of a failed dynamic `import()` is outside the engine (T-431 records it as unverified browser behaviour; observation O5).
- Unmount workflow (order: React effect cleanups → view `dispose` → r3f disposes its own meshes → renderer forget): each operation only frees GPU copies, so a failure mid-way leaves no shared object freed; the independent oracle is `dispose` events per object (M2/M3) and the real page's canvas count, frames drawn and console (M8).

## Issues

None.

## Materiality

No Issues; no materiality actions required.

## Observations (non-blocking)

- O1 Gate proposal: T-433's Technical Evidence said no build-config change and left out `check:engine-alone`; the I-204 repair changed `vitest.config.ts`, a build.md trigger. This Check ran it (pass). Future Task inputs should re-check Issue repairs on the branch, not only the Tasks' files.
- O2 `contextLoss.test.ts` reads three's renderer source. It is not a pin of Astraeus's own text (O-088's concern): it is a peer-upgrade tripwire across the admitted range (`>=0.169.0 <0.181.0`), green on 0.169 and 0.180, robust to whitespace and quote style, and if three restructures it fails loudly rather than passing silently; it costs about 90 ms. It earns its place. Its second case ("fails on a copy without the preventDefault call") only proves the matcher can fail, which adds little.
- O3 `useBodyTexture`: when the same body picture failed in two mounted viewers, unmounting one clears the URL from the shared loader cache while the other is still mounted; the other's next render re-requests it once (one Suspense round trip, not a loop). Rare and bounded.
- O4 `useBodyTexture` sets `needsUpdate` on each clone, which also bumps the shared image source's version, so other viewers' clones re-upload that image once when a new viewer mounts. Negligible cost.
- O5 Browser module-map behaviour for a failed `import()` chunk is recorded in T-431 "from memory, unverified"; the engine side (clearing the promise) is proven.
- O6 Engine growth +970 B since C-211 against the planned 900 B Task allowances; cap headroom about 10.6 KB.
- O7 The `two-viewers` step does not record how many stale-delete warnings it allowed; a count in its results would make a change in three's behaviour visible.
- O8 Two constants hold the same 10 s: `DRAWER_WAIT_MS` (`tests/helpers/developerDrawer.ts`) and `WAIT_DEFAULT_MS` (`vitest.waits.setup.ts`); with the project default in place the helper could use it.

## Issues verified on this branch

- I-203 (drawer wait): Proof Needed met. The wait goes through one shared helper (`tests/helpers/developerDrawer.ts`: preload the chunk, then a 10 s named timeout), used by `viewerIds` and `developerDrawerFolds`, with `addressDom`/`appScreenDom` preloading; shown under load (8 busy loops, files green) and two consecutive green full `npm test` runs (05:12:30, 05:18:17). Closed `verified`.
- I-204 (wait default): Proof Needed met. `vitest.waits.setup.ts` is the first setup file of the `preloaded`, `moons` and `cold` projects; an unnamed wait gets 10 s and a named one is kept (`waitDefaults.test.ts`, shown to fail without the setup file); formerly flaky files green under load; two full runs green. Closed `verified`.

## Code Health

`savepoint health check O-092` at 05:19:12Z: snapshot `sha256:ef47fdf8875b903d2cb30a4d173d57bd5e1dceca91ea8cac2e7882113c73386f` (created), "Code Health does not block clearance". complexity, duplication, dependency vulnerabilities: no finding. coverage: stale (expected: `test:full` runs at release under the O-094 rules). tests (junit): reported stale (optional instance); the gate's `npm test` passed in this session. Collection state only, not a finding.

## Closure readiness

Every owned Task is `done` with an owner waiver; this mandatory Objective Check is `CLEAR` and current; no material Issue is linked to it. The owner may accept the O-092 outcome. No owner look is required (Objective Decisions: pictures load and draw as before); the owner may view `localhost:5490/app.html?experience=synthetic-two-viewers` if curious.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — the 10 s wait lives in two constants (`tests/helpers/developerDrawer.ts` `DRAWER_WAIT_MS`, `packages/astraeus/vitest.waits.setup.ts` `WAIT_DEFAULT_MS`).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
