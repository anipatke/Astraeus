---
id: I-087
title: The code health complexity scan reads the owner's separate research notes
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:47:47Z'
severity: low
history:
  - at: '2026-10-24T02:47:47Z'
    actor: {role: planner, session: improvements-intake-20261024}
    kind: observed
    note: 'Owner, 2026-10-24: "can we add the fixes as issues, and iterate through and fix them with agents" (after "no more demos, here on in only improvements").'
---

# I-087: The code health complexity scan reads the owner's separate research notes

## Summary

The official health snapshot for O-043 (C-116, sha256:62ebcbda...) reports the highest complexity (29) in untracked Python files under `docs/research/` (owner's other projects' research, never part of Astraeus). The scan's top figure therefore does not describe this project's code. Same note at the O-042 close.

## Evidence

C-116 health section; `.savepoint/health/config.json` complexity exclusions list `node_modules`, `dist`, `.savepoint`, `coverage`, horizons cache and others but not `docs/research` or `docs/prds`.

## Proof Needed

`docs/research` and `docs/prds` are excluded from the complexity and duplication scanners in `.savepoint/health/config.json` (owner asked for this fix on 2026-10-24); a `savepoint health` run is not needed by the repairer, but the checker's snapshot shows the top complexity coming from project code. Design's Code Health paragraph names the new exclusion.
