---
id: C-144
scope: {kind: objective, id: O-055}
result: NEEDS WORK
checked_by: {role: checker, session: o055-check-20261102}
executed_session: o055-run-20261102
checked_at: '2026-11-02T10:55:00Z'
health_snapshot: sha256:4d40003cc78523a7be4341564c19a0a2a3541a76bf4db6c65df0115828170325
reviewed:
  base_commit: 72dc9be7
  head_commit: 37e670cd
  files: [packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/api/containingBlock.ts, packages/astraeus/src/assets/pictures.ts, packages/astraeus/src/assets/sky.ts, packages/astraeus/src/assets/bodies/venus.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/bodyDraw.ts, packages/astraeus/src/app/SkyView.ts, packages/astraeus/src/app/FeatureMarkers.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/bootLoader.ts, packages/astraeus/src/shell/viewerKeys.ts, packages/astraeus/src/shell/useDrawers.ts, packages/astraeus/src/shell/StoryPanelView.tsx, packages/astraeus/src/shell/DisplaySwitches.tsx, packages/astraeus/src/app/style.css, packages/astraeus/src/shell/style.css, packages/astraeus/src/shell/TopBar.css, packages/astraeus/src/shell/TimelineBar.css, packages/astraeus/src/shell/phone.css, packages/astraeus/src/shell/embedded.css, packages/astraeus-site/src/bootCover.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/app.html, packages/astraeus-site/tests/apiIsolation.allowlist.json, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json, .savepoint/Design.md]
  dependencies: []
issues: [I-140, I-141]
supersedes: null
---

# C-144: O-055 Full Objective Check

This is the mandatory Full Objective Check of O-055, "Make the viewer a good guest on any page" (G-016). Scope: `git diff main..HEAD` (`72dc9be7..37e670cd`, 11 commits, 107 files, +2568/-5825) and Tasks T-250 to T-258.

- T-250 to T-257 are `done`. Each has an owner Task-check waiver ("Mark it done and orchestrate the next one", session o055-run-20261102) and was marked by the coordinator.
- T-258 was `in_progress` / `audit` at HEAD, with the owner look recorded ("looks OK", 2026-11-02T10:05:11Z). See Observation 1 for what happened to it during this run.

The Objective has no prior Check, so there are no carried-forward owner decisions to assess. The owner's planning decisions of 2026-11-02 are design inputs, not Check exceptions; I-139 is outside the scope.

**Independence.** This conversation did not plan, build, coordinate or repair any O-055 step. It runs under the same top-level orchestration session as the builders: the scratchpad folder that holds T-256's throwaway `cascade.mjs` is the one this run uses. Builders' summaries were treated as claims to check. This run is not a lane (`git rev-parse --git-dir` and `--git-common-dir` both print `.git`).

This run wrote only:

- gate outputs (`coverage/`, `junit.xml`, `dist/`, `examples/*/dist`)
- one browser evidence folder, `docs/evidence/browser-20261102T101834Z/`
- its own evidence folder, `docs/evidence/check-o055-20261102/`, which holds:
  - the probes and their config
  - copies of the main-branch sheets
  - the probe outputs
  - `gates.log`
  - `health-check.txt`
- two temporary mutations, each restored with `git checkout --` (`git diff --quiet HEAD -- packages` is clean afterwards):
  - `App.tsx`
  - `app/AstraeusScene.tsx`
- one official health snapshot
- this record, I-140 and I-141

It did not touch `docs/prds/`, `docs/research/`, the three modified G-012/G-013/G-014 `Release.md` files or the router. It committed nothing.

**Verdict: NEEDS WORK**, for two Issues. All gates pass, and the two-viewer behaviour holds under independent probes: moons, pictures, ids, Escape, host rules and containing block.

1. **I-140.** The style scoping changed one look. An open nested Developer-drawer fold heading went from accent to muted. An independent computed-style oracle found it; the builders' model missed it because it reads `:not()` classes as required classes.
2. **I-141.** The site's loading-cover chain (`main.tsx` -> `App` -> scene -> first frame) is untested. A mutation that drops the claim passes all 2494 tests and `check:browser` never reads the cover. If that chain breaks, a black cover stays over every demo with every gate green.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (lane advice not a feature here; nothing to evaluate)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock (frozen)

1. **Criteria.**
   - O-055 Success Conditions 1 to 8.
   - Each Task's Done When (T-250 to T-258).
   - Guardrails API-01, API-02, API-03, API-06, API-07, ARCH-02, DATA-01, PROV-02, TEST-01, TEST-03, CODE-01.
   - Release gates from `docs/agents/build.md`: lint, typecheck, build, `test:full` (twice, as the brief asks), `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:react-consumer`, both example builds, and one `check:browser`.
