---
id: C-037
scope: {kind: task, id: T-058}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261016-night}
executed_session: t058-builder-2026-10-16
checked_at: '2026-10-16T11:56:00Z'
reviewed:
  base_commit: 9e001ba
  head_commit: 8130ff6
  files:
    - src/app/App.tsx
    - src/app/FrameRateSection.tsx
    - src/app/SettingControls.tsx
    - src/app/viewLink.ts
    - src/app/style.css
    - src/shell/style.css
    - src/app/AstraeusScene.tsx
    - src/app/experienceDefinition.ts
    - tests/viewLink.test.ts
    - tools/validate/browser-view-link.mjs
  dependencies: [T-038]
issues: []
supersedes: null
---

# C-037: T-058 Task Check (Quick)

## Scope Lock

1. T-058 Done When 1–6, plus the owner-added Copy view link and startView. Guardrails ARCH-01, TEST-01..03.
2. Out of scope: the owner's look at the panel.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 empty card | not rendered; cards take their own height | after/ screenshots viewed by the checker (Perseids, Apollo, 1440 and 390) |
| DW2 setting rows and groups | one row per setting, label/control/value; groups View, Sky, Sun glow, Labels, Data, shown only where applicable; glow keyed on settings, not a body name (name check passes in the full test run) | screenshots; c-t.log |
| DW3 subtitle | generic: "Live readouts, controls and diagnostics for this scene." | screenshot |
| DW4 overflow | scrolls inside with edge shadows; phone panel between the bars and the timeline | screenshots |
| DW5 frame-rate labels | no "Frames per / second" split on phone | phone screenshot |
| DW6 no behaviour change | shell, spike03, sky, sun and showers pass at HEAD | summary.txt |
| View link | the round trip passes within 1.5° / 2% (view-link exit 0); malformed `?view=` ignored (viewLink.test.ts "ignores a malformed link…", plus probe1's four bad forms, 0 errors) | view-link.log; probe1 |

## Gates (fresh, checker, committed HEAD 8130ff6 in a clean worktree `/home/user/code/astraeus-check-8130ff6`, 2026-10-16 ~10:50Z, node v24.16.0)

- `npm run typecheck`: exit 0. `npm run build`: exit 0. `npx vitest run`: 45 files, 828 passed, 1 skipped (`docs/evidence/o011-check-20261016T105315Z/c-t.log`).
- `git diff --check f5a9273 8130ff6`: one blank line at EOF in docs/DONOR_PROVENANCE.md, and trailing whitespace in two committed vite logs. Cosmetic; observation only.
- Browser: all 21 `tools/validate/browser-*.mjs` scripts (spike02, spike03, shell, anchor-labels, synthetic ×5, marker-existing, sky, sky-map, sun, earth-moon, jupiter-io, showers perseids, showers geminids, showers-gmn, view-link, precision, lighting) against vite :5450 serving the worktree: 21/21 exit 0 with zero console errors. `docs/evidence/o011-check-20261016T105315Z/summary.txt` lists each command and time; `docs/evidence/o011-check-20261016T105315Z/check-run.sh` is the runner. (The single "console-error-lines=1" in showers-gmn is its own "ok, zero console errors" line.)
- Public build (`ASTRAEUS_PUBLIC_BUILD=1 vite build` of the worktree, `vite preview` :5451): index, assets, app and the Perseids, Geminids and Apollo demos load with zero console errors and no failed requests (`docs/evidence/o011-check-20261016T105315Z/probes/probe2.mjs` output). The public-build validator found no local data in the integration-time run, and in the coordinator's run on the same tree (no matches).

## Issues Pass

All criteria are Proven. No Issues, so no materiality actions are required.

## Owner validation still needed

The owner's look at the panel in each experience, desktop and phone, and at the view-link round trip.

## Observations

- The builder made additive edits to AstraeusScene.tsx despite the Task's Boundary, to deliver the owner-added startView. They were disclosed, and the I-028 lines are untouched; I-028 still passes.
- The phone panel's top offset (172 px) is a fixed value tuned to the current toolbar height.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: tonight's commits are large (aea091d 52 files, 721d95a 49 files), mostly evidence and shared-file batching by the orchestrator.
