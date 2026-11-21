---
id: O-083
title: Errors and labels that tell the truth
status: planned
depends_on: []
release: G-024
priority: high
rank: 2
lanes: [{key: contract, title: Coded errors and scale type}, {key: react, title: React error default}, {key: time, title: Zoned time text}, {key: provenance, title: Labels and limits}, {key: science, title: Composed velocity}, {key: pacing, title: Reverse pacing}, {key: docs, title: Docs and changelog}]
---

# O-083: Errors and labels that tell the truth

## Outcome

Every throw a host can reach through the public API is a coded `SceneError`, the React component no longer fails silently, date text means one instant for every visitor, the scale setting is typed as the closed choice it is, and body cards and state reads say what the engine actually models.

## Why

AH-04 (Claude CQ-5, Gemini SCI-04/CQ-03): `stateOf` for a planet outside 1950–2045 throws a raw `TimeScaleOutOfRangeError`; also raw `TypeError`/`DataCloneError` from `mount` and `setViews`. AH-24: `AstraeusScene` sends errors to `onError?.()` only. AH-25: zone-less date text is parsed as local time. AH-23: `ScalePolicy` is documented as open but `setScale` accepts three IDs. AH-05: 13 moons labelled tidal-lock while the code uses IAU rotation; planets' known position limitations never shown. AH-06: composed states drop velocity. AH-16: body 31 throws a raw `RangeError`. AH-07: reverse-rate pacing may throw (confirm, then fix if reachable).

## Success Conditions

- Planet and moon span refusals reach hosts as `out-of-span`; the other reviewed raw throws become coded errors; the API-05 scan covers re-exported helpers.
- Without `onError`, the React component reports errors to the console.
- Date-time text without `Z` or an offset is refused (`bad-time`); date-only text keeps its documented meaning.
- The scale input is typed and documented as the three built-in choices.
- Orientation labels derive from the model in use; planet position limitations appear on cards; composed states carry velocity when every leg has it.
- More than the supported lit bodies is refused with a `SceneError`.
- Reverse-rate pacing confirmed reachable or not; if reachable, fixed with a negative-rate test.
- README, CHANGELOG (0.10.0 section, breaking changes named), API lock and error list updated.

## Architectural Considerations

Public contract changes are breaking by owner decision 6 (0.10.0). API-01..API-07, PROV-01.

## Boundaries

**In scope:**
- Error mapping, the React default, time input, the scale type, provenance labels and limitations, composed velocity, the lit-body error, the pacing check.

**Out of scope:**
- Custom scale policies (decision 5); single-pass lighting; moon-data isolation (O-084).

## Decisions

- Owner 2026-11-21 (G-024 decision 7): design confirmed by "work through this list of objectives one by one. Orchestrate each objective to completion"; step checks waived on every Task.
- Planner (orchestrate-g024-20261121), settled from evidence (details and file:line in each Task):
  1. A moon asked outside the window the scene loaded gives `bad-time` (as the body-set read does, `api/planBodySets.ts`); outside the package's own years, and a planet outside its series years, give `out-of-span`.
  2. New code `bad-scene` for a non-`Scene` passed to `mount`, `AstraeusScene` or `load` (today a raw `TypeError` in `api/definitionOf.ts`); one code, one cause (API-05).
  3. New code `too-many-bodies` for more than the 30 lit bodies, thrown at `check`/`mount` (today a raw `RangeError` in `app/sceneFraming.ts` during render); the limit is one shared constant.
  4. An unreadable or unparsable data package gives `bad-data` (its doc widened to "malformed or cannot be read"); `missing-data` keeps meaning "not passed".
  5. `parseElementsBodyRecord` gets a thin `src/api` wrapper mapping `ElementsBodyError` to `bad-element`; the API-05 scan covers functions re-exported from outside `src/api`.
  6. Scale: a new `ScaleId = "true-scale" | "readable-scale" | "solar-system"` used by `ScalePolicy.id` and every public scale id; the three exported policy objects keep working; the runtime `bad-scale` check stays for JavaScript callers.
  7. Accepted time text: `YYYY-MM-DD` (midnight UTC, unchanged) or `YYYY-MM-DDTHH:MM[:SS[.fff]]` with `Z` or `±HH:MM`; everything else is `bad-time`, the page address `t` included.
  8. `AstraeusScene` without `onError` calls `console.error(error)` through one function; no error boundary added.
  9. Orientation labels come from the same rotation facts as the binding; the planets demo's wrong Io sentence goes; two existing assertions that pin the wrong label change (assertion lines only, recorded).
  10. Planet position limits are a new optional `accuracy.positionLimitations`, required in practice for built-in bodies by a catalogue-wide test.
  11. Composed states carry velocity when every leg has it; `body === centre` stays without one.
  12. Reverse-rate pacing: probed first (T-352), then fixed or guarded by a test.
- New error codes and the closed scale type are breaking changes under decision 6 and are listed as such in the CHANGELOG (T-353).
