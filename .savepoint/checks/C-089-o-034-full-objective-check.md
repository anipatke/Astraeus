---
id: C-089
scope: {kind: objective, id: O-034}
result: NEEDS WORK
checked_by: {role: checker, session: o034-full-check-20261020}
executed_session: o034-run-20261020
checked_at: '2026-10-20T10:42:21Z'
health_snapshot: sha256:13c51697dec869af108e25bbee5646a7a09756bd6877c7f1cc93ea5f129427bf
reviewed:
  base_commit: df577a8
  head_commit: f87da4c
  files: [package.json, src/synthetic/syntheticDefinition.ts, tests/syntheticStoryAnchors.test.ts, tools/validate/playwright.mjs, tools/validate/runner.mjs, tools/validate/run-engine.mjs, tools/validate/run-demo.mjs, tools/validate/driver.mjs, tools/validate/browser-spike02.mjs, tools/validate/browser-jupiter-io.mjs, tools/validate/browser-showers.mjs, tools/validate/browser-lite.mjs, tools/validate/browser-story-panels.mjs, tools/validate/browser-apollo-shell.mjs, tools/validate/browser-layout.mjs, tools/validate/browser-jupiter-tap.mjs, tools/validate/on-request/browser-sky.mjs, AGENTS.md, README.md, docs/BROWSER_CHECKS.md, .savepoint/Design.md]
  dependencies: []
issues: [I-047]
unmet: [O-034-SC4, T-113-DW2]
supersedes: null
---

# C-089: O-034 Full Objective Check

Independent session (did not build O-034). Full mode. Scope: O-034 Objective (Success Conditions 1-5, Confirmed Decisions, Amendments) and T-110, T-111, T-112 (done, Task Checks waived by owner) and T-113 (stage audit, owner_validation required); commits 9509637, 4478001, f87da4c over base df577a8, plus the uncommitted T-113 files. First Check held to the new AGENTS.md "Browser checks" rule.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. O-034 SC1-5; T-110 DW1-6, T-111 DW1-6, T-112 DW1-7 (DW5 amended by owner), T-113 DW1-6; Guardrails ARCH-01, ARCH-03, ARCH-04, TEST-01..03; project rules on browser checks, driver, regression maintenance, historical evidence.
2. Entry points: `npm run check:engine`, `npm run check:demo -- <apollo|showers|jupiter>`, `tools/validate/playwright.mjs`, the made-up scene definition, README "Running the checks", `docs/BROWSER_CHECKS.md`, AGENTS.md project rules, Design `tools/validate/` and `src/synthetic/` rows.
3. Relied on: Vite dev/preview servers, scratch public build, playwright-core devDependency, driver guard test.
4. Not applicable: Windows/no-bash portability (not an acceptance criterion; observation only), text classes, state machines.
5. Materiality: an Issue must break a named SC/DW/guardrail through the shipped files.

## Owner decisions applied (facts, not findings)

Per-Task Checks waived (`check_waiver` on T-110..T-113); sky moved to on-request; Showers 390 s and Jupiter 248 s accepted (Objective Amendments 2026-10-20T10:36:35Z); no browser set rerun in this Check.

## Browser evidence reuse (Verification Policy, new "Browser checks" rule)

No browser set was run. Reused runs and proof their inputs are unchanged:

| Set | Run (command `npm run check:engine` / `check:demo -- <d>`) | Window (UTC) | Result |
|-----|------|------|------|
| engine | docs/evidence/engine-20261020T092052Z | 09:20:52-09:25:26 | 16 steps exit 0, 0 error lines, 275 s |
| jupiter | demo-jupiter-20261020T101926Z | 10:19:26-10:23:34 | 5 steps exit 0, 0 error lines, 248 s |
| apollo | demo-apollo-20261020T102339Z | 10:23:39-10:27:26 | 5 steps exit 0, 0 error lines, 227 s |
| showers | demo-showers-20261020T102729Z | 10:27:29-10:33:59 | 5 steps exit 0, 0 error lines, 390 s |

