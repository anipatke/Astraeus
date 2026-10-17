---
id: T-084
title: Show activity as a glow within the timeline line instead of a graph above it
objective: O-020
status: done
depends_on: [{task: T-080, requires: clear}]
owner_validation: {required: true, accepted_check: C-063, accepted_by: {role: owner, session: owner-chat-20261018}}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Show activity as a glow within the timeline line instead of a graph above it

## Outcome

The purple activity graph that sits above the timeline in the showers goes. Instead, the timeline's own track carries a gradient: brighter where activity is high and around key moments (the shower's peak), dimmer and lighter where nothing happens. The timeline is one slim line for every experience, showers included, on desktop and phone.

## User Check

Open the Perseids and the Geminids: no graph above the timeline; the track glows brightest at the peak night and fades away from it; hovering the track still tells you the rate at that moment. Apollo 11 and the others look as before.

## Done When

1. Owner, 2026-10-17: "I am not a fan of the purple lines. I want this re-designed to be a gradient within the line that gets brighter towards the key moments, and lighter when nothing happens", "this is on the timeline only". The window strip (`timeline-window`, `timeline-window-curve`, `timeline-windows` in `src/shell/TimelineBar.tsx` and `TimelineBar.css`) is removed; the experience's activity profile (the same data the strip drew) drives a gradient along the scrubber track, mapped from rate to brightness (and, if it reads better, a little thickness), with the played portion keeping its accent colour.
2. Generic: the shell draws the gradient from the experience's window data and event times, never from experience names (ARCH-01); an experience without a profile shows the plain track. Key moments (events) stay as marks on the line.
3. Readable information is not lost: the peak value and the rate at the hovered or current time are available as a tooltip or accessible text ("Perseids activity: peak 100 meteors per hour (ZHR)" today), and the gradient has a text equivalent for screen readers.
4. The gradient's colours, minimum brightness and curve are settings with live controls (owner rule), not hard-coded numbers; colour contrast keeps the scrubber thumb and played portion clearly visible.
5. Desktop and phone: the showers' timeline height equals the other experiences' (T-080 measured 101 px desktop and 173 px phone for the Perseids with the strip; the target is the one-line 52 px and two-line 110 px).
6. Browser checks that read the window strip are updated through the shared driver (T-083) or mapped, each scenario kept (TEST-03); pictures of both showers.
7. Owner validation: the owner looks at both showers.

## Context Files

