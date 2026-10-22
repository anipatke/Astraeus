---
id: T-150
title: Trim the download every page shares
objective: O-031
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o031-planning-20261023}
lane: trim
check_waiver:
    task: T-150
    reason: 'owner asked for one full fresh check at the end of O-031 instead; quote: "orchestrate the delivery of O-31. Ask questions before execution, one full test at end"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T00:00:00Z"
---

# Trim the download every page shares

## Outcome

The shared app script that every page downloads is measured, and code no visitor needs on first view (for example the developer panel behind the cog) loads only when it is first used, so the first download is smaller with nothing visitors notice.

## User Check

None on screen in this step. Read the before and after sizes and the list of bigger ideas in Technical Evidence.

## Done When

- `app.js` in the public build is measured by what it contains (module sizes from the build, for example a bundle report written to a scratch folder, not committed); the top contributors are listed with sizes.
- Only invisible cuts are made: code moved into chunks fetched when first needed, where the first use shows no new wait (the developer panel, its settings and frame-rate graph are the expected first candidate). Each cut is named with its saving.
- `tools/validate/load-budget.mjs` lists any new chunk where it belongs and its limits are lowered to the new measurement plus the file's stated headroom rule; before and after raw and gzip sizes recorded.
- Bigger ideas that would change something visible (a short wait, a library swap) are listed with an estimated saving for the owner, not built.
- Configured gates pass; the public build and `node tools/validate/load-budget.mjs <dist>` pass. No browser runs.

## Context Files

`src/main.tsx`, `src/app/App.tsx`, `src/app/DeveloperSettings.tsx`, `src/app/FrameRateSection.tsx`, `src/app/SettingControls.tsx`, `src/shell/AstraeusShell.tsx`, `vite.config.ts`, `package.json`, `tools/validate/load-budget.mjs`, `tests/publicBuild.test.ts`.

## Design References

Design: Public site and launch (O-016); the load budget (O-017 T-070); the `src/app/` row.

## Guardrails

ARCH-01, ARCH-04, CODE-01, TEST-01, STYLE-10; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. Build the public site to a scratch folder and measure what `app.js` holds.
2. Pick the cuts that are invisible; move them behind a dynamic import.
3. Rebuild, measure, update the load budget.
4. List the bigger ideas.

## Boundaries

No change to what visitors see, no new waits, no dependency swaps. Another step edits the scene's render loop at the same time (`AstraeusScene.tsx`, `LayeredRender.tsx`, `sceneFrame.ts`); stay out of those files. No browser runs, no screenshots.

## Technical Verification

Configured gates, the public build and the load-budget check at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built in lane `lane-t150`. Task Check waived (see `check_waiver`); the Full Objective Check covers this.

**Measured** (public build, scratch outDir, sourcemap attribution of `app.js` bytes). Top contributors to `app.js` (raw): three.js 528.6 kB; react-dom 128.9 kB; react-reconciler 89.8 kB; orb `earth-epv00/data.js` 63.1 kB; @react-three/fiber events 26.0 kB; then Astraeus own code, largest `App.tsx` 13.9 kB, `moonSystem.ts` 11.8, `outerPlanets.ts` 11.3, `bootLoader.ts` 10.4, `PathView.ts` 9.6, `OrbitSetView.ts` 8.6, `PointsView.ts` 8.4, `TimelineBar.tsx` 8.3, `DeveloperSettings.tsx` 7.5. Libraries are about 870 kB of the 1,366 kB; the app's own code is small, so only the developer panel was a cut.

**Cut made.** The Developer tools panel (the folds built inside `App.tsx`, `DeveloperSettings.tsx`, `FrameRateSection.tsx`, `SettingControls.tsx`, `Collapsible`) moved to new `src/app/DeveloperPanel.tsx`, which `App.tsx` loads with `import()`: on idle after the page is up (`requestIdleCallback`, 4 s timeout; 1.5 s timer where unsupported), or at once if the cog is pressed first. App keeps all the state and the 250 ms polling; the panel holds none and is handed state and setters, so behaviour is unchanged. Chunk `DeveloperPanel`: 20.29 kB raw / 5.88 kB gzip.
- `app.js`: 1,366.17 kB raw / 403.76 kB gzip -> 1,319.99 kB raw / 389.53 kB gzip (-46.2 kB raw, -14.2 kB gzip). Of that, 20.3 kB raw / 5.9 kB gzip is the panel moved out; the rest is rolldown splitting `twoBodyAdapter.js` (27.6 kB) and `rolldown-runtime.js` (0.7 kB) out of app.js as shared chunks that app.js imports statically (both are modulepreload-linked in `app.html`, so they load in parallel, not after app.js).
- Honest reading: the visitor's script on the critical path before first paint is about 20 kB raw / 6 kB gzip lighter. Total bytes per page are not lower: the panel is still fetched on idle, and each page set rose by about 2.8 kB raw / 2.5 kB gzip for the extra chunk headers.