- `git diff --stat 4478001 HEAD -- src tests package.json package-lock.json tools/validate/{driver,runner,run-engine,playwright,driver-guard}.mjs vite.config.* index.html public`: empty. `git diff --stat 4478001 HEAD -- tools/`: only browser-jupiter-io, browser-lite, browser-showers, browser-spike02, browser-story-panels, run-demo (none in the engine list; engine scripts import only driver.mjs, playwright.mjs, load-budget.mjs, all unchanged). `git diff --stat HEAD -- src tests tools package.json`: empty (uncommitted work is docs/records only).
- File mtimes: every tracked file in src/, tests/, tools/ and package.json last changed before 09:20:13Z except the six T-112 demo files (latest run-demo.mjs 10:19:24Z), all before the first demo run (10:19:26Z). Nothing changed after any run. The engine run predates commit 4478001 (09:26:08Z) but no engine input changed between 09:20:13Z and that commit.
- Toolchain: same checkout, playwright-core 1.59.1 (package.json), unchanged.

## Gates (fresh, 2026-10-20T10:39:50Z-10:40:23Z)

`npm run typecheck` exit 0; `npm run build` exit 0 (chunk-size warning only); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` exit 0, 79 files, 1143 passed, 1 skipped, including tests/browserDriverGuard.test.ts (4) and tests/syntheticStoryAnchors.test.ts (4). `git diff --check`: one trailing blank line at EOF of docs/BROWSER_CHECKS.md (cosmetic).

## Code Health

`savepoint health check O-034` after the gates: snapshot sha256:13c51697...427bf (created), "does not block clearance". Coverage instance reported stale (optional; collection state, not a finding).

## Coverage matrix

| Criterion | Evidence (independent) | Result |
|-----|-----|-----|
| SC1 one command, <300 s, project playwright-core, no outside path | package.json `check:engine`; playwright.mjs `import(process.env.PLAYWRIGHT_CORE ?? "playwright-core")`; no tools/validate script reads PLAYWRIGHT_CORE directly (only tools/import and tools/archive, out of scope); engine run 275 s | Proven |
| SC2 engine set opens no demo | Read every engine script's addresses: all `?experience=synthetic*`, the scale-menu harness page, or no browser; embedded frames the synthetic URL; orbit-motion loops `["synthetic"]`; no bare default address. Engine logs mention demo names only in public-build file listings (no browser) | Proven |
| SC2 additions made-up, out of public build, unit-tested | syntheticDefinition.ts diff: "mark-1..12", "marker-loop"/"marker-late", sources "Made up ... not a real source"; main.tsx keeps synthetic behind `__PUBLIC_BUILD__`; public-build-assets `checkNoSyntheticExperiences` passed in the engine run; tests/syntheticStoryAnchors.test.ts asserts panels, ids, no real names, anchors (4 tests, pass) | Proven |
| SC3 per-demo command; Jupiter sampled; Perseids trimmed; Apollo speed at known time with negative probe | run-demo.mjs lists; jupiter-io 1361 s to 158 s; Perseids 186 s; spike02 seeks three paused UTC times, compares speed readout with the range readout's change over one simulated minute (8 %), values 1.685/1.633, 0.86/0.85, 1.514/1.483 km/s; times accepted by owner | Proven |
| SC4 every moved/dropped scenario mapped with reason | Four T-111 groups missing (I-047) | Issue |
| SC5 one short rule, reuser note, zero console errors | AGENTS.md diff confined to lines 169+ under "Astraeus Project Rules" (outside the managed block); no run-full.sh, tiers or donor path remain; README "Running the checks" matches package.json, runner behaviour and the 275 s run; all four runs 0 error lines | Proven (owner reading pending) |
| T-110 DW1-6 | loader single place; runners Node, sequential, fresh dir refused if non-empty; run-full.sh deleted | Proven |
| T-111 DW1-6 | as SC2; driver edit `.first()` only; guard passes | Proven |
| T-112 DW1-7 | smoke steps via LITE_ONLY/LITE_PAGES; STORY_ONLY; DW5 amended | Proven |
| T-113 DW1, 3, 4, 5, 6 | rule, note, Design rows rewritten from all three drift notes, times cited | Proven |
| T-113 DW2 map | I-047 | Issue |

External boundary (runner): configured vs actual ports (5479/5480, `--strictPort`); startup waits 60 s then fails the set; build failure throws and stops servers in `finally`; non-zero exit or console-error line fails the set; process groups killed; scratch dir removed. Redirect, retry and secrets: not applicable (local servers, no credentials).

Workflow lock (runSet): mkdir fresh evidence (refuse non-empty) -> scratch dir -> dev server -> public build -> preview -> wait -> steps in order -> finally stop/cleanup -> summary total -> exit code. Failure at any stage is set-fatal and cleanup runs; evidence directory remains for diagnosis. Proven by reading; not exercised this run (no browser runs by owner decision).

## Adversarial notes

- The Apollo negative probe (`!speedMatches(check, implied * 1.5)`) cannot fail once the positive 8 % assertion passes (the ranges cannot overlap), so it proves only that the tolerance is under 50 %. It meets T-112 DW3's letter ("a deliberately wrong expected speed fails"); the real discrimination comes from the independent range-derived value. Observation.
- Speed reads wait 600 ms after a paused seek; a stale read would make the implied speed wrong and fail, not pass falsely.
- Runner portability: `spawn("npx", ...)` without a shell and `process.kill(-pid)` will not work on Windows, though T-110 chose Node "so they also work where bash is absent". Not an acceptance criterion; observation.

## Issues

- I-047 (TEST-03, SC4, T-113 DW2): `docs/BROWSER_CHECKS.md` omits Apollo anchor labels, demo view links, Jupiter orbit motion and demo/phone sky as moved or dropped.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|-----|-----|-----|-----|-----|
| I-047 | High (always true of the file) | Low (documentation; no lost behaviour coverage beyond what T-111 recorded) | Low | Fix now: four lines in the map, no rerun |

## Owner validation still needed

T-113 `owner_validation.required`: the owner reads the AGENTS.md "Browser checks" rule and the README "Running the checks" note. Not a blocker for this Check's technical result.

## Observations (non-blocking)

- Design.md `src/synthetic/syntheticDefinition.ts` row: the T-111 note is appended after the row's closing `|`, a third cell in a two-column table, so a Markdown renderer drops it.
- T-113 Technical Verification still says "The Full Objective Check runs the engine set and the three demo sets once each" and its evidence says the check "reruns the engine set once"; superseded by the owner's no-rerun decision and the new rule.
- T-111 evidence says tests/syntheticStoryAnchors.test.ts has 5 cases; it has 4.
- docs/BROWSER_CHECKS.md ends with a blank line (`git diff --check`).
- Demo summaries print `scene=?` for steps without a `scene` field.

## Code Style Review

- [x] STYLE-01 **One job per file** — loader, runner, set lists split.
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — runner failure paths (non-empty dir, unknown demo, server timeout) have no test; T-110 noted the unknown-demo path untested.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries** — runner fails the set on build/server errors.
- [x] STYLE-07 **One source of truth** — set membership only in run-engine/run-demo; one playwright loader.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data** — made-up panels parsed through `parseStoryPanels`.
- [ ] STYLE-10 **Small diffs** — 145 files / 7,447 lines, mostly committed evidence logs; code changes themselves are moderate.

## Result

NEEDS WORK on one low-materiality documentation gap (I-047). Every other criterion is proven. Remediation: a direct repair of `docs/BROWSER_CHECKS.md` under I-047 (no browser rerun needed, per the new rule), then a re-check; completed Tasks keep their status.
