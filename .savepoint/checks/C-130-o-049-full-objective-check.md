---
id: C-130
scope: {kind: objective, id: O-049}
result: NEEDS WORK
checked_by: {role: checker, session: o049-check-20261031}
executed_session: o049-run-20261031
checked_at: '2026-10-31T12:58:00Z'
health_snapshot: sha256:87eee85326f95d0257c36d8daedef57d9c17a457f95ac559bd4a15a0246d421b
reviewed:
  base_commit: 34f33db2
  head_commit: 0b37876f
  files: [.savepoint/Design.md, packages/astraeus-data-uranus/README.md, packages/astraeus-site/src/journeyData.ts, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/data/moons/jupiter.json, packages/astraeus/data/moons/mars.json, packages/astraeus/data/moons/neptune.json, packages/astraeus/data/moons/pluto.json, packages/astraeus/data/moons/saturn.json, packages/astraeus/data/moons/uranus.json, packages/astraeus/src/api/bodies.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/app/PathView.ts, packages/astraeus/src/app/sceneHooks.ts, packages/astraeus/src/assets/bodies/listedMoons.ts, packages/astraeus/src/assets/catalogue.ts, packages/astraeus/src/assets/moonCatalogue.ts, packages/astraeus/src/core/bodies/listedMoonBodies.ts, packages/astraeus/src/core/bodies/listedMoons.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/synthetic/syntheticJourneyScene.ts, packages/astraeus/tests/listedMoonBodies.test.ts, packages/astraeus/tests/listedMoons.test.ts, packages/astraeus/tests/sceneCatalogueReach.test.ts, packages/astraeus/tests/syntheticJourney.test.ts, packages/astraeus/tools/import/jupiter-moon-catalogue.mjs, packages/astraeus/tools/import/moon-lookup.d.mts, packages/astraeus/tools/import/moon-lookup.mjs, packages/astraeus/tools/import/moon-periods.mjs, packages/astraeus/tools/import/planet-moon-catalogues.mjs, packages/astraeus/tools/import/planet-moon-periods.json, tools/check-node-consumer.mjs, tools/check-packs.mjs]
  dependencies: []
issues: [I-123]
unmet: [T-212-browser-gate, O-049-proof-browser]
supersedes: null
---

# C-130: O-049 Full Objective Check

This is the mandatory Full Objective Check of O-049 ("Make every listed moon addable", T-210 to T-212, escalated from I-122).

**Independence.** This session did not plan, build, repair or coordinate O-049. It wrote only these things:
- gate outputs (`coverage/`, `junit.xml`, `dist/`, example builds);
- two health snapshots (the official one is recorded above);
- the browser run folder `docs/evidence/browser-20261031T123947Z/`;
- one throwaway probe test (copied into `packages/astraeus/tests/`, run, then deleted; `test:full` was rerun afterwards so the health reports are fresh);
- byte-identical rewrites of the moon lists and lookup from rerunning the importers (git shows no change);
- this record and I-123.

**Baseline.** The branch is `o049-listed-moons`. The diff runs from plan commit `34f33db2` to HEAD `0b37876f` (1825a2db, a300240d, 0b37876f) and covers 38 non-record files. This is not a lane (`git-dir` = `git-common-dir`). `docs/prds/` and `docs/research/` were not read or touched. Times are UTC; Node is v24.16.0.

**Verdict: NEEDS WORK.** On the code side the Objective works:
- every one of the 458 listed moons is added by one rule with no moon named in it;
- periods match the transcribed JPL table exactly;
- the slim lookup is within budget;
- the packed package adds Miranda and Titania;
- the owner's look passed.

