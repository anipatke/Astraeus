---
id: I-069
title: The Venus site thumbnail is the old CC BY picture, now labelled public domain
type: defect
status: open
source:
  kind: check
  check: C-096
  actor: {role: checker, session: o039-full-check-20261022}
  at: '2026-10-22T11:19:28Z'
tasks: [T-132]
checks: [C-096]
guardrail_ids: [PROV-02]
severity: medium
history:
  - at: '2026-10-22T11:19:28Z'
    actor: {role: checker, session: o039-full-check-20261022}
    kind: observed
    check: C-096
    note: Found by the O-039 Full Objective Check; listed as an open point in T-132 and T-137.
---

# I-069: The Venus site thumbnail is the old CC BY picture, now labelled public domain

## Summary

T-132 moved the Venus credit from Solar System Scope (CC BY 4.0) to USGS/NASA Magellan (public domain) on the home page shelf (`index.html:297`) and the assets page card (`assets.html:194`), but both still show `site/t-venus-2k.jpg`, which is unchanged since T-057 (commit 9e001ba3, 2026-10-16) and was made from the old Solar System Scope map. The public pages therefore show a CC BY 4.0 picture captioned "Public domain" and "USGS and NASA Magellan radar mosaic", with no Solar System Scope credit. PROV-02 requires every picture to carry its true source and licence, and Success Condition 1 asks for the credits to name Magellan for the Venus map.

## Evidence

`git log -1 -- site/t-venus-2k.jpg` gives 9e001ba3 (T-057). T-132 Technical Evidence, deviation 3, and T-137 Limitations both say the thumbnail was not regenerated. The public build `/tmp/o039-public-o8mS` ships `assets/t-venus-2k-CaKlBPYD.jpg`.

## Proof Needed

`site/t-venus-2k.jpg` is regenerated from `src/assets/textures/venus-2k-balanced.jpg` the same way the other thumbnails were made (or its caption goes back to the Solar System Scope credit until it is), and the owner looks at the shelf and the assets card on the preview.
