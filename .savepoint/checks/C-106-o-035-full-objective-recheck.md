---
id: C-106
scope: {kind: objective, id: O-035}
result: CLEAR
checked_by: {role: checker, session: o035-full-recheck2-20261023}
executed_session: i076-repair2-20261023
checked_at: '2026-10-23T06:48:37Z'
health_snapshot: sha256:dba5aa9f49f6b609be75b0c2748e211b2d9d8f47510f7ac064a3db1a4ae3b72c
reviewed:
  base_commit: 187a5133
  head_commit: 59c27359
  files: [packages/astraeus-site/tests/packageBoundaries.test.ts, packages/astraeus-demo-showers/tests/swiftTuttle.test.ts, packages/astraeus-demo-showers/tests/elementsBody.test.ts, tools/check-engine-alone.mjs, .savepoint/Design.md, .savepoint/issues/I-076-the-package-boundary-test-misses-import-meta-glob-including-a-code-glob.md]
  dependencies: []
issues: []
supersedes: C-105
---

# C-106: O-035 Full Objective Recheck (second)

Last recheck of I-076 (owner, 2026-10-23: "One more fix, then stop (Recommended)") after the round-2 repair commit `59c27359` (diff `187a5133..59c27359`, tree clean apart from the untracked `.claude/worktrees/` lane, which is not part of this Check). This session is independent: it did not plan, build, repair, coordinate or mark any O-035 work, and it wrote neither C-104 nor C-105. Times are `date -u` output.