`src/shell/TimelineBar.tsx`, `src/shell/TimelineBar.css`, `src/shell/timelineModel.ts`, the shower window settings (`data/showers/*.json` timeline/activity fields and how `src/experiences/showers/showerActivity.ts` builds the window), `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Design References

Design.md shell timeline; the approved mock-ups https://claude.ai/artifact/Akgz8SgcZBq1jCy15aPqoS (one-line timeline).

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Remove the strip; expose the profile to the track.
2. Draw the gradient (CSS gradient stops or a small canvas behind the track), settings, tooltip and text equivalent.
3. Scripts, pictures, owner look.

## Boundaries

Timeline only (owner). No change to the activity data or the scene.

## Technical Verification

Configured gates, lite, pictures of both showers, the scripts that read the timeline. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (executor, lane o020-t084, 2026-10-17)

**Design.** The strip (windows band, curve, caption, clickable band) is gone. `src/shell/timelineGlow.ts` builds the activity profile from the experience's windows (`rateAt`, ARCH-01: no names): an even 240-step grid plus every rate sample and window start, peak and end, as 0-1 against the highest rate. `glowGradient` turns it into one CSS linear-gradient (alpha = quiet + (1 - quiet) * rate^curve) for the ahead colour and one for the played (accent) colour. The track holds a `.timeline-glow` behind the range input: an ahead layer plus a played layer clipped at the playhead (clip-path), each with a blurred halo copy. The range input's own track is transparent; the thumb is a cream disc with accent ring. Event and panel marks are cream on a glow track. The peak is a small accent diamond with a stem riding above the line (so an event or story panel on the peak stays pressable). No rate: plain track as before (Apollo).
**Settings (live, Display settings > "Timeline glow", shown when a window has a rate).** Glow colour, Played colour (colour pickers), Quiet brightness, Curve, Played brightness floor, Thickness (px), Halo blur (px), Reset glow. Defaults in `DEFAULT_TIMELINE_GLOW`: #cfe0ff, #fc6323, 0.10, 0.45, 0.40, 8, 10. App state, passed AstraeusShell -> TimelineBar.
**Text.** Track `title` follows the pointer ("<window>: N unit" or "No activity here. <window>: peak ..."); glow `role=img` aria-label "Activity along the timeline, brighter where it is higher. <window>: peak N unit"; slider `aria-valuetext` carries the rate at the clock.

Criterion 1: strip removed from TimelineBar.tsx/.css; gradient drives the track; played keeps accent (picture checked by eye at 2x). 2: generic; no profile = plain track (synthetic: Apollo "no activity glow"); events remain marks. 3: tooltip/aria above; asserted in browser-synthetic (tooltip at peak 48 passes per hour, away from window says so) and browser-showers. 4: settings above; browser-showers drags "Timeline quiet brightness" and sees the gradient change live. 5: heights measured by browser-showers (bar box): **52 px at 1440x900, 110 px at 390x844, both showers** (was 101 / 173); equal to the other experiences. 6: scripts below, scenarios mapped; pictures in docs/evidence/o020-t084-showers/ and the full run. 7: owner validation pending (not set done).

**Scripts changed.** tools/validate/driver.mjs: removed windowBand, pressWindowBand, pressWindowBandAt and the strip parts of windowParts; added glowCount, glowText, glowGradients, glowTooltipAt, timelineBox, sceneCanvasPng (canvas picture with the timeline bar blacked out), glow slider ids. browser-synthetic.mjs and browser-showers.mjs updated (scenario map in the code comments: band -> glow, curve line/area -> gradient peaks at the peak and quiet stops fainter, caption -> glow text, band click -> slider seek lands in the window + peak mark opens details, "Apollo no strip" -> no glow). docs/BROWSER_CHECKS.md driver list. `node tools/validate/driver-guard.mjs`: passes.
**Gates.** `npx tsc --noEmit` clean; `npx vitest run` 956 passed, 1 skipped (timeline tests for the removed curve/area/click helpers replaced by glow tests in tests/timeline.test.ts); `npm run build` ok.
**Browser (dev server 5498, software GL, started when load < 6 and no chrome).** browser-showers (both), browser-shell, browser-synthetic, browser-lite (26/26), browser-story-panels: exit 0, zero console errors. Final `bash tools/validate/run-full.sh docs/evidence/o020-t084-full-20261017T095240Z`: 22 of 22 steps exit 0, error-lines 0 (an earlier full run, docs/evidence/o020-t084-full-20261017T092928Z, had story-panels fail: the first peak mark sat over the earth-crossing panel mark; fixed by moving the peak mark above the line).

**Drift Notes.**
1. browser-showers: the "comet's whole orbit is drawn in the Overview" assertion (violet pixels > 60) and the Earth-path shape counts were passing partly on the old purple strip / bar, because the scene canvas lies behind the timeline bar and the screenshot included it. Scene counts now use `ui.sceneCanvasPng` (bar masked). Scene-only, violet in the Sun Overview is ~0 (the I-035 orbit look is not violet there), so that one assertion is now recorded (`out.path.<start|peak>WholeOrbitViolet`) not asserted; the Whole-orbit preset check still asserts the violet orbit extent (left unmasked on purpose). Needs an owner/Issue decision on the Overview comet-orbit check (I cannot create Issues in a lane).
2. `ui.windowPeakTimeMs` read `data-time-utc-ms` which no element carried; the peak mark now carries it.
3. On a year-long timeline a shower's window is about 3 percent of the width, so the bright part is a narrow patch around the peak; the settings (curve, thickness, halo) tune it. Owner look pending.
**Extra reads.** src/app/App.tsx, SettingControls.tsx, AstraeusShell.tsx (to place the settings and pass the look); tests/timeline.test.ts; tools/validate/driver-guard.mjs header; data/local copied from main (git-ignored GMN files the browser scripts need) into this lane's data/local.

## Owner Completion — 2026-10-18

Owner looked at the glow on the preview: "ah, youve done it on one. Looks good!", then chose "Mark it done" after being told the glow appears only on the two showers (the experiences with activity data). Quick Task Check C-063 CLEAR.
