---
id: T-410
title: Look lock keeps only what the look rules need
objective: O-088
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-410, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: look
planned_reads: [packages/astraeus/src/app/style.css, packages/astraeus/src/shell/look/look.css, packages/astraeus/tests/viewerStyles.test.ts, packages/astraeus/tests/lookDrift.test.ts, packages/astraeus/tests/interfaceLook.test.ts, packages/astraeus/tests/domSetup.ts]
planned_writes: [packages/astraeus/src/app/style.css, packages/astraeus/tests/computedLook.test.ts, packages/astraeus/tests/fixtures/computed-look.baseline.json, tools/look-lock.mjs, package.json]
---

# Look lock keeps only what the look rules need

## Outcome

The computed-look snapshot (a 302 KB baseline of 56 properties for every element, keyed by element index, so one new element shifts every later key; `computedLook.test.ts` ~185) is replaced by focused checks of the look rules it was added for, and the baseline, its writer and the `look:lock` script are retired (AH-33; Gemini: 16 s of `npm test`; G-024 decision 4). The look rules it served (Design `Good guest` item (6) Styles, I-140): the two bundle orders give the same look, and the specificity convention keeps class rules from beating the generic control rules (the I-140 flip). Token use, host isolation and the look defaults are already checked elsewhere (`lookDrift.test.ts`, `viewerStyles.test.ts`, `interfaceLook.test.ts`).

## User Check

None visual; no stylesheet changes. `npx vitest run packages/astraeus/tests/computedLook.test.ts` passes, faster than today (time recorded).

## Done When

- `computedLook.test.ts` keeps its render harness (the real App, four layouts, two definitions, every fold and panel open) and replaces the baseline comparison with:
  - **Bundle orders agree:** per layout and definition, every element's computed style under the "site" order equals the "mount" order (`ORDERS`, ~42), element by element, with elements keyed by ancestry path and position among siblings, not by a global index. No file is read.
  - **Specificity convention (I-140) and named parts:** a small table of named parts found by role, accessible name or a stable class (for example the open and closed nested fold heading, a top-bar button, a panel, the information panel text), each asserting only the properties the look rules govern (`color`, `background-color`, `font-size`, `font-weight` where relevant) equal to the value of the look token it should take from `look.css` (read from the stylesheet, not retyped). The nested fold heading case asserts accent when open and muted when closed, the I-140 defect.
  - The existing guards that the drawer is open with a nested fold, and that more than 100 elements render, stay.
