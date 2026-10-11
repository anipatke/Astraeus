---
id: I-018
title: Committed Spike 01/02 anchor-label evidence was overwritten by a T-031 browser run
type: verification
status: resolved
source:
  kind: check
  check: C-012
  actor: {role: checker, session: o009-check-20261011}
  at: '2026-10-11T04:26:07Z'
tasks: [T-031]
checks: [C-012, C-013]
resolution:
  disposition: accepted
  actor: {role: owner, session: owner-chat-20261011}
  at: '2026-10-11T04:38:20Z'
  reason: Owner accepted the restore after C-013 independently confirmed the Proof Needed; recorded by the agent on the owner's direct instruction.
history:
  - at: '2026-10-11T04:26:07Z'
    actor: {role: checker, session: o009-check-20261011}
    kind: observed
    note: Found by the O-009 Full Objective Check against T-031 Done When 5 and the AGENTS.md Historical evidence preservation rule. The T-031 r2 anchor-label run wrote into the historical directory and the change was committed in bc080c4.
    check: C-012
  - at: '2026-10-11T00:00:00Z'
    actor: {role: executor, session: o009-i018-repair-20261011}
    kind: repair_attempted
    note: 'Restored the three overwritten files with git checkout 601a9ff -- docs/evidence/regression-spike01-02/anchor-labels/ (601a9ff equals ebc40df for that directory). Proof Needed 1: git diff --stat ebc40df -- docs/evidence/regression-spike01-02/ is empty. Proof Needed 2: T-031 Technical Evidence has an appended dated correction for Done When 5 naming the overwrite, the bc080c4 commit and the restore; original text kept. Proof Needed 3: git diff --name-status --diff-filter=MDRTC ebc40df -- docs/evidence is empty, so no existing historical evidence file differs; only new o008/o009 run directories were added. No code changed; gates not re-run. Not resolved: verification belongs to savepoint-check.'
  - at: '2026-10-11T04:31:35Z'
    actor: {role: checker, session: o009-recheck-20261011}
    kind: rechecked
    note: 'Repair proof verified independently: git diff --stat ebc40df -- docs/evidence/regression-spike01-02/ is empty; git diff --name-status --diff-filter=MDRTC ebc40df -- docs/evidence is empty; T-031 correction present with the original text kept. Not closed as verified because the verified disposition requires a Check that recorded CLEAR, and C-013 is NEEDS WORK (T-030/DW3 rests on an owner exception). The Issue stays in_progress; its Proof Needed is satisfied. The owner may resolve it as accepted, or a later CLEAR Check can verify it.'
    check: C-013
  - at: '2026-10-11T04:38:20Z'
    actor: {role: owner, session: owner-chat-20261011}
    kind: owner_decision
    note: Owner accepted I-018 (instruction in chat); restored files committed and pushed in 297b4f1. Recorded by the agent on the owner's direct instruction.
---

# I-018: Committed Spike 01/02 anchor-label evidence was overwritten by a T-031 browser run

## Summary

T-031 Done When 5 requires that "any script that writes to a fixed historical path is restored from git or given a distinct output directory", and the AGENTS.md project rule *Historical evidence preservation* requires an explicit owner decision for any replacement of historical evidence. T-031 records criterion 5 as "Met", but three files under `docs/evidence/regression-spike01-02/anchor-labels/` were overwritten by its `r2` anchor-label run, were not restored, and were committed in `bc080c4`. T-029 and T-030 restored the same files after their runs; T-031 did not.

## Evidence

- `git diff --stat ebc40df bc080c4 -- docs/evidence/regression-spike01-02/` changes exactly `anchor-labels/browser-anchor-labels-results.json` (`url` `http://127.0.0.1:5199/` → `http://localhost:5199/`), `labels-on-follow.png` (128,488 → 112,878 bytes) and `labels-on-overview.png` (120,083 → 103,065 bytes). The last commit before that to touch them is `601a9ff`.
- Working-tree modification times: `browser-anchor-labels-results.json` and `docs/evidence/o009-t031-run1/r2-browser-anchor-labels.log` are both `2026-10-11 09:07:05.99 +1100`; the PNGs are 09:07:04–05. The T-029 (08:47), T-030 (08:57) and T-031 first-run (09:04) anchor logs are earlier, and both earlier Tasks record restoring from git. Commit `bc080c4` was made at 09:19:58 +1100.
- The JSON results file and the `r2` log have identical content.
- `tools/validate/browser-anchor-labels.mjs:11` accepts an output directory as its first argument; with no argument it defaults to the historical path. C-012 ran it with `docs/evidence/o009-c012-run1/anchor-labels` and the historical files stayed unchanged (`git status` clean outside the new run directory).
- No test is missing. This is a gap in the evidence-handling workflow, so no regression test applies.

## Proof Needed

`git diff --stat ebc40df -- docs/evidence/regression-spike01-02/` is empty (for example after `git checkout 601a9ff -- docs/evidence/regression-spike01-02/anchor-labels/`), or the owner records an explicit decision to keep the replaced files. T-031's evidence for criterion 5 is corrected to name the overwrite and the restore. No other historical evidence directory differs from its last pre-O-009 commit.
