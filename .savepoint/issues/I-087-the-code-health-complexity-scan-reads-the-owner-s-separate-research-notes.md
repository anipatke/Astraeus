---
id: I-087
title: The code health complexity scan reads the owner's separate research notes
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:47:47Z'
severity: low
checks: [C-117]
resolution:
  disposition: verified
  check: C-117
  actor: {role: checker, session: c117-improvements-check-20261024}
  at: '2026-10-24T03:50:00Z'
  reason: Repair proven by C-117 (CLEAR).
history:
  - at: '2026-10-24T02:47:47Z'
    actor: {role: planner, session: improvements-intake-20261024}
    kind: observed
    note: 'Owner, 2026-10-24: "can we add the fixes as issues, and iterate through and fix them with agents" (after "no more demos, here on in only improvements").'
  - at: '2026-10-24T03:10:00Z'
    actor: {role: executor, session: repair-I-087}
    kind: repair_attempted
    note: 'Added docs/research/** and docs/prds/** to .savepoint/health/config.json: lizard -x args plus exclusions (complexity), jscpd --ignore plus exclusions (duplication), and osv-scanner --experimental-exclude plus exclusions (it scans manifests). Design.md Code Health paragraph (T-122 scanner scope) names the exclusion. AGENTS.md Build scanner lines are inside the Savepoint-managed block, left alone. Proof: lizard with the config args to a scratch CSV (6431 rows) has 0 rows from docs/research or docs/prds, top CCN 20 (PathView.ts constructor; horizons-client.mjs headerOf; validate/driver.mjs anonymous); jscpd with the config args to scratch output has 0 mentions. Unverified: official savepoint health snapshot not run (Full-Check only); osv and tests/coverage not run; no before-run baseline taken.'
  - at: '2026-10-24T03:50:00Z'
    actor: {role: checker, session: c117-improvements-check-20261024}
    kind: rechecked
    note: 'C-117 CLEAR: docs/research and docs/prds excluded in lizard, jscpd and osv args and exclusion lists; lizard with the config args (scratch run, not an official snapshot): 0 rows from those folders, top CCN 20 from project code (negative control on the folders alone: CCN 29); Design Code Health paragraph names the exclusion.'
    check: C-117
---

# I-087: The code health complexity scan reads the owner's separate research notes

## Summary

The official health snapshot for O-043 (C-116, sha256:62ebcbda...) reports the highest complexity (29) in untracked Python files under `docs/research/` (owner's other projects' research, never part of Astraeus). The scan's top figure therefore does not describe this project's code. Same note at the O-042 close.

## Evidence

C-116 health section; `.savepoint/health/config.json` complexity exclusions list `node_modules`, `dist`, `.savepoint`, `coverage`, horizons cache and others but not `docs/research` or `docs/prds`.

## Proof Needed

`docs/research` and `docs/prds` are excluded from the complexity and duplication scanners in `.savepoint/health/config.json` (owner asked for this fix on 2026-10-24); a `savepoint health` run is not needed by the repairer, but the checker's snapshot shows the top complexity coming from project code. Design's Code Health paragraph names the new exclusion.
