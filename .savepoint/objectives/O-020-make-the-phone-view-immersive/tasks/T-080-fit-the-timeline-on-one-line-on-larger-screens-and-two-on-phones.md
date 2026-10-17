---
id: T-080
title: Fit the timeline on one line on larger screens and two on phones
objective: O-020
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Fit the timeline on one line on larger screens and two on phones

## Outcome

The timeline panel becomes the approved slim bar: previous, play or pause and next as symbols, the time, the speed, the scrubber with event marks and an Events button, on one line on larger screens; on phones a simplified two-line version (transport, time and speed above, scrubber below).

## User Check

On a laptop the timeline is one slim line; on a phone it is two short lines; play, pause, previous, next, speed and the events list all still work.

## Done When

1. Matches the desktop and phone-closed artboards of the approved mock-ups (O-020 Decision 6); symbols with tooltips; accessible names unchanged (Decision 9).
2. The "Just happened / Up next" text and the event list move behind the Events button (desktop) or into the expanded drawer (the phone drawer Task wires the drawer; this Task provides the compact and expanded content).
3. Height measured before and after at 1440x900 and 390x844, stated in the evidence.
4. CSS for the timeline in its own stylesheet beside its component (not appended to `src/shell/style.css`).
5. Browser scripts that read the old timeline text are updated, each scenario mapped (TEST-03).

## Context Files

