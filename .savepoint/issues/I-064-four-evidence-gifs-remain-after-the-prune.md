---
id: I-064
title: Four evidence GIFs remain after the prune
type: verification
status: open
source:
  kind: check
  check: C-094
  actor: {role: checker, session: o037-full-check-20261021}
  at: '2026-10-21T11:10:00Z'
tasks: [T-123]
checks: [C-094]
history:
  - at: '2026-10-21T11:10:00Z'
    actor: {role: checker, session: o037-full-check-20261021}
    kind: observed
    check: C-094
    note: Found by the O-037 Full Objective Check.
---

# I-064: Four evidence GIFs remain after the prune

## Summary

Success Condition 6 and T-123 Done When 2 say every `.png`, `.jpg` and `.gif` under `docs/evidence` is deleted. Four tracked GIFs remain (about 7 MB): `o016-t063-20261016T120425Z/{old,new}/perseids-year.gif`, `o016-t063-20261016T120425Z/rev2/perseids-year-rejected-1800000.gif`, `o016-t063-capture-20261016T161406Z/pictures/readme/perseids-year.gif`. T-123's evidence left them for the owner. The README's picture is `site/readme/perseids-year.gif`, not one of these.

## Evidence

C-094: `find docs/evidence -name '*.png' -o -name '*.jpg' -o -name '*.gif'` = 4, all tracked (`git ls-files`).

## Proof Needed

The four files removed with `git rm`, or the owner's recorded decision to keep them.
