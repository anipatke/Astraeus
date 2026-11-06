---
id: C-148
scope: {kind: objective, id: O-059}
result: NEEDS WORK
checked_by: {role: checker, session: o059-check-20261107}
executed_session: o059-run-20261106
checked_at: '2026-11-06T19:51:42Z'
health_snapshot: sha256:441f363370a8ccce5356938f7bbb833d9ec434a229c11422ddede16f1a6dcd9d
reviewed:
  base_commit: 83fd9964
  head_commit: eec2d514
  files: [packages/astraeus/src/api, packages/astraeus/src/app, packages/astraeus/src/core, packages/astraeus/src/shell, packages/astraeus-demo-planets, packages/astraeus-site, tools/check-packs.mjs, .savepoint/Design.md]
  dependencies: []
issues: [I-143, I-144]
unmet: [API-04, TEST-01, TEST-03]
supersedes: null
---

# C-148: O-059 Full Objective Check

**Verdict: NEEDS WORK.** All seven Success Conditions are proven and every gate passes. Two small Issues hold it back: I-143 (three new calls keep the caller's object, API-04) and I-144 (two demo rules lost their tests, TEST-01, TEST-03). Both are narrow; neither changes what a visitor sees today.

**Independence.** This session did not plan, build, coordinate or look at any O-059 step. Task evidence was treated as claims. Mutations and probes ran in a scratch copy; the checkout's tracked files are unchanged.

**Prior decisions.** First Check of O-059, so no `carried_forward` entries. Nine Task-check waivers are present; they are not clearance.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner reused, not rerun; see Gates)
- [x] Workflow And Side-Effect Check Lock (N/A beyond the site's mount, cover and rebuild sequence, row 6 below)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (N/A, first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

Success Conditions, Owner Decisions and Boundaries of O-059; T-265 to T-273; API-01 to API-07, ARCH-01, -03, -05, -06, PROV-01, TEST-01, -03. Diff `main...o059-front-door`, 333 files, base 83fd9964, head eec2d514. An Issue needs a supported public path. Apollo and Showers deep imports, O-057 renames and removing `toDefinition` are out of scope.

## Gates

| Gate | Result |
|---|---|
| `npm run test:full` (19:25:59-19:27:12Z) | pass: 225 files, 2938 passed, 2 skipped; lines 95.31%, branches 88.57% |
| `lint`, `typecheck` | pass |
| `check:engine-alone` | pass |
| `check:pack` | pass: astraeus 9.12 of 9.5 MB unpacked, 7.23 of 8.0 packed; astraeus-data 123 of 130 files |
| `check:node-consumer`, `check:react-consumer` | pass (react 19.3.1) |
| `ASTRAEUS_PUBLIC_BUILD=1 ASTRAEUS_ENGINE_SHARE=1 npm run build` + `public-build-assets.mjs dist` | pass: `ok: true`, 96 checked, load budget, synthetic and planets checks true |
| `npm run build` (restored), `npm run build:example` | pass |
| `git diff --check` | three blank lines at file ends only (T-267, T-271, `core/bodySetFamilies.ts`) |
| Browser | reused, not rerun: `docs/evidence/browser-20261106T174821Z`, all 10 steps exit 0, 17:48:38-17:54:10Z |

**Browser reuse proof.** Last code edit before the run: `main.tsx` and `syntheticJourneyScene.ts` at 17:48:04Z; run folder created 17:48:21Z. The tree matches HEAD, and `eec2d514` changes only the T-273 record. No code changed after the run. Smoke covers the same 18 views as the last run on main (browser-20261103T111739Z).

**Code Health.** `sha256:441f363370a8ccce5356938f7bbb833d9ec434a229c11422ddede16f1a6dcd9d`, created after the full gate: "does not block clearance"; all five instances report no finding. Supporting evidence only.

## Coverage

| # | Success Condition | Class | Evidence |
|---|---|---|---|
| 1 | Front door, source and tests | Proven | Own scan of `src`, `tests`, `tools` for every string starting `astraeus/`: only `astraeus/style.css` and test fixtures inside `packageBoundaries.test.ts`. Relative reaches are file reads (star header, engine JSON, Vite placeholder), not imports. `DEEP_IMPORT_COUNTS` planets 0, site 0; Apollo 129 and Showers 68 unchanged |
| 2 | Moons are public | Proven, one Issue | `sceneBodySets`, `sceneMoonPanelPlaces`, `twoViewers` on made-up systems; browser `planets-phone` focuses Io and opens a place. I-143 is an input-copy defect on these calls |
| 3 | The picker is public | Proven | `picker`, `lifecycle` on both paths, `twoViewers`; `main.tsx` uses `setPicker` for planets and showers |
| 4 | Every other private ability has a home | Proven | `alternates`, `developerSections` absent from `src`; `smallSettings`, `desktopPictures`, `firstDraw`; `mount` takes only a `Scene` |
| 5 | Test scenes are public | Proven | See T-271 below |
| 6 | The site mounts like any host | Proven | `main.tsx` imports no `App`; mutations: removing `onFirstDraw` fails `loadingCoverChain` (T-272's claim holds), `address: false` fails it too |
| 7 | Same look | Proven | One browser run; owner "looks right" (T-273) after it |

**Input matrix** (51 cells, normal, empty, missing, duplicate, wrong type, non-finite, boundary, on `addBodySet`, `setMoonPanel`, `addPlaces`, `setPicker`): every bad input gives its typed `SceneError`, no plain throw; latitude 90 passes, 90.01 refused. Mutation after validation: `setPicker` isolated; the other three leak (I-143). Text classes, redirected output and network cells are N/A: no text width or output sink in scope.

**Scratch mutations against fast tests.** Removing `handle.onPick` or the planet `setPicker` from `main.tsx` fails no fast test. These are held only by the browser steps, which do press both pickers (`planets-phone` switches to Jupiter, `meteor-shower` to the Geminids), so TEST-01 is met; see observations.

## Named Questions

- **Limits.** Only the Owner Decisions changed: engine back at 9.5 MB, `astraeus-data` files 130, API page 200,000 raw and 40,000 gzip. `tools/api-rules.mjs` has no diff. Other rule changes are needed by the work: `apiSettings` gains `desktop` as a public mapping (API-06), `addressRule` ALLOWED shrinks, `load-budget` page sets follow renamed chunks with no limit moved, `check-packs` allows the moved data.
- **API-01 to API-07.** Surface lock, type lint, error and settings scans pass; README, CHANGELOG and lock carry each new name. API-04 fails only for I-143. **ARCH-01, ARCH-06:** additions to `src` name no body in a rule; `addBodySet` defaults to the scene's first body; the name check passes.
- **T-272's dropped tests.** Five of seven are still held by named tests, so T-272's "not asserted anywhere" overstates. Two lost their evidence: I-144. Per-demo DOM panel checks became data checks; acceptable, since `domStory` holds the drawing and the browser opens a panel.
- **T-271's differences.** Accepted against the Success Condition. They are local-only made-up scenes, not demos; each difference is named in `syntheticScenes.test.ts`; events, spans, group counts and camera reach match the fixture. Engine fixtures keep their ARCH-03 tests, and `synthetic-bare` is rightly dropped because `Scene` refuses a bodiless scene.
- **Design reconciliation.** Every Drift Note from T-265 to T-272 has a line in the O-059 accounting. Two lines need correcting: T-272's gap line (I-144) and the boundary sentence (first observation).

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-143 | Low: needs a host editing or reusing an input | Medium: unchecked values reach the viewer, or a wrong panel, with no error | Low | Fix now, small |
| I-144 | Low: needs a regression in these paths | Low: both behaviours hold today | Low | Fix now, combine with I-143 |

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `main.tsx` repeats the engine's 0.6 s fade as `DEFAULT_FADE_SECONDS`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — 333 files, though most are moved data.

## Observations (non-blocking)

- `packages/astraeus-site/tests/syntheticScenes.test.ts` calls `toDefinition` three times, against T-272's "no `toDefinition` in the site" read strictly. Source is clean and there is no deep import, and O-057's removal will fail it loudly, so this is follow-up, not an Issue. Design names only `planetViews.test.ts`; O-057 must re-point both, and needs a public read for activities. `syntheticJourneyScene.ts:4` still mentions `toDefinition`.
- The picker wiring in `main.tsx` has browser proof only; a fast test would catch it sooner.
- T-273's evidence line reads "Done, see the owner look below, not recorded", which contradicts itself.

## Owner Validation Still Needed

T-273 declares `owner_validation.required`; the look is recorded, but the structured acceptance needs a `CLEAR` Check to name. After I-143 and I-144 are repaired, a re-check under this scope lock, then the owner's acceptance and Objective close.
