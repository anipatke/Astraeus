---
id: T-158
title: Prove the engine works alone, update the guides and look at the site
objective: O-035
status: planned
depends_on: [{task: T-157, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o035-planning-20261023}
---

# Prove the engine works alone, update the guides and look at the site

## Outcome

One command copies the engine alone into a scratch folder and builds, type-checks and tests it there; the guides and Design describe the five packages; the owner has looked at the preview and the public build and found the site unchanged.

## User Check

Run the engine-alone command and see it pass. On the preview (`localhost:5490`) and a local public build, at desktop and phone size: the front page, the assets page, Apollo 11, Showers (switch Perseids and Geminids) and Planets (switch a few planets) look and behave as before. The checklist is in Technical Evidence.

## Done When

- A root script (for example `npm run check:engine-alone`) copies `astraeus` and the shared root config into a scratch folder with no demo or site, links the installed dependencies, and runs the engine's typecheck, build (if it has one) and tests there; it fails if anything reaches outside the copy. It takes about a minute, and its run is recorded.
- A short engine `README.md` says what the package holds and how a demo plugs in (pointing at a made-up scene); the root README names the five packages.
- AGENTS.md (Codebase Map rows and the Build lines, including the new command), `docs/BROWSER_CHECKS.md` paths and Design (Components/Codebase Map, Interfaces, the drift notes of the three earlier steps) describe the packages.
- The owner's checklist and verdict, in their words, are recorded.
- Configured gates pass. No browser runs (the Full Objective Check runs `npm run check:browser` once and the engine-alone command).

## Context Files

`package.json`, `README.md`, `AGENTS.md`, `docs/BROWSER_CHECKS.md`, `.savepoint/Design.md`, and the Technical Evidence of this Objective's earlier steps.

## Design References

Design: Components/Codebase Map; Interfaces and Data Flow; Browser checks (O-038).

## Guardrails

ARCH-04, TEST-01, TEST-03; AGENTS.md Astraeus Project Rules (owner judges looks on the preview, no screenshots).

## Implementation Plan

1. Write the engine-alone script; run it.
2. Engine README and root README.
3. AGENTS.md, BROWSER_CHECKS.md and Design reconciliation.
4. Checklist; owner's look; record the verdict; gates.

## Boundaries

No new features; no npm publishing (O-036). No screenshots, no browser runs.

## Technical Verification

The engine-alone command and the configured gates at hand-off; the owner's recorded look. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Reconciles the three earlier steps' drift notes into Design.md.
