---
id: C-013
scope: {kind: objective, id: O-009}
result: NEEDS WORK
checked_by: {role: checker, session: o009-recheck-20261011}
executed_session: o009-t027-t031-executor-sessions-20261011
checked_at: '2026-10-11T04:33:00Z'
health_snapshot: sha256:ae44a6473f921244fb95ea8d6b6d92f5f640c5d8748c109bb2192934e52399e5
reviewed:
  base_commit: ebc40df
  head_commit: bc080c4
  files:
    - docs/evidence/regression-spike01-02/anchor-labels/
    - .savepoint/objectives/O-009-provide-state-for-groups-of-objects/tasks/T-030-make-a-group-s-dots-glide-instead-of-stepping.md
    - .savepoint/objectives/O-009-provide-state-for-groups-of-objects/tasks/T-031-show-a-frame-rate-counter-in-developer-mode.md
    - .savepoint/issues/I-018-spike-01-02-anchor-label-evidence-overwritten-by-t-031.md
  dependencies: []
issues: []
unmet: [T-030/DW3]
supersedes: C-012
---

# C-013: O-009 Full Objective Re-check

NEEDS WORK, but only because one requirement rests on an owner exception. C-012 found two points. I-018 (overwritten Spike 01/02 evidence) is repaired and proven. T-030 Done When 3 (the "before" pacing figure) is still unmet in fact and is now waived by a structured owner `exception`. Under the Closure Rules a requirement resting on an exception keeps the Check at `NEEDS WORK`. This Check is not CLEAR and is not current clearance. O-009 is ready to close by exception once the owner validations below are recorded.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-012 lock reused unchanged)
- [x] Turn Acceptance Into Invariants (C-012 table reused; only changed rows re-assessed)
- [x] Build The Mandatory Coverage Matrix (original cells re-checked; see below)
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence (reused; see Gates)
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope and independence

Fresh checker session; it built and repaired none of T-027 to T-031 or the I-018 restore. Main checkout (not a lane), branch `spike-04`, HEAD `bc080c4`. The scope lock is C-012's frozen lock, unchanged; no axis was added. All five owned Tasks are owner-`done`. No Task, Objective, router, Design or implementation file was edited by this run. The only records written are this Check, an appended `carried_forward` entry on T-030's exception, and an appended `rechecked` history entry on I-018.

## Closure map of prior Issues

| Prior item | Status | Basis |
|---|---|---|
| I-018 (T-031 DW5, Historical evidence preservation) | **Closed in fact; not marked `verified`** (see Issue disposition) | Proof Needed 1–3 all verified below |
| T-030 DW3 "before" pacing (unverified in C-012, `unmet`) | **Still unmet; covered by owner exception** | `exception.requirements: [T-030/DW3]`, check C-012 |
| T-031 DW5 (unmet in C-012) | **Met** after repair | Restore plus correction; see ledger row 1 |

## Admission ledger

| # | Re-check item | Prior claim or Issue | Exact frozen cell | Allowed result | Result |
|---|---|---|---|---|---|
| 1 | Restore of the three anchor-label files | I-018 Proof Needed 1; T-031 DW5 "restored from git or distinct directory" | C-012 "Evidence handling / Fixed-path scripts" and T-031 DW5 row | Blocking if historical path still differs | `git diff --stat ebc40df -- docs/evidence/regression-spike01-02/` empty. Pass |
| 2 | No other historical evidence differs | I-018 Proof Needed 3 | Same cell | Blocking if any existing file differs | `git diff --name-status --diff-filter=MDRTC ebc40df -- docs/evidence` empty. Pass |
| 3 | T-031 evidence corrected | I-018 Proof Needed 2 | T-031 DW5 row | Blocking if absent or original rewritten | Dated Correction paragraph appended under Technical Evidence; the "Met" text is unchanged (`git diff HEAD` shows two added lines, no removed lines). Pass |
| 4 | No code changed by the repair | Executor claim "No code changed" | All code cells (SC1–SC6, T-027–T-031 rows) | Blocking only if source, test, tool, dependency or gate definition changed | `git status --short` lists only `.savepoint/` records and `docs/evidence/` files. `git diff --stat HEAD -- src tests tools package.json package-lock.json` empty. Pass |
| 5 | T-030 DW3 exception | T-030 front matter `exception` | C-012 row "T-030 DW3" | Carried forward if scope unchanged | `applies: true`; see Carried-forward assessment |
| 6 | Gate reuse | C-012 gates | C-012 Gates section | Reuse only if inputs proven unchanged | Reuse proven; see Gates |

