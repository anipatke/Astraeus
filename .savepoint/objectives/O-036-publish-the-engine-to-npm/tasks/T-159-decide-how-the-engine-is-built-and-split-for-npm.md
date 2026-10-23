---
id: T-159
title: Decide how the engine is built and split for npm
objective: O-036
status: in_progress
stage: build
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o036-planning-20261023}
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

Pending execution.

## Drift Notes

None yet.
