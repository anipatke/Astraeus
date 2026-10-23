---
id: C-105
scope: {kind: objective, id: O-035}
result: NEEDS WORK
unmet: [SC2]
checked_by: {role: checker, session: o035-full-recheck-20261023}
executed_session: i076-repair-20261023
checked_at: '2026-10-23T06:37:43Z'
health_snapshot: sha256:a8a03915af0ce76387ccd094643a5694932c5de844594862a33aa8199d5122e7
reviewed:
  base_commit: 7a861c03
  head_commit: 018d3e35
  files: [packages/astraeus-site/tests/packageBoundaries.test.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-demo-planets/src/experiences/planets/planetSystems.ts, tools/check-engine-alone.mjs, .savepoint/Design.md, .savepoint/issues/I-076-the-package-boundary-test-misses-import-meta-glob-including-a-code-glob.md, packages/astraeus-demo-showers/tests/swiftTuttle.test.ts, packages/astraeus-demo-showers/tests/elementsBody.test.ts]
  dependencies: []
issues: []
supersedes: C-104
---

# C-105: O-035 Full Objective Recheck

Short recheck (owner, 2026-10-23: "Fix it, short recheck (Recommended)") of C-104's single finding, I-076, after repair commit `018d3e35` (diff `7a861c03..018d3e35`, clean tree). This session is independent: it did not plan, build, repair, coordinate or mark any O-035 work, and it did not write C-104. Times are `date -u` output.

**Verdict: NEEDS WORK, low materiality, still on I-076 only.** The original reproduction is fixed: the site no longer globs the planets demo's code, and a planted copy of that glob now fails the boundary test. But the repaired test only sees a glob whose fixed prefix names a package folder. A glob with a wildcard at the package-name level (`../../*/src/**`, `../../astraeus-demo-*/src/**`) or a root-absolute one (`/packages/...`) reaches other packages' code unseen. Two such globs are in the repository now, in the showers demo's tests, and they read every package's `src/` (other demos and the site included). So the test header and Design sentence "a glob that crosses into another package's code fails ... three named rules allow a glob" are again more than the test proves. Everything else C-104 proved holds.

## Closure Map Of Prior Issues

| Issue | C-104 | Now |
|---|---|---|
| I-076 boundary test misses import.meta.glob, including a code glob (SC2) | open | **still open**: original reproduction closed; the general rule fails on wildcard-package and root-absolute globs (two live cases) |

## Full Check Progress Checklist

- [x] Establish Scope (C-104 scope lock, frozen; recheck limited to I-076 and the repair diff)
- [x] Freeze The Check Scope (C-104 lock reused unchanged)
- [x] Turn Acceptance Into Invariants (SC2 glob invariant re-run with planted offenders)
- [x] Build The Mandatory Coverage Matrix (C-104 matrix; SC2 row re-run, other rows re-proven by fresh gates)
- [x] Finite External-Boundary Matrix (unchanged; carried forward)
- [x] Workflow And Side-Effect Check Lock (`check-engine-alone.mjs` copy filter re-checked)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (no lanes; nothing to evaluate)
- [x] Perform The Adversarial Pass (on the repair)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

Every blocking probe sits in C-104's frozen cell **SC2 declared entries, Boundary / bypass** ("its regex skips `import.meta.glob`"), which I-076's Proof Needed restates as: the test "fails a glob that crosses into another package's code (`src/`)", proven with made-up offenders, and the header and Design corrected.

| Probe | Claim tested | Frozen cell | Allowed result |
|---|---|---|---|
| R1 old `main.tsx` code glob planted in the real site | repair claim: code glob fails | SC2 bypass | pass / Issue |
| R2 planted globs in the temp-folder packages (P2 to P15 below) | "a glob into another package's code fails" | SC2 bypass | pass / Issue |
| R3 real repository globs the test passes | header and Design: only three named rules allow a glob | SC2 bypass | pass / Issue |
| R4 `PLANET_SYSTEMS` loads every system, Jupiter only in public mode | repair claim: same site | SC4 normal | pass / Issue |
| R5 public build file list against C-104's tree | repair claim: same 99 files | SC4 normal | pass / Issue |
| R6 engine-alone skips git-ignored files | repair claim | SC1 workflow lock | pass / observation |

## Probe Results

How: a throwaway copy of `packageBoundaries.test.ts` (its helpers plus a probe case) under `packages/astraeus-site/tests/`, run once with `npx vitest run` and then deleted; the real-repo plant was a temporary `packages/astraeus-site/src/zzProbeOld.ts`, also deleted. `git status` was clean after each run.

