---
id: T-316
title: Show times in the visitor's zone and to the day
objective: O-074
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-316, reason: 'Owner said "orchestratew O74" (orchestrate O-074) under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: plan-o074-20261115}, recorded_at: '2026-11-15T09:10:52Z'}
planned_by: {role: planner, session: plan-o074-20261115}
planned_reads: [packages/astraeus/src/shell/timelineModel.ts, packages/astraeus/src/shell/TimelineBar.tsx, packages/astraeus/src/shell/infoModel.ts, packages/astraeus/src/api/look.ts, packages/astraeus/src/app/look.ts, packages/astraeus/src/app/liveLook.ts, packages/astraeus/src/app/labelStyle.ts, packages/astraeus/tests/look.test.ts, packages/astraeus/tests/infoCards.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/shell/timelineModel.ts, packages/astraeus/src/shell/TimelineBar.tsx, packages/astraeus/src/shell/infoModel.ts, packages/astraeus/src/api/look.ts, packages/astraeus/src/app/look.ts, packages/astraeus/src/app/liveLook.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json]
---

# Show times in the visitor's zone and to the day

## Outcome

A host sets `time: { zone, precision }` in the looks (`scene.setLook`, `handle.setLook`) and the viewer's clock bar, slider text, bound dates, event list and event/window info cards read in that zone and to that precision; `handle.look.time` reads it back; with no `time` look every time reads exactly as in 0.9.1.

## User Check

None required; the text is proven by tests with a pinned language and zone. The owner may look at any events demo on `localhost:5490` (default text unchanged).

## Done When