The one required fresh `npm run check:browser` failed in one load: smoke `synthetic-journey` at desktop size, at its first moon readout (I-123). Every other step passed, including the public-build-assets budget that blocked T-212's four runs. Under the browser policy the run was not repeated. The required release gate did not pass, so this cannot be `CLEAR`.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature in scope; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria:**
   - the O-049 Success Conditions: one rule, orbit periods, slim lookup, look, errors, proof, documentation;
   - the Done When lists of T-210, T-211 and T-212;
   - I-122 Proof Needed;
   - Guardrails ARCH-01, ARCH-03 to ARCH-06, PROV-01, PROV-02 and TEST-01 to TEST-04;
   - gates: lint, typecheck, build, `test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, one `check:browser`, `git diff --check`, Code Health.
   - The ID `T-212-browser-gate` means T-212's "One `npm run check:browser` passes". `O-049-proof-browser` means the Objective Proof's "one `npm run check:browser`".
2. **Entry points:**
   - `Scene.addBody(id | BodyRef, options)`, `listedMoons(planet?)`, `toDefinition(data)` and the `catalogue` it carries, `installData`, `Scene.stateOf` / `provenanceOf`;
   - `compositionPathLayer` / `compositionPathView` (the T-212 fix);
   - the importers `planet-moon-catalogues.mjs`, `jupiter-moon-catalogue.mjs` and `moon-lookup.mjs`;
   - the synthetic journey and the packed package.
3. **Relied-on runtime:**
   - the moon systems' `mappedMoon` and `binding` and the chunk loader;
   - the data packages' `index.json` (fit sets and spans);
   - `moonOrbitPath` (the I-119 rule);
   - the browser driver readouts (`data-body-screen`, `data-paths`).
4. **Axes and not-applicable cells:**
   - Axes: id input shape (listed, detailed, unknown, malformed, BodyRef); data present or missing; window inside or outside the span; period present or null; scene state (fresh, after a failed add, duplicate, second scene); planet (all six).
   - Not applicable: text classes (ids are matched exactly, not measured); output sinks (no CLI output in scope); serialization (definitions are in memory).
5. **Admission:** a supported public-API or viewer path, a named criterion, guardrail or release gate, and a credible consequence.

## Coverage Matrix

| # | Row (criterion) | Cells | Result | Evidence |
|---|---|---|---|---|
| 1 | Every listed moon is a period carrier (T-210) | 6 planets; null-period path; source recorded | Proven | All 458 moons have a positive `orbitPeriodDays` and `sources.period: jpl-sat-elem`, and each list carries a `periods` note with `missing: []` (`listedMoons.test.ts` "orbit periods" x6). Spot values against JPL: Miranda 1.413479, Titania 8.705869, Oberon 13.463237, Hyperion 21.276658, Phoebe 550.30391 and Nereid 360.133039 d all match the published table |
| 2 | Importer reproduces committed lists (T-210) | rerun both importers + lookup generator | Proven | Ran `planet-moon-catalogues.mjs`, `jupiter-moon-catalogue.mjs` and `moon-lookup.mjs` offline; `git status` showed no change |
| 3 | Slim table agrees with the lists (T-210) | field by field; generator output; test fails on disagreement | Proven | `listedMoons.test.ts` "the slim lookup" (458 entries `toEqual`) and "is the committed output of its generator" |
| 4 | Periods vs `data/orbits` within 0.5% (T-210) | 13 moon records; Io/Europa | Proven, with a stated deviation | The test compares the table P to each record's `elements.periodDays` within 0.5% (identical figures). Against the rotation-rate period Europa is 0.73% off, so the 1% check applies there. This is documented in the drift notes and Design. It does not reach any drawn body, because Io and Europa keep their built-in definitions (row 7) |
| 5 | One rule, no moon id (T-211, ARCH-05/06) | rule source; all 458 moons; fitBody join | Proven | `core/bodies/listedMoonBodies.ts` and `assets/bodies/listedMoons.ts` name no moon; `src/api` names none. The test "builds every listed moon by the one rule" passes. **Independent probe:** for every non-detailed listed moon (443), `addBody(parent).addBody(id, { orbit: true })` gives a span equal to the period in `planet-moon-periods.json` (the transcribed JPL file, not the lookup) within 1e-9 |
| 6 | Every listed moon has data in its package (Outcome) | 6 packages' indexes | Proven | Script: all 458 `fitBody` ids are present in the matching `astraeus-data-<planet>/data/<set>/index.json`, and the `early` flags match the 1950 spans (Uranus: the main five; Saturn: nine; Neptune: Triton, Nereid) |
| 7 | Detailed moons keep their definitions (T-211) | 15 detailed ids | Proven | Test "keeps the detailed definitions" checks object identity with the built-in definition. `#addListedMoon` returns early when the catalogue already has the id |
| 8 | Lazy, scene-local (T-211) | built-in catalogue untouched; second scene; failed add rolls back | Proven | Test "an unused moon costs nothing". **Probe:** a second scene carries no `catalogue`; a failed `addBody("miranda", { enlarge: 0 })` throws `bad-body` and leaves no `catalogue`, and a later add succeeds; a BodyRef from `listedMoons()` is accepted; a duplicate throws `duplicate-id` |
| 9 | Errors (Outcome: unknown-body, missing-data, out-of-span, no-orbit) | malformed ids `""`, `Miranda`, `" miranda"`, `s/2003 j 19`, `constructor`, `__proto__`; missing package per planet; 2040 window; null period; planet absent | Proven | **Probe:** malformed ids give `unknown-body` in under 600 characters. `missing-data` names the package for metis, phoebe, nereid, nix and puck. The test gives `out-of-span` (2040) and `no-orbit ... about uranus`. The null-period path cannot be reached today because no moon has a null period; by code reading it reaches `no-orbit` (the definition omits `orbitPeriodDays`, so `moonOrbitPath` is undefined), the same path as Phobos |
| 10 | Spans (T-211) | early (1950) vs 2010 moon | Proven | **Probe:** Phoebe's `validUtc` starts in 1950 and Pan's in 2010 |
| 11 | Positions from the fit set (Outcome) | Miranda in 1986 | Proven | Test: Miranda is 1.2e5 to 1.4e5 km from Uranus on 1986-01-24 (semi-major axis 129,900 km), with ephemeris provenance |
| 12 | Look (Outcome) | grey sphere; picture when registered | Proven by code and readout; owner look | `withPicture(id, sphere #a8a8a8)`. The browser reads `as: "sphere"` at phone size this run (radius 637 px when approached). Owner look recorded 2026-10-31T12:36:46Z |
| 13 | Slim lookup size (T-210, ~25 kB / 8 kB) | first download | Proven | `node tools/measure-example.mjs` gave a first-open of 1,638,245 B raw / 468,717 B gzip, against 0.5.1's 1,618,563 / 461,100. That is +19,682 raw / +7,617 gzip, within budget. The CHANGELOG says 1,638,210 / 468,709 (35 B / 8 B lower; observation 4). The full lists are not in first-open |
| 14 | T-212 path-layer defect and guard (TEST-02) | fix; regression test; guard generality | Proven (fix and regression); guard partial (observation 1) | `compositionPathLayer` now takes the scene catalogue and `sceneHooks` passes `runtime.catalogue`. The second case of `sceneCatalogueReach.test.ts` reproduces the original throw and the fix. Every other `src/app` default-parameter use was traced: `bodyMetrics`, `catalogueItem`, `assignBodyLayers`, `readoutPairOf`, `createSceneResolver` and `focusRadius` all receive the scene catalogue from their callers. `createReadoutMetrics` and `validatePathSpec` do not, but their inputs are limited to built-in ids by `addTrajectory` validation |
| 15 | Synthetic 1986 Uranus scene (T-212, ARCH-01/03) | made-up path; five moons with `{ orbit: true }` | Proven | `syntheticJourneyScene.ts` uses invented straight legs and names no mission; `syntheticJourney.test.ts` passes |
| 16 | `check:node-consumer` (T-212) | Miranda, Titania orbit on the packed package; no-package refusal | Proven | pass (Titania span 8.706 d) |
| 17 | One `check:browser` passes (T-212, Objective Proof) | fresh single run | **Issue I-123** | `docs/evidence/browser-20261031T123947Z/`: smoke 17/18. `synthetic-journey` desktop failed with "at 1979-03-05T12:00:00Z the moons io, europa, ganymede, callisto are not in the scene ([])". Phone passed, with `nearUranus` spheres for all five moons and orbit lines. The other seven steps passed, public-build-assets included (Apollo 11 4,486,131 B raw ≤ 4,490,000) |
| 18 | Documentation (Outcome) | README `addBody` row; uranus README line; CHANGELOG Unreleased; Design reconciled | Proven (minor drift, observation 2) | Every T-210 and T-211 drift note is in the Design paragraph "Every listed moon addable (O-049, I-122)", and T-212's notes are marked non-architectural with reasons |

