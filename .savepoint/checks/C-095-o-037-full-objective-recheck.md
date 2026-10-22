---
id: C-095
scope: {kind: objective, id: O-037}
result: NEEDS WORK
checked_by: {role: checker, session: o037-full-recheck-20261022}
executed_session: 9d85e5d6-91d4-454a-a0d6-81701c464056
checked_at: '2026-10-22T10:30:00Z'
health_snapshot: sha256:4cb756cb8f7aadf25be66bb3e3e61389aa4270a657154b0544363235cfe49e1b
reviewed:
  base_commit: a115b693
  head_commit: ac5bd066
  files: [src/app/AstraeusScene.tsx, src/app/sceneContentsHooks.ts, tests/compositions.test.ts, tests/publicBuild.test.ts, tests/sceneFrame.test.ts, tools/validate/load-budget.mjs]
  dependencies: []
issues: []
unmet: [SC4, SC5, SC6, SC8]
supersedes: C-094
---

# C-095: O-037 Full Objective Recheck

Independent session: did not plan, build, coordinate or mark any O-037 Task. Targeted recheck of C-094 under its frozen scope lock; T-129 diff `a115b693..ac5bd066` (code: the six files above). C-094's results for files T-129 did not touch carry forward unchanged (SC1, SC3, SC7, SC5 harness and archive cells, SC6 retention cell, and the browser-run results).

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope (C-094 lock reused, not widened)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-094 matrix, re-run cells below)
- [x] Finite External-Boundary Matrix (carried; no browser runs, owner decision)
- [x] Workflow And Side-Effect Check Lock (carried)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; no finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Closure map of C-094 Issues

| Issue | Re-check cell (C-094) | Result | State |
|---|---|---|---|
| I-060 full gate / coverage | SC2 "full gate writes fresh coverage"; SC8 coverage fresh | `npm run test:full` exit 0, `coverage/coverage-final.json` (2.5 MB) and `junit.xml` written; snapshot coverage `fresh`. Cause fixed (TrackedBodyView built once, `tests/compositions.test.ts:333`), no timeout changed | Repair proven; open (not `verified`: Check is not CLEAR) |
| I-061 load budget | SC4 engine set, `public-build-assets` step | Scratch public build `/tmp/c-o037-public-wzLl/dist`: `node tools/validate/load-budget.mjs` exit 0, all pages ok. Negative probe: the pre-repair script (a115b693) on the same build FAILs jupiter, saturn, uranus ("settingsFields ... the page set does not list"). New `tests/publicBuild.test.ts:132` case passes | Repair proven; open |
| I-062 scene complexity | SC8 complexity ≤20 | `AstraeusScene` no longer in lizard's list; one function over 20: `tools/validate/runner.mjs:28` `runStep` 27 (Needs attention) | Scene part proven; SC8 still unmet, resting on owner decision (below); open |
| I-063 stage tests | SC4 "each stage has a node test" | `syncViews`, `publishCanvasReadouts`, `placeViews` now tested (`tests/sceneFrame.test.ts:167-228`); all 8 stages covered; focused run 63/63 pass | Repair proven; open |
| I-064 four GIFs | SC6 "0 pictures" | 4 `.gif` still tracked under `docs/evidence/o016-t063-*` | Still open (owner-run deletion pending) |
| I-065 jupiter-io phone | SC5 planets set | Not rerun (owner decision). T-129 read-only finding verified: `src/app/FeatureMarkers.ts` unchanged by O-037; T-129's AstraeusScene move does not touch `updateOverlays`. Owner phone-size look: marker shows | Unverified by run; owner evidence only; open |
| I-066 vite advisory | out of scope | 6 vite 8.3.2 advisories (1 high) | Open, out of O-037 scope |

## Owner decisions applied

- Browser sets (owner, 2026-10-21): "Nope nope nope we cut down browser chevks" and "Tests and health only, you look (Recommended)". No browser set ran in this recheck. C-094's `check:engine` (15/16 steps green) and planets results stand as recorded; `public-build-assets` is proven fixed by node only.
- Owner's preview look (2026-10-22): "both fine, mark it done and run the recheck" (Io's Loki Patera marker at phone size, I-065; general look at the reworked scene, T-124 owner_validation / SC4). Owner evidence, not a browser pass. It agrees with the code reading: T-129's refactor moves hooks verbatim (same deps, `gl.domElement` for `gl`; same stage order via `runFrame`; `refFor` now also used for lights with the same semantics).
- `tools/validate/runner.mjs` 27 by lizard (owner, 2026-10-22): "Leave it for the cut-down (Recommended)", moved to O-038, recorded on I-062. Treated as an owner exception to SC8's complexity reading, not CLEAR.
- I-064 owner-run deletion pending; I-066 and I-054 to I-059 outside O-037.

