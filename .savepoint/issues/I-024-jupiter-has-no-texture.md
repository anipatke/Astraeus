---
id: I-024
title: Jupiter has no texture
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: owner-chat-o014-live-look-20261013}
  at: '2026-10-13T08:49:53Z'
history:
  - at: '2026-10-13T08:49:53Z'
    actor: {role: owner, session: owner-chat-o014-live-look-20261013}
    kind: observed
    note: 'Owner, accepting T-047/T-049/T-050 after the live look: "Jupiter has no texture". Recorded by the orchestrator on the owner''s direct words; not a condition on that acceptance.'
  - at: '2026-10-16T12:00:00Z'
    actor: {role: executor, session: i024-jupiter-texture-repair}
    kind: repair_attempted
    note: 'Added src/assets/textures/jupiter-2k.jpg (Solar System Scope 2k_jupiter.jpg, unchanged, 2048x1024); the textures page was re-read 2026-10-16 and still states "Distributed under Attribution 4.0 International license" (CC BY 4.0). src/assets/bodies/jupiter.ts now carries a TextureRef with an AssetLicence (credit "Solar System Scope (solarsystemscope.com/textures), CC BY 4.0, based on NASA imagery"), material colour kept as fallback. Jupiter orientation limitations (src/core/bodies/jupiter.ts) now say its bands rotate at different rates so any prime meridian is approximate and the orientation is a visual stand-in. Recorded in docs/DONOR_PROVENANCE.md. Updated tests/planets.test.ts and tests/textureLicence.test.ts for the textured Jupiter. Results: typecheck clean; vite build ok; full vitest 812 passed, 1 skipped (includes textureLicence and publicBuild); browser-jupiter-io.mjs and browser-earth-moon.mjs ran with zero errors against http://localhost:5199/app.html, evidence in docs/evidence/o011-i024-20261016T095602Z/ (desktop-focus-jupiter.png shows banded texture, desktop-overview-t0.png is Jupiter-Io overview). Unverified: owner look at texture alignment (Proof Needed 3); Io/Jupiter band alignment is by eye only.'
  - at: '2026-10-17T10:00:00Z'
    actor: {role: owner, session: owner-chat-20261017}
    kind: owner_decision
    note: 'Owner accepted the repair in chat ("accept the rest"), 2026-10-17. Recorded by the orchestrator on direct instruction; not a technical CLEAR.'
resolution:
  disposition: accepted
  actor: {role: owner, session: owner-chat-20261017}
  at: '2026-10-17T10:00:00Z'
  reason: Accepted by the owner in chat on 2026-10-17, recorded by the orchestrator on direct instruction.
---

# I-024: Jupiter has no texture

## Summary

Jupiter is drawn as a correctly flattened spheroid in a flat material colour (`#d4a97a`). This was planned. T-048 Done When 4 left Jupiter untextured because the donor's Jupiter texture has no recorded source or licence (`docs/DONOR_PROVENANCE.md`), and O-014's Boundaries exclude "a Jupiter texture until a source and licence are recorded". On the live look, the owner noted the missing texture. It is visible in Jupiter–Io and, as an orbit only, in Perseids.

## Proof Needed

- A Jupiter map with a recorded source and licence (for example a public-domain NASA/JPL or USGS product, or a CC-licensed map with attribution), or a `localOnly` declaration with a public replacement under PROV-02.
- `src/assets/bodies/jupiter.ts` carries the `TextureRef`; `tests/textureLicence.test.ts` and the public-build validator pass.
- The owner's look at Jupiter–Io finds the texture correctly aligned. Note that Jupiter's bands rotate differentially, so any single prime meridian is approximate, and that is stated in the accuracy record.
