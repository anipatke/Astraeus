---
id: T-257
title: Keep the bar, phone and embedded styles inside the viewer
objective: O-055
status: done
depends_on: [{task: T-256, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-257, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o055-run-20261102}, recorded_at: '2026-11-02T09:55:47Z'}
planned_by: {role: planner, session: o055-planning-20261102}
---

# Keep the bar, phone and embedded styles inside the viewer

## Outcome

Every rule in `src/shell/TimelineBar.css`, `TopBar.css`, `phone.css` and `embedded.css` sits under `.astraeus-shell`, with the look unchanged on phone, desktop and embedded layouts, and the O-053 isolation allowlist has no breaks left (O-055 Success Condition 7, second half; review F3; API-03).

## User Check

Not owner-facing as a step: the look is meant to stay the same. The owner's one look at 375x667 and 1280x720 on `localhost:5490` is at T-258.

## Done When

- **Scoped.** Every selector in the four files starts with `.astraeus-shell`; rules keyed on the shell's own attributes are written on the root (`[data-phone="true"] .x` becomes `.astraeus-shell[data-phone="true"] .x`, likewise `data-embedded` and `data-timeline-hidden`), not as a descendant attribute match. `node tools/api-rules.mjs css` prints nothing; the 162 `selector` entries (`shell/TimelineBar.css` 69, `shell/phone.css` 54, `shell/TopBar.css` 21, `shell/embedded.css` 18) are removed in the same change, so `packages/astraeus-site/tests/apiIsolation.allowlist.json` has `"breaks": []`. The allowlist file and its scan stay, so a new break fails `apiRules.test.ts`.
- **Cascade kept.** The same throwaway listing as T-256, run over these four files against every already-scoped rule (including the two files T-256 scoped); each tie or reversal is resolved so the computed value is as before, and recorded in Technical Evidence. The order the shell imports its sheets (`AstraeusShell.tsx`: controls, style, phone, embedded) is unchanged.
- **Proof in the fast suite.** `domPhone.test.ts`, `domEmbedded.test.ts`, `phoneLayout.test.ts`, the timeline and top-bar DOM tests pass unchanged or with a recorded reason for each edit. The style test from T-256 gains rows for the phone (`data-phone="true"`) and embedded (`data-embedded="true"`) roots: a host element carrying the same `data-phone` / `data-embedded` attribute outside the viewer is not restyled.
- **Nothing public moved:** `git diff --exit-code -- packages/astraeus/api-surface.lock.json` is empty; `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/shell/TimelineBar.css`, `packages/astraeus/src/shell/TopBar.css`, `packages/astraeus/src/shell/phone.css`, `packages/astraeus/src/shell/embedded.css`, `packages/astraeus/src/shell/controls.css`, `packages/astraeus/src/shell/AstraeusShell.tsx` under its stylesheet imports and root element, `packages/astraeus-site/tests/apiIsolation.allowlist.json`, `tools/api-rules.mjs` under `selectorBreaks`, the style test written by T-256, and T-256 Technical Evidence (the cascade listing).

## Design References

`.savepoint/Design.md` under `O-053 checks (Guardrails API-01 to API-07)`; the O-055 Objective under `Architectural Considerations` (planned decisions: root-class prefix); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F3).

## Guardrails

