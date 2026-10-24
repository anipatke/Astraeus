---
id: C-114
scope: {kind: objective, id: O-042}
result: NEEDS WORK
checked_by: {role: checker, session: o042-full-check-20261024}
executed_session: o042-run-20261024
checked_at: '2026-10-24T00:55:00Z'
health_snapshot: sha256:b5069f2a80a2807bed1538043e24a11b4e1df19ec44d73fdb1ac6b77724e6816
reviewed:
  base_commit: bb056f70
  head_commit: 2975f1bf
  files: [packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/group.ts, packages/astraeus/src/api/activity.ts, packages/astraeus/src/api/sunOrbit.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/app/listSwitch.ts, packages/astraeus/src/core/bodies/index.ts, packages/astraeus/src/core/planetSeries.ts, packages/astraeus/tests/listSwitch.test.ts, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/tests/publicApiActivity.test.ts, packages/astraeus/tests/publicApiSunOrbits.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus-demo-showers/src/experiences/showers/showerScene.ts, packages/astraeus-demo-showers/src/experiences/showers/showerSettings.ts, packages/astraeus-demo-showers/src/experiences/showers/showerText.ts, packages/astraeus-demo-showers/src/experiences/showers/showerBasics.ts, packages/astraeus-demo-showers/src/experiences/showers/measuredOrbits.ts, packages/astraeus-demo-showers/tools/data/fetch-meteoroid-orbits.mjs, packages/astraeus-demo-showers/data/stories/perseids/gmn-iau-7.json, packages/astraeus-demo-showers/data/stories/geminids/gmn-iau-4.json, packages/astraeus-demo-showers/tests/rebuildComparison.test.ts, packages/astraeus-demo-showers/tests/fixtures/showers-before-rebuild.json, packages/astraeus-demo-showers/tests/showersMeasured.test.ts, packages/astraeus-demo-showers/tests/showers.test.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/src/showerSwitch.ts, packages/astraeus-site/tests/packageBoundaries.test.ts, packages/astraeus-site/tools/site/api-reference.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/check-hello-scene.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus-demo-planets/src/experiences/planets/planetChoice.ts, examples/hello-scene/src/main.js, docs/BROWSER_CHECKS.md, .savepoint/Design.md]
  dependencies: []
issues: [I-083]
supersedes: null
unmet: ['O-042 Success Condition 6: the Full Objective Check passes (full gate npm run test:full)']
---

# C-114: O-042 Full Objective Check

This is the mandatory Full Objective Check for O-042 (T-171 to T-177), "Show groups of objects by rebuilding a shower on the public API". It is the first run.

**Independence.** This session did not plan, build, coordinate or repair any O-042 work. It started fresh from the router's `Check O-042`. The scratchpad folder it was given also holds files from the coordinator's session (`after.json`, `markdone.sh`, `hello-run/` and others). They were not read; this Check wrote only to new folders (`chk/`, `chk-old/`) and to new log files.

**Baseline.** Diff `main..HEAD` = `bb056f70..2975f1bf`: 81 files, +5,694 / -1,248, nine commits from the planning commit `cc2a7f1d` onward. `git diff --check main..HEAD` is clean. At the start the tree was clean apart from the untracked `docs/prds/` and `docs/research/`, which were not read. This is not a worktree lane (`git-dir` = `git-common-dir` = `.git`). Times are UTC.