**Why nothing shows.** The cog panel only renders once the chunk is in hand; the fetch starts on idle right after load, long before a visitor reaches for the cog, and starts instantly on a press. Not browser-proven (no browser by rule). Proof by construction: `loadDeveloperPanel()` memoises one promise, `panelModule` state is set when it resolves, and the shell mounts the panel only from `developerMode`. If the cog is pressed within the first idle moment, the panel body appears when the chunk arrives (milliseconds from cache or CDN); there is no fallback spinner to flash. The Full Check may confirm on the preview.

**Load budget.** `tools/validate/load-budget.mjs` `APP_SHARED` now lists `rolldown-runtime.js`, `twoBodyAdapter.js` and `DeveloperPanel.js` (the check failed on the unlisted static imports until then). Public build passes; per-page limits left as they were, because the new measurements (+2.8 kB per page) sit inside the existing 5% headroom and re-rounding to the next 10,000 B gives the same values: Apollo 4,196,541 / 2,769,856 (limit 4,370,000 / 2,900,000); Jupiter 6,796,379 / 4,668,172 (7,130,000 / 4,900,000); showers 9,966,335 / 6,997,325 (10,090,000 / 7,050,000); geminids 12,450,808 / 7,803,535 (12,700,000 / 7,900,000); whole build 26,023,077 / 17,387,839 (54,610,000 / 44,130,000). Limits not lowered: nothing got smaller in total.

**Bigger ideas, not built (visible or library changes).** (1) Replace the orb ephemeris data module `earth-epv00/data.js` (63 kB raw, roughly 25 kB gzip) with the repo's own Earth curve fit: changes a scientific source, so owner decision. (2) Load three.js features piecemeal / use a smaller renderer build: three.js is 529 kB raw (about 130 kB gzip); a custom three build with only used classes might save 20 to 40 percent but needs a dependency swap or alias work. (3) Defer the 3D scene itself behind the boot loader (app shell paints first, scene chunk about 1 MB loads after): first paint much earlier, but the loader shows longer: a visible wait. (4) Lazy-load the shell's drawers, timeline and story panels (about 40 kB raw): they are on screen at first view, so loading them later would flash. (5) Replace react-dom / react-reconciler (219 kB raw together) with a lighter library: a library swap.

**Gates (lane, 2026-10-23).** `npm run lint` pass; `npm run typecheck` pass; `flock /tmp/astraeus-build.lock npm run build` pass (chunk-size warning only); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 111 files, 1502 passed, 1 skipped; public build to scratch + `node tools/validate/load-budget.mjs <scratch>` pass. No browser run, no screenshot, no `test:full`, no health check. Files edited: `src/app/App.tsx`, new `src/app/DeveloperPanel.tsx`, `tools/validate/load-budget.mjs`. No extra reads beyond Context Files and `src/shell/TopBar.tsx` (cog toggle), `src/shell/Collapsible.tsx` imports only. No new Tasks, Checks or Issues needed.

**Owner decision, 2026-10-22T21:49:00Z.** Asked "The only invisible cut saves about 6 kB before first view but adds about 3 kB in total. Keep it, or drop it?", the owner chose "Drop the cut, keep the findings". The code of lane commit d60b2199 (`src/app/DeveloperPanel.tsx`, `src/app/App.tsx`, `tools/validate/load-budget.mjs`) is NOT merged; only this record is. `app.js` stays at the baseline (1,366.17 kB raw / 403.76 kB gzip, public build 2026-10-23); the load-budget limits are unchanged. The measurements and the bigger-ideas list above stand as this step's outcome for Success Condition 3.

Marked done by the coordinator at 2026-10-22T21:49:00Z on the owner's authority (O-031 run, 2026-10-23: "Yes, same as O-038", whose rule was "I mark them as they pass").

## Drift Notes

None: the split was dropped by the owner; Design records only the measurement (last step).
