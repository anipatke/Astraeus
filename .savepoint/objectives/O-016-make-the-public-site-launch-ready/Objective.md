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

**In scope:** the HYG star asset, the public-build switch, and re-shooting the site images.

**Out of scope:** deployment, DNS and the merge to main (all owner actions).
