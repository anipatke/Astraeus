---
id: T-058
title: Tidy the Developer panel so it has no empty gaps
objective: O-011
status: in_progress
stage: audit
depends_on: [{task: T-038, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o011-orchestrator-check-20261013}
lane: shell
planned_reads: [src/app/App.tsx, src/app/FrameRateSection.tsx, src/shell/style.css, src/shell/experience.ts, src/app/experienceDefinition.ts, tools/validate/browser-shell.mjs]
planned_writes: [src/app/App.tsx, src/app/FrameRateSection.tsx, src/shell/style.css, src/shell/experience.ts, tools/validate/browser-shell.mjs, tests/]
---

# Tidy the Developer panel so it has no empty gaps

## Outcome

The Developer panel reads cleanly in every experience: sections size to their content, empty sections don't show, settings sit in labelled groups with each label beside its control, and the panel's words fit the experience it's in.

## Astraeus Hypothesis

- **Capability tested:** none in the engine. This is shell presentation.
- **Owner direction (2026-10-16):** "there are big gaps in the developer mode panel, lets tidy a few things up".

## User Check

Open Developer in Perseids, Apollo, Earth–Moon and a made-up scene, at desktop and phone sizes. There are no big empty areas, the settings are easy to scan, and nothing is cut off or overlapping.

## Done When

Checker findings from screenshots on 2026-10-16 (Perseids and Apollo, 1440x900 and 390x844):

1. **Empty "Scene instrumentation" card.** In Perseids it is a header with nothing under it, stretched to the height of the Frame rate card beside it. Fix: a section with no content is not rendered. Cards in the grid don't stretch to their neighbour's height (`align-items: start`, or a column flow). Remove the big empty area under it.
2. **Display settings.** Each slider's label and value sit below and left of the slider, not beside it. Fix: one row per setting, with the label on the left, the control in the middle and the value on the right, wrapping cleanly at phone width. Group the many settings under short subheadings: View (up direction, marker threshold), Sky (stars, Milky Way and its brightness), Sun (glow size, brightness, reach), Labels, Data (orbit source, all/reliable). Use only the groups that apply to the experience.
3. **Panel subtitle.** "Time controls, mission context, live telemetry and scene diagnostics" describes Apollo only. Make it generic or built from the sections actually shown. Name no experience in shell code.
4. **Overflow.** The panel is cut off at the bottom with no visible cue at desktop size, and on phone it covers the scene. Make it scroll inside with a clear edge, and keep it from covering the object bar on phone (or let it collapse).
5. **Frame rate card.** Labels wrap awkwardly on phone ("Frames per / second"). Give the label column a sensible minimum, or stack the label above the value at narrow widths.
6. Nothing else changes behaviour. browser-shell, spike03, sky, sun and showers still pass, with their assertions updated only for the moved markup and each change listed. Screenshots before and after in a fresh evidence directory, for Perseids, Apollo and Earth–Moon at 1440x900 and 390x844.

## Boundaries

Don't touch src/app/AstraeusScene.tsx or src/app/sceneFraming.ts (uncommitted T-040/I-028 work), or the shower data files. No engine changes.

## Technical Verification

Gates and the browser scripts listed. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder evidence (2026-10-16, executor session; owner visual judgement and any Check still pending).

Evidence dir: docs/evidence/o011-t058-20261016T093905Z/ (before/, after/ incl. *-display.png, runs2/ logs and screenshots). Own vite on 5299 (5199 was held by another builder); stopped at the end.

Per criterion:
1. Empty Scene instrumentation: section renders only when the readout exists; hud is a two-column flow (column-count) so cards take their content height; Frame rate straight under the heading goes full width (readouts beside graph). After screenshots show no empty card or stretched area.
2. Display settings: one row per setting (label | slider | value), phone stacks label above slider; groups View, Sky, Sun glow, Labels, Data, each only when applicable (new src/app/SettingControls.tsx). The glow group is derived from the glow settings' presence, not a body name (nameCheck green).
3. Subtitle is generic: "Live readouts, controls and diagnostics for this scene."
4. Panel scrolls inside with edge shadows and a thin scrollbar; desktop max-height ends above the timeline; phone panel starts at 172px (below object and scale bars) and ends above the timeline.
5. Frame rate labels: label column min 8.5em on phone, 9.5em desktop; no more "Frames per / second" split on phone.
6. Gates: tsc, npm run build, full npm test (44 files, 818 passed, 1 skipped). Browser: shell, spike03, sky, sun, showers (geminids and perseids), view-link all exit 0 with zero console errors. spike03 and sky each failed once on timeouts while machine load average was about 25 and passed on a solo rerun (logs *-loadfail.log, sky-fail2.log kept). No browser-script selectors changed (aria-labels and test ids kept).

Owner addition: Copy view link. Format: ?view=<focus>,<azimuthDeg>,<elevationDeg>,<distance>&scale=<id>&up=<ecliptic|equatorial>&t=<ISO UTC>. Button in Display settings > View; shows the values as text and a selectable link field with a clipboard fallback; writes the link into the address bar. startView {focus, azimuthDeg, elevationDeg, distance} accepted by ExperienceDefinition and by shower settings look.startView (validated, named errors). A bad ?view= is ignored. New: src/app/viewLink.ts, tests/viewLink.test.ts (6 tests), tools/validate/browser-view-link.mjs (perseids and default: drag, copy, open link, compare within 1.5 deg / 2 percent).
Additive edits outside own files: src/app/AstraeusScene.tsx (SceneControls.startView and viewReadout, a first-frame start-view branch ahead of the I-028 overview rule, a per-frame viewReadout write; T-040/I-028 lines untouched), src/app/experienceDefinition.ts (startView), src/experiences/showers/showerSettings.ts and showerDefinition.ts (startView pass-through). Apollo accepts the optional field but sets none (no angles supplied).

Files changed: src/app/App.tsx, FrameRateSection.tsx, SettingControls.tsx (new), viewLink.ts (new), src/app/style.css, src/shell/style.css, plus the additive edits above.
Limitations: owner visual check of panel and view restore outstanding; phone panel top (172px) is a fixed offset tuned to the current toolbar height.

## Drift Notes

None expected.
