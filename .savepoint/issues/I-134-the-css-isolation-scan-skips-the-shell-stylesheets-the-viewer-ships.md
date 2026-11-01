---
id: I-134
title: The CSS isolation scan skips the shell stylesheets the viewer ships
type: guardrail
status: resolved
source:
  kind: check
  check: C-137
  actor: {role: checker, session: o053-check-20261101}
  at: '2026-11-01T06:05:00Z'
tasks: [T-229]
checks: [C-137, C-138]
guardrail_ids: [API-03]
severity: medium
resolution:
  disposition: verified
  check: C-138
  actor: {role: checker, session: o053-recheck-20261101}
  at: '2026-11-01T06:40:00Z'
  reason: 'Repair 7798f19c verified by C-138 CLEAR: the selector scan reads every .css under packages/astraeus/src, the same set the build ships to dist. Checker plants of body {} in shell/style.css, shell/embedded.css and shell/controls.css, a new nested core/plantdir/zz-plant.css and * {} in app/style.css each fail naming file and selector; a stale shell entry fails; the 289 shell entries match C-137''s measured counts. Fresh gates pass as for I-133.'
history:
  - at: '2026-11-01T06:05:00Z'
    actor: {role: checker, session: o053-check-20261101}
    kind: observed
    note: 'Found by the O-053 Full Objective Check. A planted page-wide body rule in src/shell/style.css passed every API test; the six shell stylesheets hold 289 selectors outside .astraeus-shell that no check or allowlist sees.'
    check: C-137
  - at: '2026-11-01T07:00:00Z'
    actor: {role: executor, session: o053-repair-20261101}
    kind: repair_attempted
    note: "Repair, not verified. tools/api-rules.mjs styleSelectorBreaks now scans every .css under packages/astraeus/src (stylesheets() derives the set, no names listed) and names each site 'file.css: selector'. apiIsolation.allowlist.json: the 100 app/style.css entries re-keyed with the file, 289 shell entries added (F3, O-055); stale entries still fail. New test proves a new stylesheet in the folder (and a nested one) is scanned and non-css files ignored. Proof Needed re-run: plant 'body { margin: 0; }' in src/shell/style.css -> fails 'new break selector shell/style.css: body'; plant '.top-bar-x' in src/shell/TopBar.css -> fails naming shell/TopBar.css; new src/shell/zz.css -> fails naming it; all reverted, tree passes. Neighbours: lint, typecheck, build, npm test (2231 passed, 1 skipped), check:pack pass. Design.md limit text updated. Unverified: scan reads source CSS, not built dist CSS."
    check: C-137
  - at: '2026-11-01T07:30:00Z'
    actor: {role: executor, session: o053-repair-20261101}
    kind: repair_attempted
    note: "Follow-up, not verified. Owner decision C-137 O2 (2026-11-01): allowlists can only grow with an owner approval. The 389 selector entries (100 re-keyed with the file name, 289 shell) carry approved {by owner, 2026-11-01, reason quoting C-137/I-134}; new tests/allowlistGrowth.test.ts compares with git main (ALLOWLIST_BASE=HEAD used to prove it: planted entry fails, tree passes)."
    check: C-137
  - at: '2026-11-01T06:40:00Z'
    actor: {role: checker, session: o053-recheck-20261101}
    kind: rechecked
    check: C-138
    note: 'Verified by C-138 CLEAR (Full Objective re-check of O-053 at 7798f19c).'
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
