---
id: T-159
title: Decide how the engine is built and split for npm
objective: O-036
status: done
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o036-planning-20261023}
check_waiver:
    task: T-159
    reason: 'owner chose no per-step checks, one Full Objective Check at the end of O-036; quote: "Same as O-035 (Recommended)"; owner read: "Yes, go ahead (Recommended)"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T07:16:20Z"
---

# Decide how the engine is built and split for npm

## Outcome

A short decision note says how `astraeus` becomes an installable package and how `astraeus-data` carries the large data, with measured sizes and a working spike, so the next two steps build to a known plan.

## User Check

Read the decision note (one page, plain words) and say yes or what to change.

## Done When

- The note in `docs/NPM_PACKAGING.md` decides, with evidence: the build tool (for example Vite library mode or `tsc` plus a copy step) producing ESM JavaScript and `.d.ts` files; how pictures (textures in `src/assets`) and JSON data travel in the compiled package and how a consumer's bundler picks them up; how the engine finds `astraeus-data` when installed (and what it shows when it is not: bodies without that data are simply not offered, never invented); which of react, react-dom, three, @react-three/fiber are dependencies versus peer dependencies, given `mount` hides React; and the exact split: what stays in `astraeus` (code, planets' positions, which pictures) and what goes to `astraeus-data` (moon positions, full pictures), with the size of each.
- Size limits for the pack check of step 3 are set (packed and unpacked bytes for each package).
- A throwaway spike, outside the committed packages (scratch folder), shows one compiled build plus `npm pack` of a minimal engine slice installed into a scratch Vite app that draws Earth; its sizes and the commands are recorded. Nothing in `packages/` changes.
- Licences: each package's notices follow what it ships (PROV-01, PROV-02).
- The owner reads the note and agrees, in their words.

## Context Files

`packages/astraeus/package.json`, `packages/astraeus/README.md`, `package.json`, `tsconfig.json`, `packages/astraeus-site/vite.config.ts`, `packages/astraeus/data/ephemerides/README.md`, `packages/astraeus/src/assets/catalogue.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/synthetic/syntheticDefinition.ts`.

## Design References

Design: Components/Codebase Map; Interfaces and Data Flow; Current Technical State (O-035).

## Guardrails

ARCH-01, ARCH-02, ARCH-04, PROV-01, PROV-02, DATA-01.

## Implementation Plan

1. Measure: sizes of code, textures and data by folder; which textures each body needs.
2. Try the build options on a minimal slice in a scratch folder; pack it; install into a scratch Vite app; draw Earth.
3. Write the note: decisions, sizes, limits, the spike's commands and results, open risks.
4. Bring the note to the owner.

## Boundaries

Research and a scratch spike only; no changes to `packages/`, no public API (next step), no publishing. No browser check runs; the spike's drawing is confirmed by the scene's own readout or a console line, never a screenshot.

## Technical Verification

The spike's commands and outputs recorded in Technical Evidence; configured gates unchanged (they must still pass). Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Note: docs/NPM_PACKAGING.md (decisions, limits, owner addition on GitHub publishing). Spike in session scratch (outside repo): tsc build + asset rewrite; npm pack astraeus 10.5 MB packed / 12.0 MB unpacked / 387 files, astraeus-data 146.0 MB / 155.7 MB / 9,297 files; scratch Vite app built (7.5 MB) and headless run logged SPIKE line (Earth picture 4096 px, 2208 triangles, Mars chunks 60). Vite library mode rejected (61 MB inlined). Finding: committed moon positions are 120 MB, not 38 MB. Gates: lint, typecheck, build, npm test (1531 passed) green. No packages/ change. Owner reading of the note pending (owner_validation).

## Drift Notes

None yet.

**Owner's verdict (2026-10-23T07:16:20Z):** Owner decisions (2026-10-23): data split "Split per planet (Recommended)" — `astraeus-data` holds the moon pictures (and Venus 8k), `astraeus-data-jupiter`, `-saturn`, `-uranus`, `-neptune`, `-mars`, `-pluto` hold moon positions; Milky Way pictures "Move to the data package" — a plain engine install shows the catalogue stars without the Milky Way picture until `astraeus-data` is added; note accepted "Yes, go ahead (Recommended)". Names `astraeus`, `astraeus-data`, `astraeus-data-jupiter`, `astraeus-data-saturn` checked free on npm by the coordinator.
