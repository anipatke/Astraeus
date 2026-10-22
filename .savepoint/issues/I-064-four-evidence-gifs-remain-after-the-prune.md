---
id: I-064
title: Four evidence GIFs remain after the prune
type: verification
status: resolved
source:
  kind: check
  check: C-094
  actor: {role: checker, session: o037-full-check-20261021}
  at: '2026-10-21T11:10:00Z'
tasks: [T-123]
checks: [C-094, C-095]
resolution:
  disposition: accepted
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  at: '2026-10-22T10:55:00Z'
  reason: 'Owner, 2026-10-22: "yes record it, then close the tidy-up" after C-095 (code repairs proven; browser proof replaced by the owner''s preview look; runner complexity left for O-038). Recorded by the agent on direct instruction; not a technical CLEAR.'
history:
  - at: '2026-10-21T11:10:00Z'
    actor: {role: checker, session: o037-full-check-20261021}
    kind: observed
    check: C-094
    note: Found by the O-037 Full Objective Check.
  - at: '2026-10-22T20:45:00Z'
    actor: {role: executor, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: "T-129: pending. Deletion is owner-run: find docs/evidence -name '*.gif' -delete, then git add -A docs/evidence. The builder did not delete anything."
  - at: '2026-10-22T10:30:00Z'
    actor: {role: checker, session: o037-full-recheck-20261022}
    kind: rechecked
    check: C-095
    note: 'C-095 recheck: the four .gif files under docs/evidence/o016-t063-* are still tracked. Owner-run deletion still pending.'
  - at: '2026-10-22T10:40:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: repair_attempted
    note: 'The owner ran find docs/evidence -name *.gif -delete; the four tracked gifs under o016-t063-* are removed (0 gifs remain), committed by the coordinator.'
  - at: '2026-10-22T10:55:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: owner_decision
    note: 'Resolved as accepted on the owner''s instruction "yes record it, then close the tidy-up".'
---

# I-064: Four evidence GIFs remain after the prune

## Summary

Success Condition 6 and T-123 Done When 2 say every `.png`, `.jpg` and `.gif` under `docs/evidence` is deleted. Four tracked GIFs remain (about 7 MB): `o016-t063-20261016T120425Z/{old,new}/perseids-year.gif`, `o016-t063-20261016T120425Z/rev2/perseids-year-rejected-1800000.gif`, `o016-t063-capture-20261016T161406Z/pictures/readme/perseids-year.gif`. T-123's evidence left them for the owner. The README's picture is `site/readme/perseids-year.gif`, not one of these.

## Evidence

C-094: `find docs/evidence -name '*.png' -o -name '*.jpg' -o -name '*.gif'` = 4, all tracked (`git ls-files`).

## Proof Needed

The four files removed with `git rm`, or the owner's recorded decision to keep them.
