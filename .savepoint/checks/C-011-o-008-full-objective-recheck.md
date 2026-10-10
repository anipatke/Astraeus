---
id: C-011
scope: {kind: objective, id: O-008}
result: CLEAR
checked_by: {role: checker, session: o008-recheck-20261011}
executed_session: o008-repair-20261011
checked_at: '2026-10-10T21:04:40Z'
health_snapshot: sha256:90a01e833dbf8f715629ccbf0322adc472554452e9fca349baf9a039de63c2aa
reviewed:
  base_commit: ebc40df
  head_commit: ebc40df
  files:
    - src/app/App.tsx
    - src/app/EarthMoonScene.tsx
    - src/app/experienceDefinition.ts
    - src/main.tsx
    - src/mission/apollo11Definition.tsx
    - src/synthetic/syntheticDefinition.ts
    - tests/experienceDefinition.test.ts
    - tests/experiencePlugIn.test.ts
    - docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md
    - tools/validate/browser-synthetic.mjs
    - .savepoint/Design.md
    - package.json
    - package-lock.json
  dependencies: [package.json, package-lock.json]
issues: []
supersedes: C-010
---

# C-011: O-008 Full Objective Recheck

## Prior Issue closure map

| Prior Issue | Result | Proof |
|---|---|---|
| I-015 | Verified repair | Actual scene-object inventory across original finite layer sets, plus source tracing, contract tests and updated synthetic/bare browser workflow |
| I-016 | Verified repair | Each of six GAP sections now answers all five brief questions plus why Astraeus rather than adapter; optional GAP-3b and deferred GAP-5 remain bounded |

CLEAR for the frozen C-010 technical scope. Required owner visual acceptance remains pending; technical clearance does not close O-008.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope, independence and admission

This conversation executed neither the Tasks nor the repairs. It remains independent from executor session o008-repair-20261011. Main checkout, not a worktree lane; no parallel agent work. Reviewed HEAD plus uncommitted implementation, including new files; equal base/head IDs are not evidence of an empty working-tree diff. C-010 stays immutable.

C-010's numbered scope lock, matrix axes and N/A classifications remain authoritative and unchanged. Before probes, `/tmp/astraeus-c011-admission.md` mapped each recheck item to an exact C-010 cell: layer flags/scene omission (I-015), metrics bounds/unknown ID, fixture assembly, original URL cases, five scripts, six GAP answers (I-016), Design/guards and fresh gates/health. No new blocking axis was added. Synthetic-bare is remediation evidence for the same omitted-layer cell; duplicate Earth/tracked entries apply the existing duplicate-layer axis. No arbitrary non-Earth centre or metrics redesign is demanded.

## Acceptance coverage and completed matrix

