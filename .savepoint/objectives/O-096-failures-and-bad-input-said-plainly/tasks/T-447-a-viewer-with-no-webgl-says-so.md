---
id: T-447
title: A viewer with no WebGL says so
objective: O-096
status: done
depends_on: []
check_waiver: {task: T-447, reason: 'Owner said "orchestrate O-96" (2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o096-20261124}, recorded_at: '2026-11-24T06:57:50Z'}
owner_validation: {required: true, accepted_check: C-218, accepted_by: {role: owner, session: orchestrate-o096-20261124}}
planned_by: {role: planner, session: plan-o096-20261124}
planned_reads: [packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/style.css, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/tests/firstDraw.test.ts, packages/astraeus/tests/contextLoss.test.ts, vitest.config.ts, packages/astraeus/vitest.setup.ts, packages/astraeus-site/tools/validate/journey-two-viewers.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/src/synthetic/syntheticTwoViewers.ts, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, tools/api-rules.mjs]
planned_writes: [packages/astraeus/src/api/webglCheck.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/api/errors.ts, packages/astraeus/src/app/style.css, packages/astraeus/vitest.setup.ts, packages/astraeus/tests/noWebgl.test.ts, packages/astraeus-site/tools/validate/journey-two-viewers.mjs, packages/astraeus-site/tools/validate/driver.mjs, docs/BROWSER_CHECKS.md, packages/astraeus/README.md, packages/astraeus/api-surface.lock.json, packages/astraeus/CHANGELOG.md]
---

# A viewer with no WebGL says so

## Outcome

On a browser or device with no WebGL 2 (three 0.169 draws with WebGL 2 only), `mount`'s `ready` rejects with `SceneError` of the new code `no-webgl`, an `AstraeusScene` host's `onError` hears the same error (the console when no `onError` is given), and a short readable message stays in the viewer's place instead of an empty element (belt #16). Nothing else is drawn: no shell, no bar, no canvas. `unmount` removes the message and gives the host element back as before.

## User Check

Run `npm run preview:owner`. Open `localhost:5490` in Chrome started with WebGL off (`--disable-webgl --disable-webgl2`, or Settings → System → "Use graphics acceleration when available" off and restart), at desktop width and at phone width (device toolbar, 390x844). The message reads plainly, sits inside the viewer's area, and nothing overlaps or is cut off. With WebGL back on, the site draws as before.

## Done When

- `SceneErrorCode` gains `no-webgl` with a doc comment ("The browser or device offers no WebGL 2, so the viewer cannot draw; the viewer shows a short message in its place"); the README error table is regenerated with `npm run api:errors` (the generator is `tools/api-rules.mjs`, which reads the doc comments in `errors.ts`).
- One check, in a new `api/webglCheck.ts`, is run by both entry points (`api/mount.ts` and `api/AstraeusScene.tsx`) after the scene is prepared and before the viewer is rendered: it asks a fresh canvas for a `webgl2` context, counts a `null` or a throw as no WebGL, and releases a context it got (`WEBGL_lose_context`), so probing never holds a context (two viewers on a page stay within the browser's context limit). It runs only in those two entry points, never in `scene.check()` (which must keep working in Node).
- `mount`: with no WebGL, `ready` rejects with `no-webgl` (an ordinary rejection, not marked handled, like a failed load), and the element holds the message. `AstraeusScene`: the error goes through the existing `report` (to `onError`, else `console.error`) once per scene build, and the wrapper holds the message; `onReady` and `onFirstDraw` are not called.
- The message is one short element carrying the viewer's root class (API-03: no style outside `.astraeus-shell`) and a stable `data-astraeus-no-webgl` attribute for checks, with text such as "This 3D view needs WebGL, which this browser or device has turned off or does not offer." Its look comes from the shared look tokens in `app/style.css` (centred, readable at 390x844, no new look option). Host-supplied text is out of scope.
- `MountedScene.ready`'s doc comment and the `AstraeusSceneProps.onError` doc comment name `no-webgl`; the README says in one sentence under `mount`/`AstraeusScene` what a host sees without WebGL. API lock regenerated (`npm run api:lock`).
- Tests (TEST-02, each failing before the change): a new `tests/noWebgl.test.ts` (`// @vitest-environment happy-dom`) stubs `HTMLCanvasElement.prototype.getContext` to return null for `webgl2` and proves: `mount`'s `ready` rejects with `no-webgl`, the element holds the message and no canvas, `unmount` empties it and restores the element's inline style; `AstraeusScene` calls `onError` once with `no-webgl` and shows the message, without `onError` it logs once; a throwing `getContext` is treated the same.
- **The pretend page keeps WebGL (needs the owner's OK, see Implementation step 1).** happy-dom's `getContext("webgl2")` returns null, so the new check would make every existing test that renders the real viewer through `mount` or `AstraeusScene` reject (at least `tests/publicApi.test.ts` "draws into the element, and unmount removes everything it added" and its `AstraeusScene` cases, `tests/firstDraw.test.ts`, `tests/contextLoss.test.ts`). The planned fix is one shared line, not edits to those files: the shared vitest setup gives the pretend page WebGL (for example a global `vi.mock` of `api/webglCheck.ts` answering "yes" that `noWebgl.test.ts` undoes with `vi.unmock`, or a `webgl2`-only `getContext` stub; the builder picks the smaller and says which). No existing test file is edited.
- Browser check at 1440x900 and 390x844 in the existing `two-viewers` step (`journey-two-viewers.mjs`; 9 s of a 15 s limit in `docs/evidence/browser-20261124T060708Z/summary.txt`; its paths already include `api/mount.ts` and `app/AstraeusScene.tsx`, so a Full Check adds it for this diff). A no-WebGL pass loads the same page with `getContext` returning null for WebGL through an init script (a new driver helper, since scripts touch the page only through `driver.mjs`), and reads: the message element present inside the viewer and inside the window, no canvas, and the page's `ready` rejected with `no-webgl` (read through the site's existing host seam; the made-up page may record the rejection). Keep the step under its limit; if it would pass 15 s, stop and report rather than raising the limit. Update the step's line in `docs/BROWSER_CHECKS.md` (and its `browser-steps.mjs` scene text if that text lists what the step checks). Do not touch `orbit-lines` (57 s of 60 s).
- Size: expected cost about 0.3 to 0.6 KB gzip on the engine's first download (the check, the message and one CSS rule); the cap is 527,000 B and the engine was at 525,589 B before O-096, and the shelf Task in this Objective also adds a little. Report the `npm run check:pack` engine figure; if the two Tasks together pass the cap, stop and report (a raise is the owner's decision).
- CHANGELOG (`packages/astraeus/CHANGELOG.md`, open 0.11.0 section only): a `Fixed` entry; under "### Breaking changes in 0.11.0" replace the "None: ..." line if it is still there (the shelf Task may have replaced it first; then add below) with: "New code `no-webgl`, and a viewer without WebGL now rejects `ready` (it resolved and drew nothing). A `switch` over `SceneErrorCode` needs the case; catch `ready` or pass `onError`, and drop any watcher for an emptied element."
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/api/mount.ts`
- `packages/astraeus/src/api/AstraeusScene.tsx`
- `packages/astraeus/src/api/errors.ts`
- `packages/astraeus/src/api/viewerLink.ts` (`whenAttached`, `close`)
- `packages/astraeus/src/app/AstraeusScene.tsx` (the `Canvas` element only, to confirm `gl` stays an options object; `tests/contextLoss.test.ts` pins that)
- `packages/astraeus/tests/publicApi.test.ts` (the `mount` and `AstraeusScene` describe blocks)
- `packages/astraeus/vitest.setup.ts` and the root `vitest.config.ts` (which setup files each project runs)
- `packages/astraeus-site/tools/validate/journey-two-viewers.mjs`
- `packages/astraeus-site/src/synthetic/syntheticTwoViewers.ts`
- `docs/BROWSER_CHECKS.md` (the step table and "The interface driver")
- `docs/agents/browser-policy.md`
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

`.savepoint/Design.md` under `Errors and labels that tell the truth (O-083)` and `Size budgets are split`; Guardrails API-02 (both embedding paths), API-03, API-05.

## Guardrails

API-01, API-02, API-03, API-05, TEST-01, TEST-02, TEST-03, CODE-02.

## Implementation Plan

1. Read the O-096 Objective's `Decisions` for the owner's answer on the pretend page's WebGL (the shared-setup line). If it is not recorded, or the owner chose another way, stop and return REPLAN REQUIRED naming the choice.
2. Write `tests/noWebgl.test.ts` and see it fail.
3. Add `no-webgl` to `errors.ts`, then `api/webglCheck.ts`, then the call in `mount.ts` and `AstraeusScene.tsx` before the viewer renders; render the message in its place.
4. Add the shared-setup line; run the whole `npm test` and confirm no existing test changed or failed.
5. CSS rule, doc comments, README sentence, `npm run api:errors`, `npm run api:lock`, CHANGELOG.
6. Driver helper and the no-WebGL pass in `two-viewers`; run `npm run check:browser -- --step two-viewers` once (one browser job at a time).
7. `npm run check:pack` for the engine size.

## Boundaries

No handling of WebGL loss after a successful first draw (context restore already covers it); no host-supplied message text or look option; no change to how a successful viewer draws; no change to `scene.check()`; no edits to existing test files.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/noWebgl.test.ts packages/astraeus/tests/publicApi.test.ts packages/astraeus/tests/firstDraw.test.ts packages/astraeus/tests/contextLoss.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/apiSurface.test.ts`. Handoff: the configured gates (`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`), `npm run check:pack`, and `npm run check:browser -- --step two-viewers`. Evaluated later per `agent-skills/references/check-method.md`; the Full Check adds `two-viewers` and the packed examples (the API lock changes).

## Technical Evidence

Reads beyond Context Files: `packages/astraeus/src/shell/look/look.css` (head, to pick the look token for the message background), `packages/astraeus-site/src/main.tsx` (the `show`/`ready.catch` seam, to see how the page reports a rejected `ready`), `harness.mjs` (`openPage`, `watchErrors`).

Shared-setup choice (owner: "Shared setup line"): a global `vi.mock("./src/api/webglCheck")` in `packages/astraeus/vitest.setup.ts` keeping the real exports but answering `hasWebgl2: () => true`; `tests/noWebgl.test.ts` undoes it with `vi.unmock`. No existing test file edited.

| Done When | Evidence |
|---|---|
| `no-webgl` code, doc comment, README table via `api:errors` | `errors.ts`; `npm run api:errors` wrote the table |
| One check in `api/webglCheck.ts`, both entry points, loses the probe context, not in `scene.check()` | `hasWebgl2` (fresh canvas, `webgl2`, `WEBGL_lose_context`, null/throw = no); called only in `mount.ts` and `AstraeusScene.tsx`; noWebgl.test.ts |
| `mount` rejects `ready` (ordinary rejection) and holds message; `AstraeusScene` reports once, no `onReady`/`onFirstDraw` | noWebgl.test.ts: 4 cases (mount null + throwing context incl. unmount restores inline style; AstraeusScene onError once with onReady/onFirstDraw uncalled; console.error once with throwing getContext) |
| Message element with root class, `data-astraeus-no-webgl`, look tokens, CSS | `noWebglMessage()` in webglCheck.ts; `.astraeus-shell.astraeus-no-webgl` rule in style.css; two-viewers no-WebGL pass (inside window at 1280x720 and 375x667) |
| Doc comments (`ready`, `onError`), README sentence, API lock | mount.ts / AstraeusScene.tsx comments; README (handle table row, React props paragraph); `npm run api:lock` RUN (coordinator reruns after wave) |
| Tests fail before the change | new module absent / no check before; the file asserts `no-webgl` which did not exist (not separately run red against a stub) |
| Pretend page keeps WebGL | vitest.setup.ts mock; publicApi, firstDraw, contextLoss and every file matching `grep -rl "mount\|AstraeusScene" packages/*/tests` still pass |
| Browser check two-viewers | `npm run check:browser -- --step two-viewers` passed, 10 s of 15 s, error-lines 0, evidence docs/evidence/browser-steps-20261124T070025Z; new driver helpers `withoutWebgl`, `noWebglState` |
| Size | `check:pack`: engine 1,833,526 B raw (limit 1,838,000), 525,811 B gzip (limit 527,000; +222 B vs 525,589 before; T-448 may add) |
| CHANGELOG | Fixed entry and Breaking line replaced (the "None" line was still there) |
| Gates | typecheck clean; eslint clean and prettier clean on changed files; focused vitest 45 files, 746 tests passed (noWebgl, publicApi, firstDraw, contextLoss, apiRules, apiSurface, apiImports, packageBoundaries, releaseBreaks, plus every tests file naming mount/AstraeusScene) |

Files changed: packages/astraeus/src/api/webglCheck.ts (new), src/api/mount.ts, src/api/AstraeusScene.tsx, src/api/errors.ts, src/app/style.css, vitest.setup.ts, tests/noWebgl.test.ts (new), README.md, CHANGELOG.md, api-surface.lock.json; packages/astraeus-site/tools/validate/journey-two-viewers.mjs, driver.mjs, browser-steps.mjs; docs/BROWSER_CHECKS.md.

Limitations: the no-WebGL browser pass is a separate page in the same step with an init script that nulls WebGL `getContext` (software Chromium cannot be started without WebGL here); the rejection is read from an `unhandledrejection` listener on the site's own rethrow in `main.tsx`, no site source changed. No full `npm test`, per the wave rule.

## Drift Notes

None. (`browser-steps.mjs` scene text updated.)

Marked done by the coordinator under the owner's "orchestrate O-96" (2026-11-24) after the wave gate passed (`npm run typecheck`, `npm run lint`, `npm test` 343 files 5601 passed 2 skipped, `npm run build`). Owner looked on localhost:5490 (`npm run preview:owner`, branch o096-failures-said-plainly at 536bbf99, 2026-11-24T07:06Z) in Chrome with WebGL off and said "looks lovely as far as i can tell". The acceptance fields are filled in once the Full Objective Check has an id.
