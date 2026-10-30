---
id: I-108
title: 'The browser check fails: the probe path''s label is not shown on a phone'
type: verification
status: open
source:
  kind: check
  check: C-124
  actor: {role: checker, session: o046-full-check-20261030}
  at: '2026-10-30T21:33:14Z'
tasks: [T-193]
checks: [C-124]
severity: medium
history:
  - at: '2026-10-30T21:33:14Z'
    actor: {role: checker, session: o046-full-check-20261030}
    kind: observed
    check: C-124
    note: 'Found by the one npm run check:browser of the O-046 Full Objective Check (run docs/evidence/browser-20261030T212928Z).'
---

# I-108: The browser check fails: the probe path's label is not shown on a phone

## Summary

`npm run check:browser` fails in the O-046 Full Objective Check: the `smoke` step's new Sun-centred probe case (`sunPathChecks` in `packages/astraeus-site/tools/validate/browser-smoke.mjs`) fails at phone size with "the probe path's label is not shown". Desktop passes. The other seven steps pass. T-193 Done When asks that the browser case show the path drawn, the line still between two times, and its label visible.

## Evidence

- Run `docs/evidence/browser-20261030T212928Z` (2026-10-30 21:29 to 21:31 UTC, HEAD `0d0fd4ca`): `summary.txt` shows `smoke` exit 1, 0 error lines; `smoke/results.json` has `synthetic-probe` desktop `ok: true` (line box `[0.453, 0.537, 0.466, 0.546]` at both times) and phone `ok: false`, failures `["the probe path's label is not shown"]`. The line checks run before the label check in `sunPathChecks`, so on the phone the path was drawn and did not move; only the label failed.
- The run T-193 cites, `docs/evidence/browser-20261030T211150Z`, passed on both sizes but predates the owner-look fix (`center: "sun"` on the fixture and the `addTrajectory` centre default). In that run the probe was read about Earth and spread across the view (desktop box `[0.214, 0.9, 0.495, 0.76]`); now it is placed correctly, about the Sun, and the whole path covers about 8 percent of the desktop view (`[0.453, 0.537]`). T-193 recorded that the browser scripts were unchanged and did not rerun the check, but the fixture they load had changed.
- Likely cause, not proven here (one browser run per Check): on a 375 px wide phone the inner solar system is a few tens of pixels across, and `SceneLabels` hides a label that overlaps one with a higher priority (`src/app/SceneLabels.ts:76-88`). Path labels have priority 80 and the Sun, Venus, Earth and Mars have 97 to 100 (`src/api/scene.ts:559`, `:642`). So the probe's label loses to the planets' labels. That is the label layout working as designed (T-192 Boundaries: no change to label priority order). The check's view or seek times no longer fit the corrected fixture.
- Unit tests for label reach pass (`tests/publicApiPathLabels.test.ts`). They check `labelMaxDistance` and not overlap, so they do not cover this.

## Proof Needed

- The cause is confirmed, and either the browser case or the fixture's opening view is changed so the label check is meaningful at phone size (for example, check the label where the probe is clear of the planets, or zoom the phone view in). The fix must not quietly drop the phone label check. The label priority order stays as T-192 left it unless the owner decides otherwise.
- One fresh `npm run check:browser` passes all steps, in the re-check.