| C-010 requirement / cell | Current independent evidence | Classification |
|---|---|---|
| SC1; T-024.1/2: every need and GAP justified | Complete need table; GAP-1/2/3/3b/4/5 each names capability, reused contract, precise gap, generic change, independent configuration and engine ownership. GAP-3b has specific observed/illustrative span evidence; GAP-5 stays deferred with a direction-only alternative. | Proven |
| T-024.3: ordinary trajectories challenged | Original measured 1k/10k/100k alternative and performance/memory bound unchanged; 100k cost exceeds a frame. No universal 1k cutoff inferred. | Proven as stated single-machine measure |
| T-024.4/5/6: proposal/facts/research boundary | Shell/clock/layers/metrics/camera/panels proposal, candidate fact sources and illustrative boundary intact; research-only Task evidence remains distinguishable from later production work. | Proven |
| SC2; T-025.1/2: generic boundary | App imports no mission/synthetic modules. usesEarthMoon drives runtime. Scene conditionally mounts both body meshes, lights and Moon path; frame loop skips Moon/Sun evaluation and debug readout when off. Entry chooses definitions. | Proven |
| Definition + trackedBodiesOf, both fixtures | Independent module harness repeats both definitions × empty/earth-only/tracked-only/both/duplicate tracked list: 10 rows with independent expected flags/counts. | Proven |
| App→scene original omission reproduction | Browser intercept replaces only trusted synthetic sceneLayers. Real R3F scene inventory: empty → all counts 0; Earth-only → 2 Earth meshes (body/glow), 1 Moon mesh, 4 lights, 1 Moon path, 0 tracked mesh; tracked-only → 1 tracked mesh and zero Earth/Moon/light/path counts; both → both inventories; duplicate lists → same counts once. | Proven |
| Metrics factories original bounds/unknown cells | Both factories, 3 bodies × start−1/start/end/end+1: 0/3/3/0 metrics; unknown object [] unchanged. | Proven |
| SC3; T-026.1/2/4: fixture/assembly/workflow | Own shell objects/events/clock/provenance; original contract tests, synthetic and synthetic-bare smoke, focus/follow and reload default, optional sections absent. | Proven |
| Entry selection | Original four browser queries: default→Columbia, synthetic→marker, unknown→Columbia, repeated synthetic/unknown→marker; synthetic→Apollo reload retained. | Proven |
| Apollo time/state workflow and presentation; T-025.3/4 | Fresh original four scripts cover play/pause, 30 events, four rates, six camera presets, availability, six True/Readable readout pairs, follow track, USNO phases, desktop/tablet/mobile panels and anchor off/on/off. No previous scenarios removed. | Proven |
| SC4; T-026.3: name/import guards | Generic core/shell/app name check passes, scans populated; app import scanner now also excludes synthetic modules, correcting prior advisory documentation mismatch. | Proven |
| T-025.5; architecture guards | Core and shell diff empty. Scene/rendering stays downstream of scientific State; configured illustrative fixture provenance/limitations unchanged. | Proven |
| T-026.5: Design reconciliation | All original deferred notes accounted for; Earth layer note updated to repaired state. Camera constants and metric wording/dependency remain explicit limits. | Proven |

All original mandatory cells are passed or retain C-010's stated N/A reasons. No material unverified technical criterion remains. Wrong/mixed/nonfinite untyped configuration, mutation-after-validation, hot swapping, Unicode width/output sinks, new providers and arbitrary scene backends remain outside this trusted typed fixture boundary. No scope shrinkage or new criterion interpretation occurred.

## Workflow, external boundary and adversarial pass

Original operation order is intact: entry chooses definition → construct clock/adapter/runtime → create metrics → shell/scene mount → interval and interaction updates → unmount cleanup. Repaired scene flag now gates body/light/path mounting and Moon/Sun evaluation. Tracked view updates and camera actions run even with Earth/Moon off; actual scene inventory and bare browser follow prove that branch. Runtime continues to construct a MoonTrajectory and supplies it to experience-selected metrics; its construction does not mount the layer or evaluate scene ephemeris. That existing adapter convenience is not promoted into a new recheck blocker.

Public configuration, factory failures, subscriptions, local assets and verifier artifact lifecycle were re-traced under C-010's workflow table. No new product persistence, transaction, external call, retry, cleanup writer or secret-output path was introduced. Existing interval/label/gesture cleanup remains present. Browser scripts retain finally-close. Finite external-boundary cells remain as initially classified; verifier failures remain tool failures rather than product defects.

Initial strictPort 5199 startup found another listener and exited 1. It was not reused or killed. Owned Vite started on explicit strictPort 5201; every script and harness used actual/configured `http://127.0.0.1:5201/`. This is explicit target selection, not port fallback. Initial sandbox Chromium launch failed; authorised outside-sandbox rerun passed. The module probe again printed a nonfatal HMR bind EPERM but exited 0 with complete inspected matrix output; no network probe result relies on that SSR server.

Adversarial review repeated omission and duplication of layers, alternative configuration, inclusive/exclusive endpoint cases, unknown metrics, URL fallback, backward time/event jumps, camera/scale representation changes and deferred GAP reasoning. No in-scope violation remains. No unrelated URL edge class or dependency internal was added during recheck.

