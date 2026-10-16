---
id: I-029
title: Replace the Earth and Moon pictures with sourced NASA maps
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: owner-chat-o011-pitch-page-20261016}
  at: '2026-10-16T20:00:00Z'
tasks: []
history:
  - at: '2026-10-16T20:00:00Z'
    actor: {role: owner, session: owner-chat-o011-pitch-page-20261016}
    kind: observed
    note: 'While building the pitch page credits, the orchestrator noted the donor never recorded the Earth or Moon texture source. Owner asked "What we took from the other project is fully credited isn''t it", was told these two cannot be, and directed: "Add it". Recorded by the orchestrator on the owner''s direct words; outside O-011 scope.'
  - at: '2026-10-16T21:00:00Z'
    actor: {role: owner, session: owner-chat-o011-pitch-page-20261016}
    kind: observed
    note: 'Owner: "lets ensure we get a credited moon source before we go live too if not already on the to-do list". This Issue is a launch blocker for the public site (astraeus.curiouscode.ai): the Moon and Earth must carry exact credits before the site goes live.'
  - at: '2026-10-16T21:45:00Z'
    actor: {role: executor, session: builder-i029-20261016}
    kind: repair_attempted
    note: >-
      Replaced both maps. Moon: NASA SVS 4720 CGI Moon Kit, lroc_color_poles_2k.tif (2048x1024) from https://svs.gsfc.nasa.gov/4720, accessed 2026-10-16, credit "NASA's Scientific Visualization Studio" (page text: "Please give credit for this item to: NASA's Scientific Visualization Studio"), JPEG q90, src/assets/textures/moon-lroc-2k.jpg (565,978 B; old 1,053,869 B). Earth: NASA Earth Observatory Blue Marble Next Generation with Topography and Bathymetry, July 2004 (Reto Stockli), world.topo.bathy.200407.3x5400x2700.jpg, page https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/ (Visible Earth 73751 redirects there), accessed 2026-10-16, credit "NASA Earth Observatory (Blue Marble: Next Generation, Reto Stockli)", Lanczos to 4096x2048, JPEG q92, src/assets/textures/earth-bmng-july-4k.jpg (1,559,348 B; old 1,461,877 B). Old earth-2k.jpg and moon-orig-2k.jpg removed. AssetLicence records in src/assets/bodies/earth.ts and moon.ts (licence "public domain"; localOnly declarations removed); vite.config.ts LOCAL_ONLY_TEXTURES now []; public-build-assets.mjs guard changed to fail only when there are no sources at all (it refused to run with no local-only texture). Proof 1 (Moon, poles): the poles are smooth LDAM albedo fill, no pinched streaks; near side and maria register identically to the old map (moon-full-old-over-new.png, moon-poles-old-over-new.png). Proof 2/3: DONOR_PROVENANCE, README credits, assets.html and index.html updated; Earth and Moon thumbnails regenerated as site/t-earth-bmng.jpg and site/t-moon-lroc.jpg, old unsourced site/t-earth-2k.jpg and t-moon-orig-2k.jpg deleted. Proof 4 (orientation): flat-map comparison shows identical registration (earth-full-old-over-new.png; Africa/India/Asia in the same place); browser-earth-moon and browser-spike03 before and after in docs/evidence/o011-i029-20261016T103813Z/ (before-*, after-*, close-*/focus-* before-after pairs): zero errors, lit-pixel counts unchanged within noise. In-app Apollo 11 close Earth after-view at 1969-07-16T14:14Z shows West Africa and the Atlantic under Columbia (after-faces/). UNVERIFIED: India/Asia and the terminator were not compared in the app against the old texture side by side (the app's presets frame Earth too small, only the Africa close view was captured); the Earth look differs from the old map in snow cover (July vs the old map's apparent August-like state) and ocean tone is the same bathymetry style. Gates: npm run typecheck clean; npm run build ok; npx vitest run 45 files, 828 passed, 1 skipped; public build (ASTRAEUS_PUBLIC_BUILD=1, scratch outDir) and public-build-assets.mjs ok:true. nameCheck is not configured. Left open for the checker; owner to judge the look.
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

# I-029: Replace the Earth and Moon pictures with sourced NASA maps

## Summary

`src/assets/textures/earth-2k.jpg` (4096x2048) and `moon-orig-2k.jpg` (2048x1024) came from the Planetary Explorer donor, which never recorded their sources (docs/DONOR_PROVENANCE.md, "Texture assets"). Earth is very likely NASA Blue Marble, but the product and URL are unknown. The Moon's origin is unknown. The owner approved committing both on 2026-10-06. However, the public pitch page lists a credit line for every asset, and these two cannot be credited exactly.

## Proof Needed

1. Replace the Moon with NASA SVS CGI Moon Kit (SVS 4720, LROC WAC colour map; public domain, NASA credit). Choose the resolution to match today's 2048x1024. The donor's earlier swap was rejected for pole quality, so compare the poles at the owner's look.
2. Replace Earth with a named NASA Blue Marble product (e.g. Blue Marble Next Generation, a specific month, at 4096x2048 or 2048x1024), recording the URL and credit.
3. Record the source, URL, access date, credit and licence in DONOR_PROVENANCE and in each `AssetLicence`. The public-build validator accepts both.
4. Orientation stays correct: India/Asia and the terminator for Earth, the near side for the Moon, judged at the owner's look against the current textures. Run browser-earth-moon and spike03 in a fresh evidence directory.
5. The pitch page's assets and credits list is updated to match.
