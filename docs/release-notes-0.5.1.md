# Astraeus 0.5.1

## astraeus 0.5.1 (2026-10-31)

First download of the packed example (`npm run measure:example`): 1,618,563 bytes raw, 461,100 bytes gzip (code and styles loaded on first open).

Near planets stay visible and ringed planets show their rings (O-048, G-014), from a second round of findings sent back by the outside interplanetary probe app built on 0.5.0.

- A planet or moon near the camera now stays visible however far the camera has zoomed out (O-048 T-204, I-117). The renderer uses a logarithmic depth buffer, so a Sun-centred scene whose far plane reaches a 170 AU path no longer loses Saturn at 0.01 AU to depth precision. Every custom shader in the engine carries the log-depth chunks, and a test fails for one that does not.
- Jupiter, Saturn, Uranus and Neptune now carry their rings in their one catalogue definition (O-048 T-205, I-118), so a scene that adds the planet through the public API draws the rings with their NSSDC fact-sheet source; the ring bands and the ring look sliders are unchanged. The planets demo no longer attaches rings itself. First download of the packed example (`npm run measure:example`) grows from 1,608,313 to 1,617,005 bytes raw and from 457,901 to 460,652 bytes gzip (the ring data now ships with the engine).
- `addBody(moon, { orbit: true })` draws the orbit line of any catalogued moon, not only the Moon and Io (O-048 T-206, I-119). One rule: one lap of the period the moon's catalogue definition carries (`orbitPeriodDays`, read once from its mean-element record), drawn about its planet; the Moon and Io draw as before, and a moon with no period (Phobos, Deimos) throws `no-orbit`. First download grows by 786 bytes raw, 243 bytes gzip (1,617,005 to 1,617,791 raw; 460,652 to 460,895 gzip).
- `addEvents` takes an optional `object` (a body or trajectory id) per event (O-048 T-207, I-120): the timeline's Go to, Previous and Next seek to the event and frame that object as `camera.lookAt` does; an event without one seeks as before, and an `object` the scene lacks throws `bad-event` naming the event and the id. Only code already in the first download changed; size is not re-measured.
- Overlapping labels no longer flicker at fast playback (O-048 T-208, I-121). One rule for every label: a label hidden by an overlap needs 14 px more clearance than the plain 6 px gap before it shows again, so two labels crossing swap winner once per crossing; the selected object's label still always wins and labels switched off stay hidden. Layout only; no State change and no new files in the package.

## astraeus-data 0.5.1 (2026-10-31)

No changes to the pictures, data or this package's code. Released with `astraeus` 0.5.1 to keep the version numbers together; the six moon-position packages are unchanged.