- **Planted breaks, recorded then reverted, before the baseline is deleted:** (1) remove the `:where(...)` from `style.css` ~73 (`.astraeus-shell :where(.hud .collapsible-nested) .collapsible-toggle`): the I-140 case fails; (2) move one rule so it wins only by source order (for example duplicate a `look.css`-token rule later in `app/style.css` with a different token): the bundle-orders case fails. Both run against the new test while the old baseline still exists, showing the old test also fails on them (so nothing it caught for these rules is lost).
- If the bundle orders do not agree today, stop: record the differing elements and properties and return them to the coordinator (that is either a real look defect or a reason to compare per order); do not write exclusions on your own.
- Deleted after the planted breaks: `packages/astraeus/tests/fixtures/computed-look.baseline.json`, `tools/look-lock.mjs`, the `look:lock` script in root `package.json`, the `LOOK_UPDATE` branch and "writes the baseline" case in the test. A search for `look:lock`, `look-lock` and `computed-look.baseline` outside `docs/evidence`, `audits`, `.savepoint/checks|issues|objectives` and `docs/architecture/` history lists only `.savepoint/Design.md` lines (Drift Notes).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/tests/computedLook.test.ts` (whole file: the subject)
- `packages/astraeus/src/app/style.css` (~60–80, the collapsible rules) and `packages/astraeus/src/shell/look/look.css` (the token block only)
- `packages/astraeus/tests/lookDrift.test.ts`, `viewerStyles.test.ts`, `interfaceLook.test.ts` (header comments only, to avoid duplicating them)
- `tools/look-lock.mjs` (whole, short)
- root `package.json` (`scripts` only)

## Design References

`.savepoint/Design.md` under `Good guest` (item (6) Styles only).

## Guardrails

API-03, TEST-01, TEST-02, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Time today's test. Add the order-agreement check beside the baseline check; run; stop if orders differ.
2. Add the named-part table with token values read from `look.css`.
3. Planted breaks against both old and new checks; record; revert (`git diff` on the CSS empty).
4. Remove the baseline comparison, the update path, the fixture, the writer and the script; search.
5. Focused run (time), gates.

## Boundaries

Test, tool and script only; no stylesheet or component change. No new snapshot of any kind. No owner look needed: nothing visible changes.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/computedLook.test.ts packages/astraeus/tests/viewerStyles.test.ts packages/astraeus/tests/lookDrift.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Boundary widened for I-194 (owner: Make both like the site): `packages/astraeus/src/app/style.css` added to planned_writes.

Colliding rules (confirmed by the bundle-order test, red on HEAD's CSS in all 8 scenarios): app/style.css `.astraeus-shell :where(.hud) button|input|select` (0,1,1: min-height, padding 6px 8px, radius-s) against controls.css `.astraeus-shell button|select|summary.ui-button` (0,1,1: padding 0 12px, pill radius, min-height) and the phone `control-height`; equal weight, so source order decided.
Fix: the drawer rule is now `:where(.hud) button:is(button)` (and input, select): one type selector heavier (0,1,2), so it beats the generic rules in either order and still loses to class variants (0,2,0: .ui-icon, .ui-bare, ...) as in the site order. No per-button override; embedder rules outside the viewer root class are unaffected.

| Done When | Evidence |
|---|---|
| Bundle orders agree, per layout and definition, keyed by ancestry path, no file read | `computedLook.test.ts` "look rules: the two bundle orders give the same look" (8 cases) passes; red on HEAD CSS (padding, radius, min-height diffs) |
| Named parts take look tokens; nested fold open accent, closed muted | "look rules: named parts take their look tokens" (nested fold toggle, plain top-bar button, information toggle), token values read from look.css |
| Drawer-open-with-nested-fold and >100 elements guards stay | in the order test (`collapsible-nested` key present, `site.size > 100`) |
| Planted breaks | (1) `:where(.hud .collapsible-nested)` unwrapped in style.css: named-part case failed (and the old site baselines failed); (2) `.astraeus-shell .ui-ghost { color: var(--astraeus-accent) }` appended to style.css: all 8 bundle-order cases failed (and old site baselines failed). Run under the gates flock; style.css restored (git diff shows only the intended I-194 edit) |
| Retired | baseline json, tools/look-lock.mjs, `look:lock` script, LOOK_UPDATE and "writes the baseline" case deleted; search for `look:lock`, `look-lock`, `computed-look.baseline` outside the excluded paths lists only `.savepoint/Design.md` (and `audits/2026-11-21_...auditfindings.md`, docs/evidence files are excluded history) |
| Gates | lint: eslint clean, prettier warns only in other builders' files (astraeus-site streamCheck.test.ts, browser-exit/draws-through-harness.mjs); typecheck pass; build pass; check:pack pass, engine 1,836,372 B raw (limit 1,838,000), 525,692 B gzip (limit 527,000); npm test: 2 failures in other builders' files (see report), computedLook/viewerStyles/lookDrift 40 passed |

Focused run: 3 files, 40 tests, 5.7 s (the computedLook file alone was ~11 s with the baseline). Extra reads: Design `Good guest` item (6) (via grep), `packages/astraeus/src/shell/parts/controls.css` (collision source), api/AstraeusScene.tsx import line; reason: find the colliding rules.
Limitations: happy-dom's cascade, not a browser's; the owner judges the buttons on localhost:5490 (I-194 Proof Needed).

## Drift Notes

Expected: `.savepoint/Design.md` under `Good guest`, item (6), describes the baseline and `npm run look:lock`; the planner rewrites it to the two focused checks. Also add: the drawer control-density rule is `:where(.hud) button:is(button)` (0,1,2) so both bundle orders agree (I-194).

## Coordinator

Parked 2026-11-22: the builder found the two bundle orders disagree today (I-194: button padding, radius, min-height). Owner decision pending on the intended look; the remaining T-410 work (~20 min) resumes after it. Draft at /tmp/claude-1000/T-410-draft-computedLook.test.ts.
- Owner decided 2026-11-22 ("Make both like the site", I-194): resumed, no longer parked.

## Coordinator (gates)

Set done by the orchestrating session after the combined handoff gates passed with T-402..T-404 and T-406..T-412 together (owner: "I mark them as they pass", O-038; G-024 decision 7 "Orchestrate each objective to completion"; owner 2026-11-22 "I am remote now, add park the check and move on"): lint and Prettier clean, typecheck clean, `npm test` 324 files, 5319 passed, 2 skipped; `npm run check:pack` pass, engine 1,836,372 B raw (cap 1,838,000), 525,692 B gzip (cap 527,000).
