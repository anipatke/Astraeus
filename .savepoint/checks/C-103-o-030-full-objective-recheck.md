---
id: C-103
scope: {kind: objective, id: O-030}
result: CLEAR
checked_by: {role: checker, session: o030-full-recheck-20261023}
executed_session: o030-coordinator-20261023
checked_at: '2026-10-23T03:26:13Z'
health_snapshot: sha256:850883a2436090e5c77778fac9b94b8b63cdc96a712b20e045cc3be1948cc76e
reviewed:
  base_commit: c4d5853a
  head_commit: 9eadeba9
  files: [src/shell/bootLoader.ts, src/app/sceneFrame.ts, tests/bootLoader.test.ts, .savepoint/issues/I-074-a-switch-made-while-the-loading-cover-is-fading-loses-the-cover.md]
  dependencies: []
issues: []
supersedes: C-102
---

# C-103: O-030 Full Objective Recheck

Short recheck (owner, 2026-10-23: "Fix it, short recheck (Recommended)") of C-102's single finding, I-074, after repair commit `9eadeba9`. This session is independent: it did not plan, build, repair, coordinate or mark any O-030 work. Times are `date -u` output.

**Verdict: CLEAR.** I-074 is repaired and proven; SC3 is now proven. C-102's other results are carried forward unchanged because the repair touches none of their scope.

## Closure Map Of Prior Issues

| Issue | C-102 | Now |
|---|---|---|
| I-074 cover lost on a switch during the fade (SC3) | open | **closed (verified by this Check)** |

## Full Check Progress Checklist

- [x] Establish Scope (C-102 scope lock, frozen; recheck limited to the repair)
- [x] Freeze The Check Scope (C-102 lock reused unchanged)
- [x] Turn Acceptance Into Invariants (SC3 cover invariant re-run)
- [x] Build The Mandatory Coverage Matrix (C-102 matrix; `showBootLoader`/`hideBootLoader` row re-run)
- [x] Finite External-Boundary Matrix (unchanged; carried forward)
- [x] Workflow And Side-Effect Check Lock (steps 2 and 6 re-run)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (lanes not used; not a finding)
- [x] Perform The Adversarial Pass (on the repair)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Diff Since C-102

`git diff --stat c4d5853a..9eadeba9`: 4 files, +50/-10: `src/shell/bootLoader.ts`, `src/app/sceneFrame.ts`, `tests/bootLoader.test.ts` and the I-074 record. No other source, test, tool, browser script, data or Design file changed, so C-102's SC1, SC2, SC4, SC5, T-153 and T-154 results, the external-boundary matrix and the browser run carry forward unchanged. `git diff --check c4d5853a 9eadeba9`: clean.

## Admission Ledger

| Recheck item | Prior claim | Frozen cell (C-102) | Result |
|---|---|---|---|
| Switch during the fade keeps the cover | I-074 repro: hide, 200 ms, show, 2000 ms: cover removed | `showBootLoader`/`hideBootLoader` row, "switch during the fade" | **passed** |
| A later hide still fades and removes it | I-074 Proof Needed | same row, normal | **passed** |
| Stale first-frame hide from an overtaken mount | I-074 adjacent case | same row, "stale first-frame hide (adjacent)" | **passed** |
| Switch after the fade rebuilds the cover | C-102 control case | same row, normal | **passed** |
| Failure cover stays failed | C-102 matrix, `main.tsx` build failure | `main.tsx` mount/remount, build failure | **passed** |
| No `#boot` element: no-op | C-102 boundary | same row, no template | **passed** (existing test "hide once, no loader") |

## Repair Judged

