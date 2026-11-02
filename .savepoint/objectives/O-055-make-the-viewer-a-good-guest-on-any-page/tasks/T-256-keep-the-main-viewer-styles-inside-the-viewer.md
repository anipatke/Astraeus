---
id: T-256
title: Keep the main viewer styles inside the viewer
objective: O-055
status: planned
depends_on: [{task: T-255, requires: clear}]
owner_validation: {required: false}
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

Pending execution.

## Drift Notes

Record architecture deltas here; T-258 reconciles them into Design.md.
