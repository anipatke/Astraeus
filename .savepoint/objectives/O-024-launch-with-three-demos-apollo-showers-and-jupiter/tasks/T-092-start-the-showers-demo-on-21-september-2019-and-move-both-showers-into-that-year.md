---
id: T-092
title: Start the Showers demo on 21 September 2019 and move both showers into that year
objective: O-024
status: done
depends_on: [{task: T-091, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
check_waiver:
    task: T-092
    reason: "Owner waived the optional Task Check for this batch ('Waive the task checks just do one for the objective'); the Full Objective Check covers it."
    actor:
        role: owner
        session: 009b0116-b8b7-4912-9273-91d589baf044
    recorded_at: "2026-10-18T09:26:44Z"
---

# Start the Showers demo on 21 September 2019 and move both showers into that year

## Outcome

The Showers demo opens on 21 September 2019 and runs a year, so the Geminids peak (December 2019) and the Perseids peak (August 2020) both fall inside it, with every peak, activity window, comet and asteroid position and story moment taken from published values for those dates.

## User Check

Open the Showers demo: the clock starts on 21 September 2019; play through to the Geminids' peak in December 2019, switch to the Perseids and reach their peak in August 2020; the stories open at sensible moments.

## Done When

1. Owner, 2026-10-18 (O-024 Decision 3): the Showers demo starts on 21 September 2019 ("Date my daughter was born") and runs a year.
2. Each shower's peak time and activity window for its 2019-2020 return come from published values (IMO or AMS), recorded with sources; the timeline glow follows them.
3. 109P/Swift-Tuttle and 3200 Phaethon positions for those dates come from the existing ephemeris path (checked against JPL Horizons at sample dates, as C-030/C-032 did).
4. Story panel moments move into the new year (for example Phaethon's closest pass of the Sun nearest that window, from JPL); body text unchanged unless a date-bound sentence needs it; details say the 2019-2020 values and that the meteor orbits were measured by the Global Meteor Network in 2025 (illustrative positions, as now). The panel tests that pin times are updated.
5. The narrowed `span=activity` view still works for each shower.
6. Browser checks through the shared driver; full run passes.
7. Owner validation: the owner plays the year.

## Context Files

`data/showers/perseids.json`, `data/showers/geminids.json`, `data/stories/perseids/panels.json`, `data/stories/geminids/panels.json`, `src/experiences/showers/showerSettings.ts`, `src/experiences/showers/showerActivity.ts`, `tests/storyStoriesAllDemos.test.ts`, `tests/showers.test.ts`, `docs/ASTRONOMY_VALIDATION.md`, `tools/validate/browser-showers.mjs`, `.savepoint/objectives/O-024-launch-with-three-demos-apollo-showers-and-jupiter/Objective.md`.

## Design References

O-024 Decision 3 and Notes for planning.

## Guardrails

PROV-01, ARCH-01, TEST-01, TEST-03.

## Implementation Plan

1. Published 2019-2020 peaks and windows; comet and asteroid checks.
2. Story moments; tests; full run.

## Boundaries

Dates and the values that follow them; no new data sets.

## Technical Verification

Configured gates, showers and story-panel scripts, full run. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (executor, lane o024-t092, 2026-10-18)

Design. Generic, no shower names: an optional `timeline.yearStartUtc` in the shower settings (`src/experiences/showers/showerSettings.ts`); when given, the "year" span starts there (`yearBoundsOf` in `showerBasics.ts`) instead of being centred on the peak, and the parser refuses a year that does not hold the whole activity window (error names `timeline.yearStartUtc`). `span=activity` is unchanged (the activity window). Both `data/showers/perseids.json` and `geminids.json` set `"yearStartUtc": "2019-09-21T00:00:00Z"`; the year ends 2020-09-20T06:09:09.763Z (365.256363 days).

Published values (PROV-01). imo.net serves a holding page for its calendar files (site being rebuilt), so the IMO calendars were read from the Internet Archive: 2019 calendar (IMO_INFO(2-18), SHA-256 b0c4b8bc...83fd02e, web.archive.org/web/20191228130925/...cal2019.pdf) and 2020 calendar (IMO_INFO(2-19), SHA-256 56927b2d...e739493, web.archive.org/web/20201216020712/...cal2020.pdf).
- Geminids 2019: active Dec 4-17, maximum Dec 14 (λ 262.2), peak period λ 261.5-262.4 = 2019 Dec 14 02h-23h UT. File: 2019-12-04 to 2019-12-18, peak 2019-12-14T04:33:33Z (the I-027 rule: MDC 261.6 deg J2000 on the engine ephemeris; inside IMO's period), night "Dec 13-14, 2019".
- Perseids 2020: active Jul 17 - Aug 24, maximum Aug 12 13h-16h UT (node λ 140.0-140.1). File: 2020-07-17 to 2020-08-25, peak 2020-08-12T15:41:56Z (MDC 140.1; inside IMO's 13-16h), "Aug 12, 2020".
- Peak rates unchanged (AMS ZHR 100 and 150); the sources now say IMO's own figures (110/100 Perseids, 140 Geminids 2019).
- Comet and asteroid against JPL Horizons at six dates across the year (raw `tests/fixtures/showers-year-horizons-source.txt`, normalized `showers-year-horizons.json`, test `tests/showersYearHorizons.test.ts`): Phaethon (Horizons JPL#1019; shipped elements SB441-N16) largest 365,665 km (0.16%) at 2020-09-20, inside the recorded 935,344 km; `parentElements.accuracy` validFromUtc moved 2020-12-14 -> 2019-09-21, statement and limitations updated. Swift-Tuttle (JPL#32) largest 7,644,938 km (0.13%) at 2019-09-21, inside its recorded 10,686,093 km and 1990-2030 validity; record unchanged. Phaethon perihelia from Horizons elements: 2019-07-02 ~23:51 UTC and 2020-12-07 ~14:26 UTC, both outside the year. Written up in docs/ASTRONOMY_VALIDATION.md, new section "The Showers year".

Story moments. Perseids: stream-shape 2027-03-01 -> 2019-11-01; earth-crossing stays the peak event (now 2020-08-12T15:41:56Z); swift-tuttle 2027-10-01 -> 2020-09-01. Geminids: phaethon 2026-09-02T02:46 (perihelion) -> 2019-11-01 (no perihelion inside the year; six weeks in, before the shower); best-shower 2026-12-06 -> 2019-12-06; earth-crossing stays the peak event. Body text unchanged except one date-bound sentence in the Geminid Phaethon panel: "Today it makes its closest pass of the Sun, far closer than Mercury ever gets." -> "Every 17 months it swings closer to the Sun than Mercury ever gets; its last close pass was in early July 2019." Details now give the 2019-2020 values, IMO sources, the measured-orbit years (GMN Jul-Aug 2025 for the Perseids; Dec 2024 and Dec 2025 for the Geminids) with illustrative places, the 2020-peak measured figures (closest pass 2.3 h before, radiant 0.06 deg; the old 2027 figures kept, as the T-088 fact test requires) and the Horizons checks. 1 October 2019 (ten days in) was tried first for both first panels: the panel then opened over the phone scene before browser-showers' plain-load check (2.5 s) could see the stream, so both moved to 1 November.

Tests. `tests/showers.test.ts`: year start (made-up settings: bounds, clock, stream bounds, narrowed view), three refusals naming `timeline.yearStartUtc`, both showers' year 2019-09-21 -> 2020-09-20 with peak inside and narrowed view = activity window, pinned 2019-2020 values inside IMO's peak periods; perseids timeline equality updated. `tests/elementsBody.test.ts`: validFromUtc pin. New `tests/showersYearHorizons.test.ts` (5 cases). Browser scripts: `browser-showers.mjs` checkYear (starts at yearStartUtc else peak mid-timeline), glow brightest at the peak's own fraction (was 50%), wheel zooms with the cursor over empty sky (quarter point; the camera zoom is distance-only) because Earth's and Mercury's labels sit by the Sun at the year start and swallow the wheel, the equatorial-up tilt read at the peak (7.8 deg at the start against the 8 deg floor; 10.7 at the peak), checkSwitch t=2020-01-01; `browser-story-panels.mjs` wording; `capture-experience-pictures.mjs` perseids t=2020-08-12T12:00Z, geminids t=2019-12-14T04:33:33Z; `capture-site-pictures.mjs` PERSEIDS_PEAK_UTC 2020-08-12T12:00Z. README shower example updated.

Files changed: data/showers/{perseids,geminids}.json, data/stories/{perseids,geminids}/panels.json, src/experiences/showers/{showerSettings,showerBasics}.ts, tests/{showers,elementsBody}.test.ts, tests/showersYearHorizons.test.ts (new), tests/fixtures/showers-year-horizons{-source.txt,.json} (new), tools/validate/{browser-showers,browser-story-panels,capture-experience-pictures,capture-site-pictures}.mjs, docs/ASTRONOMY_VALIDATION.md, README.md, this Task.
Extra reads (outside Context Files, all to find what pins dates or the year shape): src/experiences/showers/{showerDefinition,showerBasics,showerChoice}.ts, src/main.tsx (span override), src/app/App.tsx and src/core/clock.ts (t= and loop wrap), src/app/CameraController.tsx (wheel), src/core/elementsBody.ts, tests/{elementsBody,swiftTuttle,showersMeasured,storyPanels}.test.ts, tests/helpers/streamFacts.ts, tools/validate/{capture-*,run-full.sh,diff-screenshots,contact-sheet,driver}.mjs, README.md, T-091 evidence.

Verification (handoff tier lite; full run deferred to the orchestrator's batch run). Gates after merging o018-o019 (T-102): `npx tsc --noEmit` clean; `npx vitest run` 71 files, 1081 passed, 1 skipped; `npm run build` ok; driver guard ok. Browser, one at a time on an idle machine, dev server :5610: before the merge `browser-lite` exit 0, 0 error lines (docs/evidence/o024-t092-lite-20261018T072208Z), `browser-story-panels` exit 0 (o024-t092-story-panels-20261018T072549Z), `browser-showers` perseids and geminids (light) exit 0 (…-054039Z, …-055542Z). After the merge: `browser-showers perseids` exit 0, 260 s (o024-t092-showers-perseids-20261018T073802Z.log), `browser-showers geminids` (ASTRAEUS_LIGHT=1) exit 0, 108 s (…-geminids-20261018T074316Z.log), 0 error lines each. Limitation: `browser-story-panels` was not rerun after the merge (the session ended); its pre-merge run passed. The equatorial-up tilt workaround was dropped at the merge: T-102 reads the path's vertices, not pixels. Screenshots from the pre-merge runs were deleted (T-102: no screenshots).

Drift Notes: (1) Phaethon's perihelia (2 Jul 2019, 7 Dec 2020) fall outside the year, so the Phaethon panel moved to 1 Nov 2019 with one body sentence changed (owner to confirm the wording). (2) Peak instants keep the I-027 IAU MDC solar-longitude rule; both fall inside IMO's published peak periods, not at IMO's single best Geminid estimate. (3) The IMO site is down; calendars read from the Internet Archive (hashes recorded). (4) README still says `?experience=shower-<name>` (T-093 owns addresses). (5) The picture baseline predates the new year; the archived capture scripts carry the new times.
- Owner decision 2026-10-18 (session 009b0116): the Phaethon panel's changed wording (1 Nov 2019) is approved ("Wording is fine").