No structured `exception` or `owner_validation.accepted_check` exists on O-037 or its Tasks, so there is no `carried_forward` entry to write; the decisions above live in Issue history and Task drift notes only.

## Gates and commands (2026-10-22, UTC)

- `npm run test:full` 10:16:43Z-10:17:46Z, exit 0: 92 files, 1287 passed, 1 skipped; coverage Statements 68.89%, Branches 65.8%, Lines 72.09%.
- `npm run lint` 10:17:53Z exit 0; `npm run typecheck` 10:17:56Z exit 0; `npm run build` 10:18:00Z exit 0 (chunk-size warning only).
- Scratch `ASTRAEUS_PUBLIC_BUILD=1 vite build --outDir /tmp/c-o037-public-wzLl/dist` exit 0, then `node tools/validate/load-budget.mjs` exit 0 (not a browser).
- `git diff --check a115b693..HEAD -- src tests tools`: clean.

## Code Health

`savepoint health check O-037` 10:18:22Z, after the full gate: snapshot `sha256:4cb756cb8f7aadf25be66bb3e3e61389aa4270a657154b0544363235cfe49e1b` (created, official, tree clean at ac5bd066). Verdict: **blocks clearance** (dependency_vulnerabilities: 1 high, vite 8.3.2, I-066).

| Signal | Value | Rating | SC |
|---|---|---|---|
| Duplication | 1.43% (74 clones, 929/65087 lines) | Watch | SC1, SC8 met |
| Complexity | 27 max (`runner.mjs` `runStep`); 1 function over 20 (was 38, 2) | Needs attention | SC8 unmet; owner exception (O-038) |
| Coverage | 68.9%, fresh | Needs attention (declining against a median of older readings on the wider pre-SC2 universe) | SC2/SC8 "fresh" met; rating is an observation |
| Tests | 0 failing of 1288 | Good | met |
| Vulnerabilities | vite 8.3.2: 1 high, 4 medium, 1 low | Needs attention; blocks | I-066, pre-existing, out of scope |

## Adversarial pass

- Bypass of the budget fix: the new node test only checks listings, not the real chunk graph; the scratch build plus negative probe covers the real graph.
- Refactor drift: `useScenePointer` keeps the deliberate exhaustive-deps suppression with `[canvas, controls]`; `useSceneFrame` reads `inputs` from the latest render as the inline callback did. No behaviour change found.
- I-060 fix is at the cause, not a timeout: the case still exercises `update` at every date/policy/centre.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-064 four GIFs | High | Low (7 MB) | Low | Owner runs the deletion |
| I-062 runner.mjs 27 | High | Low (dev tool, ESLint passes) | Low | Owner exception to O-038, or resolve as accepted |
| I-065 jupiter-io phone | Low (code path unchanged, owner saw it) | Medium if real | Low | Owner accepts on the preview look, or one script run |
| SC4/SC5 browser proof after T-129 | Low | Medium | Low | Covered by the owner's browser decision; record as exception |
| I-066 vite advisory | High | Medium | Low for O-037 | Owner decision outside O-037 |

## Observations

- `publishOrbitHeadGap` (`src/app/sceneFrame.ts:176`) has no direct node test; it is a helper, not one of the eight stages.
- `.claude` hooks still counted by lizard/jscpd (C-094 observation stands).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — load-budget page sets still list chunks by hand (`tools/validate/load-budget.mjs:17-25`); the new test guards one chunk only.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**

## Verdict

NEEDS WORK, by a narrow margin and on owner-held items only. All code repairs are proven (I-060, I-061, I-063, and the scene part of I-062). Unmet: SC4 and SC5 (browser runs not repeated after T-129, by owner decision; I-065 rests on the owner's look), SC6 (I-064 GIFs), SC8 (runner.mjs 27, owner exception). The health verdict also blocks on I-066, outside O-037. No code remediation is asked for. The Objective can close by owner exception only: the owner runs the I-064 deletion, records the browser and runner.mjs decisions as structured exceptions (or resolves I-062, I-065 and I-066 as accepted), resolves I-060, I-061 and I-063 as accepted on this proof or has a later Check verify them, and records T-124/T-129 owner_validation. This is the convergence limit: no further autonomous remediation round.