## Finite External-Boundary Matrix

| Boundary | Cell | Result |
|---|---|---|
| Browser runner | configured vs actual target, startup, success | Ran: the runner started its own dev, preview and example servers. 7 of 8 steps passed; smoke exited 1 (I-123) |
| Browser runner | timeout / readiness after seek | Issue I-123. The journey check waits a fixed 1.5 s after a seek; its run time doubled from 35 s (C-129) to about 74 s after the Uranus moons were added |
| Browser runner | secret-safe output, cleanup | Pass: only summary and results files are kept; logs go to scratch |
| Data packages | missing package; out-of-span window | Proven (rows 9 and 10) |
| JPL SSD source | fetch | Not applicable at run time: the figures are transcribed and dated (fetched 2026-10-31), and the importers run offline |

## Workflow And Side-Effect Check Lock

`addBody` for a listed moon runs in this order:
1. Keep the current catalogue as `before`.
2. `#addListedMoon` swaps in an extended scene-local catalogue.
3. `#register` validates and records the body.
4. If it throws, the catalogue goes back to `before`.

`toDefinition` then passes `catalogue` when it differs from the built-in one, and `prepare` → `installData(catalogue)` loads that moon's chunks. Failure owner: `#register` (bad-body / no-orbit / duplicate-id), which rolls back. Independent oracle: the probe's rollback case (row 8). The built-in catalogue is never mutated (row 8).