- `LookInput.time?: { zone?: string; precision?: "day" | "minute" | "second" }` and `LookRead.time: { zone, precision }` (default `{ zone: "UTC", precision: "second" }`), checked through the look spec table and `resolveLook`; an empty or unknown zone (one `Intl.DateTimeFormat` refuses) or an unknown precision throws `bad-look`. No page address parameter (`param: null`, as `labels`), no Developer drawer control.
- One formatter (in `src/shell/timelineModel.ts`, beside `formatUtcTimestamp`) takes a moment and the resolved time look:
  - `"UTC"`: ISO text; `"second"` is byte-identical to `formatUtcTimestamp` today, `"minute"` `2026-11-15T04:37Z`, `"day"` `2026-11-15`.
  - `"local"` (the visitor's zone, no `timeZone` option) or an IANA name: `Intl.DateTimeFormat` in the visitor's language (`undefined` locale) with day, short month, year, and for `"minute"`/`"second"` the hour, minute (second) and `timeZoneName: "short"`; `"day"` shows the date only.
- Every visitor-facing time uses it: the clock bar timestamp, the slider `aria-valuetext`, the start/end bound dates (now formatted at `"day"` precision in the zone rather than `.slice(0, 10)`), the event list rows, and `infoModel` (event subtitle; window Starts, Ends, Peak). `<time dateTime>` attributes stay ISO UTC. `DebugOverlay` and the page address stay UTC.
- A live `handle.setLook({ time })` changes the shown text without a remount; `setLook(handle.look)` leaves the text unchanged (round-trip).
- One table test over zone × precision (`"UTC"`, `"local"` with `TZ` pinned, `"Australia/Sydney"`, `"America/New_York"` across a date boundary) × (`day`, `minute`, `second`) with the language pinned; a test that the default and explicit UTC/second render today's exact strings in the bar, list and info cards; `bad-look` cases; the read-back default and round-trip. Existing tests' setup unchanged.
- README `setLook` row (Looks, controls and views) and `handle.look` row (Looks, picker, scale and switches) name `time`; CHANGELOG `Unreleased` entry; `npm run api:lock` rerun; configured gates pass.

## Context Files

- `packages/astraeus/src/shell/timelineModel.ts`
- `packages/astraeus/src/shell/TimelineBar.tsx`
- `packages/astraeus/src/shell/infoModel.ts`
- `packages/astraeus/src/api/look.ts`
- `packages/astraeus/src/app/look.ts`
- `packages/astraeus/src/app/liveLook.ts`
- `packages/astraeus/src/app/labelStyle.ts` (the worked example of a look with no address parameter)
- `packages/astraeus/tests/look.test.ts`
- `packages/astraeus/tests/infoCards.test.ts`
- `packages/astraeus/README.md` under `Looks, controls and views` and `Looks, picker, scale and switches`
- `packages/astraeus/CHANGELOG.md` under `Unreleased`
- `.savepoint/objectives/O-074-time-as-the-visitor-reads-it/Objective.md`

## Design References

Design `Public API shape (G-016, owner 2026-11-01)`; `Headless use and looks as settings`. Objective O-074 `Design Decisions`.

## Guardrails

ARCH-02, API-02, API-04, API-05, API-06, TEST-01..03.

## Implementation Plan

1. Add `time` to `LookInput`/`LookRead` and the look spec table with its own check (zone accepted by `Intl.DateTimeFormat`, precision one of three); resolve defaults.
2. Carry the resolved time look in the live controls (`applyLook`, `lookReadOf`) and pass it to `TimelineBar` and `infoModel` the way `labelStyle` reaches its consumers.
3. Write the one formatter; replace each visitor-facing `formatUtcTimestamp` call and the bound `.slice(0, 10)`.
4. Tests, README rows, CHANGELOG, API lock.

## Boundaries

No host formatter functions, no story panel text, no page address parameter, no Developer drawer control, no change to times in the API or to `formatUtcTimestamp`'s output.

## Technical Verification

Focused tests while iterating; configured gates at handoff (lint, typecheck, build, test). Evaluated later under `agent-skills/references/check-method.md`. No browser check needed beyond the existing suite; default text is unchanged.

## Technical Evidence

- Cases: `tests/timeLook.test.ts` (24 tests): one table over zone (UTC, local with TZ pinned to Asia/Kolkata, Australia/Sydney, America/New_York across a date boundary: 02:37Z is the 14th in New York) x (day, minute, second) with the language pinned to en-US; UTC/second byte-identical to `formatUtcTimestamp`; default and explicit UTC/second render today's exact strings in the bar timestamp, slider `aria-valuetext`, bounds, and event and window info cards; a named zone changes all of those while `dateTime` stays ISO UTC; read-back default; `Scene.setLook` keeps a good time look and the address cannot reach it; six `bad-look` cases; `applyLook` live change, read-back and `setLook(read)` round-trip. `tests/look.test.ts` gained two CASES rows (`time.zone`, `time.precision`) so its "covers every look in the table" check holds; no existing setup changed.
- Gates: lint pass; typecheck pass; build pass; test: 259 files passed, 1 failed; 3950 passed, 1 failed (`packages/astraeus-site/tests/apiReference.test.ts`, the api/index.html gzip budget: 44,225 B against the 44,000 B limit in `tools/validate/load-budget.mjs`). The new documented surface (`TimeLook`, `LookInput.time`, `LookRead.time`) pushes the generated API page over; I shortened the docs but the limit was already within a few hundred bytes. Raising `gzipLimit` is an owner decision (earlier raises: owner 2026-11-03, 2026-11-10); not changed here. The `apiSurface` allowlist needed no entry (TimeLook exported from `src/api/index.ts`).
- `npm run api:lock` rerun.
- Files changed: src/core/lookValues.ts (isTimeZone, isTimePrecision, TIME_PRECISIONS), src/app/look.ts (zone and choice kinds; time.zone, time.precision fields), src/api/lookInput.ts, src/api/look.ts (TimeLook, LookInput.time, LookRead.time), src/api/index.ts (export TimeLook), src/shell/timelineModel.ts (TimeLook, DEFAULT_TIME_LOOK, withDefaultTime, formatTime), src/shell/TimelineBar.tsx, src/shell/infoModel.ts, src/shell/AstraeusShell.tsx, src/app/timeLook.ts (new, timeLookOf), src/app/AstraeusScene.tsx (SceneControls.timeLook), src/app/liveLook.ts, src/app/App.tsx, tests/timeLook.test.ts (new), tests/look.test.ts (two rows), tests/helpers/viewerPresentation.ts (FAKE_LOOK gained `time`, required by the LookRead type), README.md (setLook row, handle.look row), CHANGELOG.md (Unreleased), api-surface.lock.json.
- Extra reads: none beyond Context Files (plus README.md/CHANGELOG.md rows by line).

- Owner decision (2026-11-15T09:20:17Z): api/index.html gzip limit 44,000 -> 44,500 B (`packages/astraeus-site/tools/validate/load-budget.mjs`); owner chose "Raise to 44,500 bytes". The page measured 44,225 B with the time look. `apiReference.test.ts` rerun: 4 passed. The rest of the builder's full test run (259 files, 3950 passed, 1 failed, which was this test) is unaffected by the change to the limit alone.
- Coordinator marks done (lint, typecheck, build pass; test gate passes once the limit is raised), per the owner's "orchestratew O74".

## Drift Notes

Record any architecture delta (for example where the time look is carried) for reconciliation before the Full Objective Check.

- The time look is carried like the label style: `SceneControls.timeLook` (set by `applyLook`, read by `lookReadOf`), mirrored in App state (`timeLookShown`) and passed as the `timeLook` prop of `AstraeusShell`, which hands it to `TimelineBar` (and `TimelineExpanded`) and to `infoView` (optional 4th argument). `formatTime` in `shell/timelineModel.ts` is the one formatter; `DebugOverlay` and `dateTime` attributes still use `formatUtcTimestamp`. The look has two new spec kinds (`zone`, `choice`) in `app/look.ts`, both with `param: null`. Design.md reconciliation: note the new kinds and the shell prop.
