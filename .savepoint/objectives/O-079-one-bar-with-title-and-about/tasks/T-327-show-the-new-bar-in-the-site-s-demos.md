---
id: T-327
title: Show the new bar in the site's demos
objective: O-079
status: planned
depends_on: [{task: T-332, requires: clear}]
check_waiver: {task: T-327, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Show the new bar in the site's demos

## Outcome

Every demo on the site sets an About from its existing name and credits, so the owner can judge the one bar and About on desktop and phone at localhost:5490; Design.md describes the bar, About and phone row as built.

## User Check

On localhost:5490, open each demo at 1280×720 and 375×667: the bar shows the demo's title (or "i" on a tight phone row), the switch tabs and the menu; About lists the demo's credits and ends with "Built with Astraeus" and the version; nothing overlaps. The owner records the result.

## Done When

Each demo calls `setAbout` with its title, a short title where the full one is long, and its credits with source links taken from the existing credit records (one source of truth, no copied text where a record can be read); a site test asserts each demo has an About; the browser journeys pass at both sizes under the browser policy; Design.md is reconciled for every drift note from T-328, T-330, T-326, T-329, T-331 and T-325 (each reflected or marked non-architectural with a reason) before the Full Objective Check; owner validation recorded. Apply `docs/agents/verification.md`.

## Context Files

- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-325-give-the-bar-a-title-that-opens-about.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-326-put-the-phone-s-controls-in-one-bar-row.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-329-place-every-panel-by-one-rule.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-330-set-up-the-screen-areas-and-one-shared-look.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-331-rebuild-the-timeline-on-the-new-layout.md` under `Drift Notes`
- `docs/architecture/viewer-interface.md`
- `.savepoint/Design.md` under `Components/Codebase Map`
- `.savepoint/Design.md` under `Host-page behaviour`
- `packages/astraeus-site/src/main.tsx`
- `packages/astraeus-site/src/pageTitle.ts`
- `packages/astraeus-site/tools/site/package-credits.mjs`
- `packages/astraeus-site/tools/validate/journey-planets-phone.mjs`
- `docs/agents/browser-policy.md`

## Design References

Design "Components/Codebase Map" (site row), "Host-page behaviour", "Public API shape (G-016, owner 2026-11-01)" (use the front door ourselves).

## Guardrails

ARCH-01, PROV-01, API-01, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Find where each demo's name and credits already live (page title, package credits); build each demo's About from them in the site, not in the engine (story data never bundled into the engine).
2. Call `setAbout` on every demo scene in `main.tsx`; add short titles where the full name would crowd the phone row.
3. Site test: every demo scene has an About with at least one credit.
4. Run the browser journeys at 1280×720 and 375×667, one browser job at a time.
5. Reconcile Design.md (bar, About, phone row, short labels, any embedded finding) and the decision note from the drift notes of T-330, T-326, T-329, T-331, T-325 and T-332, and confirm the old stylesheets and placement code are gone and the contributor guide matches the code.
6. Ask the owner to judge the demos on localhost:5490 and record the result.

## Boundaries

No engine changes beyond fixes the demos reveal (report them; return REPLAN REQUIRED if they are material), no outside apps, no version bump.

## Technical Verification

Configured gates, the site tests and the browser journeys under the browser policy; owner validation on localhost:5490. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

This Task is the deferred Design reconciliation point for T-330, T-326, T-329, T-331, T-325 and T-332 (AGENTS.md project rule).