No probe lacked an exact frozen cell, so none was demoted to an observation.

## Re-check of original matrix cells

Because no code, test, tool or dependency changed, the C-012 independent harness results for every code cell (`createOrbitGroup`, `fillPositionsKm`, `stateAt`, Moon centre, `PointsView`, centre composition, plug-in contract, scene/browser, `FrameStats`) are unaffected and stand as recorded in C-012: all Proven, with the unchanged observations. The only changed cell is "Evidence handling", re-checked above: now Pass.

## Gates and Code Health: reuse under the metadata-only rule

The C-012 full gate is reused; it was not re-run. Basis for reuse:

- **Original run:** `npm run typecheck`, `npm run build`, `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`. Started `2026-10-11T04:18:45Z` (`docs/evidence/o009-c012-run1/started.txt`; vitest start 15:18:46 +1100). Toolchain: Node v24.16.0, Vitest 5.0.3, Vite 8.3.2. Result: all exit 0, 16 files, 253 tests passed (`docs/evidence/o009-c012-run1/gates.log`). The six browser scripts (`browser-shell`, `browser-spike03`, `browser-spike02`, `browser-synthetic`, `browser-synthetic-ring`, `browser-anchor-labels`) each logged `"errors": []`, written only under `docs/evidence/o009-c012-run1/`.
- **Code, tests, fixtures, tools, dependencies and gate definitions unchanged since that run:**
  - `git diff --stat HEAD -- src tests tools package.json package-lock.json` is empty, and `git ls-files -m -o --exclude-standard` outside `docs/` and `.savepoint/` is empty. The tree equals HEAD `bc080c4` for everything the gates read.
  - `find src tests tools package.json package-lock.json tsconfig.json vite.config.ts .savepoint/config.yml index.html -newer docs/evidence/o009-c012-run1/started.txt` returns nothing.
  - `node_modules/.package-lock.json` last changed 07:53 +1100, before the gate run (15:18 +1100). `.savepoint/config.yml` (`quality_gates`) last changed 2026-10-10 17:40.
  - Fixtures and datasets read by tests live under `data/` and `tests/`; `git status` shows no change there.
- **What did change since the gate run:** three files under `docs/evidence/regression-spike01-02/anchor-labels/` (restored to their `ebc40df` bytes) and `.savepoint/` records. These are evidence and metadata, not gate inputs. (The `browser-anchor-labels` script writes only to a directory passed as an argument and was not rerun, so the restore does not interact with it.)
- **Code Health:** `savepoint health check O-009 .` was **not re-run**, because the gate was not run fresh. The C-012 official snapshot `ae44a6473f92…` (verdict "does not block clearance") is reused for the same reason: the code under measurement is identical.
- `git diff --check` was not re-run for the same reason; C-012 ran it on `ebc40df..bc080c4` for `src tests tools`, which are unchanged.
- No browser script was run in this session, so no `docs/evidence/o009-c013-run1/` directory was created.

## Carried-forward assessment of owner decisions

One owner decision exists on the Objective: the structured `exception` on T-030 for `T-030/DW3` (`check: C-012`, recorded `2026-10-11T04:40:00Z`).

- **Scope compared:** the exception waives only the "before" headless frame-pacing figure. Since its recording, no source, test, tool, dependency or gate definition changed. The only changes are the I-018 evidence restore and `.savepoint/` records, so none touches the T-030 behavior, the requirement T-030/DW3 or its scope.
- **Outcome:** `applies: true`. I appended a `carried_forward` entry (check C-013) under the exception in T-030, append-only. The owner is not asked to renew it.
- **Coverage of `unmet`:** this Check lists `unmet: [T-030/DW3]`, and the exception's `requirements` cover it. T-031/DW5, listed unmet in C-012, is now met. No uncovered requirement ID remains.
- **Effect:** the exception grants completion eligibility only. It does not make T-030 DW3 proven, and the result stays `NEEDS WORK`.
- **Other decisions:** there are no `owner_validation` acceptances to carry. T-029, T-030 and T-031 each have `accepted_check: ""`.