- **R1, passed.** Planted `import.meta.glob("../../astraeus-demo-planets/src/experiences/planets/systems/*.ts")` and `("../../astraeus-demo-apollo11/src/**/*.ts")` in the real site: both reported as "glob into astraeus-demo-…, never code". C-104's reproduction is closed. `main.tsx` has no glob into a demo's `src/` (grep).
- **R2, caught (pass):** `../../../astraeus/**/src/core/*.ts` (P15), a demo's `tests/` globbing another demo's `src/` with `?raw` (P10), `../../astraeus/data/../src/core/*.ts` (P11), `../../astraeus/{data,src}/**` (P9). The builder's own seven made-up offenders also pass in the committed test.
- **R2, not caught (Issue):**
  - P2: site `src/` file, `import.meta.glob("../../*/src/**/*.ts")`: a code import of every package's source. No offence.
  - P3: site `src/` file, `import.meta.glob("../../astraeus-demo-*/src/**/*.ts")`. No offence.
  - P13: a demo's `tests/` file, `import.meta.glob("../../*/src/**/*.{ts,tsx}", { query: "?raw", ... })`. No offence, though the non-wildcard form of the same reach (P10) is an offence.
  - P4: site `src/` file, `import.meta.glob("/packages/astraeus-demo-a/src/things/*.ts")`. No offence: patterns not starting with `.` are skipped (`packageBoundaries.test.ts:86`).
  - Cause: `globOffences` resolves `globBase(pattern)` (the text before the first wildcard) and checks only whether that path is inside a package folder (`packageBoundaries.test.ts:87-89`). A base of `packages/` itself, or a partial name such as `packages/astraeus-demo-`, is inside no package folder, so the glob is skipped.
- **R3, Issue.** The real repository has two globs of the P13 kind, and the boundary test is green: `packages/astraeus-demo-showers/tests/swiftTuttle.test.ts:165` and `packages/astraeus-demo-showers/tests/elementsBody.test.ts:242`, both `import.meta.glob("../../*/src/**/*.{ts,tsx}", { query: "?raw", ... })`. They read the Apollo, planets and site packages' source as well as the engine's. None of the three named rules allows that (TEST-READS-ENGINE-TEXT is engine `src/` only), and the builder's note lists the rule as needed for "three existing test files" without naming these two. Today they are text reads in tests (a name check), so nothing ships through them; the finding is that the guard and its docs claim a rule the guard does not enforce, which is what I-076 is about.
- **R4, passed.** A throwaway probe imported `PLANET_SYSTEMS` by its package name: keys `earth,jupiter,mars,mercury,neptune,pluto,saturn,uranus,venus` equal the `system` of every `data/planets/*.json`, and each loader returns its `<name>System` export. With `ASTRAEUS_PUBLIC_BUILD=1`, the only key is `jupiter` (the public `PLANET_FILES` glob offers only Jupiter, so no other planet can be chosen).
- **R5, passed.** C-104's tree (`7a861c03`) was built in a scratch worktree (removed after) with the same command: 99 files, 26,012,296 B. This tree: 99 files, 26,012,269 B. The file names are identical once content hashes are stripped; every non-JS, non-HTML file is byte-identical (md5); `app.html` differs only in chunk hashes. `public-build-assets` reports `planetSelfProof: true` and no non-Jupiter system matched.
- **R6, passed with an observation.** `.horizons-cache` (2.5 GB, git-ignored) is no longer copied; engine-alone took 13.7 s (C-104: 23.5 s). Observation: `git ls-files ... packages/astraeus` also lists other packages that start with that prefix (`astraeus-demo-showers/data/local/`, `astraeus-site/node_modules/`); harmless, since only the engine folder is copied. If `git` is missing, `spawnSync(...).stdout` is null and the script throws before copying (a dev tool only).

## TEST-READS-ENGINE-TEXT: Honest And Narrow?

Honest in purpose: its three real users (`astraeus-demo-apollo11/tests/timeline.test.ts:135`, `astraeus-site/tests/experiencePlugIn.test.ts:20`, `astraeus-site/tests/experienceDefinition.test.ts:25,39`) all read engine source as `?raw` text for name or genericity rules, and none of them imports it. It is narrow in target (engine `src/` only, from a `tests/` file). Its detection is loose, though, and the next repair should tighten it:

- `?raw` is detected anywhere in the next 600 characters up to the next glob (`packageBoundaries.test.ts:56`). Probe P5: a `tests/` file with `import.meta.glob("../../astraeus/src/core/*.ts", { eager: true })` and the text `?raw` in a following comment is allowed, although it imports engine code.
- `tests/` is matched anywhere in the file's path (`/(^|\/)tests\//`), so `src/anything/tests/x.ts` counts as a test (probe P12).

