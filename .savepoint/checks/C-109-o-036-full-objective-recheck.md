---
id: C-109
scope: {kind: objective, id: O-036}
result: CLEAR
checked_by: {role: checker, session: o036-short-recheck-20261023b}
executed_session: o036-leftovers-20261023
checked_at: '2026-10-23T08:52:03Z'
reviewed:
  base_commit: 6821479e
  head_commit: 69b8f3a8
  files: [tools/build-packages.mjs, tools/check-packs.mjs, packages/astraeus-site/tests/packagePacks.test.ts, .github/workflows/publish.yml]
  dependencies: []
issues: []
supersedes: C-108
---

# C-109: O-036 Short Full Objective Recheck

This recheck supersedes C-108 (CLEAR). It covers HEAD `69b8f3a8`, which repairs three of C-108's non-blocking observations, against its parent `6821479e` (the merge C-108 cleared at `56eada5d`). The tree was clean. The owner asked on 2026-10-23: "fix it, short recheck". This session is independent: it did not build, repair or coordinate the change. It packed its own tarballs, wrote its own TypeScript consumer and planted its own faults. Times come from `date -u`.

**Verdict: CLEAR.** All three repairs hold. The planet data packages now ship `chunks.d.ts`, and a TypeScript consumer sees `chunkUrls` as `Readonly<Record<string, string>>`, not `any`. The pack check now fails on a missing `?no-inline` or a missing `chunks.d.ts`, and a unit test plants both faults. The workflow's npm guard now fails on a version it cannot read. Nothing C-108 proved has regressed.

## Closure Map Of Prior Findings

C-108 opened no Issues. Its observations are not Issues, so this map is informational.