## Issue disposition

- **I-018:** all three Proof Needed items are verified. I did not close it as `verified`. The Closure Rules and `issue-capture.md` define `verified` as proven by a Check that recorded `CLEAR`, and this Check is `NEEDS WORK` because T-030/DW3 rests on an exception. I appended a `rechecked` history entry naming C-013. It stays `in_progress` with its repair proven. Either the owner resolves it as `accepted` from the board, or a later `CLEAR` Check verifies it. Because the repair is proven, it is not a material open blocker on its merits, but under the Objective-closure rule it still needs resolution (the owner's `accepted` resolution is sufficient) before O-009 closes.
- **New Issues:** none opened by this run (`issues: []`).

## Materiality

No Issue remains open as a defect. The one residual item is the exception-backed T-030/DW3 gap.

| Item | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| T-030 DW3 "before" pacing absent | Certain | Low: cost figures, interval choice and the owner's "looks smooth" cover the purpose | Low | Accept via the existing owner exception (already recorded) |
| I-018 resolution status | Certain | None: repair proven | Low | Owner resolves as `accepted`, or a later CLEAR Check verifies it |

## Observations (non-blocking)

All C-012 observations stand unchanged (reversed/aliased `bounds`; "shower" not scanned in app-file name check; stale Design line 92 "owner's look … pending" now contradicted by T-031's "looks smooth"; Moon-centred groups fail late; stale hold point after a scale switch; the ~14 ms slide hitch; camera reach for O-011). New:

- The T-030 exception's `recorded_at` (`2026-10-11T04:40:00Z`) is later than this machine's clock at the time of this Check (about `04:31Z`), so the timestamp looks forward-dated by the recorder. It does not change applicability; the owner may want to confirm it.
- The working tree still holds the I-018 restore uncommitted. HEAD `bc080c4` carries the overwritten versions, so the restore must be committed for the repository state to match this Check. The project rule asks the owner to commit at Objective close.
- The T-031 correction itself says criterion 5 "stays subject to the Check's judgement"; this Check judges it met.

## Owner validation still needed

Not recorded by this run and not inferable from it:

- **T-029:** `owner_validation.accepted_check` is empty. SC5 asks for a look "at both scales"; the recorded judgement does not say which scales were seen.
- **T-030:** acceptance of the smoothed motion. T-030's own evidence still reads as pending; the owner's "looks smooth" is recorded under T-031.
- **T-031:** acceptance together with the numbers seen on the owner's machine (DW7).

Each Task needs `owner_validation.accepted_check` set by the owner (against C-012 or C-013).

## Code Style Review

Unchanged from C-012; no code changed.

- [x] STYLE-01 **One job per file**
- [ ] STYLE-02 **One job per function** — `EarthMoonScene.tsx` frame callback also syncs groups, feeds frame stats and frames groups; advisory.
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [ ] STYLE-06 **Handle errors at boundaries** — `orbitGroup.ts:218` takes `bounds` unvalidated and by reference.
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — O-008 and O-009 landed in one 249-file commit (`bc080c4`).

Style does not change the verdict.

## Handoff and closure eligibility

- **Result:** `NEEDS WORK` (`unmet: [T-030/DW3]`, covered by the owner exception). Not `CLEAR`; not current clearance.
- **O-009 closure:** eligible to close **by exception only**, not as CLEAR. Before closing, the owner must:
  1. Record `owner_validation` acceptance on T-029, T-030 and T-031.
  2. Resolve I-018 (as `accepted`; it cannot be `verified` by a non-CLEAR Check).
  3. Commit the restored evidence and these records so the tree has a diff baseline.
- **Task status:** every Task keeps `done`; none retreats.
- **No further remediation round is required** by this Check. If the owner wants O-009 closed as a true CLEAR instead, the only route is option (a) from C-012 (reconstruct and measure the "before" pacing in a fresh directory), then a new Check.
