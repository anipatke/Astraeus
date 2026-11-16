# Earth's Closest Calls — app prompt (v0.1, 2026-11-11)

Status: draft for the owner. Based on `earths-closest-calls.md` (the PRD) and the owner's 2026-11-10 idea of one shared timeline. Built as a separate app on the published packages, like Voyagers and Zodiac; asteroid data stays in the app, never in the engine.

---

> You are building **Earth's Closest Calls**, a small web app, as a story on the published `astraeus` npm package (0.9.0 or later). Use only its public API (`import … from "astraeus"`); never fork or patch the engine or import private paths. When the API can't do something, write it down as a finding (what you needed, what you tried, the workaround). Those findings are the main thing the Astraeus project wants back.
>
> **The story.** The closest recorded asteroid flybys of Earth since 2000, with no impacts, ranked by clearance above Earth's mean surface (closest distance to Earth's centre minus 6,371 km; say it is a mean sphere, not local terrain). The owner's provisional list, unverified: 2025 UC11, 2020 VT4, 2025 TF, 2024 XA, 2024 LH1, 2024 UG9, 2020 QG, 2021 UA1, 2025 BP6, 2023 BU. Confirm every identity, date, distance and speed from JPL's close-approach data before using it, and record the snapshot date. If you cannot show the ranking is complete, call it "a selection of the closest", not "the top ten".
>
> **One timeline, not ten replays.** All ten fall between August 2020 and October 2025, so they run on one timeline:
> - Each closest approach is a timed event (`scene.addEvents`), and pacing (`setTimeline({ pacing })`) runs quickly through the months between and slows almost to a stop around each pass.
> - The visitor can zoom the timeline from the whole span down to the hours around one flyby.
> - Two views (`scene.setViews`): a Sun-centred overview with all ten orbits crossing Earth's path, and an Earth-centred close-up at true scale where each pass happens. Switch views as each flyby comes and goes.
> - A ranked list beside the timeline jumps to any encounter.
>
> **Two kinds of position data.**
> - Between flybys: each asteroid's published orbit elements (JPL small-body database) through `scene.addBodyFromElements`.
> - Around each flyby: Earth-centred states from JPL Horizons, 48 hours centred on closest approach, about one-minute steps near the encounter, through `scene.addTrajectory` sampled paths.
> - The hand-over between them must be continuous in time and position; measure the jump and report it.
> - JPL sends no browser permission header, so fetch everything at build time and ship static JSON with the query, date, frame, origin, time standard and units recorded.
>
> **What the visitor sees and does.**
> - Opens paused on the overview with the ranked list.
> - Picks an encounter: the view moves to the Earth close-up, a marker shows closest approach, and live readouts show distance from Earth's centre, clearance above the surface and relative speed. Use `scene.stateOf`, never values worked out from the drawing.
> - Play, pause, scrub and reset, with time shown relative to closest approach and as an absolute UTC time.
> - A card per asteroid: what it is, the size estimate with its range, when it was found (often after it passed), and how well its path is known.
>
> **Honesty rules.**
> - Earth is true size. If an asteroid's marker is enlarged so it can be tapped, say so.
> - Show the minimum clearance separately from the moving readout.
> - Explain uncertainty in words. Never draw a made-up uncertainty cloud.
> - No hazard predictions, impact simulations or "is it safe" claims.
> - Every number cites its source; anything you couldn't verify is labelled.
>
> **Build.** Phone first: no overlapping controls at 375×667 and 1280×720. The ranked list works from the keyboard, selection is not shown by colour alone, and reduced motion is respected. Check one asteroid end to end (data, interpolation error against denser samples, closest approach against JPL's value) before doing the other nine.
>
> **Report back** like the Voyagers review: what you built, every API finding ranked by cost, what worked, the workarounds, and your top three asks.

---

## Open for the owner

- The app's repo and name (a new repo, like Voyagers?).
- Tolerances: how close the app's minimum distance, time and speed must be to JPL's values, and the allowed error between samples.
- Whether the overview spans the whole 2020–2025 window or a shorter one around each flyby.
