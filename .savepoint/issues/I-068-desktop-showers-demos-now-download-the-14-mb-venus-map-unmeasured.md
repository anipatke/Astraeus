---
id: I-068
title: Desktop showers demos now download the 14.5 MB Venus map, and the load budget does not see it
type: defect
status: open
source:
  kind: check
  check: C-096
  actor: {role: checker, session: o039-full-check-20261022}
  at: '2026-10-22T11:19:28Z'
tasks: [T-132]
checks: [C-096]
severity: medium
history:
  - at: '2026-10-22T11:19:28Z'
    actor: {role: checker, session: o039-full-check-20261022}
    kind: observed
    check: C-096
    note: Found by the O-039 Full Objective Check.
---

# I-068: Desktop showers demos now download the 14.5 MB Venus map, and the load budget does not see it

## Summary

T-132 gave Venus a desktop texture variant (`venus-8k-balanced.jpg`, 14,474,577 bytes) chosen in `describeBody` (`src/app/bodyDraw.ts:108`) for any viewport 768 px or wider. The choice is global, not limited to the planets demo: the Perseids and Geminids showers demos draw Venus as a textured sphere (the mesh is always mounted, `BodyView.tsx:94`), so on a desktop the public showers pages now fetch the 8k file. Their real desktop download goes from about 9.96 MB to about 24.4 MB (Perseids) and 12.45 MB to about 26.9 MB (Geminids). `tools/validate/load-budget.mjs` lists only `venus-2k-balanced.jpg` in `SHOWER_COMMON`, so the public-build check passes without measuring that weight. That breaks the load-budget rule in that file ("A change that makes a page heavier must raise its limit here on purpose, in the same change, with the new measurement"), and works against G-007's outcome of smaller downloads. The Venus planet-view limits were also not re-measured (T-132 evidence, deviation 4).

## Evidence

- Probe in C-096 (a scratch vitest, since removed): `showerComposition(parseShowerSettings(perseids|geminids)).bodies` includes `venus`; `describeBody(catalogue.get("venus"), trueScale).textureUrl` is `/src/assets/textures/venus-8k-balanced.jpg` with `window.innerWidth` 1280 and `venus-2k-balanced.jpg` with 375.
- Public build `ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir /tmp/o039-public-o8mS` (2026-10-22T11:15:58Z) ships `assets/venus-8k-balanced-5SSIs4uz.jpg` (14,474,577 B). `node tools/validate/public-build-assets.mjs` passes: showers 9,963,600 B raw against the 10,090,000 limit, geminids 12,448,073 against 12,700,000, whole build 40,477,206 B (T-136 measured 25,793,015 before the 8k map merged).
- `tests/venusMap.test.ts` tests the choice only for Venus on its own, not for the demos that draw it.

## Proof Needed

Either the 8k variant is used only where the owner wants it (for example only in the planets demo's Venus view), with a node test that a desktop showers page asks for the 2k file; or the load budget counts the file each page really fetches at desktop width, and the owner raises the showers limits on purpose with the new measurement. Either way the Venus planet-view limits are re-measured against the new 2k file.
