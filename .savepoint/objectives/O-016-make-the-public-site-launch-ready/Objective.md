---
id: O-016
title: Make the public site launch-ready
status: in_progress
depends_on: []
release: G-005
---

# O-016: Make the public site launch-ready

## Outcome

The public build (ASTRAEUS_PUBLIC_BUILD=1) shows real catalogue stars from a shippable source. The front page and README pictures are re-shot from that public build, so they show exactly what visitors see.

## Why

The Yale catalogue is local-only, so the public build has no catalogue stars, and the current site pictures show Yale stars. Owner decisions 2026-10-16: "Use HYG stars" and "Re-shoot with HYG stars". The credited Moon and Earth (I-029) are the other launch blocker, repaired as an Issue.

## Success Conditions

1. The public build draws naked-eye stars from HYG v4.2 (CC BY-SA 4.0, credited on the assets page and in DONOR_PROVENANCE). Local builds may keep Yale as an option. The star positions are checked against the Yale set for shared stars.
2. The front page, assets page and README images come from the public build, with no Yale stars and no CAMS-derived images.
3. The public-build validator rejects any non-shippable asset.

## Architectural Considerations

The star data is an asset with a licence record (PROV-02). The star file ships under its own licence, separate from the MIT code.

## Boundaries

**In scope:** the HYG star asset, the public-build switch, re-shooting the site images, and fixes and wording on the portfolio's Astraeus page (https://anipatke.com/astraeus, `/home/user/code/main-portfolio/components/astraeus/AstraeusBridge.tsx`).

**Out of scope:** deployment, DNS and the merge to main (all owner actions); committing or deploying the portfolio repository (owner); a layout redesign of the portfolio page.

## Planned Decisions

Owner decisions, 2026-10-20 (structured questions in the planning session):

- The portfolio Astraeus page belongs to O-016 ("Should be part of O-16"). Scope is "fixes and wording both": broken links, wrong facts, a plain-words pass; no redesign ("Yes, write it up").
- The Earth & Moon card is removed, since the Earth-Moon experience left the app in O-024 T-093 ("Remove the card"). The portfolio cards match the demos on the app's own front page.
- The five Tasks T-057, T-058, T-060, T-063 and T-064 were closed by the owner on their CLEAR Task Checks ("Close five, plan portfolio"); the Full Objective Check still covers them.