## Gates (fresh, HEAD 0b37876f, 2026-10-31 UTC)

| Gate | Result |
|---|---|
| `git diff --check 34f33db2 HEAD` | clean |
| `npm run lint`, `typecheck`, `build` | pass |
| `npm run test:full` | pass: 162 files, 2029 passed, 1 skipped. Statements 91.7%, branches 86.42%, lines 94.29%. Run twice (12:37Z, and again after the probe was deleted), same result |
| `npm run check:engine-alone` | pass (16.2 s) |
| `npm run check:pack` | pass |
| `npm run check:node-consumer` | pass |
| `node tools/measure-example.mjs` | first-open 1,638,245 B raw / 468,717 B gzip |
| `npm run check:browser` | **FAIL**. Run once, 12:39:46Z–12:43:33Z, with no other browser job: smoke 17/18 (synthetic-journey desktop); smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-build-assets and public-addresses passed. No screenshots. Not repeated (browser policy) |
| Independent probe | 6 of 6 pass (rows 5, 8, 9, 10); file deleted |

## Code Health

`savepoint health check O-049 .` ran after the rerun `test:full`. Snapshot `sha256:87eee85326f95d0257c36d8daedef57d9c17a457f95ac559bd4a15a0246d421b` (created), verdict "Code Health does not block clearance". Complexity, coverage, vulnerabilities, duplication and tests all returned "no finding". An earlier snapshot this session (`sha256:5a38ccb9...`) reported coverage and tests as stale because the probe and the importer rerun touched files after the first `test:full`. The rerun supersedes it and it is not used as evidence. The health verdict neither grants nor withholds clearance; the browser gate does.

## Owner Decisions Assessed

