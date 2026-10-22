---
id: T-132
title: Give Venus Planetary Explorer's Magellan map and lighting
objective: O-039
status: planned
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

Pending execution.

## Drift Notes

The texture variant and emissive fields are Design changes; deferred to T-137.