**Verdict: CLEAR.** Every glob shape C-105 named is now caught, the two live showers globs are narrowed to engine `src/` and allowed by the named rule, and the `?raw` and `tests/` tightenings hold, all reproduced with my own planted offenders rather than the committed ones. Two further, hand-made bypass shapes still get through (a brace list that holds a `/`, and Vite's `base` option); neither appears anywhere in the repository and both need deliberate construction, so they are recorded as observations under the method's admission test, not as an Issue. The test header and Design sentence are accurate apart from not naming those two shapes (wording residue, below). Everything C-104 and C-105 proved still holds. Convergence limit reached: no further autonomous repair round is proposed.

## Closure Map Of Prior Issues

| Issue | C-105 | Now |
|---|---|---|
| I-076 boundary test misses import.meta.glob (SC2) | open (wildcard-package and root-absolute globs unchecked; two live) | **closed, verified**: C-105's shapes caught, live cases narrowed, header and Design match the checked rule; residue below is observation only |

## Full Check Progress Checklist

- [x] Establish Scope (C-104 scope lock, frozen; recheck limited to I-076 and the round-2 diff)
- [x] Freeze The Check Scope (C-104 lock reused unchanged)
- [x] Turn Acceptance Into Invariants (SC2 glob invariant re-run with independent planted offenders)
- [x] Build The Mandatory Coverage Matrix (C-104 matrix; SC2 row re-run, other rows re-proven by fresh gates)
- [x] Finite External-Boundary Matrix (unchanged; carried forward)
- [x] Workflow And Side-Effect Check Lock (`check-engine-alone.mjs` git listing and failure path re-checked)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (no lanes in scope; nothing to evaluate)
- [x] Perform The Adversarial Pass (on the repair)
- [x] Re-check After Remediation
- [x] Verify File Reality (every file the repair note names exists; diff touches only the six files listed)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

All blocking probes sit in C-104's frozen cell **SC2 declared entries, Boundary / bypass**, as restated by I-076 Proof Needed and C-105's remaining-proof note.

| Probe | Claim tested | Frozen cell | Allowed result |
|---|---|---|---|
| Q1 C-105 shapes re-planted (P2, P3, P4, P5, P9, P11, P12, P13) | C-105 remaining proof | SC2 bypass | pass / Issue |
| Q2 real repository globs | two live showers globs narrowed or rule-allowed; test green | SC2 bypass | pass / Issue |
| Q3 header and Design match the checked rule | I-076 Proof Needed | SC2 bypass | pass / Issue |
| Q4 further glob shapes (brace with `/`, `base`, `caseSensitive`, extglob, `?`, `[..]`, `**/..`, single quotes, template, spaced call, `.js` file, own-package wildcard) | general rule | SC2 bypass | pass / Issue (admission test) |
| Q5 public build unchanged | SC4 same site | SC4 normal | pass / Issue |
| Q6 engine-alone listing and missing-git path | repair claim | SC1 workflow lock | pass / observation |

## Probe Results

How: a throwaway copy of `packageBoundaries.test.ts` helpers plus a probe case (`packages/astraeus-site/tests/zzProbe.test.ts`) building its own scratch `packages/` with `scratchPackages`, run once with `npx vitest run` and deleted; then a throwaway real-repository test (`zzViteProbe.test.ts`) that both ran Vite's own `import.meta.glob` transform and was scanned by the real boundary test, also deleted. `git status` was clean (only the lane folder) after each.

- **Q1, all caught.** `../../*/src/**` (all three other packages), `../../astraeus-demo-*/src/**` (both demos), a demo `tests/` file with `../../*/src/**/*.{ts,tsx}` and `?raw` (the other demo and the site; engine `src/` allowed by TEST-READS-ENGINE-TEXT), `/packages/astraeus-demo-a/src/...`, an eager code glob followed by a `?raw` comment and a `"?raw"` string (caught), `src/x/tests/` with `?raw` (caught), `{data,src}/**` and `data/../src` (caught). Also in the real repository: a planted `/packages/astraeus-demo-planets/src/**` glob in a site test failed "holds across the real packages".
- **Q2, passed.** `swiftTuttle.test.ts:165` and `elementsBody.test.ts:242` now glob `../../astraeus/src/**/*.{ts,tsx}` with `query: "?raw"` from the showers package's top-level `tests/`; the boundary test is green on the real packages. The 46 `import.meta.glob` calls in `packages/` and `tools/` contain no `base:` option, no `caseSensitive`, and no brace list holding a `/`.
- **Q3, passed (with wording residue).** Header lines 9-11 and the Design O-035 "Entry points and the boundary" sentence say the same thing, and it is what `globOffences` does: relative and `/`-rooted patterns are matched against every package (wildcard, partial name, brace list, `**` above a package); three named rules; alias globs and runtime reads not checked. Neither names the two Q4 misses.
- **Q4, caught:** `astraeus-demo-?`, `astraeus-demo-[ab]`, `astraeus-**`, `data/**/../../src`, an array mixing allowed data and a demo `src/`, an options object whose `query: "?raw"` sits in a comment, single quotes, a template literal, `import.meta.glob ( ... )`, a `.js` file, a demo wildcarding over its siblings.
- **Q4, not caught (observations):**
  - **Brace list holding a `/`.** `import.meta.glob("../../{astraeus-demo-planets/src,astraeus-demo-apollo11/src}/**/*.ts", ...)` in a site test: Vite 8.3.5 returned 17 files of the two demos' code; the real boundary test stayed green. Cause: `pathSegments` keeps the brace as one segment, so `segmentMatches("{a/src,b/src}", "astraeus-demo-planets")` is false (`packageBoundaries.test.ts:93-109`). The header's "brace list in the package-name segment" is true only for a brace without `/`.
  - **Vite's `base` option.** `import.meta.glob("./**/*.ts", { base: "../../astraeus-demo-planets/src", ... })`: Vite returned 15 files of the planets demo's code; boundary test green. The pattern is resolved from the file, not from `base`, so it looks local (`packageBoundaries.test.ts:142`).
  - Not real in Vite 8 (Vite matched 0 files, so no bypass): `caseSensitive: false` with an upper-case name, and extglob `@(...)` / `+(...)`.
  - Contrived, not run further: a `?raw` mention inside a string value of the same options object (`note: 'query: "?raw"'`) passes as raw; a `/../`-rooted pattern in the site build, whose Vite root is the site folder, not the repository root the test assumes.
- **Q5, passed.** Public build: 99 files, 26,012,269 B, the same count and bytes as C-105 (which matched C-104's file list modulo hashes). The round-2 diff changes no runtime file (only tests, a dev tool, Design and the Issue).
- **Q6, passed.** `git ls-files ... -- packages/astraeus/` lists only the engine folder; with `PATH` lacking `git`, the script prints "engine alone: cannot list git-ignored files (spawnSync git ENOENT); git is required", exits 1 and leaves no `astraeus-engine-alone-*` folder in `/tmp`. C-105's prefix observation is closed.

### The two narrowed showers tests

- `swiftTuttle.test.ts` "finds the comet's name only in src/core/bodies/ and src/assets/bodies/": its paths and expectation always named engine folders, so narrowing to engine `src/` loses nothing it asserted; grep finds the comet's name in no other package's `src/` today.
- `elementsBody.test.ts` "finds the asteroid's name nowhere in src: it exists only in its settings file": it now scans engine `src/` only. Its title promises "nowhere in src", and the most likely place for the name to leak into code is the showers demo's own `src/`, which is no longer scanned. That is a real narrowing of the test, not of the product: grep finds `phaethon|geminid` in no package's `src/` today. It does not violate an O-035 success condition (the engine half, ARCH-01, is still guarded), so it is an observation. A zero-cost fix is a second glob of the package's own `../src/**` (same package, no boundary crossing).

## Gates (fresh)

| Gate | Time (UTC) | Result |
|---|---|---|
| `git diff --check 187a5133 HEAD` | 06:44:39Z | clean |
| `npm run lint` | 06:44:39-06:44:42Z | pass |
| `npm run typecheck` | 06:44:42-06:44:47Z | pass |
| `npm run build` | 06:44:47-06:44:48Z | pass |
| `npm run test:full` (first) | 06:44:55-06:46:12Z | 4 timeouts at 5000 ms (`pointsLookAhead.test.ts` x3, `showersMeasured.test.ts` DW3(ii)); load average 5.9 from other sessions; neither file is in either repair diff |
| `npm run test:full` (rerun) | 06:46:45-06:47:47Z | 116 files, 1530 pass, 1 skip; statements 72.01%, branches 70.38%, lines 74.86%; fresh `coverage-final.json` and `junit.xml` |
| `npm run check:engine-alone` | 06:46:12-06:46:29Z | pass in 16.7 s |
| `ASTRAEUS_PUBLIC_BUILD=1 npm run build` | 06:47:57-06:47:58Z | pass |
| `load-budget.mjs dist` | 06:47:58-06:47:59Z | every page ok; whole build 99 files, 26,012,269 B |
| `public-build-assets.mjs dist` | 06:47:59-06:48:01Z | ok, 99 checked, Jupiter-only `planetSelfProof: true` |
| `savepoint health check O-035` | 06:48:07-06:48:14Z | snapshot `sha256:dba5aa9f…`, created; "Code Health does not block clearance"; no instance reports a finding |
| `npm run check:browser` | not run | reused, below |

`dist/` was rebuilt in normal mode after the public-build checks. `public-addresses.mjs` was not re-run: no address, page or `vercel.json` changed.

### Browser run reused: `docs/evidence/browser-20261023T062251Z`

Owner rule: never twice for one change. That run (C-104, tree `7a861c03`) passed smoke, the public showers check, both journeys and both file checks. Since then the only runtime changes are round 1's `planetSystems.ts` and `main.tsx` (C-105 R4/R5 proved the same loaders and the same public files); round 2 changes no runtime file, and the public build is byte-count identical to C-105's. Browser scripts, driver and runner are unchanged.

## Matrix (re-run rows)

| Row | Result now |
|---|---|
| SC1 engine alone | Proven (fresh pass; missing-git path fails clearly) |
| SC2 declared entries | Proven (C-105 shapes and live cases closed with independent offenders; two hand-made shapes left as observations) |
| SC2 engine imports no demo | Proven (fresh boundary test; engine-alone) |
| SC3 demo-owned data and credits | Proven (unchanged; `public-build-assets` ok) |
| SC4 same site | Proven (Q5; load budget; reused browser run) |
| SC5 same commands and deploy | Proven (all root commands ran) |

## Owner Decisions Carried Forward

None is a structured `exception:` or `owner_validation` field, so these are recorded here only.

- **T-156, "Accept broad doorways (Recommended)".** No `package.json` changed. Applies unchanged.
- **T-157, "Finish it, short (Recommended)".** Credits untouched. Applies.
- **T-158 owner look, "all fine, run the check".** No runtime file changed in round 2; public build identical in count and bytes. Applies; no renewal needed.

## Materiality

No Issues; no materiality actions required. The observations below are low likelihood (each needs a hand-written unusual glob that no file in the repository uses) and low impact (a reviewer reading the glob sees the reach; nothing ships through them today).

## Observations (non-blocking)

- **Wording residue (owner may choose to fix, a few words):** the test header and Design sentence do not name two shapes the check misses: a brace list containing `/` and the `base` option. Adding them to the "Not checked" list would make the docs exact; teaching `globOffences` to expand `/`-braces and resolve from `base` is the alternative.
- `elementsBody.test.ts` no longer scans the showers demo's own `src/` for the asteroid's name (see above); add `../src/**` to restore that coverage.
- The `?raw` detection accepts the text `query: "?raw"` inside a string in the same options object (contrived).
- The first `test:full` run had four 5 s timeouts under machine load (other sessions active); the rerun passed. These tests are close to the default timeout when the machine is busy.
- C-104's observations stand (demo-named engine folders, `tests/` paths in docs, relative data paths for O-036, no engine build step).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [ ] STYLE-05 **Build only what is needed**: unchanged from C-104 (broad engine exports, under the owner's decision).
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: unchanged from C-104 (credit rows in two places; copied Horizons fixtures).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**: the repair is 6 files, 117 insertions, 27 deletions.

## Owner Validation Still Needed

- Decide whether to add the two unnamed glob shapes to the header and Design "Not checked" list (wording only; does not affect this verdict).
- Record T-158's owner acceptance against the current Check, then close O-035.
- A real Vercel deploy at the next release.