There is no structured `owner_validation.accepted_check` or `exception` on O-049 yet, so there are no `carried_forward` entries. The recorded decisions stand and their scope is unchanged:
- three Task-check waivers (T-210 to T-212, owner "orchestrate O49"), each complete in shape;
- the owner look 2026-10-31T12:36:46Z ("Looks good, run final check");
- the Apollo 11 raw budget raised from 4,470,000 to 4,490,000 B (measured 4,486,131 B this run, so inside it with 3,869 B headroom).

## Issues

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-123: synthetic-journey desktop smoke failed on the one fresh `check:browser` run | Medium. The view passed at phone size in this run and at both sizes in T-212's run, so it looks timing-dependent. But the view's run time doubled with O-049's added data, which makes the race likelier | Medium. It is a dev-only view, and no product behaviour was shown wrong. But the required release gate is red, and a flaky gate erodes every later Objective Check | Medium | Fix now, before closing O-049. Find the cause (a slower ready state after the seek, or the check's fixed 1.5 s wait) and fix it generally, for example a driver wait for a scene-ready readout after a seek. Then rerun the browser gate once in a re-check. Or the owner explicitly accepts the gate result |

`unmet: [T-212-browser-gate, O-049-proof-browser]`.

## Code Style Review

- [x] STYLE-01 **One job per file** — the rule (`core/bodies/listedMoonBodies.ts`), look (`assets/bodies/listedMoons.ts`), generated table and generator are separate.
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — the missing, out-of-span, no-orbit, duplicate and detailed-wins branches are tested. The null-period branch cannot be reached with today's data.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries** — `parseMoonCatalogue` accepts only a positive finite period.
- [x] STYLE-07 **One source of truth** — the lookup is generated from the lists, and a test fails on disagreement. The radius and period source strings in `listedMoonBodies.ts` repeat the list's `sources` text (minor).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — the code diff is small. Most lines are the generated table and the regenerated lists.

## Owner Validation Still Needed

T-212 (`owner_validation.required: true`): the owner's look passed. `accepted_check` can only name a `CLEAR` Check, so it waits for the re-check after I-123. T-210 and T-211 are done. O-049 closes after I-123 is repaired and a re-check is `CLEAR`, or after the owner explicitly accepts I-123.

## Non-blocking Observations

1. **The T-212 guard is narrower than the defect class.** `sceneCatalogueReach.test.ts` case 1 is a regex that only catches an *unaliased* `catalogue` import in `src/app`. The pattern behind the bug survives: a function with a default parameter `bodies = builtInCatalogue`, where a caller forgets to pass the catalogue. `PathView`'s fix uses exactly that pattern, and several other `src/app` files do too. Every caller was traced and passes the catalogue correctly today (row 14), and case 2 is a real behavioural regression test. So the fix is sound, but the guard does not mechanise the general rule. A stronger guard would drop those defaults where a scene catalogue exists, or test behaviour by mounting a scene with a scene-local body through every view factory.
2. **Design drift.** The O-048 paragraph in Design.md still says "The astraeus pack file limit is 464"; it is now 470 (`tools/check-packs.mjs`).
3. **The listed-moon reach is `addBody` only.** `addTrajectory({ center })`, trajectory readouts (`distance.to`, `altitude.above`, `range.marker`) and the scene-centre fallback still accept only built-in ids (`scene.ts` ~347, ~353, ~942), so a path measured from Miranda is refused with `unknown-body` / `bad-readout`. The same was already true for elements bodies, and O-049 promises only `addBody`, but the probe app's Uranus flyby may want "distance to Miranda".
4. The CHANGELOG first-open figures (1,638,210 / 468,709) are 35 B / 8 B below today's measurement (1,638,245 / 468,717), probably the T-212 `PathView` change, which the CHANGELOG line calls "no change to the package's code or size".
5. The Apollo 11 raw budget has 3,869 B of headroom, and the astraeus pack count is at its limit (470/470).
6. Europa's JPL P is 0.73% shorter than its rotation-rate period. It is documented and does not reach any drawn body, but any later Jovian use of the table period needs the apsis-corrected rule (Design says so).