## Fresh verification evidence

Run 2026-10-11 local / 2026-10-10 UTC, Node v22.22.2 with pinned project toolchain and Chromium 1217 SwiftShader. New code/dependency inputs required fresh execution; no metadata-only reuse was claimed.

- `npm run typecheck`: exit 0.
- `npm run build`: exit 0; existing chunk-size warning only.
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: exit 0; 188/188 tests, 12 files, 28.19 s; fresh JUnit. Named changed suites: experienceDefinition.test.ts (9) and unchanged experiencePlugIn.test.ts (9). Existing test mutation remains only owner-accepted I-014, plus expanded experience-definition checks.
- `git diff --check`: exit 0. Lint unconfigured; TypeScript includes src/tests/tools.
- `node /tmp/astraeus-c011/probe.mjs`: exit 0; module matrix in probe-results.json.
- `node /tmp/astraeus-c011/browser-matrix.mjs`: exit 0; 10 browser rows, errors []; actual scene-store inventory in browser-matrix-results.json.
- Five scripts: browser-synthetic.mjs, browser-shell.mjs, browser-spike03.mjs, browser-spike02.mjs, browser-anchor-labels.mjs; all exit 0, errors []. Common environment `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_URL=http://127.0.0.1:5201/`. Screenshot scripts use `ASTRAEUS_EVIDENCE_DIR=/tmp/astraeus-c011/{synthetic,spike03,spike02}`; anchor script positional path `/tmp/astraeus-c011/anchor-labels`; shell writes no screenshots. Run began at displayed 08:01 environment time. Fresh scratch paths preserve all historical evidence.
- `savepoint health check O-008`: after fresh gate, exit 0, official snapshot in frontmatter, does not block clearance. Complexity maximum 30 and duplication 10.9% need attention but optional/nonblocking. Coverage 84.5% is stale and not relied upon; OSV collection failed so vulnerability health is unknown. Fresh JUnit reports 188 tests/zero failures. Optional stale/failure is distinct from unhealthy code and no high/critical vulnerability finding was obtained.

Every named production/test/document file and repair screenshot exists; new recheck artifacts exist under /tmp/astraeus-c011. The discarded original benchmark remains acknowledged scratch. No core or shell source change. Package/lock add optional coverage tooling; configured test gate is unchanged and executed fresh. No prior Check or history was overwritten.

## Owner decisions and closure eligibility

No Objective acceptance or structured exception exists to assess or carry forward; T-026 accepted_check remains empty. The three Task-check waivers still apply to the same optional-check decision, with their named reason/actor/time unchanged; they waive no acceptance criterion. I-014's owner-accepted reconstruction tolerance is unchanged and remains accepted, not verified by this recheck. No renewal is requested and no owner decision is inferred.

All three owned Tasks remain owner-done. C-011 supersedes C-010 technically; I-015 and I-016 are resolved as verified against this CLEAR record. Owner visual acceptance for T-026's distinct synthetic experience and normal Apollo remains required before Objective closure. The checker does not close the Objective or alter the router.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — original layer omissions now exercised with real scene inventory.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries** — trusted typed fixtures; no untrusted parser added.
- [x] STYLE-07 **One source of truth** — layer lists drive scene and tracked bodies.
- [x] STYLE-08 **Comments explain why**
- [ ] STYLE-09 **Content lives in data** — generic App developer copy still says mission context; advisory, unchanged.
- [x] STYLE-10 **Small diffs** — bounded repair; no core redesign.

## Observations and materiality

No remaining Issues; no materiality actions required. C-010's benchmark-cutoff, camera-limits and generic-wording observations remain nonblocking. Design now accurately limits scene omission rather than claiming metrics are Moon-free: metrics factories can choose Moon distances independently of visible layers. Optional health complexity/duplication and stale/failed collection are disclosed above; no new durable Issue is warranted solely from those signals within this recheck.