**Verdict: NEEDS WORK.** The work itself holds up. Every Success Condition except the full gate is proven by fresh gates and by independent probes. The fixture behind the comparison test was rebuilt here from the pre-rebuild code and matches. The trimmed orbit files parse to exactly the old members. The browser run passes. But `npm run test:full` failed twice in a row on a timing-bound case in `showersMeasured.test.ts` (I-083), and so the official health snapshot blocks clearance. The repair is test-only and small. O-042 cannot close until a re-check sees the full gate pass.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (no lanes were used; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock (frozen)

1. **Criteria.** The six O-042 Success Conditions (SC1 to SC6) and Decisions 1 to 7. The Done When lists of T-171 to T-177. Guardrails ARCH-01 to ARCH-05, PROV-01, PROV-02, DATA-01, TEST-01 to TEST-03, CODE-01 and CODE-02. The AGENTS.md gates: lint, typecheck, build, test, full, engine-alone, pack, example and browser.
2. **Changed files and public entry points.** The files in `reviewed.files`. Public entry points: `Scene.addGroup`, `Scene.addActivity`, `Scene.addBodyFromElements`, the new `addBody` options (`orbit` for any body that circles the Sun, `enlarge`, `showLabel`), `setTimeline({ loop })`, `camera.lookAt`/`follow({ up })`, `camera.setReach`, `SceneError` codes `bad-group`/`bad-activity`/`bad-camera`, the exported input types, and `toDefinition()`/`prepare`. Also `buildShowerScene` and `loadShowerPanelsFile` in the showers demo, the site's `showerSwitch.ts`, and the engine's `app/listSwitch.ts`.
3. **Relied-on orchestration.** `toDefinition` defers the Sun-orbit lines and clumped groups into `prepare` until the planet series load. The listed-orbit group and points layer, `createWindows`/`rateAt`, the elements-body parser and `extendCatalogue`, the public build and `load-budget.mjs`, and the packed tarballs for `hello-scene`.
4. **Matrix axes.** The full axes are below. Not applicable: text classes (no width or truncation logic is in scope), and environment/output sinks (no CLI output is in scope; the browser is covered by the external-boundary matrix).
5. **Admission boundary.** An Issue needs a supported public call, the shipped demo, or a configured gate. Hypothetical misuse outside the documented types is an observation.

## Acceptance Coverage

| Criterion | Rule | Result | Evidence |
|---|---|---|---|
| SC1 showers `src/` imports only `astraeus`; boundary test enforces it | Every import in `packages/astraeus-demo-showers/src` is `astraeus` or relative | **Proven** | Imports grepped: only `astraeus` (`showerScene.ts:2`, `showerSettings.ts:2`) plus relative files. `PUBLIC_API_DEMOS` holds `astraeus-demo-showers` (`packageBoundaries.test.ts:18`), and the test passes in `npm test` |
| SC2 comparison test: rebuilt showers match the pre-rebuild definitions, differing only by a Decision or a flag | The fixture is the real old output, and the differences are the named ones | **Proven** | Independent oracle: the tree at `81a7971e` (pre-rebuild, post-T-175, extracted with `git archive`) was given its own linked workspace packages. Its `buildShowerDefinition(settings, shipped orbits, "all", shipped panels)` was compared with `tests/fixtures/showers-before-rebuild.json`. Both showers match on object ids, labels, colours, provenance, priorities, label reach, descriptions, limits, `showLabel`, group count, colour, dot size, refill, bounds, provenance and card, every sampled member id, positions at the peak (< 1e-3 km), events, event provenance, windows, window, rates, story panels, camera menu, clock, loop, viewUp, startView, scene layers, scale choices, overrides, tracked bodies, camera, path ids, path colours and shell objects (2/2 pass). `rebuildComparison.test.ts` (34 cases) passes. Each difference is tied to Decision 1, 4 or 6 or marked FLAG, and the FLAGs were shown to the owner (T-176 Owner Look) |
| SC3 engine names no shower code; list switch is generic | `src/experiences/showers/` is gone, and the switch is generic | **Proven** | `packages/astraeus/src/experiences/` holds only `settingsFields.ts`. `app/listSwitch.ts` (`chooseSwitch`, `SwitchEntry`) is used by `planetChoice.ts` and the site's `showerSwitch.ts`. Engine `src/` grep: shower words only in comments and as doc examples ("meteors per hour") |
| SC4 orbit files trimmed (Decision 5); page sets re-measured; limits = measurement + 5% rounded up to 10,000; no raise without OK | Lossless trim; limits follow the rule; nothing raised | **Proven** (Perseids gzip see O1) | Independent oracle: the pre-trim files from `main` and the new files, both parsed with `parseMeasuredOrbits`, give identical members (id, epoch, elements) and counts, 25,588 and 51,115, 0 differing. Exactly three columns were dropped from the shipped layout (`convergenceAngleDeg`, `geocentricVelocityKmS`, `geocentricVelocityErrorKmS`; the old header lists 10 columns). The fresh public build in `check:browser` (`public-build-assets` step) gives Perseids 9,191,109 / 6,758,808 and Geminids 10,768,779 / 7,314,429. Recomputed limits: 9,191,109 x 1.05 = 9,650,664 -> **9,660,000** (set); 10,768,779 x 1.05 -> **11,310,000** (set); 7,314,429 x 1.05 -> **7,690,000** (set); 6,758,808 x 1.05 = 7,096,748 -> 7,100,000 > standing 7,040,000, so it was kept (O1). No limit was raised |
| SC5 every new export has a doc comment, a place on `/api` and a made-up test (ARCH-03); hello-scene uses `addGroup` from the packed tarball | | **Proven** | The doc-comment test passes. The built `dist/api/index.html` has a "Groups of dots and activity" section and names every new type and call (`GroupInput`, `GroupOrbitInput`, `GroupClumpInput`, `GroupReadoutInput`, `ActivityInput`, `ActivitySampleInput`, `ActivitySourceInput`, `ElementsBodyRecord`, `addActivity`, `addBodyFromElements`, `setReach`, `enlarge`, `loop`, `ecliptic`, `refillSliceMs`, `bad-group`, `bad-activity`, `bad-camera`, `solar-system`). The made-up tests (`publicApiGroup`, `publicApiActivity`, `publicApiSunOrbits`) name no shower. `examples/hello-scene/src/main.js:42` calls `addGroup` (74 lines; the limit is 80). Browser `hello-scene` step: `ringDots 40` on desktop and phone, from the packed tarball |
| SC6 owner look at both showers (desktop and phone); Full Objective Check passes with one `check:browser` | | **Issue** (I-083) | Owner look recorded in T-176 "Owner Look" ("looks fine", after being shown the flags). One `check:browser` passed (below). `npm run test:full` failed 2/2 |
| D1 developer extras dropped | No orbit-set buttons, `?orbits=` or `?span=`; all orbits are drawn; rule and counts stay in the known limits | **Proven** | No `orbits=`/`span=` in site or demo `src`. `definition.alternates` is undefined. `streamLimitations` quotes `shipped.qualityCounts` and the rule (`showersMeasured.test.ts` case). The browser journey draws 25,588 / 51,115 dots |
| D2 own body from elements | `addBodyFromElements` with provenance; Phaethon uses it | **Proven** | `showerScene.ts:142-146`. Probes: bad e, a missing label, a catalogue id or a repeat are refused (`bad-element`, `duplicate-id`). A bad option rolls the catalogue back (a retry succeeds). Phaethon's orbit line spans 523.67 d, equal to the independent Kepler P = 2π√(a³/GM☉) = 523.67 d; closure 1.7e-9 |
| D3 groups are listed orbits only | `addGroup` takes listed orbits, a seed and a clump; nothing else public | **Proven** | `GroupInput` (`group.ts`) has no spread or moon-set option. Matrix below |
| D4 rate bar and radiant text | `rate` readout from the activity curve; radiant RA/Dec in the description | **Proven** | Probe: the rate bar equals an independent linear interpolation at 8 times, including both window edges, the peak ±1 ms and outside (null). Comparison test: same values as before; radiant line present |
| D5 trims and limits | See SC4 | **Proven** | DATA-01 OK recorded in Decision 5 |
| D6 as O-041 | Camera menu automatic, 17 items; no display switches; standing run rules | **Proven** | Comparison test (17 ids). Waivers recorded on every Task. One browser run |
| D7 gaps (T-177) | Solar system scale, safe planet-series loading, `clump.near` on own bodies, `refillSliceMs` | **Proven** | Probes: Sun-centred + `enlarge` -> `["true-scale","solar-system"]`; readable + enlarge -> `["readable-scale","true-scale"]`; Earth-centred unchanged; `only` -> one. Deferred loading: `publicApiSunOrbits` resets modules (series not loaded) and passes. The real site path no longer preloads (`main.tsx`), and the browser journey drew 6 paths and 25,588 dots. `refillSliceMs` -1/NaN -> `bad-group`, 0 accepted |
| T-171 to T-177 Done When | Each Task's list | **Proven** apart from the full gate | Covered by the rows above plus fresh gates. T-172's "left for the rebuild Task" items (settings `stream.quality`, `?orbits=`/`?span=`, `OrbitSet`) were removed in T-176, except the inert settings field (O3) |
| Design reconciliation | Every drift note accounted for | **Proven** | `Design.md` gains the O-042 block (T-171 to T-177, each reflected), the Components row for the showers demo, and the "Rebuilt on the public API" lead for the shower entry. The deferred notes of T-173 and T-174 (namespace, build-at-`toDefinition`, extended catalogue, `BUILT_IN_SAMPLING`, label reach) appear there |

## Coverage Matrix

Probe harness: `scratchpad/chk/probe.test.ts`, run with a separate Vitest config over the HEAD source. Result codes are `SceneError.code`, or `ok`.

| Surface | Cells (input -> result) |
|---|---|
| `addGroup` input shape | normal ok; empty or missing id `bad-group`; empty or non-array orbits `bad-group`; duplicate orbit id `bad-group`; e = 1, 1.5, -0.1 `bad-group`; e = 0.999999 ok; a = 0 or NaN `bad-group`; inclination Infinity `bad-group`; bad orbit time `bad-time` |
| `addGroup` boundaries | seed -1, 1.5, 2^32 `bad-group`; 2^32-1 ok; dotSize 0 or NaN `bad-group`; colour "red" `bad-group`; refillAfter 0 `bad-group`; refillSlice -1 or NaN `bad-group`, 0 ok; clump fraction -0.1, 1.1, NaN `bad-group`, 0 ok; width 0 and 180.01 `bad-group`, 180 ok |
| `addGroup` references | clump near unknown, not in scene, or the centre `bad-group`; centre unknown `unknown-body` (O4); centre not in scene `bad-group`; readout kind other `bad-readout`; rate with no activity or an unknown activity `bad-readout` |
| `addGroup` ids and sequence | id = body `duplicate-id`; body added after a group with the same id `duplicate-id`; group twice `duplicate-id`; group "earth-orbit" plus Earth's orbit line `duplicate-id` |
| Mutation after validation | duplicate orbit pushed into the caller's array after `addGroup`: `bad-group` at `toDefinition`; array emptied: `bad-group` |
| Placement oracle | 8 orbits with e from 0 to 0.35, 3 times: every dot's radius lies within its own [a(1-e), a(1+e)]; worst excursion 1.0e-14. Same seed gives the same picture (repo test) |
| `addActivity` | normal ok; 1 sample, unsorted, duplicate time, negative, NaN, sample outside, peak outside, end before start, empty unit, overlapping provenance, provenance outside, bad provenance record, duplicate id: all `bad-activity`; bad time `bad-time`; no `setTimeline`: the window spans the activity |
| Rate bar oracle | 8 times against hand interpolation: 0 mismatches; peak 100; outside null |
| `addBodyFromElements` | normal ok; e = 1 or missing label `bad-element`; id "earth" or twice `duplicate-id`; bad option then retry: `bad-body` then ok |
| `addBody` new options and `orbit` | `orbit` on the Sun, on the Moon without Earth, or on Mars without the Sun: `no-orbit`; on Swift-Tuttle ok (built-in sampling); enlarge 0.5, NaN or "2" `bad-body`, 1 ok; showLabel "no" `bad-body`; tracked path in a Sun-centred scene `bad-trajectory` |
| Orbit-line values | spans: Earth 365.26 d, Mars 687.02 d, Jupiter 4333.09 d, Phaethon 523.67 d (the Kepler oracle above); closure gap/radius 1.5e-5, 9.8e-5, 3.2e-4, 1.7e-9 |
| Camera and timeline | setReach 0, -1, Infinity or "5" `bad-camera`; reach 200,000 -> `{maxFocusDistance 200000, far 500000}`; up "north" `bad-camera`, "ecliptic" -> `viewUp: "ecliptic"`; no target -> no viewUp; loop "yes" `bad-timeline`; loop true -> `loop: true`; `{none, loop}` silently ignored (O5); Earth-centred label reach = max(500, reach) -> 2000; Sun-centred: no label reach; `showLabel: false` carried |
| State and sequence | `toDefinition` with the series loaded builds everything at once. Without them, lines and clumped groups go into `prepare`, which is idempotent: a second call adds nothing (`length` guards, `scene.ts:530-532`). The repo test asserts not-loaded then loaded. Representation: `toDefinition()` is consumed by the site (`main.tsx:80`) and by `mount`/`AstraeusScene` (packed `hello-scene` and `hello-react` steps pass) |
| Showers demo | Perseids and Geminids, loaded / absent / invalid orbits (`showers.test.ts` and `demoShowers.test.ts` cases; absent: no stream, the Sun says so); a panel that names the stream with no stream drawn (`panelsOf`); shipped data: comparison test and oracle |

### Finite External-Boundary Matrix

| Cell | Result |
|---|---|
| Configured vs actual target | `run-browser.mjs` serves the dev, preview and public builds itself on its own ports. The owner's `:5490` preview was left alone |
| Startup and reuse | Servers started per step; all 8 steps exit 0 |
| Unavailable dependency | Planet series not loaded: deferred into `prepare` (D7). Orbits absent: the absent notice, no stream (repo tests) |
| Success and non-success responses, malformed response | The measured-orbit loader takes loaded, absent or invalid (`MeasuredLoad`). The invalid-file text is covered by `showers.test.ts` |
| Redirect, timeout, cancellation | Not applicable: there are no network calls beyond Vite's static chunks. The switch's newest-request-wins logic is unchanged (O-030) |
| Retry, cleanup, partial effects | Not applicable: the scene build is pure; `prepare` is idempotent |
| Secret-safe output | Not applicable: there are no secrets |

### Workflow And Side-Effect Lock

| Order | Operation | Side effect | Failure owner and final state | Oracle |
|---|---|---|---|---|
| 1 | `add*` calls | Validated plans held in the scene | Throws `SceneError` at the call; a failed `addBodyFromElements` restores the catalogue | probe "bad option then retry" |
| 2 | `toDefinition` | Builds the definition; may build groups and lines now | Group errors at build are re-coded `bad-group`; the scene is unchanged | probes |
| 3 | `prepare` | Loads the planet series once; pushes the deferred lines and groups into the definition's own arrays; installs data | A late `bad-group` (clumped group with a bad orbit, series not loaded) rejects `prepare` rather than `toDefinition` (O6) | code reading `scene.ts:529-533`; repo test for the deferred path |
| 4 | Fetch tool `shippedCopy` | Rewrites the two shipped files | Owner DATA-01 OK; lossless | independent member-by-member equality |

### Matrix Completion Lock

Every cell above is passed, not applicable with a reason, or an observation. The one Issue (I-083) is a gate cell. All remaining cells were completed after it was found.

## Adversarial Pass

- **Bypassing validation.** Mutating the caller's orbit array after `addGroup` cannot slip through: the core group check catches it at build. A group id cannot shadow a body, a path or an orbit-line id, in either order.
- **Transitions.** A second `prepare` is idempotent. A switch remounts by key (unchanged). Deferred groups are appended after the eager ones, so group order can differ from add order when only some are clumped. That is harmless: each group is its own layer and menu item.
- **Representation.** The site uses `toDefinition()` plus its own label and switcher. The packed tarball path is proven by the `hello-scene` and `hello-react` steps.
- **Numeric classes.** Non-finite, negative, zero and out-of-range values are covered for every new number (see the matrix).
- **Independent outcomes.** The fixture was rebuilt from the old code, the trim checked against the old files, Phaethon's period checked by Kepler's law, and the rate bar by hand interpolation. None of these reuse the implementation's own calculation.

## Gates (fresh, this session)

| Gate | Result | Time (UTC) |
|---|---|---|
| `npm run test:full` (run 1) | **FAIL**: 129 files, 2 failed, 1736 passed, 1 skipped. Geminids DW3(ii) timeout 5000 ms (7.67 s); Perseids fill 108.3 ms (limit 100). No coverage report | 00:40:17-00:41:28 |
| `npm run test:full` (run 2) | **FAIL**: 1 failed (Geminids DW3(ii) timeout, 5.40 s), 1737 passed, 1 skipped. No coverage report | 00:42:39-00:43:44 |
| `showersMeasured.test.ts` alone, with and without `--coverage` | pass, 19/19 (DW3(ii) Geminids 1.86 s; fill 19.2 ms) | 00:41:44-00:42:08 |
| `npm run lint` | pass | 00:44:03-00:44:06 |
| `npm run typecheck` | pass | 00:44:06-00:44:13 |
| `npm run build` | pass | 00:44:13-00:44:15 |
| `npm run check:engine-alone` | pass (819 passed, 1 skipped; 15.5 s) | 00:44:15-00:44:30 |
| `npm run check:pack` | pass (astraeus 7.02 MB packed, limit 8.0; every data package within its limits) | 00:44:30-00:44:45 |
| `npm run build:example` | pass | 00:44:45, ended before 00:45:07 |
| `npm run check:browser` (once) | pass, all 8 steps exit 0, error-lines 0, total 113 s. Evidence `docs/evidence/browser-20261024T004507Z/` (summary.txt and each step's results.json; logs in `/tmp/astraeus-check-logs-qVobuG`). Meteor journey: 25,588 dots, 6 paths, 7 bodies, switched to the Geminids with 51,115 dots, panel `stream-shape`. hello-scene: `ringDots` 40 on desktop and phone | 00:45:07-00:47:00 |
| `npm test` | pass, 129 files, 1738 passed, 1 skipped | 00:51:33-00:52:08 |
| `git diff --check main..HEAD` | clean | |

Load budget (public build inside `check:browser`, `public-build-assets` step, no problems): Apollo 4,355,880 / 2,815,247 (limits 4,370,000 / 2,900,000); Jupiter 6,934,205 / 4,705,307; Perseids 9,191,109 / 6,758,808 (9,660,000 / 7,040,000); Geminids 10,768,779 / 7,314,429 (11,310,000 / 7,690,000); whole build 22,338,622 / 16,528,523. These figures equal T-176's to the byte.

## Code Health

`savepoint health check O-042`, run after the full gate (00:50:53Z): snapshot `sha256:b5069f2a80a2807bed1538043e24a11b4e1df19ec44d73fdb1ac6b77724e6816` (official, created). **Code Health blocks clearance.**

- tests (vitest-junit): blocks clearance; 1 failing, evidence stale. This is I-083.
- coverage (vitest-v8): collection failure, because no report was written while the full gate is red. This is a consequence of I-083, not a separate finding about the code.
- complexity (lizard), dependency vulnerabilities (osv), duplication (jscpd): optional; no finding.

## Issues

- **I-083: The Geminids solar-longitude test times out under the full gate.** `npm run test:full` failed 2/2 on `showersMeasured.test.ts` DW3(ii) for the Geminids (5000 ms timeout), and once on the Perseids fill-time indicator. The fast suite and the file alone pass. The violated rule is the AGENTS.md full gate, which is O-042 SC6. File and line: `packages/astraeus-demo-showers/tests/showersMeasured.test.ts:107-118`, `:255`. Missing evidence: T-172 and T-176 ran only `npm test`.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-083 | High: 2 of 2 full runs on this machine | Low for users (product, browser run and fast suite fine). It blocks the gate, the coverage report and the health snapshot | Medium: blocks closure only | Fix now, test-only: hoist the solar-longitude work into a `beforeAll` or give a justified timeout, as I-080 did; make the fill indicator load-tolerant. Then re-check, reusing this browser run |

## Owner Decisions And Validation

- **Task-check waivers** for T-171 to T-177 (owner session `o042-run-20261024`) are recorded and apply to the optional Task Checks only. This Check covered every Task.
- **T-176 `owner_validation.required`.** The owner's look is recorded in prose ("looks fine", desktop and phone, after being shown the flagged differences). The structured acceptance (`owner_validation: {required: true, accepted_check: C-###, ...}`) is still needed. It should be given against the re-check that clears, since this Check is NEEDS WORK. The repair is test-only and does not touch what the owner looked at.
- **Optional owner choice (O1).** The Perseids gzip limit stays at 7,040,000 rather than the formula's 7,100,000. No decision is required for closure.
- There are no structured `exception`s on the Objective or its Tasks, so no `carried_forward` entries were written.

## Observations (non-blocking)

- **O1. Decision 5 and the Perseids gzip limit.** Measurement + 5%, rounded up, gives 7,100,000, which is above the standing 7,040,000. Decision 5 says "lowered to"; SC4 adds "no limit raised without the owner's OK". These two clash for this one cell, and the builder followed the explicit no-raise guard and flagged it. This Check treats that as meeting the condition's intent: the limit is the tighter one, and it was not raised. The headroom is 4.2% instead of 5%. If the owner wants the formula applied literally, that is a raise and needs the owner's OK.
- **O2. Outcome vs Success Condition for `hello-scene`.** The Outcome says each new call is "used by examples/hello-scene", but only `addGroup` is. SC5 requires only `addGroup`, and `hello-scene` is at 74 of its 80-line limit. The other calls are used by the showers demo and proven on made-up configurations. Consider aligning the Outcome wording in a later plan.
- **O3. Inert setting.** `stream.quality.default` ("all" | "reliable") is still parsed and required in the settings (`showerSettings.ts:322-330`), but nothing reads it now (Decision 1). It is harmless, but it is a leftover (STYLE-05).
- **O4. Error-code wording.** The `addGroup` doc comment says a bad centre throws `bad-group`. An uncatalogued centre throws `unknown-body` (`group.ts` `planGroup`); a centre not in the scene throws `bad-group`. The behaviour is reasonable; the doc is slightly loose.
- **O5. `{ none: true, loop: true }`.** `loop` is silently ignored when there is no timeline. That is harmless.
- **O6. Late errors.** With the planet series not loaded, a clumped group's build errors surface from `prepare` (a rejected `mount`) rather than from `toDefinition`. They keep the code `bad-group`.
- **O7. Apollo page headroom.** Apollo raw is 4,355,880 against 4,370,000 (99.7%), up about 18.8 kB since O-041 from the shared `scene.js` chunk. The limit was not raised.
- **O8. Engine comments.** `listSwitch.ts` and `activity.ts` mention "a shower" and "meteors per hour" as examples in comments. They are not names in code (ARCH-01 is about code and names); this is noted only.

## Code Style Review

- [ ] STYLE-01 **One job per file**: `packages/astraeus/src/api/scene.ts` is 687 lines and now holds the Sun-orbit, group, activity, scale and label assembly helpers beside the Scene class. The new `group.ts`, `activity.ts` and `sunOrbit.ts` split out much of that, but `scene.ts` keeps growing.
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [ ] STYLE-05 **Build only what is needed**: the `stream.quality.default` setting is still validated but unread (O3).
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**: the Earth colour `#9fd8ff` and `PLANETS`/`RATES` are constants in `showerScene.ts`, which is acceptable for a story builder.
- [ ] STYLE-10 **Small diffs**: T-176 is one commit of about 60 files. That is expected for an in-place rebuild, and the comparison test makes it reviewable.

## Next

Repair I-083 directly (test-only), under `agent-skills/references/issue-capture.md` Out-Of-Scope Repair. Every O-042 Task keeps its `done` status. Then run a fresh `savepoint-check` re-check of O-042. It runs `npm run test:full` twice and `savepoint health check O-042`. It reuses this browser run unless the repair touches the browser scripts or the product code.
