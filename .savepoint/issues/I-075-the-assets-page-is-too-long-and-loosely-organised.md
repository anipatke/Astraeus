---
id: I-075
title: The assets page is too long and loosely organised
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: o035-owner-look-20261023}
  at: '2026-10-23T06:12:01Z'
tasks: [T-158]
checks: []
guardrail_ids: []
severity: low
resolution:
  disposition: accepted
  actor: {role: owner, session: 00a3b7e2-dcc4-432a-a7e9-b1f995ca1a1f}
  at: '2026-10-23T06:57:37Z'
  reason: 'Owner, 2026-10-23, asked "Which do you want me to do now?", chose "Accept I-075 for me (Recommended)" after the page was merged (c4d067ce) and pushed (b566d578); S/2010 J 6 family follow-up fixed in b3e231e3. Recorded by the agent on direct instruction; not a technical CLEAR.'
history:
  - at: '2026-10-23T06:12:01Z'
    actor: {role: owner, session: o035-owner-look-20261023}
    kind: observed
    note: 'During the O-035 T-158 look on localhost:5490. Owner: "tagged places looks a bit weird as a table", "Feel like that page could be optimised", "assets.html is too long, we need to make it more concuse and organise the information better". Asked whether to fold it into O-035, the owner chose "Log it, do it next (Recommended)".'
  - at: '2026-10-23T06:46:26Z'
    actor: {role: executor, session: i075-repair-lane-20261023}
    kind: repair_attempted
    note: 'Owner: "i want to do the asset clean up before the next push"; "Outline first, then build (Recommended)"; outline approved "Approve as proposed (Recommended)", open questions at their defaults (lists closed, "textured, with tagged places" said once, credits before moons/places). assets.html 1,693 to 606 lines. Order now: sky (the two rows folded into the captions), surface pictures (compact auto-fill grid, same 21 cards and chips), credits (rows unchanged, moved up), How it is made (Where things are, Meteor showers and The science merged: 18 one-line rows under three captions), Moons (summary table, one list of the moons with their own picture, a closed Show all N moons block per planet, families closed, rows are name, size, year only; ids moons-jupiter to moons-pluto kept, a small script opens a block linked by id), Tagged places (summary table of places, categories and in-app status, then one closed Show all places block; per body note kept, places as a comma list of name and type, every data-place and data-places-body attribute kept), Not in the app yet (Ceres and the wish list in one list). Generators changed to match (tools/site/assets-sections.mjs, a new moons-overview block; jupiter-moon-catalogue.mjs, whose page path was stale and now points at astraeus-site). Tests changed: assetsPageCredits, only the two heading slice ends (surface pictures now end at Credits; credits end at How it is made), same checks. Gates: lint, typecheck, build clean; npm test 1530 pass, one showersMeasured timeout under load that passes alone; public build with load-budget (assets.html 617,758 B raw, limit 670,000) and public-build-assets ok. No browser run, no screenshots. Owner to judge on the preview. Note: data/moons/jupiter.json differs from what the Jupiter script regenerates (S/2010 J 6 family); the page follows the old page and the script, the file is untouched.'
  - at: '2026-10-23T06:57:37Z'
    actor: {role: owner, session: 00a3b7e2-dcc4-432a-a7e9-b1f995ca1a1f}
    kind: resolved
    note: 'Accepted by the owner ("Accept I-075 for me (Recommended)"), recorded by the agent on direct instruction. The S/2010 J 6 note above was resolved in b3e231e3: the script and page now follow the data (Pasiphae group).'
---

# I-075: The assets page is too long and loosely organised

## Summary

The public assets page (`packages/astraeus-site/assets.html`, about 1,700 lines, sections built partly by `packages/astraeus-site/tools/site/assets-sections.mjs`) reads as too long. The owner wants it more concise and better organised; the per-moon rows ("textured, with tagged places") read oddly as a table. Not caused by O-035: the page is unchanged by the package move. O-035 promises the site unchanged, so the rewrite is follow-up work for the next Objective.

## Evidence

Owner's words in the history above. The page's content is the same before (commit 35462f39) and after O-035.

## Proof Needed

A shorter, reorganised assets page the owner accepts on the preview; credits and licences still complete (`public-build-assets` and the credit tests pass); no overlap at 375x667 and 1280x720.
