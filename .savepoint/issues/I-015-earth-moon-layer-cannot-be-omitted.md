---
id: I-015
title: Earth–Moon layer cannot be omitted through the plug-in contract
type: defect
status: resolved
source:
  kind: check
  check: C-010
  actor: {role: checker, session: o008-check-20261011}
  at: '2026-10-10T20:52:00Z'
tasks: [T-025, T-026]
checks: [C-010, C-011]
guardrail_ids: [ARCH-03, TEST-01]
resolution:
  disposition: verified
  check: C-011
  actor: {role: checker, session: o008-recheck-20261011}
  at: '2026-10-10T21:04:40Z'
  reason: Actual scene inventory verifies original layer matrix; all configured and browser gates pass.
history:
  - at: '2026-10-10T20:52:00Z'
    actor: {role: checker, session: o008-check-20261011}
    kind: observed
    check: C-010
    note: Initial Full Check found advertised scene-layer selection ignores omission of earth-moon. Design acknowledges the limitation, but no owner exception changes the agreed boundary.
  - at: '2026-10-10T21:00:13Z'
    actor: {role: executor, session: o008-repair-20261011}
    kind: repair_attempted
    note: 'The scene now honours sceneLayers: with earth-moon omitted it mounts no Earth/Moon bodies, lights or Moon path and makes no Moon or Sun calls (EarthMoonScene.tsx, App.tsx, experienceDefinition.ts usesEarthMoon). Proof Needed rerun: layer lists empty, tracked-only, earth-moon-only, both and duplicate pass in tests/experienceDefinition.test.ts; a synthetic-bare variant mounts through the same App path and its screenshot shows only the marker and its path (docs/evidence/o008-i015-run1/synthetic/synthetic-bare.png), with data-earth-moon false and true asserted by browser-synthetic.mjs. Neighbouring cases: Apollo and synthetic with both layers unchanged. typecheck pass, build pass, npm test 188 of 188, all five browser scripts errors [] (run dir docs/evidence/o008-i015-run1). Not verified: a non-Earth-centred experience (out of scope), pixel comparison against earlier Apollo screenshots, and the metrics factory still reads the Moon for the bare variant (recorded in Design.md). src/core and src/shell unchanged. Awaiting checker verification.'
  - at: '2026-10-10T21:04:40Z'
    actor: {role: checker, session: o008-recheck-20261011}
    kind: rechecked
    check: C-011
    note: 'Verified against C-010 frozen layer cells: empty, Earth-only, tracked-only, both and duplicates produce expected actual meshes, lights and paths. 188 tests and five browser scripts pass; core/shell unchanged.'
---

# I-015: Earth–Moon layer cannot be omitted through the plug-in contract

## Summary

O-008's Architectural Considerations require the boundary to let an experience name the layers it uses, without required Apollo concepts. The audit §4 explicitly says Earth and Moon are never mandatory. `ExperienceDefinition.sceneLayers` advertises opt-in layers, but only `tracked-bodies` is consumed. An otherwise valid definition with `sceneLayers: []` or `["tracked-bodies"]` still mounts Earth and Moon. This undermines SC2's generic boundary and ARCH-03's alternative-configuration proof.

## Evidence

- `src/app/experienceDefinition.ts:36` advertises layers the scene mounts; line 46 filters tracked bodies only.
- `src/app/App.tsx:17` always constructs Moon runtime; line 119 always mounts `EarthMoonScene` without passing layer selection.
- `src/app/EarthMoonScene.tsx:177` always reads Moon state; its JSX always mounts both body meshes. There is no `sceneLayers` input or branch.
- Smallest supported configuration: spread `syntheticDefinition`, replacing `sceneLayers` with `[]`, leaving its trusted typed data unchanged. Browser response interception applies exactly this override without editing production; the Earth–Moon canvas still mounts. See C-010 scope and `/tmp/astraeus-c010/browser-matrix.mjs`. Source tracing establishes unconditional bodies; the canvas marker alone is not a pixel oracle.
- Expected: omitted layer does not mount its bodies or require its orchestration. Actual: Earth–Moon orchestration remains unconditional. Tracked-body omission works in the independent finite layer matrix.
- `tests/experienceDefinition.test.ts` exercises tracked-body omission only. Both fixture definitions include Earth–Moon, so `tests/experiencePlugIn.test.ts` never challenges this requirement.

## Proof Needed

Repair the layer boundary without core scientific changes, or return the architectural decision to planning. Prove empty, tracked-only, Earth–Moon-only, both and duplicate layer lists through the same App path, retain synthetic/Apollo contract evidence, and rerun configured gates and all five browser scripts. Preserve completed Task statuses. Any narrower contract requires an explicit owner decision rather than treating executor drift notes as acceptance.