`src/shell/TimelineBar.tsx`, `src/shell/timelineModel.ts`, `src/shell/style.css` (timeline rules only, to move out), `tools/validate/browser-shell.mjs`, `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Implementation Plan

1. Move the timeline CSS out; build the one-line layout.
2. The two-line phone variant; Events button.
3. Tests, browser scripts, pictures.

## Boundaries

Timeline only; no top bar or drawers (other Tasks).

## Design References

Design.md shell components and presentation (ARCH-02); the approved mock-ups https://claude.ai/artifact/Akgz8SgcZBq1jCy15aPqoS.

## Guardrails

ARCH-01 (no experience names in the shell), ARCH-02, ARCH-03, TEST-01, TEST-03 (any browser script a UI change invalidates is updated with each scenario mapped), STYLE-01, STYLE-07.

## Technical Verification

Configured gates, the lite browser check, before/after pictures against `docs/evidence/o017-baseline-20261017/` (differences are expected where the UI changes; each is listed), and the full run (`tools/validate/run-full.sh`) before handoff. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (executor, lane o020-t080, 2026-10-17)

Status: in_progress, stage audit (ready for a Check; not a pass). Worktree lane: no router edit, no Tasks/Checks/Issues created.

### Changes
- `src/shell/TimelineBar.tsx`: one-line bar (transport symbols, time, speed, scrubber with event marks, Events button). Play/Pause/Previous/Next are inline-SVG symbols (paths from the approved mock-up) with unchanged accessible names ("Play playback", "Pause playback", "Previous event"/"Next event" or "Previous: <label>") and tooltips (`title`). "Just happened / Up next / Inside" and the event list moved into the exported `TimelineExpanded` component, shown in the Events popover. The same component is the expanded content for the phone drawer (T-081 wires it; this Task does not build the drawer). The compact content is the bar itself. Time renders a full and a short (phone) text; `aria-label` keeps the full stamp.
- `src/shell/TimelineBar.css` (new, imported by the component): all timeline rules, moved out of `src/shell/style.css` (timeline rules only: base block, 700px and 701-900px media rules, reduced-motion entry, panel-marker rules, open-Events z-index; the shared button-list min-height entries lost their timeline selectors). `--shell-timeline-space` values for the info panel are set from the timeline sheet (84/160 px desktop, 150/240 px at 900px and below).
- Browser scripts updated (TEST-03), scenario map below.

### Heights (`.timeline-bar` bounding box, headless Chromium)
| Viewport / experience | Before | After |
|---|---|---|
| 1440x900 Apollo (no rate window) | 140.6 px | 52 px |
| 1440x900 Perseids (rate window strip) | 198.2 px | 101 px |
| 390x844 Apollo | 230 px | 110 px |
| 390x844 Perseids | 269.8 px | 173 px |
Pictures: `docs/evidence/o020-t080-shots/{before,after}-{desktop,phone}-{apollo,perseids}.png` (git-ignored PNGs, on disk in the lane worktree).

### Criteria
1. Mock-up match: desktop is one slim line (previous, play/pause, next symbols, time, speed, scrubber, Events (n)); phone is two lines (transport, time, speed above; scrubber and Events below). Differences from the mock-up: the Events button stays on phone line two (the phone mock has none) so the list stays reachable until T-081; speed shows the experience's own rate labels in a select (truncated on a phone); touch targets are 44 px at 900px and below. Experiences with a rate window (showers) keep the window strip above the line, so they are taller (101 px) than the single line. Met.
2. Met: text and list are in `TimelineExpanded`, behind Events; drawer wiring left to T-081.
3. Met: table above.
4. Met: `src/shell/TimelineBar.css`; nothing appended to style.css (only timeline rules removed).
5. Met: scenario map:
   - `browser-shell.mjs` "open Events, read the Just happened / Up next text, click Next" : unchanged (list is open when it reads the context). "click the Just happened button to open event info": now opens the Events popover first and closes it after.
   - `browser-synthetic.mjs` "Inside line while inside the window": opens the Events popover, reads the line, closes it. Other synthetic scenarios (band, curve, peak, band click seeks, Events list of 2) unchanged and passing.
   - `browser-spike03.mjs` (touch targets at phone/tablet, Events list, info), `browser-story-panels.mjs` (markers), `browser-view-link.mjs`, `browser-showers.mjs`: no edit needed (they use accessible names, `.timeline-event-list summary/li button`, markers, `.timeline-time`).
   - Other scripts that read `.timeline-event-list li button` (browser-spike02) were not run; they open `summary` first and are unaffected by markup.
- Found and fixed while testing: the time stamp changes length while playing, which moved the scrubber (a band-click test failed); the time now has a fixed 24ch width. Speed select min-height lost to style.css `select` rules until prefixed with `.timeline-bar`.

### Commands and results
- `npx tsc --noEmit`: ok. `npx vitest run`: 57 files, 937 passed, 1 skipped. `npm run build`: ok.
- Lite (`browser-lite.mjs`, port 5492, `ASTRAEUS_EVIDENCE_DIR=docs/evidence/o020-t080-lite-20261017c`): 26/26 loads passed, zero console errors. (An earlier run `...b` also passed 26/26 before the time-width fix; removed.)
- `browser-shell.mjs`, `browser-spike03.mjs` (after the select fix), `browser-story-panels.mjs` (ASTRAEUS_OUT scratch dir), `browser-view-link.mjs`, `browser-synthetic.mjs` (after the width fix), `browser-showers.mjs` with `ASTRAEUS_LIGHT=1` (2 of 2 showers): all passed, errors []. Outputs in the session scratchpad, not the repo; `browser-spike03.mjs` rewrites `docs/evidence/spike03/browser-results.json`, which I restored with git checkout (historical evidence preserved).
- Pictures: `capture-experience-pictures.mjs --out docs/evidence/o020-t080-after-20261017 --port 5493`: 20 pictures, 0 errors. `diff-screenshots.mjs` against the baseline (read from the main checkout, because the baseline PNGs are not in the lane): `docs/evidence/o020-t080-after-20261017/diff-vs-baseline.json`. Site pages identical (0 to 0.001%). The 16 scene pictures differ only in the timeline band: desktop 10.5-14.9% of pixels (over16 2.4-6.4%), phone 14.1-26.0% (over16 4.6-10.3%); the intended change is the slimmer timeline (its height fell from about 141-198 px to 52-101 px on desktop and 230-270 px to 110-173 px on a phone). I did not inspect every picture; no other area was edited.
- `run-full.sh` not run (instructed). The machine was quiet (load under 1, no other headless Chromium) before browser runs.

### Extra reads
- The two mock-up files in the scratchpad (markup and icon paths), `tests/experienceDefinition.test.ts` match (grep only), other `tools/validate/browser-*.mjs` by grep for timeline selectors; the baseline picture directory in `/home/user/code/Astraeus` (read-only, for the diff).

### Drift Notes
- Design.md shell/presentation notes: the timeline now has its own stylesheet and an exported `TimelineExpanded` (reused by T-081's drawer); the info panel's `--shell-timeline-space` is set from the timeline sheet. For the O-020 integration Task to reflect in Design.md (ARCH-02) or mark non-architectural.
- `style.css` still carries `--shell-timeline-space` defaults (150/266/184 px) in the top-bar rules; the timeline sheet overrides them with `:has` selectors. The top-bar Task owns those lines.

### Limitations
- Phone pictures and the Events popover were checked by screenshots at 390x844 and 1440x900 only; 768 width was covered by the spike03 touch-target assertions, not by a picture. Rate-window experiences are taller than one line (the window strip stays above the line).

### Repair after merge (2026-10-17)

The orchestrator's full run on the merged tree (`docs/evidence/c060-20261017T052231Z/`) failed `browser-showers.mjs perseids`: "desktop: the rate readout is highest at the peak (100,100,100)". Cause: the script, not the app. The rate regex `([\d.]+) meteors per hour` read the first match in the timeline region, which is now the window caption "... peak 100 meteors per hour" (a constant), and the live "Inside: ... N meteors per hour" line now lives in the closed Events popover (hidden from `innerText`). Fix in `tools/validate/browser-showers.mjs` (`checkCrossing`): open `details.timeline-event-list` before the three seeks, match the `Inside:` line (commas stripped), and close the popover afterwards; every scenario kept. Solo run (`perseids`, dev server on 5494): exit 0 (`docs/evidence/o020-repair-showers-053144-d`). The live rate still updates in the app.

Other repairs (T-079 controls, spike02 timing) are in T-079's "Repair after merge". Files changed: `tools/validate/browser-showers.mjs`, `browser-sky.mjs`, `browser-spike02.mjs`. Gates: tsc clean, vitest 939 passed, build ok. The full-run summary is appended below once it finishes.

Full browser run after the repairs (`bash tools/validate/run-full.sh`, 2026-10-17): `docs/evidence/o020-repair-full2-053144/summary.txt`, every step exit 0, zero error lines. Picture difference figures (differ from the baseline by design): {"files":20,"identical":2,"maxOver16Pct":13.0982}. A first full run (`o020-repair-full-053144`) failed only `showers-perseids` at `checkLoopOff` ("Select object" stream option not enabled) while the machine was loaded by other builders (325 s versus 161 s); the same script passed solo right after (`o020-repair-showers-053144-e`) and in the second full run, so it is recorded as a load flake, not a regression (not fixed; not reproduced).

## Owner Completion — 2026-10-18

Marked done on the owner's standing instruction for O-020 ("Yes, for all clear interface steps"), after Quick Task Check C-061 CLEAR.