| C-108 observation | Now | Basis |
|---|---|---|
| 3. `chunks.d.ts` missing from planet data packages (`chunkUrls` is `any`) | **repaired** | All 6 `dist/src/chunks.d.ts` exist. The packed Pluto tarball holds `src/chunks.d.ts` (129 files; Saturn now 5,858). A consumer type-checks it as exact `Readonly<Record<string,string>>` |
| 4. npm guard lets an unreadable version through | **repaired** | Workflow snippet run against 16 inputs, below |
| 5. `?no-inline` guard has no planted test | **repaired** | New unit test plants it; mutating the guard makes that test fail |
| 1, 2, 6 (AGENTS wording, Design note, test timeout) | unchanged | Outside this repair; still non-blocking |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-107's lock, reused through C-108, unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (only the cells the diff reaches re-run; others covered by gates)
- [x] Finite External-Boundary Matrix (unchanged; publish workflow guard re-run)
- [x] Workflow And Side-Effect Check Lock (publish workflow: only the guard step changed)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (none used; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence (not re-run; see Gates)
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| Recheck item | Prior claim | Frozen cell | Allowed result |
|---|---|---|---|
| `chunkUrls` type in a packed data package | C-108 obs. 3 | SC3 compiled ESM + `.d.ts` | blocking if the repair fails |
| `?no-inline` and `chunks.d.ts` guards | C-108 obs. 5, I-078 fast check | SC2 contents and size check | blocking if the repair fails |
| Workflow npm guard | C-108 obs. 4 | SC6 publish | blocking if the repair fails |
| Every other C-108 cell | none | as in C-108 | blocking if regressed |

## Recheck Matrix

| Row | Cell | Result | Evidence (this session) |
|---|---|---|---|
| SC3 | `chunkUrls` type, packed tarball, `skipLibCheck: true` | **Proven** | `npm pack` of `astraeus` and `astraeus-data-pluto` dist, extracted into a scratch app. TypeScript 6.0.3, strict, Bundler resolution. Assertions: not `any`; exact type equality with `Readonly<Record<string,string>>`; `dataSource` assignable to `DataSource`; `Object.values(chunkUrls)[0]` is `string \| undefined`; `@ts-expect-error` on a write (read-only) and on assigning to `number`. rc 0 |
| SC3 | same app, `chunks.d.ts` removed (oracle that the probe can fail) | **Proven discriminating** | rc 2: the value turns `unknown`, and both `@ts-expect-error` lines become unused |
| SC3 | `skipLibCheck: false` | **Proven** | 4 errors, none in `astraeus-data-pluto`: `react` (2), `three` (1) not installed in the scratch app, and `../app/style.css` side-effect import (pre-existing, C-108 obs. 3). The chunk-list error C-108 saw is gone |
| SC3 | `dist/src/chunks.d.ts` equals source | **Proven** | `cmp` with `packages/astraeus-data-pluto/src/chunks.d.ts` |
| SC2 | guard plants on the packed Pluto `chunks.js` (my own script, `checkPacks({build:false})`) | **Proven** | Baseline: no problem. Last URL with the query dropped, `?no-inline=0`, `?no-inline&x`, `?raw`, `?inline`, `.json?no-inline` instead of `.bin`, every query stripped: each fails "lacks ?no-inline". Empty list: "lists no chunk". `chunks.d.ts` removed: "src/chunks.d.ts is missing". Files restored byte-for-byte (`cmp`) |
| SC2 | the new unit test detects a broken guard (mutation) | **Proven** | Deleting the `chunks.d.ts` check, then separately disabling the `?no-inline` check in `tools/check-packs.mjs`: the new test fails both times. Restored with `git checkout`; tree clean |
| SC6 | workflow guard, the step's exact `node -e` text extracted from `publish.yml` | **Proven** | Pass: 11.5.1, 11.10.0, 11.13.0, 12.0.0, 11.6.0-pre.1. Fail "too old": 11.5.0, 11.4.9, 10.9.9, 9.99.99. Fail "cannot read": empty, `abc`, `11`, `11.5`, `v11.6.0`, ` 11.6.0`, `npm warn x`. Live npm 11.13.0 passes. The YAML parses (one job, `publish`) |
| SC4 | example from packed tarballs | **Proven, no regression** | `build:example` passes |
| all | every other C-108 cell | **Proven, no regression** | Gates below. The diff changes no shipped JavaScript: it only adds a `.d.ts` copy to `build-packages.mjs` |

## Adversarial Pass

- The repair adds a file to the package; it changes no runtime code a bundler or browser sees. `chunks.js` is still generated by the same unchanged line.
- The new `?no-inline` regex is stricter than the old one: it needs the query directly after `.bin` and directly before the closing quote, so `?no-inline=0` and `&x` suffixes fail, as do non-`.bin` URLs.
- The guard still does not catch a URL built by string concatenation. The generator never writes that form (C-108 already noted it).
- The npm guard's regex has no end anchor, so `11.6.0-pre.1` passes as 11.6.0. That is correct for trusted publishing.
- If `npm --version` itself fails, the earlier `npm --version` line in the same step already fails the step under GitHub's `bash -e`.

## Gates (fresh, this session, run once each)

| Gate | UTC | Result |
|---|---|---|
| `git diff --check 6821479e 69b8f3a8` | 08:49 | clean |
| `npm run lint` | 08:49:20-08:49:25 | pass |
| `npm run typecheck` | 08:49:25-08:49:29 | pass |
| `npm run build` | 08:49:29-08:49:31 | pass |
| `npm test` (default + junit) | 08:49:35-08:50:09 | pass: 119 files, 1569 passed, 1 skipped (one more than C-108: the new test) |
| `npm run check:pack` | 08:50:09-08:50:21 | pass, 8 packages, every one under its limits |
| `npm run check:engine-alone` | 08:50:21-08:50:38 | pass |
| `npm run build:example` | 08:52:00-08:52:03 | pass |

**Not run, with reasons:**

- `npm run check:browser`. The owner rule is never twice for one change. Reusing `docs/evidence/browser-20261023T084202Z/` (C-108, 7 steps, exit 0) is sound because this diff changes nothing a browser loads. It adds a type declaration that bundlers drop. It adds guard code and a unit test that run only in Node. It changes one workflow step that runs only in CI. The page, the public build and the example bundle are byte-for-byte unaffected.
- `npm run test:full` and `savepoint health check`. C-108 ran both at 08:34-08:41 (snapshot `sha256:15dfbb13…`, "does not block clearance"). Since then the changes are 28 lines in build tooling, a test and CI. No `src` file changed, and coverage counts only `src` and the non-browser tools. I judged a fresh full run unnecessary for a short recheck. The fast suite covers the new test. The owner may ask for a fresh full run if they want the stricter reading of the Full-gate rule.

Nothing was published or pushed. Ports 5490, 5491 and 5496 were not touched. The scratch app, tarballs and plant script are in `/tmp/claude-1000/-home-user-code-Astraeus/00a3b7e2-dcc4-432a-a7e9-b1f995ca1a1f/scratchpad/c109/`.

## File Reality

Every file in the diff exists at HEAD. All six `packages/astraeus-data-*/src/chunks.d.ts` sources exist, and each is copied into its `dist/src/`.

## Owner Decisions

As in C-108, no structured acceptance or exception exists on O-036, so there are no `carried_forward` entries. The Task-check waivers and owner verdicts on T-159 to T-162 cover behaviour this diff does not change.

## Materiality

There are no Issues, so no materiality actions are required.

## Observations (non-blocking)

1. C-108's observations 1 (AGENTS "Moon-to-Charon" wording), 2 (Design.md:236 dated note) and 6 (`pointsLookAhead.test.ts` load timeout; it did not recur in this run) remain as C-108 recorded them.
2. With `skipLibCheck: false`, a consumer still sees `astraeus`'s `../app/style.css` side-effect import as an error. This predates O-036's repairs and is common for packages that ship CSS. The default `skipLibCheck: true` hides it.

## Owner Validation

No owner look is needed: nothing visible changed. O-036 stays ready for the owner to accept and close.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**: the `?no-inline` and missing-`chunks.d.ts` branches now have planted cases. "Lists no chunk" is still proven only by mutation (this Check and C-108).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: unchanged from C-108 (the `loadIndex` copy in six packages; the specifier regex in two tools).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**: 4 files, +28/-4.
