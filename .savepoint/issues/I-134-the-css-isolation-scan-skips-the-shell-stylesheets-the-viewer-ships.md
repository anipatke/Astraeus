---
id: I-134
title: The CSS isolation scan skips the shell stylesheets the viewer ships
type: guardrail
status: open
source:
  kind: check
  check: C-137
  actor: {role: checker, session: o053-check-20261101}
  at: '2026-11-01T06:05:00Z'
tasks: [T-229]
checks: [C-137]
guardrail_ids: [API-03]
severity: medium
history:
  - at: '2026-11-01T06:05:00Z'
    actor: {role: checker, session: o053-check-20261101}
    kind: observed
    note: 'Found by the O-053 Full Objective Check. A planted page-wide body rule in src/shell/style.css passed every API test; the six shell stylesheets hold 289 selectors outside .astraeus-shell that no check or allowlist sees.'
    check: C-137
---

# I-134: The CSS isolation scan skips the shell stylesheets the viewer ships

## Summary

Guardrails API-03 (Required) says a viewer has "no styles outside the viewer's root class", checked by "a CSS selector scan". The O-053 Outcome says every API rule that can be mechanised has a check, so "from here on a change that breaks an API rule fails a test". T-229 scans only `packages/astraeus/src/app/style.css`. That matches the narrower wording of the Success Condition and the Task Done When. But the viewer also ships six more stylesheets, all imported by `src/shell/AstraeusShell.tsx` (lines 25-28) and `src/shell/TopBar.tsx`/`TimelineBar.tsx`, so they load with every `mount` and `<AstraeusScene>`. None of them is scanned or allowlisted. A page-wide rule added there passes. Design.md "O-053 checks" records the gap as a limit ("widening it is for the next API Objective that touches styles"). It names no Objective or Task, though, and the owner has not accepted the gap.

## Evidence

- `tools/api-rules.mjs`: `const stylePath = join(ENGINE_SRC, "app", "style.css"); export const styleSelectorBreaks = (path = stylePath) => …`, the only stylesheet read.
- Unscanned breaks, measured with the same `selectorBreaks()` (checker probe `shellcss.mjs` in the checker scratchpad): `shell/style.css` 127, `shell/TimelineBar.css` 69, `shell/phone.css` 54, `shell/TopBar.css` 21, `shell/embedded.css` 18, `shell/controls.css` 0. That is 289 selectors outside `.astraeus-shell` (e.g. `.info-panel`, `.timeline-bar`, `[data-phone="true"] .controls-pill`), against 100 in the scanned `app/style.css`.
- Planted break (checker, 2026-11-01, reverted): appended `body { margin: 0; }` to `packages/astraeus/src/shell/style.css`. `cd packages/astraeus-site && npx vitest run tests/apiRules.test.ts tests/apiSurface.test.ts tests/packageBoundaries.test.ts` gave `Tests 31 passed (31)`. The same kind of plant in `app/style.css` (`* { box-sizing: border-box; }`) fails with `selectors: new break selector *`.

## Proof Needed

- The selector scan reads every stylesheet the engine ships: every `.css` under `packages/astraeus/src/`, or every stylesheet the viewer imports. Today's breaks are allowlisted per file with finding F3 and O-055, and stale entries fail as they do now.
- Plant `body { margin: 0; }` in `src/shell/style.css`: the isolation test fails and names the file and selector. Remove the plant: it passes.
- A synthetic case proves a new stylesheet in the scanned folder gets scanned.
