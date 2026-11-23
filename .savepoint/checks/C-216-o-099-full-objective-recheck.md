---
id: C-216
scope: {kind: objective, id: O-099}
result: CLEAR
checked_by: {role: checker, session: check-o099-20261123}
executed_session: orchestrate-o099-20261123 (T-444..T-446 builders, coordinator)
checked_at: '2026-11-23T09:09:31Z'
health_snapshot: sha256:a18c85639177ffa5144da7cf2400dd13e42b938573dd3605e8746ee21ba38724
reviewed:
  base_commit: e33334e4
  head_commit: 6169ef93
  files: [packages/astraeus/CHANGELOG.md, packages/astraeus/src/api/scene.ts]
  dependencies: []
issues: []
supersedes: C-215
---

# C-216: O-099 Full Objective recheck

Same checker session as C-215, which is still independent of the builders and the coordinator. This recheck keeps C-215's scope lock. Since C-215 the only change is `6169ef93`: wording in the CHANGELOG 0.10.1 entry and in the `AddBodyOptions.orbit` doc comment in `scene.ts`. That commit also adds the C-215 record and its evidence.

**Result: CLEAR.** C-215's one unmet item (`browser-gate-synthetic-journey`) now passes. Every other result in C-215 is reused: the code and tests are unchanged, the edit touches comments and CHANGELOG text only, and the gates were rerun on it anyway (below).

## Closure map

| C-215 item | Status |
|---|---|
| `browser-gate-synthetic-journey` (unverified: host network change) | **Closed.** `npm run check:browser -- --step synthetic-journey` was run once, 09:07:16Z-09:08:26Z: exit 0, 66 s (limit 115 s), 0 error lines, desktop and phone. Evidence `docs/evidence/browser-steps-20261123T090716Z/` |
| Issues | none were opened in C-215 |

## Remediation wording (the C-215 Uranus/Neptune observation)

Checked against a probe: a temporary test, since removed, that played Uranus and Neptune ±100 y from 2026-01-01 in quarter-year steps.

- **Correct:** the line can run off Uranus and Neptune in the years between re-fits, and "their card says so". Both the CHANGELOG and the doc comment now carve the two planets out of "the line runs through the body".
- **Imprecise:** "re-fitted only after about half a turn". In fact the re-fit comes when the display time leaves the middle half of the drawn turn, which is about a quarter turn from the turn's centre. Probe results:
  - Uranus re-fits at -22.25 y.
  - Neptune re-fits at -20.25 y, because its opening turn spans -61.4..+103.9 y.
  - Neither re-fits going forward from 2026, because a re-fit needs the planet series, which ends in 2045.
  
  The known-limitations card in `sunOrbit.ts` states the rule exactly, and SC7 is met by that card. This is therefore an observation, not an Issue. Suggested wording: "re-fitted only when the display time moves about a quarter turn on, and only while the planet series (1950-2045) covers it".

## Gates on 6169ef93 (fresh)

| Gate | Result | Time |
|---|---|---|
| `npm run lint` | exit 0 | 7 s |
| `npm run typecheck` | exit 0 | 7 s |
| `npm run build` | exit 0 | 3 s |
| `npm test` (junit) | 340 files, 5518 passed, 2 skipped | 37 s |
| `git diff --check e33334e4 HEAD` | clean | <1 s |

The health snapshot is reused from C-215 (`savepoint health check` ran after C-215's full gate). The only change since is comments and text, which cannot change any health instance.

## Owner decisions

All are assessed as still applying, because their scope has not changed since C-215; the only edits are wording:

- the +0.21 ms/frame acceptance (T-446 Coordinator Completion);
- `orbit-lines` as a full-tier step;
- the three `check_waiver`s;
- the owner's "looks good" (T-445 and T-446 Owner Validation).

None of these is a structured `exception` or acceptance record, so there is no `carried_forward` list to append to.

**Closure:** CLEAR lets the owner accept the outcome. T-445 and T-446 still need `owner_validation: {required: true, accepted_check: C-216, accepted_by: {role: owner, ...}}` filled from the recorded owner look. That is the owner's or coordinator's record to write, not the checker's.

## Observations (non-blocking)

- The re-fit wording above.
- Neptune's opening turn is not centred on the display time (-61.4..+103.9 y). Its first re-fit is therefore earlier going back than going forward. The drawn ellipse is closed, so the line looks the same either way.
- C-215's other observations stand.

## Code Style Review

Unchanged from C-215: STYLE-01..09 ticked; STYLE-10 unticked because `PathView.ts` grew by 261 lines.
