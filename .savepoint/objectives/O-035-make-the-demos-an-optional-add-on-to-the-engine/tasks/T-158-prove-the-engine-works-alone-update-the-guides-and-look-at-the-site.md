---
id: T-158
title: Prove the engine works alone, update the guides and look at the site
objective: O-035
status: done
depends_on: [{task: T-157, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o035-planning-20261023}
check_waiver:
    task: T-158
    reason: 'owner chose no per-step checks, one Full Objective Check at the end of O-035; quote: "Same as O-030 (Recommended)"; owner look given: "all fine, run the check"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T06:19:54Z"
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

Builder run 2026-10-23, uncommitted, stage test (waiting for the owner's look).

**New command.** `npm run check:engine-alone` (`tools/check-engine-alone.mjs`): copies `packages/astraeus` and root `tsconfig.json`, `vitest.config.ts`, `eslint.config.js`, `tools/lint/` into a temp folder (no demo, no site, no `data/local`), links each installed dependency one by one (not the workspace links) and points `astraeus` at the copy, then type-checks, lints and tests there. The engine has no build script, so there is no build step. Result: pass in 16.9 s (typecheck 0.4 s, lint 1.7 s, test 9.8 s: 65 files, 647 passed + 1 skipped). First run FAILED: `packages/astraeus/tests/moonOrbits.test.ts` globbed `../../../docs/evidence/o019-t078-{horizons,iau-rotation,sats-elem}-*` (repository root, outside the engine). Fixed by copying those three folders (about 0.9 MB, byte copies; originals stay, the orbit data cites them) into `packages/astraeus/tests/fixtures/o019-t078/` and pointing the globs there. No other engine test or file reached outside.

**Docs.** New `packages/astraeus/README.md` (what it holds, how a demo plugs in pointing at `src/synthetic/syntheticDefinition.ts`, engine-alone command). Root `README.md`: Architecture now names the five packages and the boundary rule; fixed stale image, panel, data, fetch-tool and validator paths; `check:engine-alone` listed under Develop. `AGENTS.md`: Codebase Map rows per package, Build lines (lint scope, harness paths, coverage config, new Engine-alone gate), Project Rules paths. `docs/BROWSER_CHECKS.md`: `tools/validate/` paths now under `packages/astraeus-site/`. `.savepoint/Design.md`: package paragraph at the top of Components/Codebase Map (old row paths read through it), APOLLO11_SOURCES path, new O-035 entry in Current Technical State reconciling the drift notes of T-155 (moves, per-package story globs, two unemitted panels files), T-156 (exports patterns, owner exception, boundary test and its unchecked glob/file reads) and T-157 (credits, hand-written assets.html rows). Fixed stale text `fetchOrbitsCommand` in `measuredOrbits.ts` to `node packages/astraeus-demo-showers/tools/data/fetch-meteoroid-orbits.mjs` (and the three test expectations that quote it).

**Gates (repo root).** `npm run lint` pass 2.9 s; `npm run typecheck` pass 4.5 s; `npm run build` pass 1 s; `npm test` 116 files, 1529 passed + 1 skipped (first run had one failure, a test quoting the old fetch-tool path; fixed, rerun green); `npm ci --dry-run` exit 0. Public build (`ASTRAEUS_PUBLIC_BUILD=1 npm run build`) ok, `public-build-assets.mjs dist` ok (no matches). No browser runs, no screenshots, `test:full` not run (Full Objective Check).

**Servers for the owner's look.** Dev preview http://localhost:5490 (the old `vite` process there, started before the package move, answered 404 for every page; it was this checkout's own, so it was stopped and restarted with `npm run dev -- --port 5490 --strictPort`). Local public build http://localhost:5491 (`vite preview` of `dist`, built with `ASTRAEUS_PUBLIC_BUILD=1`; shows Jupiter only in Planets, by design, O-039 T-136).

**Owner's checklist** (desktop about 1280x720 and phone about 375x667, on both 5490 and 5491): 1. Front page `/`: loads, pictures show, links work. 2. Assets page `/assets.html`: sections, credits at the bottom. 3. Apollo 11 `/app.html`: plays, a story panel opens at the landing, info panel works. 4. Showers `/app.html?experience=showers`: Perseids draw; switch to Geminids and back. 5. Planets `/app.html?experience=planets&planet=jupiter`: on 5490 switch through Saturn, Mars, Earth and others; on 5491 only Jupiter. 6. Nothing overlaps on the phone size. Verdict: the site looks and behaves as before, or what differs.

**Owner's verdict (2026-10-23T06:19:54Z):** "all fine, run the check". During the look the owner also said "tagged places looks a bit weird as a table" and "assets.html is too long, we need to make it more concuse and organise the information better"; the page is unchanged by O-035, and the owner chose "Log it, do it next (Recommended)" — recorded as I-075.


## Drift Notes

Reconciles the three earlier steps' drift notes into Design.md.
