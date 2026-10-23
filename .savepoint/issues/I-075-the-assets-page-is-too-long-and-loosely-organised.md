---
id: I-075
title: The assets page is too long and loosely organised
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: o035-owner-look-20261023}
  at: '2026-10-23T06:12:01Z'
tasks: [T-158]
checks: []
guardrail_ids: []
severity: low
history:
  - at: '2026-10-23T06:12:01Z'
    actor: {role: owner, session: o035-owner-look-20261023}
    kind: observed
    note: 'During the O-035 T-158 look on localhost:5490. Owner: "tagged places looks a bit weird as a table", "Feel like that page could be optimised", "assets.html is too long, we need to make it more concuse and organise the information better". Asked whether to fold it into O-035, the owner chose "Log it, do it next (Recommended)".'
---

# I-075: The assets page is too long and loosely organised

## Summary

The public assets page (`packages/astraeus-site/assets.html`, about 1,700 lines, sections built partly by `packages/astraeus-site/tools/site/assets-sections.mjs`) reads as too long. The owner wants it more concise and better organised; the per-moon rows ("textured, with tagged places") read oddly as a table. Not caused by O-035: the page is unchanged by the package move. O-035 promises the site unchanged, so the rewrite is follow-up work for the next Objective.

## Evidence

Owner's words in the history above. The page's content is the same before (commit 35462f39) and after O-035.

## Proof Needed

A shorter, reorganised assets page the owner accepts on the preview; credits and licences still complete (`public-build-assets` and the credit tests pass); no overlap at 375x667 and 1280x720.
