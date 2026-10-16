---
id: C-038
scope: {kind: task, id: T-059}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261017-night}
executed_session: t059-builder-2026-10-16
checked_at: '2026-10-17T03:15:00Z'
reviewed:
  base_commit: 3e1d130
  head_commit: cd40140
  files:
    - src/shell/storyPanels.ts
    - src/shell/useStoryPanels.ts
    - src/shell/StoryPanelView.tsx
    - src/shell/AstraeusShell.tsx
    - src/shell/TimelineBar.tsx
    - src/shell/experience.ts
    - src/shell/style.css
    - src/app/App.tsx
    - src/app/AstraeusScene.tsx
    - src/app/StoryMarkers.ts
    - src/experiences/apollo11/apollo11.ts
    - src/main.tsx
    - docs/DONOR_PROVENANCE.md
    - tests/storyPanels.test.ts
    - tools/validate/browser-story-panels.mjs
  dependencies: []
issues: []
supersedes: null
---

# C-038: T-059 Task Check (Quick)

## Scope Lock

1. T-059 Done When 1–5 (panel schema and named errors, auto-open on forward playback with a pause setting, markers reopen, desktop side panel and phone sheet ported from Planetary Explorer, contract tests and browser script). Guardrails ARCH-01, ARCH-03, STYLE-06, PROV-01, TEST-01.
2. Reviewed at cd40140, which includes later tonight's edits that touch T-059 files (I-019 timeline, T-062 shower wiring); those are covered by the shared gate run.
3. Out of scope: the owner's look at the panels (owner_validation required), the Apollo and Perseids panel wording (T-061, T-062).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 schema, named errors, no story wording in shell | `parseStoryPanels` names the panel and field in every error. Checker probe (12 malformed inputs: not an object, panels missing, unknown badge, two `at` keys, UTC without Z, unknown event, unknown object, outside the window, empty title, pause −1, pause 999, and a non-array body) all throw except a single-string body, which is deliberately accepted as one line (`storyPanels.ts:61-65`). Panels exactly at the window start and end are accepted. nameCheck test green in the full run. | probe file `scratchpad/probes-c038/tests/panels.test.ts` (13/14 as expected, the 14th the deliberate string body); vitest full run |
| DW2 auto-open, pause setting, seek does not open, one at a time | Forward crossing opens and holds; resumes on its own; Continue resumes early; scrubbing opens nothing; pause 0 opens without pausing; the 2 s setting held 1945 ms; auto-open off crosses silently. Unit tests cover seek-forward, loop wrap and several-in-one-step (newest only). | night-check `story-panels.log`; `tests/storyPanels.test.ts` |
| DW3 markers reopen | Timeline markers reopen, one at a time; the scene marker on the named body reopens its panel. | `story-panels.log` |
| DW4 layouts and ports | Side panel at right on desktop; phone bottom sheet 368 px with handle; swipe dismisses, a short drag keeps it. SidePanel, BottomSheet/useSwipeToDismiss, HotspotMarker and Badge ports each have a row in `docs/DONOR_PROVENANCE.md:124-133`. | `story-panels-out/*.png`, DONOR_PROVENANCE |
| DW5 tests and regressions | Contract tests on a synthetic story; the browser script writes only into an empty `ASTRAEUS_OUT`. All 22 browser scripts pass. | gates below |

## Gates (fresh, checker, frozen snapshot of the spike-04 tree that was then committed unchanged as 1eb8b05..cd40140, 2026-10-16 15:26–16:04Z, node v24.16.0)

- Runner `docs/evidence/night-check-20261016T152607Z/check-run.sh`; per-step command, time and exit in `summary.txt`; `tree-status.txt` records the tree it copied. The snapshot was committed in the five commits 1eb8b05, c19aacf, 64d1e32, 30e6201, cd40140 with no edits in between (committer report: `git status --porcelain` empty afterwards).
- `npm run typecheck`: exit 0. `npx vitest run`: 48 files, 896 passed, 1 skipped. `npm run build`: exit 0. `ASTRAEUS_PUBLIC_BUILD=1 npm run build` then `public-build-assets.mjs`: exit 0, 0 matches.
- `browser-public-showers.mjs` against `vite preview` of the public build: exit 0.
- Browser: all 22 `tools/validate/browser-*.mjs` scripts (spike02, spike03, shell, anchor-labels with an explicit fresh directory, synthetic ×5, marker-existing, sky, sky-map, sun, earth-moon, jupiter-io, showers perseids, showers geminids, showers-gmn, view-link, precision, lighting, story-panels) against vite :5451 serving the snapshot: 22/22 exit 0 with zero console errors (the two "console-error-lines=1" entries are each script's own "zero console errors" line).
- Fresh clone of spike-04 at cd40140 (no data/local): `npm ci`, typecheck, vitest (859 passed, 38 skipped for absent local data), public build plus `public-build-assets.mjs` (exit 0), plain build: all exit 0. The public dist holds the GMN Perseids and Geminids files, the HYG star file and both panels files.

## Issues Pass

All five criteria are Proven. No Issues, so no materiality actions are required.

## Owner validation still needed

T-059 requires the owner's look at the panels on desktop and phone, including the panel fade on desktop.

## Observations

- I-031 (open): when two panels name the same object, their scene markers sit on top of each other and only one can be pressed. Logged during T-061; not a T-059 criterion, since the timeline markers still reach every panel.
- STYLE-10: 8f0bcec bundled the shared files of several Tasks (28 files); orchestrator batching.

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
- [ ] STYLE-10 **Small diffs**: see observation.
