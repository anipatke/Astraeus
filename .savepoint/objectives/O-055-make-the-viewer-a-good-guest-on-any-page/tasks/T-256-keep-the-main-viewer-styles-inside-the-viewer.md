---
id: T-256
title: Keep the main viewer styles inside the viewer
objective: O-055
status: done
depends_on: [{task: T-255, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-256, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o055-run-20261102}, recorded_at: '2026-11-02T09:49:15Z'}
planned_by: {role: planner, session: o055-planning-20261102}
---

# Keep the main viewer styles inside the viewer

## Outcome

The viewer's stylesheet no longer styles the host page's `:root`, `html`, `body` or `#app`, and every rule in `src/app/style.css` and `src/shell/style.css` sits under `.astraeus-shell`, with the look unchanged; the site and both examples set their own page styles (O-055 Success Condition 7, first half; review F3; API-03).

## User Check

Not owner-facing as a step: the look is meant to stay the same. The owner's one look at 375x667 and 1280x720 on `localhost:5490` is at T-258, after both style steps.

## Done When

- **Page rules gone.** `src/app/style.css` has no `:root`, `html`, `body` or `#app` rule: its custom properties, `color-scheme` and base font move onto `.astraeus-shell` (merged with the shell's own root rule, one place for each value); the old `#app { position: relative; overflow: hidden }` becomes the viewer's own: `mount` and the `AstraeusScene` wrapper make their element a containing block (`position: relative` when it is static, `overflow: hidden`) next to the `isolation` they already set, so `.astraeus-shell { position: absolute; inset: 0 }` fills the host's element and not the page. `packages/astraeus-site/app.html`, `examples/hello-scene/index.html` and `examples/hello-react/index.html` set their own `html`, `body` and `#app` size and background (the examples already do; the site gains it).
- **Scoped.** Every selector in `src/app/style.css` and `src/shell/style.css` starts with `.astraeus-shell` (a descendant of it, or the root itself with an attribute or pseudo-class), so `node tools/api-rules.mjs css` lists no break for either file, and their 227 `selector` entries (`app/style.css` 100, `shell/style.css` 127) are removed from `packages/astraeus-site/tests/apiIsolation.allowlist.json` in the same change.
- **Cascade kept.** Before editing, a throwaway script (kept out of the repo, its output in Technical Evidence) lists every property where a rewritten rule now ties or outranks an already-scoped rule (`shell/controls.css`, scoped rules in these files, `embedded.css` root rules) for the same element class; each listed case is resolved so the computed value is as before (order, or the rule's own selector), and the resolution is recorded. Nothing in the 3D canvas is styled differently.
- **Proof in the fast suite.** A DOM test (new `packages/astraeus/tests/viewerStyles.test.ts`, or extend `hostPageDom.test.ts`) mounts a viewer into a host page with its own `body` font, colour and `button` rule and checks: the host's `html`, `body` and its own elements keep their computed styles after `mount` and after `unmount`; the viewer's root carries the custom properties; the mount element is a containing block; a second viewer in a 400x300 element fills that element only. If the test environment does not apply imported stylesheets, the test injects the source CSS files into a `<style>` element itself and says so. The existing DOM layout tests (`domShell`, `domPhone`, `domEmbedded`, `appScreenDom`) pass unchanged or with a recorded reason for each edit.
- **Nothing public moved:** `git diff --exit-code -- packages/astraeus/api-surface.lock.json` is empty; `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts` passes. CHANGELOG Unreleased gains the entry with its migration line (the viewer no longer styles `html`, `body` or `#app`: give the element a size yourself).
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; `node tools/build-example.mjs hello-scene` and `node tools/build-example.mjs hello-react` build; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/app/style.css`, `packages/astraeus/src/shell/style.css`, `packages/astraeus/src/shell/controls.css`, `packages/astraeus/src/shell/embedded.css` under its root rules, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx` under the wrapper element, `packages/astraeus-site/app.html`, `examples/hello-scene/index.html`, `examples/hello-react/index.html`, `packages/astraeus-site/tests/apiIsolation.allowlist.json`, `tools/api-rules.mjs` under `selectorBreaks`, `packages/astraeus/tests/hostPageDom.test.ts`.

## Design References

`.savepoint/Design.md` under `O-053 checks (Guardrails API-01 to API-07)` (the CSS scan bullet); the O-055 Objective under `Architectural Considerations` (planned decisions: root-class prefix); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F3).

## Guardrails

API-03, TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Run the cascade listing script on the two files against the already-scoped rules.
3. Move the page rules; make the mount element a containing block; give the site page its own styles.
4. Prefix every selector; resolve each listed cascade case; remove the 227 entries.
5. DOM test; example builds; CHANGELOG; gates.

## Boundaries

`src/app/style.css`, `src/shell/style.css`, the two wrappers and the three host pages only; the bar, phone and embedded sheets are T-257. No look change intended. Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the Full Objective Check's one `npm run check:browser` (its control-style comparison) and the owner's look cover the appearance. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Throwaway scripts (outside the repo): `/tmp/claude-1000/-home-user-code-Astraeus/6ace7dd6-3481-4a4c-93b6-30c2035a8bd4/scratchpad/cascade.mjs` (lists, for every declaration pair in the bundle order app/style, TopBar, TimelineBar, controls, shell/style, phone, embedded, where the winner flips once the plain prefix adds one class of weight), `apply.mjs` (rewrites selectors), `verify.mjs` (compares HEAD against the working tree).

- **Cascade listing (before editing).** Plain `.astraeus-shell ` prefix: 148 winner flips (same-value pairs dropped), all with the rewritten rule newly winning against an already-scoped or other-sheet rule. Groups: (a) `.hud button|input|select` and their `:hover` / `[aria-pressed]` forms against controls.css `.astraeus-shell button|select|.ui-icon|.ui-bare|.ui-pill|.ui-ghost|.ui-accent|.ui-row` (min-height, padding, border, radius, background, color, font) and `.astraeus-shell input[type=...]` (box-sizing, width, min-height); (b) `.moons-toggle`, `.moon-picture`, `.story-panel-close`, `.story-panel-continue` (button classes at weight 0,1,0, which lost to controls.css `.astraeus-shell button` at 0,1,1: min-height, padding, font, line-height) ; (c) span and paragraph rules (`.info-panel-badge`, `.story-badge`, `.metric-*`, `.moon-*`, `.visually-hidden`, `.sources-*`, `.info-panel-description`, `.story-panel-body p`, `.developer-heading p`, `.telemetry-state > span`, `.hud .overlay div`) against TopBar.css, TimelineBar.css and phone.css tag selectors such as `.scale-explanation-panel p`, `.timeline-event-list summary span`, `.drawer-handle span`. The listing is by class and tag, not by real element, so group (c) is mostly pairs that never meet on one element; they are resolved the same way for safety.
- **Resolution.** Each rewritten rule that gained weight was written as `.astraeus-shell :where(.first-class) rest` (or `.astraeus-shell:where([data-phone="true"]) ...`), which keeps its pre-prefix weight exactly, so it ties or loses to the other sheets as before; order is unchanged. Iterated to a fixed point: 42 selectors needed it (listed in `w3.json` beside the scripts). The other rules take the plain prefix. A comment above the root rule in shell/style.css explains the form.
- **Cascade kept (after).** `verify.mjs` over HEAD versus the working tree: same declaration count and values in both files (the root rule's 12 added declarations excluded), `0 flips`. Not a browser computed-style listing at 375x667 / 1280x720; the Task's method (a stylesheet pair listing) did not need one. Limits: heuristic subject overlap (class subset or same tag, class to tag via className usage in the TSX), coarse property families, media conditions ignored, so a pair on an element the heuristic cannot see could be missed; the Full Check's `npm run check:browser` control-style comparison is the backstop.
- **Page rules.** `:root`, `html, body, #app` and `#app` removed from app/style.css. Their custom properties, `color-scheme` (already there), `background: #000`, colour and 14px base font are now on `.astraeus-shell` once (shell/style.css root rule). `height: 100%; margin: 0` are the page's: app.html gained `html, body, #app { height: 100%; margin: 0; background: #000 }`, `html { color-scheme: dark }`, `#app { position: relative; overflow: hidden }` (the site mounts `App` directly, not through `mount`); both examples already set `html, body, #app` size and background, and `mount` / `AstraeusScene` now supply the containing block (new `src/api/containingBlock.ts`: `position: relative` when static, `overflow: hidden` when visible; empty computed values, as in a test DOM, count as the defaults). No example file needed an edit.
- **Scoped.** `node tools/api-rules.mjs css | grep -E "(app|shell)/style.css"` lists nothing; 227 `selector` entries removed from apiIsolation.allowlist.json (389 to 162).
- **DOM test.** New `packages/astraeus/tests/viewerStyles.test.ts` (happy-dom, injects the source sheets into a `<style>` itself): 9 tests, both entry paths (`mount`, `AstraeusScene`) table-driven, plus an environment control that an unscoped rule does restyle the host button. Run 10 times: 10/10 pass. Against the HEAD stylesheets it fails 4 of 9 (host body/button restyled, no custom properties on the root), so it can fail. Existing DOM layout tests (domShell, domPhone, domEmbedded, appScreenDom) pass unchanged.
- **Nothing public moved.** `git diff --exit-code -- packages/astraeus/api-surface.lock.json` clean; apiSurface, apiRules, allowlistGrowth tests 32/32. CHANGELOG Unreleased entry with migration line added.
- **Gates.** `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 199 files, 2485 passed, 1 skipped; `node tools/build-example.mjs hello-scene` and `hello-react` build; `npm run check:pack` pass; `npm run check:react-consumer` pass. No browser run.
- **scenePin / viewerLinkPin.** No entries changed.

## Drift Notes

Record architecture deltas here; T-258 reconciles them into Design.md.

- The root rule now also carries `background: #000` and the `--ui-*` / `--perf-*` properties (previously on the host's `:root` / `#app`); Design.md's note on the viewer's page-level styles should say the viewer owns none. Selectors that needed `:where()` to keep their old weight (42, pre-prefix specificity) are the places T-257 should look at first when it prefixes the bar, phone and embedded sheets; once those are scoped the weights can be rebalanced and the `:where()` forms retired. Deferred to T-258.
