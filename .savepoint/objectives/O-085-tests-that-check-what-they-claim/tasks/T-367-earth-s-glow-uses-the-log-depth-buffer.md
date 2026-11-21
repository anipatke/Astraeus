---
id: T-367
title: Earth's glow uses the log depth buffer
objective: O-085
status: in_progress
stage: audit
depends_on: []
check_waiver: {task: T-367, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:50:31Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: atmosphere
planned_reads: [packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/src/app/SkyView.ts, packages/astraeus/src/app/BodyView.tsx, packages/astraeus/src/assets/bodies/earth.ts]
planned_writes: [packages/astraeus/src/app/AtmosphereGlow.tsx, packages/astraeus/tests/logDepth.test.ts, packages/astraeus/CHANGELOG.md]
---

# Earth's glow uses the log depth buffer

## Outcome

The atmosphere glow writes and tests depth the same way as every other body in the logarithmic depth buffer, so it is hidden only by things in front of it; and the log-depth guard now reads JSX `<shaderMaterial>` as well as `new ShaderMaterial(`, so the next such material cannot miss the chunks unseen (AH-12/AH-32: Gemini F-04/RND-04 and Probe A, Claude R-6).

## User Check

Owner, on `localhost:5490` (restart the preview first so it serves this branch). Earth is the only body with an atmosphere today (`src/assets/bodies/earth.ts:9`, `EARTH_ATMOSPHERE`), so the look is Earth's:

1. `app.html?experience=planets&planet=earth`: Earth's thin blue rim at the edge of the disc has the same colour, width and softness as on `main`; the glow does not spread across the lit face. Zoom in close and back out: the rim stays steady, does not flicker, vanish or show through the planet.
2. `app.html` (Apollo 11, the default experience): near Earth, the rim looks as before. Where the Moon, the spacecraft, or an orbit line passes **in front of** Earth's edge, it hides the glow; where something passes **behind** the edge, the glow now stays over it (before this change a body or line behind the rim could cut a gap in the glow).

Expected: unchanged look in open space, correct overlap where things cross the rim. Anything that looks worse (rim gone, thicker, banded, or drawn over nearer objects) is a fail; say what and where.

## Done When

- Guard first: `packages/astraeus/tests/logDepth.test.ts`, case "every ShaderMaterial in src/app carries the log-depth chunks, or is allowlisted with a reason and draws without depth", is the subject. Its count regex `/new\s+(Raw)?ShaderMaterial\s*\(/g` also counts JSX `<shaderMaterial` and `<rawShaderMaterial` elements, and its source glob widens from `../src/app/*.{ts,tsx}` to `../src/**/*.{ts,tsx}` (a material moved to a subfolder or another layer is still read). The allowlist check for `depthTest: false` also accepts JSX `depthTest={false}`. The chunk list gains `common` (three's `logdepthbuf_vertex` calls `isPerspectiveMatrix` from it, so a material with the four chunks but no `#include <common>` fails to compile on the GPU). Run it against the current `AtmosphereGlow.tsx` and record the "missing" offences (the four log-depth chunks and `common`) (the guard failing on HEAD).
- `src/app/AtmosphereGlow.tsx`: `VERTEX` gains `#include <common>` (three's `logdepthbuf_vertex` calls `isPerspectiveMatrix`, defined there) and `#include <logdepthbuf_pars_vertex>` before `main`, `#include <logdepthbuf_vertex>` after `gl_Position`; `FRAGMENT` gains `#include <logdepthbuf_pars_fragment>` before `main` and `#include <logdepthbuf_fragment>` at the top of `main`, matching `src/app/OrbitSetView.ts` lines ~36–60. Nothing else in the shader, uniforms or material props changes. A one-line comment says why (the renderer uses the log depth buffer; donor code ran without it).
- The guard case passes with the fix; the `SkyView.ts` allowlist entry is unchanged.
- The other cases in `logDepth.test.ts` are unchanged.
- `packages/astraeus/CHANGELOG.md`, top section `## 0.10.0 (proposed)` (read only that section): one line under fixes: Earth's atmosphere glow now uses the logarithmic depth buffer, so bodies and lines behind the rim no longer cut into it.
- Owner look recorded (User Check) before the Full Objective Check. Until then this Task waits at `stage: audit` with code, guard and gates done; no other Task depends on it.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/AtmosphereGlow.tsx`
- `packages/astraeus/tests/logDepth.test.ts` (lines 1–48)
- `packages/astraeus/src/app/OrbitSetView.ts` (the shader strings ~30–62, as the pattern; read only)
- `packages/astraeus/src/app/BodyView.tsx` (line ~100, where the glow is drawn; read only)
- `packages/astraeus/src/assets/bodies/earth.ts` (line ~9; read only)
- `packages/astraeus/CHANGELOG.md` (the `## 0.10.0 (proposed)` section only)

## Design References

`.savepoint/Design.md` under `Near planets and rings` if depth set-up context is needed; the I-117 log-depth decision is in `tests/logDepth.test.ts`'s header.

## Guardrails

TEST-01, TEST-02, TEST-03, CODE-01, STYLE-08, STYLE-10.

## Implementation Plan

1. Widen the guard; show it failing on HEAD with the five offences.
2. Add the four chunks to the atmosphere shaders.
3. Guard green; focused tests; gates.
4. CHANGELOG line.
5. Hand to the coordinator for the owner look (orchestration: park unmerged if the owner is offline).

## Boundaries

Only `AtmosphereGlow.tsx`'s shader text changes (porting faithfully otherwise: the Objective names this deviation from the donor). No change to glow colour, intensity, power, scale, blending, side or `depthWrite`. No browser script change and no per-Task browser run; the Full Check's one `npm run check:browser` covers it (shader change: full tier under Release decision 1).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/logDepth.test.ts packages/astraeus/tests/bodyViewDom.test.ts`. Handoff: `quality_gates`. Owner look on `localhost:5490` (User Check). No screenshots, no browser run by the builder.

## Technical Evidence

Extra reads: none beyond Context Files (CHANGELOG top section only).

Red first: with the widened guard and the unfixed `AtmosphereGlow.tsx`, the guard case failed with exactly five offences: `AtmosphereGlow.tsx: missing common`, `missing logdepthbuf_pars_vertex`, `missing logdepthbuf_vertex`, `missing logdepthbuf_pars_fragment`, `missing logdepthbuf_fragment`.

| Done When | Evidence |
|---|---|
| Guard counts JSX `<shaderMaterial`/`<rawShaderMaterial`, globs `../src/**/*.{ts,tsx}`, accepts `depthTest={false}`, chunk list has `common`; failed on HEAD with the five offences | `tests/logDepth.test.ts` edited (4 lines); red run above |
| Shader gains `<common>`, the pars/vertex/fragment chunks, one-line comment; nothing else changes | `src/app/AtmosphereGlow.tsx` diff: only added include lines and the comment |
| Guard passes; SkyView allowlist unchanged | `npx vitest run logDepth.test.ts bodyViewDom.test.ts`: 12 passed |
| Other logDepth cases unchanged | untouched; all 4 pass |
| CHANGELOG line | one `- Fixed:` line in `## 0.10.0 (proposed)` |
| Owner look | PENDING (owner offline), see below |
| Gates | lint, typecheck, build clean; `npm test`: 301 files, 5031 passed, 2 skipped |

Files changed: `packages/astraeus/src/app/AtmosphereGlow.tsx`, `packages/astraeus/tests/logDepth.test.ts`, `packages/astraeus/CHANGELOG.md`.

What the owner should look at on `localhost:5490` (restart the preview so it serves this branch; Earth is the only body with an atmosphere):
1. `app.html?experience=planets&planet=earth`: the thin blue rim at the disc edge should have the same colour, width and softness as on `main`, with no glow across the lit face. Zoom in close and back out: the rim should stay steady, not flicker, vanish or show through the planet.
2. `app.html` (Apollo 11): near Earth the rim looks as before. The Moon, the spacecraft or an orbit line passing in front of Earth's edge hides the glow; something passing behind the edge now stays under the glow (before, it could cut a gap).
Fail if the rim is gone, thicker, banded, or drawn over nearer objects.

Limitations: no browser run by the builder; GPU compile of the shader is unverified until the owner look (the Full Check's `check:browser` also covers it).

## Drift Notes

Record for Design reconciliation: the log-depth guard reads JSX materials and all of `src/`.

Coordinator (orchestrate-g024-20261121): gates green for this Task (lint, typecheck, build; `npm test` 301 files, 5031 passed). Left at `stage: audit`: `owner_validation` is required and the owner is offline (G-024 decision 7, "Park it, move to the next"); the owner's look on localhost:5490 is described above.