2. **Changed files and entry points.**
   - Files: the 107 files of `main..HEAD`.
   - Public entry points: `mount` (`MountOptions.developerTools`), `<AstraeusScene>` (`developerTools` prop), `DataSource.pictures`, and the `astraeus/style.css` sheets.
   - Internal seams the Objective promises: `App` `developerTools` / `claimCover`, `createMoonSystem().load`, `installData`, `assembleScene` `pictures`, `textureOf`, `milkyWayPicture`, `keyIsForViewer`, `FeatureMarkerLayer` occluders, `makeContainingBlock`, `hideBootLoader`, the site's `createBootCover`.
3. **Relied-on runtime.**
   - React 19 `useId`.
   - The happy-dom cascade, as the fast-suite oracle.
   - Browser CSS specificity (Selectors 4, `:where`/`:is`/`:not`).
   - Real Jupiter moon fits on disk.
   - The site bundle's CSS order (measured from `dist/assets/app-*.css`: TimelineBar, TopBar, controls, shell/style, phone, embedded, app/style). The `mount` entry's order puts app/style first.
4. **Matrix axes.** Below. Not applicable:
   - Text classes: no text-width logic changed.
   - Serialization: no format changed. The surface lock is covered by gates.
5. **Admission boundary.**
   - A supported path is a host using `mount` or `AstraeusScene`, or the demo site.
   - In scope, a look change counts only on the site or viewer at 375x667 and 1280x720.
   - A missing guard counts only where a Task's Done When or TEST-01 promised the evidence.

## Coverage Matrix

