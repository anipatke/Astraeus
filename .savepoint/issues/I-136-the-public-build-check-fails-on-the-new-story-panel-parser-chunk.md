---
id: I-136
title: The public build check fails on the new story-panel parser chunk
type: defect
status: resolved
source:
  kind: check
  check: C-139
  actor: {role: checker, session: o058-check-20261101}
  at: '2026-11-01T07:58:00Z'
tasks: [T-237]
checks: [C-139, C-140]
guardrail_ids: [TEST-01]
severity: medium
resolution:
  disposition: verified
  check: C-140
  actor: {role: checker, session: o058-recheck-20261101}
  at: '2026-11-01T08:25:00Z'
  reason: 'C-140 CLEAR: the one npm run check:browser on a3c9115c passed every step including public-build-assets (loadBudget.ok true, every page within limits, self-proof true); wholly-engine chunks are admitted via engine-share.json while unnamed, tableless, mixed or chained-mixed chunks still fail (checker probes b1-b9); DEEP_IMPORT_COUNTS unchanged; scenePin passes without -u.'
history:
  - at: '2026-11-01T07:58:00Z'
    actor: {role: checker, session: o058-check-20261101}
    kind: observed
    note: 'Found by the O-058 Full Objective Check (C-139). The one npm run check:browser (07:45:25-07:51:18Z on 1d729c02) failed at public-build-assets (exit=1). Four app page sets have a script that statically imports assets/storyPanels-BiQHMCgc.js, which no page set lists. The same step passed on the tree before the split (C-137 run docs/evidence/browser-20261101T055531Z). Evidence folder docs/evidence/browser-20261101T074525Z, logs /tmp/astraeus-check-logs-lg4vec/public-build-assets.log.'
    check: C-139
  - at: '2026-11-01T19:05:00Z'
    actor: {role: executor, session: o058-repair-20261101}
    kind: repair_attempted
    note: 'Repair, not verified. load-budget.mjs now follows the engine-share table: an unlisted script that a listed script imports at load and that engine-share.json says is wholly engine code (engine == total) joins the page set and counts as engine share (held by the engine limit); a chunk with any demo code, or one the table does not name, must still be listed. A re-chunk inside the engine therefore cannot fail the step. Fast test in publicBuild.test.ts (proveLoadBudgetFails gains engineChunk and mixedChunk cases, also run as self-proof in public-build-assets.mjs). Evidence: public build with ASTRAEUS_PUBLIC_BUILD=1 ASTRAEUS_ENGINE_SHARE=1, then public-build-assets.mjs alone exit 0 and load-budget.mjs 8 ok, 0 FAIL (storyPanels-BiQHMCgc.js is engine 4310 of 4310 bytes). Full npm run check:browser not re-run here; the re-check does it. Page-set limits unchanged.'
  - at: '2026-11-01T08:25:00Z'
    actor: {role: checker, session: o058-recheck-20261101}
    kind: rechecked
    note: 'Re-checked by C-140 on a3c9115c. check:browser 08:12:41-08:18:47Z exit 0, evidence docs/evidence/browser-20261101T081242Z; storyPanels-BiQHMCgc.js still emitted and now admitted as wholly engine. Engine limit 1,662,849/1,735,000 raw. Budget probes: unnamed, no table, total 0, one demo byte, engine>total and engine-then-mixed chain all fail; engine chains pass and count as engine share. Verified.'
    check: C-140
---

# I-136: The public build check fails on the new story-panel parser chunk

## Summary

O-058 Success Condition 6 requires one `npm run check:browser` at the Full Objective Check, and it must pass. On the O-058 tree it fails at the `public-build-assets` step. T-237 moved `parseStoryPanels` and its constants to `src/core/storyPanels.ts`. Both `api/story.ts` and the `shell/storyPanels.ts` re-export now import it, so the production build splits the parser into its own shared chunk, `assets/storyPanels-<hash>.js`. The first-load budget (`packages/astraeus-site/tools/validate/load-budget.mjs`) lists every file each page loads at first. Its rule is that a listed script statically importing an unlisted script fails, "so an eager new chunk cannot slip past the limit" (file header, lines 3-5; `unlistedImportProblems`, lines 202-212). No page set lists the new chunk, so four app pages fail.

The page sizes are within their limits. The failure is that the page sets are out of date with the build. Even so, the public-build gate is red. No Task ran a browser check under the run rules, and the fast suite (`tests/publicBuild.test.ts`) does not build the real public site, so the step was first run here.

## Evidence

- `npm run check:browser` (checker, once, 07:45:25-07:51:18Z, HEAD 1d729c02): smoke, smoke-public-showers, planets-phone, meteor-shower, views, hello-scene, hello-react and public-addresses gave `exit=0`. `public-build-assets | scene=none (files only) | exit=1`. `FAILED: a step exited non-zero or logged a console error`. Summary: `docs/evidence/browser-20261101T074525Z/summary.txt`.
- `/tmp/astraeus-check-logs-lg4vec/public-build-assets.log`, `loadBudget.ok: false`, per page:
  - `app.html (Apollo 11)`: `assets/scene-Kas8L-MY.js imports assets/storyPanels-BiQHMCgc.js, which the page set does not list`
  - `app.html?experience=planets&planet=jupiter`: `assets/planetDefinition-T4ftnfFr.js imports assets/storyPanels-BiQHMCgc.js, …`
  - `app.html?experience=showers` and `app.html?experience=showers&shower=geminids`: `assets/scene-Kas8L-MY.js imports assets/storyPanels-BiQHMCgc.js, …`
- Baseline: the C-137 run of `check:browser` on the O-053 tree (05:55:31Z, `docs/evidence/browser-20261101T055531Z`) passed every step, including `public-build-assets`.
- The cause commit is 80313408 (T-237): new `packages/astraeus/src/core/storyPanels.ts`, imported by `src/api/story.ts:5` and re-exported by `src/shell/storyPanels.ts:3-13`.

## Proof Needed

- `npm run check:browser` passes every step, including `public-build-assets`, with `loadBudget.ok: true`, and each page stays within its limits. This takes one browser run, at the re-check.
- Choose and record the fix. Either list the chunk in the shared app page set (`APP_SHARED`) and re-measure the limits if they move, or change the build so the parser is not a separate eager chunk. Keep the strategic-fix rule (owner, 2026-10-30) in mind. Today a source move inside the engine reaches a browser-only gate that no fast test covers. Say whether a fast test (for example one that checks the page sets against a build) should catch an unlisted eager chunk next time, or record why not.
- Deep-import counts and `DEEP_IMPORT_COUNTS` stay unchanged, and `scenePin` still passes without `-u`.