Both are observations (no live case); the wildcard gap above is the finding.

## Gates (fresh, once each)

| Gate | Time (UTC) | Result |
|---|---|---|
| `git diff --check 7a861c03 018d3e35` | 06:33:38-06:33:39Z | clean |
| `npm run lint` | 06:33:39-06:33:41Z | pass |
| `npm run typecheck` | 06:33:41-06:33:46Z | pass |
| `npm run build` | 06:33:46-06:33:47Z | pass |
| `npm run test:full` | 06:33:51-06:34:54Z | 116 files, 1530 pass, 1 skip; lines 74.89%, branches 70.4%, statements 72.04% |
| `npm run check:engine-alone` | 06:34:54-06:35:08Z | pass in 13.7 s (65 files, 647 pass, 1 skip) |
| `ASTRAEUS_PUBLIC_BUILD=1 npm run build` | 06:35:21-06:35:22Z | pass |
| `load-budget.mjs dist` | 06:35:22-06:35:23Z | every page ok; whole build 99 files, 26,012,269 B |
| `public-build-assets.mjs dist` | 06:35:23-06:35:25Z | ok, 99 checked, Jupiter-only self-proof true |
| C-104 tree public build (scratch worktree) | between 06:35:25Z and 06:36:13Z (not timed separately) | 99 files, same list modulo hashes (R5) |
| `savepoint health check O-035` | 06:36:13-06:36:18Z | snapshot `sha256:a8a03915…`, created; "does not block clearance"; every instance reports no finding |
| `npm run check:browser` | not run | reused, see below |

`public-addresses.mjs` was not re-run: no address, page or `vercel.json` changed in the repair.

### Browser run reused: `docs/evidence/browser-20261023T062251Z`

Owner rule: never twice for one change. The reuse is sound because the repair's only runtime change is how `main.tsx` finds a planet's system loader (by name from the planets package's map, rather than by a path into its `src/`). R4 proves that map in the fast suite through Vite's own glob transform, in both build modes, for every planet the settings name; R5 proves the public build is the same file set with identical non-JS bytes. The browser scripts, driver and runner did not change. The rest of the repair is a test, a dev tool and docs.

## Matrix (re-run rows)

| Row | Result now |
|---|---|
| SC1 engine alone | Proven (fresh engine-alone pass; C-104 probes unaffected by the repair) |
| SC2 declared entries | **Issue I-076 (still open)**: the code glob is gone and the plain-path rule holds, but wildcard-package and root-absolute globs bypass it, two live |
| SC2 engine imports no demo | Proven (fresh boundary test; engine-alone) |
| SC3 demo-owned data and credits | Proven (unchanged by the repair; `public-build-assets` ok) |
| SC4 same site | Proven (R4, R5, load budget) |
| SC5 same commands and deploy | Proven (all root commands ran; deploy command unchanged) |

## Owner Decisions Carried Forward

None is a structured `exception:` or `owner_validation` field, so these are recorded here only.

- **T-156, "Accept broad doorways (Recommended)".** No `package.json` changed in the repair. It applies unchanged. It does not cover the glob reaches.
- **T-157, "Finish it, short (Recommended)".** Credits untouched. Applies.
- **T-158 owner look, "all fine, run the check".** The site is the same (R5: same files, identical non-JS bytes; R4: same loaders). Applies; no renewal needed.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-076: the boundary test skips globs whose package segment is a wildcard, or that start at `/`; two live test globs read every package's source unseen | Low for new code globs; certain for the two live test reads | Low (test-only text reads today; a code glob of this shape would bypass the guard silently) | Low | One targeted fix: resolve a glob against every package folder it can match (expand the package segment, and resolve `/` patterns from the workspace root), and either give the showers name check a named rule or narrow it to engine `src/`; tighten `?raw` to the call's own options. Or the owner accepts the remaining shapes by name, with the header and Design saying which glob shapes are not checked |

This is the method's convergence point: C-104, then this recheck. One more targeted repair and recheck is allowed; after that the owner decides.

## Observations (non-blocking)

- The two TEST-READS-ENGINE-TEXT looseness points above (P5, P12).
- `check-engine-alone.mjs` lists ignored files by prefix and assumes `git` is present (R6).
- C-104's observations stand unchanged (demo-named engine folders, `tests/` paths in docs, relative data paths for O-036, no engine build step).

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
- [x] STYLE-10 **Small diffs**: the repair is 6 files, about 110 lines.

## Owner Validation Still Needed

- Decide I-076: one targeted fix and short recheck, or accept the remaining glob shapes by name from the board (the header and Design must then name them).
- Record T-158's owner acceptance against the current Check.
- A real Vercel deploy at the next release.
