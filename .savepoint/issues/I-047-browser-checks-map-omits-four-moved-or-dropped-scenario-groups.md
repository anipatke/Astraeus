---
id: I-047
title: The browser-check map omits four moved or dropped scenario groups (Apollo anchor labels, demo view links, Jupiter orbit motion, demo and phone sky)
type: verification
status: resolved
source:
  kind: check
  check: C-089
  actor: {role: checker, session: o034-full-check-20261020}
  at: '2026-10-20T10:42:02Z'
tasks: [T-113, T-111]
checks: [C-089, C-090]
resolution:
  disposition: verified
  check: C-090
  actor: {role: checker, session: o034-recheck-20261020}
  at: '2026-10-20T10:45:47Z'
  reason: 'docs/BROWSER_CHECKS.md now names the four groups and the kept Apollo shell cases; each claim checked against HEAD and df577a8 scripts; C-090 CLEAR.'
guardrail_ids: [TEST-03]
severity: low
history:
  - at: '2026-10-20T10:42:02Z'
    actor: {role: checker, session: o034-full-check-20261020}
    kind: observed
    note: 'Found by the O-034 Full Objective Check C-089 at HEAD f87da4c plus the uncommitted T-113 files.'
    check: C-089
  - at: '2026-10-20T10:45:47Z'
    actor: {role: checker, session: o034-recheck-20261020}
    kind: rechecked
    note: 'C-090 CLEAR. Repair by the coordinator (documentation only) verified against scripts at HEAD and df577a8. Closed as verified.'
    check: C-090
---

# I-047: The browser-check map omits four moved or dropped scenario groups

## Summary

O-034 Success Condition 4 says every kept or moved scenario is mapped in `docs/BROWSER_CHECKS.md` and every dropped scenario is named there with its reason; T-113 Done When 2 asks the map to record "the moves recorded by the earlier steps"; the project rule "Browser regression maintenance" asks each prior scenario to be mapped. T-111's evidence records four scenario groups that left a demo, and the rewritten map names none of them.

## Evidence

T-111 Technical Evidence (scenario map) against `docs/BROWSER_CHECKS.md` (uncommitted T-113 version, "Dropped, with reasons", lines 43-55):

1. `browser-anchor-labels`: "desktop and phone, 40 Apollo anchors -> same script on ?experience=synthetic, 12 anchors". At df577a8 the script opened the default address (Apollo, `git show df577a8:tools/validate/browser-anchor-labels.mjs` line 26). The map's engine row says "twelve labelled anchors"; Apollo's anchor labels are not named as moved or dropped, and no Apollo-set script asserts them (`browser-apollo-shell.mjs` only checks the toggle is visible, line 191).
2. `browser-view-link`: "perseids and default -> synthetic" (df577a8 line 31: `[["perseids", "?experience=showers"], ["default", ""]]`). Not named.
3. `browser-orbit-motion`: "jupiter-io and synthetic -> synthetic only (the Jupiter run is the same arc code)". A dropped Jupiter-Io run; not named.
4. `browser-sky`: "apollo + perseids (sampled: apollo desktop and mobile) -> synthetic desktop only" (df577a8 lines 33-35), then moved to `on-request/`. The map says only "moved here 2026-10-20"; the Apollo/Perseids runs and the phone-size pass are not named as dropped.

The first "Dropped" bullet covers phone, controls, embedded and tap-focus runs on the demos only.

Minor, same file: the bullet "Apollo-only shell cases not on the made-up scene: 30 events, Unavailable-at-start, Observed badge, mission readout stability, UTC field" sits under "Dropped" although `browser-apollo-shell.mjs` still asserts them (lines 44, 123, 190); say they are kept there.

## Expected

Each of the four groups named in the map as moved (to which script and scene) or dropped (with the reason T-111 gave).

## Actual

Not named; a reader of the map cannot tell that Apollo anchors, demo view links, Jupiter orbit motion and demo/phone sky are no longer checked on a demo.

## Repair

Documentation only: add the four lines (and fix the Apollo-shell bullet) in `docs/BROWSER_CHECKS.md`. No script or browser run needed.
