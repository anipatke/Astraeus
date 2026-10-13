---
id: I-024
title: Jupiter has no texture
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: owner-chat-o014-live-look-20261013}
  at: '2026-10-13T08:49:53Z'
history:
  - at: '2026-10-13T08:49:53Z'
    actor: {role: owner, session: owner-chat-o014-live-look-20261013}
    kind: observed
    note: 'Owner, accepting T-047/T-049/T-050 after the live look: "Jupiter has no texture". Recorded by the orchestrator on the owner''s direct words; not a condition on that acceptance.'
---

# I-024: Jupiter has no texture

## Summary

Jupiter is drawn as a correctly flattened spheroid in a flat material colour (`#d4a97a`). This was planned. T-048 Done When 4 left Jupiter untextured because the donor's Jupiter texture has no recorded source or licence (`docs/DONOR_PROVENANCE.md`), and O-014's Boundaries exclude "a Jupiter texture until a source and licence are recorded". On the live look, the owner noted the missing texture. It is visible in Jupiter–Io and, as an orbit only, in Perseids.

## Proof Needed

- A Jupiter map with a recorded source and licence (for example a public-domain NASA/JPL or USGS product, or a CC-licensed map with attribution), or a `localOnly` declaration with a public replacement under PROV-02.
- `src/assets/bodies/jupiter.ts` carries the `TextureRef`; `tests/textureLicence.test.ts` and the public-build validator pass.
- The owner's look at Jupiter–Io finds the texture correctly aligned. Note that Jupiter's bands rotate differentially, so any single prime meridian is approximate, and that is stated in the accuracy record.