| # | Row (criterion) | Cells (entry x input/state) | Result | Evidence |
|---|---|---|---|---|
| 1 | SC1 two viewers isolated | 3 pairings x {6 setters, onSelect, unmount A, remount A, ids} | Passed | `twoViewers.test.ts` (47 passing at HEAD, part of `test:full`); P-ID-1 adds a 4th pairing order (React then mount) |
| 2 | SC2 moons per request | later window, new moon, in flight, history, year-after, identical, out-of-span, failed fetch retry, public `installData`, rebuild, remount | Passed | `moonLoadTwice.test.ts`, `twoViewers.test.ts` T-251 cases. P-MOON-1 (independent, hand-released fetches): 3 overlapping requests in flight each answer `stateOf`, every chunk fetched once; a failing chunk rejects only its request, a retry refetches only that batch (never io's); an out-of-span request beside a good one rejects with `MoonOutOfSpanError` and fetches nothing for 2030/2031 |
| 3 | SC3 pictures per viewer | 4 pair orders x {all-pictures beside titan-only package, both load orders} + a third bare viewer; sphere, listed moon (io, titan), Venus desktop variant, Milky Way | Passed | P-PIC-1 (16 cases): each viewer resolves only its own package's pictures; the bare viewer gets none; `registerPictures`/`pictureOf` are gone (`grep` empty) |
| 4 | SC4 developerTools | mount/React x {default, true, false}, rebuild, App as site | Passed | `developerToolsOption.test.ts` (13 rows, module-load counter); `twoViewers` T-253; the site passes it (`main.tsx:126`) |
| 5 | SC5 no fixed ids | 4 pair orders x {desktop, phone} with both drawers, every fold, the info panel and phone drawers open | Passed | P-ID-1 (8 cases): no repeated id; every `aria-controls`/`labelledby`/`describedby`/`for` resolves inside its own `.astraeus-shell`; `node tools/api-rules.mjs ids` lists nothing (apiRules test) |
| 6 | SC6 Escape | 4 pair orders x {host select, host wrapper with tabindex around viewer A, inside A, inside B, documentElement, document, body with host preventDefault} | Passed | P-KEY-1 (4 cases x 7 origins) plus `escapeScope.test.ts` (3 listeners x 4 origins) |
| 7 | SC6 cover | `mount`/React with page `#boot`; site claim | Engine side passed; site chain is an Issue | `twoViewers` T-255, `bootLoader`/`bootCover` tests; mutation shows the App -> scene -> frame chain is unguarded: **I-141** |
| 8 | SC6 markers | own panel vs another viewer's panel over the same area | Passed | `pointerAndFeatureLayerDom.test.ts`; code: `FeatureMarkers.ts` uses `closest(.astraeus-shell)` |
| 9 | SC7 no styles outside | 4 pair orders x host `:root` custom props, `html` font-size, `body` font/colour/background/margin, `button`, generic `.hud/.info-panel/.shell-top/.timeline-bar/.ui-pill` host elements, a host `[data-phone]` element | Passed | P-STYLE-2 (4 cases): host computed values equal before, during and after both viewers; each viewer root keeps `--ui-accent #fc6323` and `--ui-muted #c7bdb3` against the host's `:root`. Control: with `PROBE_OLD=1` (main sheets) the same 4 cases fail |
| 10 | SC7 containing block | mount/React x {static, host-class absolute, fixed+auto, sticky+clip} | Passed | P-BOX-1 (8 cases): mount sets relative/hidden only when static/visible, otherwise keeps the host's; AstraeusScene positions its own wrapper and never writes the host element's style |
| 11 | SC7 look unchanged | 4 layouts (desktop, phone, embedded desktop, embedded phone) x 2 bundle orders (site, mount) x 2 definitions (synthetic, listed) x every element (280 to 361) x 56 properties, Developer drawer with every fold open, the info panel, the phone drawer and every collapsed control pressed | **Issue** in the 8 synthetic cells; the 8 listed cells pass | P-STYLE-1: exactly 4 differences per synthetic cell, all one flip: **I-140**. The intended page-rule moves (`html`, `body`, root background) are excluded by name |
| 12 | SC7 owner look | 375x667, 1280x720 | Recorded | T-258 Technical Evidence: owner "looks OK", 2026-11-02T10:05:11Z |
| 13 | SC8 surface and notes | lock, README rows/section/sizing note, CHANGELOG paragraph, Design | Passed, with observation O3 | lock: the two `developerTools` members (apiSurface test); README `apiRules` test; text read in full |
| 14 | Gates | below | Passed | `docs/evidence/check-o055-20261102/gates.log` |

**Finite external-boundary matrix.**

- Fetch of moon chunks:
  - success: P-MOON-1, `moonLoadTwice`
  - non-success / thrown: P-MOON-1 row 2, `moonLoadTwice` failed-fetch row
  - in-flight reuse: row 2
  - cleanup: `fetching` entries are deleted on settle (code `moonSystem.ts` `done`)
  - redirect and timeout: not applicable, the engine has no own handling and `fetch` follows redirects
- Browser runner: one run, all 9 steps exit 0, 0 error lines.
- npm registry (`check:react-consumer`): reachable, pass.
- Secret-safe output: not applicable, no secrets in scope.

**Workflow and side-effect lock.**

| Order | Operation | Side effect | Failure owner / final state | Oracle |
|---|---|---|---|---|
| 1 | `mount` | sets `isolation` and the containing block on the host element | — | P-BOX-1 |
| 2 | `prepareScene` -> `installData` | rights check (`bad-data`) and moon load (per request) | rejects `ready`, set stays usable (P-MOON-1) | — |
| 3 | render `App` | — | — | — |
| 4 | first frame | hides the claimed cover (site only) | — | I-141: the chain has no oracle |
| 5 | unmount | the viewer DOM goes; host inline styles stay (Observation 5) | — | — |

Cover: `hideBootLoader` schedules a per-element removal and cancels an earlier one for the same element (I-074 rows in `bootLoader.test.ts`).

**Adversarial pass.**

- Bypass paths:
  - A hand-built definition skips `installData`'s rights check. The site passes `PICTURES` from `astraeus-data`, which `textureLicence.test.ts` checks. Not a public path.
  - A second package's picture with the same name replaces the first's (`mergePictures`, documented).
- Sheet order: the builders modelled one order. The site and `mount` differ, so P-STYLE-1 ran both orders, with the same result.
- Mutated invariant: removing the cover claim is not caught (I-141).
- An independent oracle stood in for the builders' own model (I-140).

## Gates (this run, 2026-11-02, `docs/evidence/check-o055-20261102/gates.log`)

| Command | Result |
|---|---|
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 (site built in 2.0 s; chunk-size warning only) |
| `git diff --check main..HEAD` | clean |
| `npm run test:full` (1) | 200 files, 2494 passed, 1 skipped (10:06:22 to 10:07:32Z) |
| `npm run test:full` (2) | 200 files, 2494 passed, 1 skipped (10:07:32 to 10:08:39Z) |
| `npm run check:engine-alone` | pass in 20.7 s (136 files, 1517 passed, 1 skipped) |
| `npm run check:pack` | pass (14.4 s) |
| `npm run check:node-consumer` | pass (9 tests) |
| `npm run check:react-consumer` | pass |
| `npm run build:example` | exit 0: hello-scene and hello-react built from packed tarballs (`examples/*/dist/index.html`) |
| `npm run check:browser` (once) | exit 0, 9/9 steps, 0 error lines, 350 s; evidence `docs/evidence/browser-20261102T101834Z/` (smoke 18/18 loads) |

**What `check:browser` proves about the style scoping (asked by the coordinator).**

What it does prove:

- The viewer still lays out and draws in a real browser at desktop and phone size, with no console error. This covers the site, the public showers build, and `hello-scene` / `hello-react` from the packed tarballs.
- The examples set their own `html, body, #app` sizes, and the viewer drew Earth, the Moon and a path in them. That is real-browser evidence that the removed page rules plus `makeContainingBlock` still give the viewer a box.
- Some geometric readouts pass:
  - the story panel is clear of Play
  - timeline list items do not overlap
  - the switch and view panels fit inside the window and clear the other controls (`check-hello-scene.mjs:76`, `journey-views.mjs:29`)

What it does not prove:

- It reads no computed style. `driver.mjs`'s `controlStyles` exists, but no step calls it, and it skips `.developer-tools` anyway. T-256's note that "the Full Check's `npm run check:browser` control-style comparison is the backstop" is therefore wrong.
- It compares nothing between before and after.

So the real-browser evidence for "look unchanged" is the owner's look alone. The builders' static model (0 flips) is contradicted by P-STYLE-1 in one place (I-140). P-STYLE-1 uses happy-dom's cascade, not a browser's, but the flip it found comes from specificity alone, so a browser computes the same result.

## Code Health Evidence

`savepoint health check O-055 .` was run after the full gate. Its output is in `docs/evidence/check-o055-20261102/health-check.txt`; the snapshot ID and verdict are in the frontmatter and in the paragraph below.

Snapshot `sha256:4d40003cc78523a7be4341564c19a0a2a3541a76bf4db6c65df0115828170325` (created). Verdict: "Code Health does not block clearance." Optional instances: complexity (lizard) no finding; duplication (jscpd) no finding; dependency vulnerabilities (osv-scanner) no finding; coverage and tests (vitest v8 / junit) reported **stale**: collection statement, not a finding (the reports are from the second `test:full`, 10:08:39Z; the tree has since gained only this run's evidence files, records and probe files outside `vitest.config.ts`'s include, and the 2494/2494 result above stands). The verdict neither grants nor withholds clearance.

## Acceptance Coverage

| Criterion | Class | Note |
|---|---|---|
| SC1 / T-250 | Proven | matrix row 1, P-ID-1 |
| SC2 / T-251 | Proven | row 2, P-MOON-1 |
| SC3 / T-252 | Proven | row 3; the planner's six read points plus the planets-demo read the builder found are all moved (grep: no `visual.texture` read outside `catalogue.ts` and `textureOf`) |
| SC4 / T-253 | Proven | row 4 |
| SC5 / T-254 | Proven | row 5; allowlist `breaks: []` |
| SC6 / T-255 | **Issue** (I-141) | engine side proven (rows 6 to 8); T-255's stated proof for "the site's cover still fades" (DOM tests, `check:browser`) does not exist |
| SC7 / T-256, T-257 | **Issue** (I-140) | scoping and host isolation proven (rows 9, 10); "look unchanged" / "Cascade kept" broken at one rule |
| SC8 / T-258 | Proven, with observation | Design reconciled (below); README sentence overstated (O3) |

**Design reconciliation.** Design.md "Good guest (O-055)" reflects every deferred drift note of T-250 to T-257. T-258 Drift Notes account for each one: T-250's is non-architectural; T-251, T-252, T-253, T-254, T-255, T-256 and T-257 are reflected, including the `:where()` convention and `:is(main)`; the `featureMarkers` naming note is non-architectural. The codebase map names the new tests, and the O-053 checks bullet says the isolation allowlist is empty. The reconciliation is accurate against the code read here. It does not mention the site and `mount` bundle-order difference; I record that as a non-architectural observation (O4).

## Issues

- **I-140**: scoping turned the open Fine-tune fold heading from accent to muted.
  - Violates SC7 ("look of the site is unchanged") and T-256 Done When "Cascade kept".
  - Repro: P-STYLE-1. Evidence: `app/style.css:53` vs `controls.css:81`.
  - Root cause: the model's `subject()` counts `:not(.x)` classes as required classes.
- **I-141**: nothing fails when the site's loading cover is no longer handed to the scene.
  - Violates TEST-01 and T-255 User Check / Technical Verification.
  - Repro: the mutation at `app/AstraeusScene.tsx:171` passes 2494/2494 tests and `tsc`; `check:browser` reads no loader state.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-140 | High (always, when the nested fold is open) | Low (one heading colour in the Developer drawer; the site turns the drawer on, outside hosts have it off by default) | Low | Fix now with a one-selector `:where()`, or the owner accepts muted; add a kept computed-style comparison test so the model's blind spot is mechanised (Strategic fix first) |
| I-141 | Low today (the code is correct) to Medium over time (a three-link chain with no guard) | High if it trips (opaque cover over every site demo, all gates green) | Medium | Fix now: one App-level DOM test, plus a site or browser readout of the loader state |

`unmet`: not listed in the frontmatter. The Issues map to SC6 and SC7.

## Owner Validation Still Needed

- T-258 declares `owner_validation.required: true`. The owner look is recorded, but no `accepted_check` exists yet.
- Objective closure needs I-140 and I-141 resolved: verified by a later Check, or I-140 accepted by the owner.
- A later re-check uses this scope lock.

## Observations (non-blocking)

1. **Records changed during this run, not by this session.** At start, the working tree held only the three `Release.md` files and the two untracked doc folders. Mid-run, `git status` showed T-258 at `status: done` (`stage` removed) and router `task: none`. That is consistent with the owner closing T-258 on the board. It does not conflict with this run's writes, so the run continued. It is reported here because AGENTS.md asks a session to report records that change under it.
2. **`check:browser` gives no computed-style evidence.** See Gates.
3. **README overstates.** "Several viewers on one page" says "so nothing leaks to or from your page". P-STYLE-3 shows a host's generic `button { letter-spacing; text-shadow; word-spacing }` still reaches viewer buttons through `mount` and `AstraeusScene` wherever the viewer does not set those properties. That is expected without a shadow root; "to your page" is true. Suggest "nothing leaks out to your page; your own generic rules can still reach properties the viewer does not set".
4. **Bundle order differs by entry.** The site bundle puts `app/style.css` last; `mount`/`AstraeusScene` import it first. The builders' flip model assumed one order. P-STYLE-1 found no order-dependent flip, but a kept test should run both orders (I-140 Proof Needed).
5. **Inline styles stay after unmount.** `mount` leaves the inline `isolation`, `position` and `overflow` it set on the host element (no restore). This is documented as making the element a containing block. No criterion requires a restore.
6. **Misplaced comment.** In `AstraeusShell.tsx`, the doc comment "The wide-screen moons toggle and the sheet it opens under the toolbar" now sits above `DeveloperDrawer`, not `MoonsSheet` (lines 62 to 63).
7. **No new allowlist entry.** No `O-055`-tagged entry remains in any allowlist, and `allowlistGrowth.test.ts` passes.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches**: the `claimCover` branch of `App` -> scene -> frame has no test (I-141).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [ ] STYLE-08 **Comments explain why**: misplaced doc comment above `DeveloperDrawer` (`AstraeusShell.tsx:62`).
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: 107 files, +2568/-5825. Most of it is mechanical (−4923 allowlist lines; 9 CSS files rewritten by script). The rewrite is larger than the behaviour it changes, and its "look unchanged" proof lived in uncommitted scripts.

## Probe Sources

All probes are in `docs/evidence/check-o055-20261102/probes/`. Run them from the repo root with:

`npx vitest run --config docs/evidence/check-o055-20261102/vitest.probe.config.ts docs/evidence/check-o055-20261102/probes`

The run list is in `probes-run.txt`: 56 tests, 48 passed. The 8 failures are the I-140 flip, in the P-STYLE-1 synthetic cells.

| File | Probes |
|---|---|
| `cascade.probe.test.ts` | P-STYLE-1. Outputs: `cascade-<layout>-<order>-<definition>.txt`. Main sheets: `old-sheets/` (`git show main:`) |
| `guest.probe.test.ts` | P-STYLE-2, P-STYLE-3, P-BOX-1, P-PIC-1, P-ID-1, P-KEY-1 |
| `moons.probe.test.ts` | P-MOON-1 |

Mutation probes, each restored:

- `App.tsx` `claimCover={claimCover}` removed: 3 `packagePacks` failures only (build lint side effect).
- `app/AstraeusScene.tsx:171` claim removed: 0 failures.
