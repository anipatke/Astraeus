---
id: T-257
title: Keep the bar, phone and embedded styles inside the viewer
objective: O-055
status: planned
depends_on: [{task: T-256, requires: clear}]
owner_validation: {required: false}
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

Pending execution.

## Drift Notes

Record architecture deltas here; T-258 reconciles them into Design.md.