API-03, TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Run the cascade listing over the four files.
3. Prefix every selector (root-attribute form for the shell's own attributes); resolve each listed case; remove the 162 entries.
4. Extend the style test; gates.

## Boundaries

The four stylesheets and the allowlist only. Sizes still follow the browser window (`vw`, `dvh`); moving them to the viewer's own box is outside O-055. Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the Full Objective Check's one `npm run check:browser` and the owner's look cover the appearance. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built by a throwaway script: the four sheets were rewritten (plain `.astraeus-shell` prefix; `[data-phone]`, `[data-embedded]` leading attribute compounds moved onto the root; `main.astraeus-shell[data-timeline-hidden]` became `.astraeus-shell:is(main)[data-timeline-hidden]`, which keeps the old weight and still starts with the root class). The cascade listing (all seven sheets, HEAD vs tree, per property and overlapping subject) first showed 49 flips with a plain prefix (rules that already began `.astraeus-shell`, such as `.astraeus-shell button`, `.astraeus-shell .ui-row`, the `:where(.hud) button` forms, and `main.astraeus-shell[data-timeline-hidden] .shell-top`, gained a point on the bar/phone rules), resolved by `:where()` on the first class of 17 selectors, then a greedy pass that tried each `:where()` across all six scoped sheets as plain: 32 retired (T-256's 42 plus this Task's), 31 kept. Final listing: 0 flips across all sheets, HEAD vs tree.

Kept `:where()` forms (each flips a winner if made plain; the rule it would beat is a controls.css generic element/`.ui-*` rule or the `.hud` element rules, which won at lower weight before):
- app/style.css: `.hud button`, `.hud input`, `.hud select`, `.hud button:hover:not(:disabled)`, `.hud select:hover`, `.hud button[aria-pressed]`, `.hud .mission-summary summary`, `.advanced-readouts summary`, `.hud .view-link-field input`, `.hud .setting-buttons`, `.hud-section-frame .frame-body`, `.developer-heading p`, `.collapsible-body[hidden]` (they set sizes/colours that `controls.css` `.astraeus-shell button|select|input|.ui-row` and the later bar rules outranked or lost to).
- shell/style.css: `.info-panel-subtitle`, `.info-panel-description`, `.developer-tools summary:focus-visible`, `.story-panel-body p`, `.story-panel-close`, `.story-panel-continue`, `.moons-toggle`, `.moon-note`, `.moon-picture` (each is a class rule that today loses to `.astraeus-shell button` or `.hud button`).
- shell/TimelineBar.css: `.timeline-expanded li button`, `.timeline-track input[type=range]` (+`:focus-visible`), `.timeline-group-item` (lose today to `.astraeus-shell button|.ui-row|input[type=search]` or `.hud button`).
- shell/phone.css: `.drawer-handle`, `.drawer-handle-top`, `.drawer-handle-bottom`, `.timeline-speed-slider input` (lose today to `.astraeus-shell button`, `.hud button`, `input[type=search]`).
- shell/embedded.css: `[data-embedded="true"]:where([data-phone="false"]) .shell-top` (weight 0,3,0: ties `.astraeus-shell:has(.timeline-bar) .shell-top` and loses to `:is(main)[data-timeline-hidden] .shell-top`, as before).
Per-kept-selector flip lists were produced by the throwaway script (scratchpad p3.mjs / reasons.txt).

Style test `packages/astraeus/tests/viewerStyles.test.ts` gained: a table of five host wrappers (no attribute; `data-phone=true`; `data-embedded=true data-phone=false`; `data-embedded=true data-phone=true`; `data-timeline-hidden=true`) with 20 bar/phone/panel class names and a range input, whose computed values must be identical before and after the sheets are injected and after removal (fails against the old sheets: 9 failures); and, for each entry path (`mount`, `AstraeusScene`) x (`data-phone`, `data-embedded`), a host element with the same attributes beside a live viewer is not restyled. 10 consecutive runs: 18/18 each. Edited `domEmbedded.test.ts` lines 76-77 (the source-text regexes now allow the `:where(...)` close paren after `.drawer-handle` and `.timeline-speed-slider`); reason: the selector text changed, the 44 px promises are unchanged.

Gates: `node tools/api-rules.mjs css` prints nothing; allowlist `"breaks": []`; api-surface.lock.json unchanged; apiSurface/apiRules/allowlistGrowth 32 passed; `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm test` 199 files, 2494 passed, 1 skipped. No browser run.

## Drift Notes

Record architecture deltas here; T-258 reconciles them into Design.md.

- Deferred to T-258: the `:where()` convention is now retained at 31 sites (list in Technical Evidence), only where a plain prefix would let a class rule beat the generic `.astraeus-shell button|select|input|.ui-*` rules; Design.md should state that convention. `main.astraeus-shell` became `.astraeus-shell:is(main)` to keep its weight. No public surface change.
