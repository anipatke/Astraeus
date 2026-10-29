---
id: I-095
title: Docs and comments still describe the old ESO Milky Way picture
type: drift
status: open
source:
  kind: check
  check: C-122
  actor: {role: checker, session: i026-check-20261029}
  at: '2026-10-29T11:10:00Z'
checks: [C-122]
severity: low
history:
  - at: '2026-10-29T11:10:00Z'
    actor: {role: checker, session: i026-check-20261029}
    kind: observed
    note: 'Found in C-122 (I-026 repair check, commit 44210be5). Non-blocking: no I-026 criterion or guardrail names these lines. Four text-only leftovers from the ESO-to-Gaia swap; see Evidence.'
    check: C-122
  - at: '2026-10-29T11:09:34Z'
    actor: {role: executor, session: i095-release-prep}
    kind: repair_attempted
    note: 'Fixed docs/architecture/demo-contracts.md:28 (now the Kevinmloch Gaia EDR3 render, CC BY-SA 4.0, I-026 resolved in C-122), the pictures.ts:5 example name (milky-way) and the SkyView.ts PICTURE_DIM comment (flat scale 0.04^(1/2.2) = 0.2315 of the stored value; shader unchanged). Design.md line already fixed by the planner. Final grep of eso0932a, milky-way-left and milky-way-right outside historical records finds only the 0.3.0 astraeus-data changelog line saying the names are gone; dated entries in docs/DONOR_PROVENANCE.md, docs/ASTRAEUS_SPIKE_04*.md and docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md left as history. Not resolved; awaiting a Check.'
---

# I-095: Docs and comments still describe the old ESO Milky Way picture

## Summary

The I-026 repair replaced the ESO picture (two halves) with one starless Gaia EDR3 render. The credits were all updated, but a few descriptive lines still describe the old picture or give wrong figures. Nothing a user sees in the app is wrong; these are docs and code comments.

## Evidence

- `docs/architecture/demo-contracts.md:28`: "The one Milky Way picture is ESO eso0932a (CC BY 4.0, owner 2026-10-16)" and "its softness against the stars is I-026, still open". Since 44210be5 the picture is the Kevinmloch Gaia EDR3 render, CC BY-SA 4.0.
- `packages/astraeus/src/assets/pictures.ts:5`: the doc comment gives `milky-way-left` as an example picture name. That name no longer exists (it is `milky-way`).
- `packages/astraeus/src/app/SkyView.ts:11-15` (`PICTURE_DIM` comment) says the decode, scale and encode makes "faint values fall far more than bright ones". With the shader's pure 2.2 power, `pow(pow(c, 2.2) * 0.04, 1/2.2)` is exactly `c * 0.04^(1/2.2)` = `c * 0.2315`, a uniform scale of the stored value. The look the owner approved is unaffected; only the explanation is wrong.
- `.savepoint/Design.md:23`: astraeus-data "about 38.6 MB packed". `npm run check:pack` on 44210be5 reports 35.46 MB.

## Proof Needed

- The four lines describe the shipped picture and its real behaviour (or the comment states the uniform scale). Design.md goes through `savepoint-design`, not a direct edit.
- `git grep -n -E "eso0932|milky-way-left|milky-way-right"` outside historical records (`.savepoint/` history, `docs/evidence/`, dated spike and provenance entries) finds nothing current.
