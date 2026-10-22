---
id: T-132
title: Give Venus Planetary Explorer's Magellan map and lighting
objective: O-039
status: done
check_waiver:
  task: T-132
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the Full Objective Check covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T10:40:06Z'
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o039-planning-20261022}
lane: venus
planned_reads: [/home/user/code/planetary-explorer/src/entities/venus.ts, /home/user/code/planetary-explorer/src/features/moon/usePlanetTexture.ts, src/assets/bodies/venus.ts, src/assets/licence.ts, src/assets/visual.ts, src/app/useBodyTexture.ts, src/app/BodyMesh.tsx, data/bodies/venus/map.json, docs/DONOR_PROVENANCE.md, tests/assets.test.ts]
planned_writes: [src/assets/bodies/venus.ts, src/assets/licence.ts, src/assets/visual.ts, src/app/useBodyTexture.ts, src/app/BodyMesh.tsx, src/assets/textures/venus-2k-balanced.jpg, src/assets/textures/venus-8k-balanced.jpg, tests/venusMap.test.ts, docs/DONOR_PROVENANCE.md]
---

# Give Venus Planetary Explorer's Magellan map and lighting

## Outcome

Venus draws the donor's USGS/NASA Magellan maps (2k below 768 px viewport width, 8k at 768 px or wider) with the donor's lighting and material, so it matches Planetary Explorer and its tagged places sit on their terrain (I-054).

## User Check

On the preview, open Venus on desktop and in a phone-sized window: Maxwell Montes sits on the bright highland near the top, Aphrodite Terra on the equatorial highland band, and Venus looks like it does in Planetary Explorer.

## Done When

- `venus-2k-balanced.jpg` and `venus-8k-balanced.jpg` are copied byte-for-byte from the donor (SHA-256 matching `data/bodies/venus/map.json`); the old `venus-2k.jpg` is removed if nothing else uses it.
- `TextureRef` carries one optional desktop variant with its minimum viewport width; the texture loader picks it once at load by viewport width, as the donor's `usePlanetTexture.ts` does; bodies without a variant are unchanged, and a phone never requests the 8k file.
- `BodyMaterialConfig` carries an optional emissive colour and intensity; Venus uses the donor's values (ambient 0.24, directional 1.18, emissive `#4f2e16` at 0.04, colour `#f6e1b9`, roughness 0.9, metalness 0.04); `textureYawRad` stays 0.
- The licence record says USGS Astrogeology / NASA Magellan, public domain; credits text and `docs/DONOR_PROVENANCE.md` updated.
- `tests/venusMap.test.ts` covers variant choice either side of 768 px, the file hashes and the material values. Owner verdict recorded. Configured gates pass.

## Context Files

`/home/user/code/planetary-explorer/src/entities/venus.ts` (read only), `/home/user/code/planetary-explorer/src/features/moon/usePlanetTexture.ts` (read only), `src/assets/bodies/venus.ts`, `src/assets/licence.ts`, `src/assets/visual.ts`, `src/app/useBodyTexture.ts`, `src/app/BodyMesh.tsx`, `data/bodies/venus/map.json`, `docs/DONOR_PROVENANCE.md`, `tests/assets.test.ts`.

## Design References

Design: Asset architecture (O-014); Components/Codebase Map row for `src/assets/`.

## Guardrails

PROV guardrails, ARCH-01, STYLE-05, STYLE-07, STYLE-10.

## Implementation Plan

1. Port faithfully: copy the donor files and values as they are; name and ask the owner before any deviation.
2. Add the optional desktop variant and emissive fields with defaults that leave other bodies untouched.
3. Point Venus at the new maps, licence and lighting.
4. Write the tests; ask the owner to look on the preview.

## Boundaries

Venus only. No desktop variants for other bodies, no cloud layer, no atmosphere shell. The donor checkout is never edited.

## Technical Verification

Focused node tests; configured gates at handoff; owner's look on the preview. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-22 in lane `lane-t132`.

- Files: copied `venus-2k-balanced.jpg` and `venus-8k-balanced.jpg` from the donor byte for byte; SHA-256 `5ccac073...c237` and `4d0e991b...b0c9` match `data/bodies/venus/map.json` (tested). Old `venus-2k.jpg` removed; its only other users were `tools/validate/load-budget.mjs` (names updated).
- `TextureRef.desktop` (url, size, `minViewportWidth`) and `textureUrlFor(texture, width)` in `src/assets/licence.ts`; `describeBody` picks the file from `window.innerWidth` (widest when there is no window, as the donor). `BodyMaterialConfig` gained optional `emissive`/`emissiveIntensity`, applied by `BodyMesh`'s lit textured material. Venus: ambient 0.24, directional 1.18, `#f6e1b9`, emissive `#4f2e16` at 0.04, roughness 0.9, metalness 0.04, yaw 0.
- Tests: new `tests/venusMap.test.ts` (5): variant choice at 320/375/414/600/767 vs 768/1024/1920, `describeBody` with a stubbed 375 px window never returns the 8k URL, bodies without variant unchanged, hashes, material/light/licence. 
- Gates (from the lane): lint, typecheck, build pass; `npm test` 94 files, 1296 passed, 1 skipped.
- Deviations: (1) Licence is now public domain, so the credit text moved out of the Solar System Scope rows: edited `assets.html` (new Venus map credit row, Venus card chip), `index.html` shelf chip, `README.md` credit lines, and tests `assetsPageCredits`, `assetsSections`, `textureLicence`, `planets` that asserted CC BY 4.0 for Venus. (2) Licence `accessed` 2026-10-22; the USGS page was not opened, the licence is the donor's statement. (3) The site thumbnail `site/t-venus-2k.jpg` (home shelf and assets card) is still the old Solar System Scope picture; not regenerated. (4) `tools/validate/load-budget.mjs` Venus limits (3.1 MB raw) were not re-measured: the 2k file is about 200 KB larger than the old one and the browser/public-build gates were not run, so the limit may need raising at the Full Check. The 8k file (14.5 MB) ships in `dist` and loads only at 768 px or wider. (5) Venus-only material emissive in the flat (untextured) material was not added.
- Design change (variant, emissive) deferred to T-137.

Owner look on preview: pending. On localhost:5490 open the planets demo at Venus on a desktop-width window: Maxwell Montes on the bright highland near the top, Aphrodite Terra on the equatorial highland band, a warm tan Magellan radar look as in Planetary Explorer. Repeat in a phone-width window (under 768 px; reload after resizing): the same map, softer. In the network panel the phone should fetch only `venus-2k-balanced`, never `venus-8k-balanced`.

## Drift Notes

The texture variant and emissive fields are Design changes; deferred to T-137.