- **Mid-fade removal.** `hideBootLoader` keeps the removal timer in `removal`; `showBootLoader` clears it before reusing the element (`src/shell/bootLoader.ts:42-43`), and the timer clears `removal` when it fires. A show after the timer fired finds no element and rebuilds from the template, as before.
- **Stale first-frame hide.** `showBootLoader` increments `showings`; each scene records `bootShowing()` in `createFrameState` (`src/app/sceneFrame.ts:76`), called from `useRef` in `AstraeusScene.tsx:151` at mount, and its first frame calls `hideBootLoader(state.coverShowing)` (`sceneFrame.ts:197`), which ignores a showing that is no longer the latest. Order traced in `addressNavigation.ts` `run`: `showCover` runs before `rebuild`, and `mount` (new key) happens after, so the new scene records the new showing and the old scene the older one.
- **First page open.** `showings` starts at 0 and the first scene records 0, so its first frame hides the page's own cover (default argument kept for any caller without a showing).
- **StrictMode double mount.** `useRef(createFrameState(...))` evaluates twice in development; nothing calls `showBootLoader` between the two renders, so both read the same showing. The scene mounts synchronously with `App` (`App.tsx:529`, no Suspense), so an old App cannot mount a scene after a later showing.
- **Planets switch.** Same `navigation.open` path through `switcherOf` (`main.tsx`), so the same rules apply; C-102's planets-phone journey is unaffected by the change.
- **Failure.** `hideBootLoader` still returns on `failed`; a failed rebuild leaves the cover failed.

## Probes (this session)

Checker probe (scratch Vitest file created in `tests/`, run, deleted; not committed), fade 3 s via `?loadfade=3`: first-page hide; show at 2.9 s (inside the fade); stale hide from the first scene; 10 s later the cover is still there, `loading`, not removed; a second switch overtakes, the overtaken showing's hide is ignored, the newest showing's hide (twice) fades and removes it exactly once; a further switch rebuilds from the template and hides again. Second case: show, fail, current and stale hides: stays `failed`, never removed. Result: 2 passed. The repair's own tests in `tests/bootLoader.test.ts` (8 tests in the file) pass.

## Gates (fresh, this session)

| Gate | Result | Time (UTC) |
|---|---|---|
| `npm run lint` | pass | 03:23:36-03:23:38 |
| `npm run typecheck` | pass | 03:23:38-03:23:42 |
| `flock /tmp/astraeus-build.lock npm run build` | pass | 03:23:42-03:23:43 |
| `npm run test:full` | pass, 114 files, 1524 passed, 1 skipped (junit 1525 tests, 0 failures); coverage statements 71.95%, lines 74.81% | 03:24:19-03:25:20 |
| Public build (`ASTRAEUS_PUBLIC_BUILD=1`, scratch outDir, under the lock) + `node tools/validate/load-budget.mjs <dist>` | pass, all 7 page sets ok (showers 9,945,384 B of 10,070,000; geminids 12,431,960 B of 12,680,000) | 03:25:23-03:25:25 |
| `savepoint health check O-030` | snapshot created; "Code Health does not block clearance"; all five optional instances no finding | 03:25:28-03:25:32 |
| `npm run check:browser` | **reused, not rerun**: C-102's run `docs/evidence/browser-20261023T031537Z/` (6 steps exit 0, 03:15:36-03:16:47). Reason: owner rule "never run it twice for one change"; the repair changes no browser script, runner, driver or anything the steps read, and its behaviour (fade-window timing) is proven in the fast suite. | n/a |

## Owner Validation

T-154's owner look is recorded in that Task: "all fine, run the check". It is the owner's validation of the switch's look. T-154 has `owner_validation.required: true` and no structured `accepted_check` yet; the owner may record it against this Check.

Prior owner decisions: the Task Check waivers on T-152, T-153 and T-154 and the O-024 dependency drop are unchanged by this repair. No structured `exception` or owner acceptance exists on the scope, so no `carried_forward` entry is needed.

## File Reality

All four changed files exist. The checker's probe file was scratch, created and deleted in this session. The new health snapshot file is the one `savepoint health check` writes.

## Code Health

Snapshot `sha256:850883a2…cc76e`, after the full gate: does not block clearance; supporting evidence only.

## Materiality

No Issues; no materiality actions required.

## Observations (non-blocking, carried from C-102 unless noted)

- T-152 record line 80 trailing space (record text only).
- Load-budget self-tests not extended for `storyPanels`; the public build exercises it.
- Dev-only StrictMode effect order in `useReleaseSharedTextures` (production unaffected).
- Public build ships an unused lazy `no-panels` story chunk (pre-existing).
- New (this recheck): `showings` and `removal` are module state in `bootLoader.ts`, appropriate for one page-wide cover; the repair's unit tests share them across cases, which works because each case reads `bootShowing()` freshly.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — `showBootLoader`'s fade-window branch now has tests; `load-budget.mjs` `addStoryPanels` still has no self-test (carried).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — repair is 3 code/test files, +46/-10.
