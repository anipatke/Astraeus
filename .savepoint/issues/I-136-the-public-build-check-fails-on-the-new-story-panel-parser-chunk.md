---
id: I-136
title: The public build check fails on the new story-panel parser chunk
type: defect
status: open
source:
  kind: check
  check: C-139
  actor: {role: checker, session: o058-check-20261101}
  at: '2026-11-01T07:58:00Z'
tasks: [T-237]
checks: [C-139]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-11-01T07:58:00Z'
    actor: {role: checker, session: o058-check-20261101}
    kind: observed
    note: 'Found by the O-058 Full Objective Check (C-139). The one npm run check:browser (07:45:25-07:51:18Z on 1d729c02) failed at public-build-assets (exit=1). Four app page sets have a script that statically imports assets/storyPanels-BiQHMCgc.js, which no page set lists. The same step passed on the tree before the split (C-137 run docs/evidence/browser-20261101T055531Z). Evidence folder docs/evidence/browser-20261101T074525Z, logs /tmp/astraeus-check-logs-lg4vec/public-build-assets.log.'
    check: C-139
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
