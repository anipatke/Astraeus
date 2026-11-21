---
id: O-083
title: Errors and labels that tell the truth
status: planned
depends_on: []
release: G-024
priority: high
rank: 2
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
