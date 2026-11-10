# astraeus

A 3D solar system for the browser. Place bodies and recorded paths in a scene, mount it, and get time controls, camera, scale choice and body information, with no React and no 3D code of your own.

> **Before 1.0.** The public API below is the promise: it is small on purpose and may still change between `0.x` versions, with every change listed in [CHANGELOG.md](./CHANGELOG.md). Anything not exported from `astraeus` is internal and may change or disappear in any release.

## Install

```sh
npm install astraeus react react-dom @react-three/fiber three
```

`react` (19), `react-dom` (19), `@react-three/fiber` (9.8.2 or later 9.x) and `three` (0.169 or later) are peer dependencies: your app's own copies are used, so install them beside `astraeus` (npm 7 and later installs missing peers for you).

A plain-JavaScript page still needs React: `mount` draws the viewer with React and `@react-three/fiber` inside, so all four peers must be installed even if your own code never touches React.

Both `mount` and the `AstraeusScene` component load the viewer's stylesheet themselves; you add no CSS import. (`astraeus/style.css` is exported for a host that wants the file on its own, for example to load it ahead of time.)

You need a bundler. These were each built and run with the packed packages (a scene with Saturn and Titan from `astraeus-data-saturn`): Vite 8, webpack 5 (5.112) and Parcel 2 (2.16, which needs `"@parcel/resolver-default": { "packageExports": true }` in your `package.json` so it reads the package `exports`). Others are untried. The package is plain ES modules that reference their pictures with `new URL(..., import.meta.url)`; drawing needs a bundler and a browser, so do not load it from a bare `<script type="module">`. Node and Vitest can import it for scene definitions and tests (see "Loading in your build and in tests").

## A scene in about 20 lines

```js
import { Scene, earth, moon, mount } from "astraeus";

// A made-up probe on a circle 120,000 km from Earth, one lap in six hours (positions in km, times as ISO text).
const start = Date.parse("2026-01-01T00:00:00Z");
const samples = Array.from({ length: 73 }, (_, i) => {
  const angle = (i / 72) * 2 * Math.PI;
  return { time: start + i * 300_000, positionKm: [120_000 * Math.cos(angle), 120_000 * Math.sin(angle), 0] };
});

const scene = new Scene()
  .addBody(earth)
  .addBody(moon, { orbit: true })
  .addTrajectory({ id: "probe", label: "Hello probe", samples })
  .setTime("2026-01-01T00:00:00Z");
scene.camera.follow("probe", { distance: 110 });

mount(document.getElementById("app"), scene);
```

The element needs a size (for example `height: 100%` all the way up). The viewer styles nothing outside its element: it sets no style on `html`, `body` or `#app`, so give the element its size (and, for a full-page viewer, your own `html, body { height: 100%; margin: 0 }` and background) yourself; it makes its own element a containing block (`position: relative` if static, `overflow: hidden` if visible). The probe's circle and the Moon's own orbit (tilted to it, because the circle lies in the reference frame's x-y plane) are both drawn. The finished app, grown into a small made-up story with every call below, is in the repository at `examples/hello-scene`; `examples/hello-planets` shows the same calls with a page's own controls.

### A probe across the solar system

A recorded path can cross the solar system beside enlarged planets. This one is made up (an invented straight line that starts 0.6 AU from the Sun, inside Earth's orbit, and ends about 1.49 AU out, given in ecliptic axes; it is not aimed at any planet); the same calls take positions you downloaded from JPL Horizons.

```js
import { Scene, earth, mars, mount, solarSystemScale, sun } from "astraeus";

const start = Date.parse("2026-01-01T00:00:00Z");
const DAY = 86_400_000;
const AU = 149_597_870.7;
// Ecliptic J2000 positions from the Sun, in km: a straight line from 0.6 AU to about 1.49 AU from the Sun over 200 days (x runs 0.6 to 1.1 AU, y 0 to 1.0 AU).
const samples = Array.from({ length: 11 }, (_, i) => ({ time: start + i * 20 * DAY, positionKm: [AU * (0.6 + 0.05 * i), AU * 0.1 * i, 0] }));

const scene = new Scene()
  .addBody(sun)
  .addBody(earth, { enlarge: 60 })
  .addBody(mars, { enlarge: 60 })
  .addTrajectory({ id: "probe", label: "Made-up probe", samples, plane: "ecliptic-j2000", lineFixedTo: "sun" })
  .setTime(start)
  .setScale(solarSystemScale);
scene.camera.fitOrbit(mars);

mount(document.getElementById("app"), scene);
```

Positions are about the scene centre (here the Sun, the first body) unless `center` says otherwise. `lineFixedTo: "sun"` keeps the line still against the Sun while the planets move (`lineFixedTo: "auto"` picks the Sun or a planet for each stretch from the path's own samples, or give a list such as `[{ start, end, body: "earth" }]`); `plane` turns the ecliptic vectors into the engine's equatorial frame once; `solarSystemScale` keeps the distances true and draws the named bodies larger; the probe's name shows at any distance in a Sun-centred scene. The repository's dev site opens a fuller version at `?experience=synthetic-probe`, and a made-up 1977-to-170-AU journey past Jupiter and Saturn (moons at their dates, paced playback, provenance by stretch) at `?experience=synthetic-journey`.

### Your own controls

The viewer's looks, scale and switches are settings, so a page can draw its own controls and drive them through the handle: `handle.look` and `handle.setLook(look)` (star brightness, Sun glow size and brightness and so on; see `scene.setLook` below for the ranges), `handle.scale` and `handle.setScale(id)` (one of `scene.scales`), `handle.switches` and `handle.setSwitch(id, on)`. The repository's `examples/hello-planets` is a plain `mount` app of the Sun to Mars with no data package and three sliders and a scale button of its own under the viewer; it has no Milky Way slider because the Milky Way picture comes from `astraeus-data`, which it does not install.

## The public API

The full reference, generated from the types and doc comments, is at <https://astraeus.anipatke.com/api/>. The table below is the short form.

| Call | What it does |
|---|---|
| `new Scene()` | An empty scene. Every method below returns the scene, so calls chain. |
| `scene.addBody(body, { orbit?, enlarge?, showLabel?, labelReachEarthRadii?, description?, color?, knownLimitations?, readouts?, listed?, facts?, sources?, labelPriority? })` | Adds a catalogued body: a ready-made one (`sun`, `mercury`, `venus`, `earth`, `moon`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune`, `pluto`, and the moons `io`, `europa`, `ganymede`, `callisto`, `mimas`, `enceladus`, `tethys`, `dione`, `rhea`, `titan`, `iapetus`, `triton`, `charon`, `phobos`, `deimos`) or its id; every moon in the moon lists is also taken by its id (`addBody("miranda")` with `astraeus-data-uranus` passed to `mount`) as a grey sphere at its mean radius, and `listedMoons(planet?)` names them with the data package each needs (`requires`). Moons with pictures: Io, Europa, Ganymede, Callisto, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton and Charon. Every other listed moon, among them Uranus's Miranda, Ariel, Umbriel, Titania and Oberon, draws flat-coloured with this package loaded. The first body added is the scene's centre. `{ orbit: true }` also draws its orbit line: any catalogued moon with a period in its data (every listed moon but those the list gives no period for, and `moon`, `io`, `europa`, `ganymede`, `callisto`, `mimas`, `enceladus`, `tethys`, `dione`, `rhea`, `titan`, `iapetus`, `triton`, `charon`) about its planet, one lap of that period (the planet must be in the scene; `phobos`, `deimos` and any moon with no period throw `no-orbit`), or, with `sun` in the scene, one turn round the Sun of any body that circles it (the planets, Earth's year, a body from `addBodyFromElements`), from the opening time: one full turn of the body's own positions where they cover a whole turn, else (Uranus and Neptune, whose turn outlasts the planet series) the two-body ellipse osculating at the opening time, which the info card says; anything else throws `no-orbit`. `camera.fitOrbit` follows the same rule. `enlarge` (a number of at least 1) draws the body that many times larger than life (in a Sun-centred scene the viewer then offers its "Solar system" scale, true distances with the named bodies enlarged, as the second scale in place of Readable); `showLabel: false` starts its label off; `labelReachEarthRadii` (a positive number, in Earth radii, the camera's distance units) shows its label only within that distance of the camera, in place of the scene's shared rule. A scene whose first body is the Sun sets no label reach, so labels stay when zoomed out, and it can hold a path (`addTrajectory`, drawn with `lineFixedTo: "sun"`). `color` (a hex colour such as `"#9fd8ff"`) sets the colour on its info card and label; `knownLimitations` (a list of non-empty texts) replaces the catalogue's limits shown with its provenance; a bad value throws `bad-body`. `readouts` takes the list `addTrajectory` takes (`range`, `speed`, `distance`, `altitude`), measured from the scene's centre body, and draws it on the body's info card in place of the catalogue's own distance rows; a bad readout throws `bad-readout`, and a named body the scene does not hold throws `bad-readout` when the scene is built. `listed: false` (default true) leaves the body out of the object menu; it is still drawn and selectable, and the menu shows it while it is selected. `facts` (default none) is a list of `{ label, value }` rows, both non-empty, shown on the info card in order. `sources` (default none) is a list of non-empty texts added to the card's provenance after the body's own, and `scene.provenanceOf` includes them. `labelPriority` (a finite number; default `100 - index`, so bodies added earlier win) decides which label shows when labels overlap, the higher number winning. A bad value of any of these throws `bad-body`. `orbit` also takes `{ lapDays, fades? }` for a moon: it draws the line about its parent over one lap of `lapDays` (a positive number), whether or not the moon's data give a period (`phobos` and `deimos`, which have none, take it); `fades: true` fades the line's far end and `false` closes the loop, and when absent the moon's own rule applies (the Moon's line fades, others close); a bad lap throws `bad-body`, and a body that circles the Sun throws `no-orbit`. The scene's centre needs no setting: it is the first body added. Jupiter, Saturn, Uranus and Neptune are drawn with their rings (bands at the NASA NSSDC ring fact sheet radii) whenever you add them; Mercury, Venus, Earth, Mars and Pluto have none. |
| `scene.addTrajectory({ id, label?, color?, center?, plane?, lineFixedTo?, labelReachEarthRadii?, samples, provenance?, provenanceSpans?, description?, knownLimitations?, anchors?, readouts? })` | A recorded path. Each sample is `{ time, positionKm, velocityKmS? }` measured from `center` (default: the scene's centre, its first body, so a Sun-first scene reads them from the Sun and an Earth-first one from Earth; Earth if no body is added) in equatorial J2000 (EQJ) axes; `plane: "ecliptic-j2000"` instead takes ecliptic J2000 vectors as JPL Horizons publishes them and rotates them to EQJ once on the way in (positions and velocities, from samples or a provider; a provider's `orientation` quaternion passes through unrotated, a known limit; any other `plane` throws `bad-trajectory`); `lineFixedTo` names the body the line is drawn against (default the scene centre): each sample is placed from that body at the sample's own time, then the line is carried to that body's place from the scene centre at the clock time, so `"sun"` fixes a probe's line to the Sun in any scene, Sun-centred ones included, and a body the scene does not hold throws `bad-trajectory`; a list of `{ start, end, body }` (sorted, not overlapping, inside the path, times as in `provenanceSpans`) draws each stretch against its own body, so a flyby (Sun-fixed cruise, planet-fixed encounter, Sun-fixed cruise) is one path with one menu entry and card, time outside every stretch is drawn against the scene centre, and a fault throws `bad-trajectory` naming the index; `lineFixedTo: "auto"` builds that list from the path's own samples, once, when the planet series are in: each sample is fixed to the innermost body in the scene whose sphere of influence (`a (m / M)^(2/5)`, `a` its distance from its parent, GMs from the catalogue; the Sun holds everything) holds the probe, else the scene centre, consecutive samples on one body merging; a body with no catalogue GM (a comet from `addBodyFromElements`, every moon added only by id) is skipped, and `"auto"` is not usable as a body id; `labelReachEarthRadii` (a positive number, in Earth radii, the camera's distance units) limits how far from the camera its name shows, in place of the scene's shared rule; a bad value throws `bad-trajectory`; `time` is ISO text, a `Date` or Unix milliseconds. Instead of `samples` you may give `provider` (an object with `stateAt(timeUtcMs)`) and `bounds: { start, end }`. `description` and `knownLimitations` (a list of sentences) go on its info card with `provenance`. `anchors: [{ id, time }]` draw labelled dots where the source published a point (the time must fall within the path). `readouts` are bars on the card, in order: `{ kind: "range", marker? }` (distance from the centre; `marker` names a body to mark), `{ kind: "speed" }`, `{ kind: "distance", to }` and `{ kind: "altitude", above }`; a named body must be in the scene. `provenanceSpans` (a list of `{ start, end, provenance }`, sorted, not overlapping, inside the path) gives each stretch its own provenance, shown with the path as time moves (as an activity's `provenance`); where no span covers the time, `provenance` (or the illustrative default) shows; a fault throws `bad-trajectory` naming the index. |
| `scene.addBodyFromElements(record, options?)` | Your own body that circles the Sun, from published orbit elements: `record` is `{ id, label, elements: { semiMajorAxisAu, eccentricity, inclinationDeg, ascendingNodeDeg, argumentOfPerihelionDeg, meanAnomalyDeg or perihelionJdTdb }, epoch: { jd, timeScale, ttMinusUtcSeconds? }, plane: "ecliptic-j2000", source: { name, url, solution, accessed }, radius?, accuracy: { classification, statement, valid: { start, end }, limitations }, marker?: { color, sizePx } }`; `accuracy.valid` is `{ start, end }`, each ISO text such as `2030-01-01T00:00:00Z` (a record is usually JSON), a `Date` or milliseconds. Drawn as a marker on unperturbed two-body motion about the Sun; the source, accuracy and limits show on its info card, with a live "Distance from Sun" row. `options` are `addBody`'s (`{ orbit: true }` draws its whole orbit from periapsis, smooth even for a sharp comet orbit). A bad record throws `bad-element` naming the field; a repeated id throws `duplicate-id`. |
| `scene.addBodySet({ id, families, members, provenance, center?, bodies?, centerGmKm3S2?, balancePoint?, orbitHistoryMs? })` | Many small bodies about one centre as one batch of dots, each selectable with an info card, with orbit lines coloured by family. `families` is one to sixteen of `{ id, label, color?, brightness? }` (colour a CSS hex colour, default the palette in family order; `brightness` the orbit-line multiplier, default 1). A member is `{ id, family, label?, radiusKm?, elements?, description?, facts?, provenance?, knownLimitations?, listed? }`: with no `elements` it is a listed moon of `center` (`listedMoons(planet)`; its positions come through `data`, as for `addBody`, and its label and radius default to the list's); with `elements` (`semiMajorAxisKm`, `eccentricity`, `inclinationDeg`, `raanDeg`, `argumentOfPeriapsisDeg`, `trueAnomalyDeg`, `time?`, `plane?`) it is a made-up member on two-body motion and needs `label` and `radiusKm`. A set is one kind or the other. `center` is a body in the scene (default the scene's first); `centerGmKm3S2` sizes each orbit line to one lap (default the centre's moon system, else its catalogue record; neither is `bad-body-set`). `bodies` are bodies added with `addBody` that belong to a family: their orbit lines take its colour, and one with no `orbit` of its own, if it is a listed moon of `center`, gets its line in this batch. `balancePoint` (`{ body, gmKm3S2 }`, a member or such a body) draws the lines about the balance point of the centre and that body (default the centre's moon system's own when its body is drawn here). `orbitHistoryMs` loads positions that long before the window so a line can reach back (default 0). Members are not in the Object menu unless `listed: true`. `stateOf` and `provenanceOf` accept member ids; story panels may name them; a view cannot name a set or a member. A repeated id throws `duplicate-id`; a mistake throws `bad-body-set`. |
| `scene.setMoonPanel({ label, families, featuredFamily?, listSource?, listDate? })` | The sliding panel of a planet's moons by family. `label` is the name in the heading ("<label>'s moons"). `families` is `{ id, label, description, moons }` each, where a moon is `{ id, named? }`: a body (`addBody`) or a body-set member (`addBodySet`) of the scene, checked when the scene is built; its label comes from there, and `named: false` folds a provisional designation under "+N unnamed". A moon that is a body gets the picture the viewer's `data` brings for it (the packages' `pictures`); a dot gets none. `featuredFamily` is the family id listed first with pictures. `listSource` and `listDate` (a moment, kept as its day) say where and when the list was taken. Replaces any earlier panel. A malformed panel, or a moon the scene does not hold, throws `bad-moon-panel`. |
| `scene.setPicker({ id, label, options, value })` | A choice in the viewer's top bar and phone drawer: one button per option `{ value, label }` (values unique), the option with `value` pressed when the viewer opens, `label` the accessible name of the group and `id` carried on the buttons as `data-switch-param`. Fewer than two options draw nothing. Replaces any earlier picker. A press only tells the host (`handle.onPick`, the `onPick` prop): the viewer never navigates, reads or writes the page address, or keeps a time, and the pressed button does not move until the host calls `handle.setPick` or mounts a new scene. A malformed picker, or a `value` that is not an option, throws `bad-picker`. |
| `scene.addSkyFigures(figures)` | Figures and outlines drawn on the sky at infinity, like the stars (J2000 equatorial frame, presentation only), each with a label. Each is `{ id, label, kind?, segments?, points?, labelAt?, color?, labelColor?, labelFont?, labelSizePx? }`. A `"figure"` (the default `kind`) has `segments`, a non-empty list of `[end, end]` pairs, an end being `{ star: <Hipparcos number> }` (a star of the engine's star list, magnitude 6.5 or brighter) or `{ raDeg, decDeg }`; a `"boundary"` has `points`, a closed loop of at least three `{ raDeg, decDeg }` (the last joins the first). `labelAt` is `{ raDeg, decDeg }`; without it the label stands at the mean direction of the ends. Lines draw above the Sun's glow, from the orbit camera and from a look-out view; the labels join the viewer's one name layout and give way to body names. The switches `skyFigures` (on) and `skyBoundaries` (off) show each kind, and `ecliptic` and `celestialEquator` (both off) draw the two reference circles (`setSwitches`). `id` must be new among the scene's bodies, paths, groups, body sets and sky figures (`duplicate-id`, also for a repeat inside one call); a malformed figure throws `bad-sky-figure` and adds none of the call. A star number not in the star list throws `unknown-star` when the scene is built (`mount`, `prepare`; the list loads then, not at this call); a star list that cannot be read throws `missing-data` then. `color` and `labelColor` (CSS colours), `labelFont` (a CSS font-family text) and `labelSizePx` (8 to 24) are the figure's own line colour and label look, over the looks `skyLines` and `labels`; a bad one throws `bad-sky-figure`. Read the result from `scene.skyFigures`. |
| `scene.addPlaces(body, { categories, places, provenance, knownLimitations? })` | The tagged surface places of one body, drawn as markers on it and opened in the information panel. `categories` are `{ key, label, color }` (a CSS hex colour); `places` are `{ id, name, kind, category, latitudeDeg, longitudeDeg, description, details? }` (`id` unique within the body, `kind` shown as the place's kind such as "Crater", an unknown `category` draws white, longitude east-positive as the marker draws it, coordinates kept exactly as given, `details` card facts). `provenance` is shown with every place (PROV-01). The body must be in the scene when it is built; a second call for one body throws `duplicate-id`; a mistake throws `bad-places`. The place lists of 24 bodies ship as data in `astraeus-data` (`astraeus-data/bodies/<body>/{features,categories,map,overview}.json`, with `catalogue.json`); an app converts them to this input. |
| `scene.addGroup({ id, orbits, plane, label?, center?, color?, dotSizePx?, referenceTime?, seed?, clump?, refillAfterMs?, refillSliceMs?, provenance?, description?, knownLimitations? })` | A list of orbits drawn as one group of dots: `orbits` is `[{ id, semiMajorAxisKm, eccentricity, inclinationDeg, raanDeg, argumentOfPeriapsisDeg, time? }]` (bound orbits, ids distinct), measured about `center` (default the scene's centre; it must be in the scene) in `plane`, which you must give (`"ecliptic-j2000"` or `"EQJ"`; a group without one throws `bad-group`). One colour (`color`, a hex colour), dot size (`dotSizePx`), menu item, info card, provenance and known limits. Where each dot sits along its orbit is a drawing choice, marked illustrative: an even spread shuffled by `seed`, fixed at `referenceTime` (default the opening time), then two-body motion. `clump: { near, fraction, widthDeg }` draws a share of the dots near a body's place along its orbit (a model; the body must be in the scene and not the centre; it may be one added with `addBodyFromElements` before the group). `refillAfterMs` is how often the dots are placed again; `refillSliceMs` (0 or more) is how much of a frame may go on computing the next fill ahead of time. The group's card shows "illustrative" as its source type, with the elements' own type in the accuracy sentence. The id joins the camera menu (`focus-<id>`, `follow-<id>`) and may be a panel's `object`. A mistake throws `bad-group`. |
| `scene.setTime(time)` | The moment the scene opens at. |
| `scene.setScale(trueScale \| readableScale \| solarSystemScale, { only? })` | The opening scale; the viewer can switch to the other unless `{ only: true }` offers that scale alone. `solarSystemScale` (true distances, enlarged bodies drawn larger) needs a Sun-centred scene with an enlarged body, else `bad-scale`; such a scene offers it second in place of `readableScale`. |
| `scene.addEvents(events, { provenance? })` | Timed events on the timeline: `[{ id, label, time, type?, provenance?, object?, withinSeconds? }]`; it appends, and a repeated id, in one call or across calls, throws `duplicate-id`. `withinSeconds` (positive, finite, simulated seconds) gives the event its own zone, `time ± withinSeconds`, that a host hears with `onEventZone` and `eventZones` with or without pacing; a pacing `near` rule uses it in place of its own `withinSeconds` for that event. A bad value throws `bad-event` naming the event. `object` is the id of a body or trajectory in the scene the event is about: the timeline's Go to (and Previous/Next) seeks to the event and frames that object as `camera.focus` does (it is selected and Focus shows pressed); an event without one only seeks. An `object` the scene lacks throws `bad-event` naming the event and the id when the scene is built. `provenance` says where the times come from; an event's own `provenance` wins over the batch's. A provenance `sourceType` is `ephemeris`, `observed`, `reconstructed`, `modelled` or `illustrative`; `modelled` is shown as "Modelled". Batch and per-event provenance are checked: a malformed one throws `bad-event`. May be called more than once. |
| `scene.addStoryPanels(list)` | Appends story panels that open as playback reaches them: `[{ id, at: { time } \| { event } \| { anchor }, title, body, details?, provenance, object? }]`. `at.time` is any moment (ISO text, a `Date` or Unix milliseconds). `provenance` is `{ sourceType, sources, accuracy, notes }`: the badge shows the word for `sourceType`, and `sources`, `accuracy` and `notes` show in the panel's folded section. `sources` is never empty and `accuracy` is never blank; where a source states none, say so. A bad shape throws `bad-panels` at the call, naming the panel and field; a repeated id throws `duplicate-id`. The events, anchors and objects a panel names may be added later, so they are checked at `check` and `mount`, which throw `bad-panels`. |
| `scene.setStoryPanelPlayback({ pauseSeconds?, autoOpen? })` | How story panels play: the seconds playback holds when a panel opens by itself (0 to 20, default 6; 0 never pauses) and whether panels open by themselves (default true). Replaces the whole setting; a bad value throws `bad-panels`. |
| `scene.setTimeline({ start, end, rates?, rate?, loop?, pacing? })` | The timeline's span, the playback speeds offered (simulated seconds per real second) and the one it opens at. `{ none: true, at?, rate? }` draws no timeline bar: time is frozen at `at`, or runs on at `rate`. The speed menu shows exactly the `rates` you give (ascending), and no others; without `rates` it offers 1 minute, 1 hour and 1 day per second. `pacing` slows playback for encounters and speeds it up for cruise, see "Paced playback" below. With a timeline bar and no `loop`, playback stops on the timeline's end instead of running past it. |
| `scene.addActivity({ id, label, unit, start, end, samples, peak?, provenance?, type?, peakLabel? })` | A period of activity on the timeline: a rate curve `samples: [{ time, value }]` (at least two, sorted, inside `start` to `end`; straight lines between) that the timeline glows by, with an optional `peak` mark and `provenance: [{ start, end, provenance }]` for where each stretch comes from. A group's `readouts: [{ kind: "rate", activity? }]` shows the live rate (unavailable outside the period) against the peak on its card. Without `setTimeline` the timeline spans the activities. A repeated id throws `duplicate-id`; a bad curve, peak or source throws `bad-activity`; a rate readout with no activity is `bad-readout`. |
| `scene.camera.setReach(distance, { farEarthRadii? })` | How far the viewer can zoom out, in Earth radii; the far plane (where drawing stops) is 2.5 times it unless `farEarthRadii` (a finite number of at least `distance`, in Earth radii) sets it; labels reach as far, a path's own name (at its marker, switched by `labels`) included. A bad value throws `bad-camera`. Without `setReach` or `fitOrbit`, a Sun-centred scene with a path about the Sun widens its farthest zoom-out to fit that path whole (twice its farthest Sun distance, for the live canvas shape), so a path out to 170 AU can be seen entire. The object the scene opens on (`camera.follow` or `camera.focus`) is selected, and a selected object's label wins every label collision: it is never the one hidden because it overlaps another. Other labels keep their priority order. `camera.follow` and `camera.focus` take `up: "ecliptic"` (default `"equatorial"`) to orbit about the ecliptic's pole; any other value throws `bad-camera`. `setTimeline` takes `loop: true` so playback wraps from the end to the start. |
| `scene.camera.setStartView(pose)` | Opens at a pose (what `handle.camera` reads, either kind: an orbit pose `{ focus, azimuthDeg, elevationDeg, distance }`, distance in Earth radii, or a sky pose `{ lookOut, raDeg, decDeg, fovDeg }`) with no camera button pressed, so Focus does not show as pressed and choosing another body moves the camera as it would without a start. `focus` or `lookOut` must be a body or path already added (`unknown-body`); a bad angle, distance or field of view throws `bad-camera`. The last of `follow`, `focus`, `lookOut` and `setStartView` wins. Default: none. |
| `scene.camera.lookOut(body, { direction?, fovDeg? })` | Opens standing inside a body (at its centre) and looking out, with no camera button pressed: the same as `setStartView` with a sky pose. `direction` is a star-map position `{ raDeg, decDeg }` (J2000 equatorial degrees; default right ascension 0, declination 0) and `fovDeg` the vertical field of view in degrees (5 to 100; default 60). The body must be already added (`unknown-body`); a direction or field of view out of range, a half or misspelt direction, an unknown key, or a `look` that is not an object throws `bad-camera` at the call (as `setCamera` does). The body stood in is not drawn while looking out. `scene.camera.lookOut("earth", { direction: { raDeg: 83.6, decDeg: 22 }, fovDeg: 40 })` |
| `scene.camera.setFollowChoices(ids)` | Which objects offer a Follow button in the camera menu, by body or id already added (`unknown-body`); the others offer Focus only, and an empty list offers Follow on none. Default: every body, path and group. An opening `camera.follow` of an object not in the list throws `bad-camera` when the scene is built. |
| `scene.camera.setLookOutChoices(ids)` | Which bodies offer a "Look out from" entry in the camera menu (O-064 T-293), by body or id already added (`unknown-body`; a non-list is `bad-camera`). The entry sits with Focus and Follow on the bar and the phone drawer and stands inside the body looking toward right ascension 0, declination 0; Focus, Follow, Overview or an orbit `setCamera` leaves the sky view. Default: none. The opening `camera.lookOut` does not need the body listed. `scene.camera.setLookOutChoices(["earth", "mars"])` |
| `scene.setBodyReadouts(kinds)` | Which rows a body's info card shows, in order: `"distance"`, `"phase"`, `"coordinates"`; replaces the earlier choice. Default `["distance"]`. A body whose `addBody` gave its own `readouts` keeps those. An unknown kind throws `bad-readout`. |
| `scene.camera.fitOrbit(body)` | Sets the farthest zoom-out so the whole orbit of a body that circles the Sun (a planet, or a comet or asteroid from `addBodyFromElements`, already added) fits the canvas from any view direction: 1.1 times its farthest Sun distance over the sine of the narrower half field of view. The fit follows the live canvas shape (a phone turning, a window resizing) and the far plane is 2.5 times the reach. The opening view is not moved, except that it is clamped to the limit like any other. Labels are not limited in a fitted scene. It and `setReach` set the same limit; the later call wins. A body that does not circle the Sun throws `bad-camera`; one not in the scene, `unknown-body`. `scene.camera.fitOrbit("c-2025-a1")` |
| `scene.setLook({ starBrightness?, milkyWay?, milkyWayBrightness?, skyVisible?, sunGlow?: { sizePx?, brightness?, scale? }, markerSwapRadiusPx?, featureMinBodyPx?, loadFadeSeconds?, desktopPictures?, skyLines?: { figure?, label?, boundary?, ecliptic?, equator?, traced?, faded? }, labels?: { fontFamily?, sizePx? } })` | The looks, presentation settings that change how the scene is drawn and never where anything is; each is optional and keeps its default when not named (the call replaces the whole look). Ranges and defaults: star and Milky Way brightness 0 to 2 (1); `milkyWay` and `skyVisible` true or false (Milky Way off, sky shown); `sunGlow.sizePx` 0 to 400 (the Sun record's 72), `sunGlow.brightness` 0 to 2 (1), `sunGlow.scale` 1 to 6 (2.5); `markerSwapRadiusPx` 0 to 100 (3), the screen radius under which a sphere is drawn as a dot; `featureMinBodyPx` 0 to 2000 (60); `loadFadeSeconds` 0 to 3 (0.6); `desktopPictures` true or false (false) lets a body with a larger desktop picture use it on a wide screen, read when the viewer is built, so a later `setLook` neither swaps pictures nor changes what `look` reads. `skyLines` sets the colours of the sky lines and their names as CSS colour texts (hex, a name, or comma-form `rgb()`/`rgba()`/`hsl()`/`hsla()`): `figure` `"#8fb4ff"`, `label` `"#cfe0ff"` (the names), `boundary` `"#5f7a9c"`, `ecliptic` `"#e0b25a"`, `equator` `"#7fd1b9"`, `traced` `"#ffd166"` and `faded` `"#44546d"` (the last two are for the lines a trace draws, in a later step); `labels` sets the font (`fontFamily`, a CSS font-family text, default `"inherit"`, the page's own) and size (`sizePx`, 8 to 24, default 12) of every label in the viewer (bodies, paths, sky figures and anchors), so the defaults keep the labels as they were; a sky figure may set its own. A colour the viewer cannot read, an empty font or a size out of range throws `bad-look`. `skyLines` and `labels` have no page address parameter: they are set here, with `handle.setLook` and in the Developer drawer only. A page address parameter (table below) overrides the look it names when `address` is on. An unknown look or a value out of range throws `bad-look`. |
| `scene.setSwitches({ orbitLines?, labels?, milkyWay?, skyFigures?, skyBoundaries?, ecliptic?, celestialEquator? })` | Where each display switch shows: `{ place: "top-bar" \| "panel" \| "developer", on? }`. A top-bar switch is a button in the bar, a panel switch is a row in one switch panel opened from the bar, and a developer switch is only in the Developer drawer (where every switch stays), so it shows only when the viewer was built with `developerTools` on; with it off there is no drawer and the switch is simply not shown. `orbitLines` is the orbit ring, trailing arc and moon orbits; `labels` is body and anchor labels; `milkyWay` is the sky picture; `skyFigures` and `skyBoundaries` are the figures and the outlines of `addSkyFigures` (a switch the scene has no figure of shows nowhere); `ecliptic` and `celestialEquator` are the two reference circles of the sky. `on` is the starting state (default on, except `skyBoundaries`, `ecliptic` and `celestialEquator`, which start off). Nothing placed: the bar is as before. A bad name, place or `on` throws `bad-switch`. |
| `scene.setViews(views, { place, start? })` | Names views of one scene: each `{ id, label, objects?, events?, panels?, camera? }` lists the `addBody`, `addGroup` and `addTrajectory` ids (`objects`), `addEvents` ids and `addStoryPanels` ids it shows. Anything no view names shows in every view; anything named shows only in the views that name it. `place` is `"top-bar"` or `"panel"`; `start` is the opening view (default the first). `camera` is `"stay"` (default), `"start"` or `{ follow: id }` / `{ focus: id }` (the object must be in the view). The rule applies only when switching to the view takes away the object the camera follows or focuses on: `"stay"` holds the camera where it is (its target fixed in the scene, so it does not move on with the hidden object), stops following and closes that object's card; `"start"` takes the scene's opening framing; `{ follow: id }` / `{ focus: id }` follows or focuses that object. A followed object still in the new view leaves the camera alone, unless the framing opts in: `{ follow: id, always: true }` / `{ focus: id, always: true }` applies it on every switch to the view, also when the camera follows an object both views show (a host's own `setCamera` made after the switch still wins over it). Read and set the view from `mount` or `AstraeusScene` ("Views from the host page"). Presentation only: State is unchanged. An empty list, a repeated id, a bad place, camera or `start` throws `bad-view` at the call (`always` must be `true` when given); an unknown id or a camera target the view hides throws `bad-view` when the scene is built. |
| `scene.stateOf(id, time)` | The state of any body in the scene at a moment, for figures a story quotes. `positionKm` is always there; `velocityKmS` (km/s) only where the body's source gives one, so check it before use: a path from `addTrajectory` whose samples or provider carry velocities, and a moon from fitted data (Io); planets, Earth, the Sun and elements bodies give position only. Bodies: a path from `addTrajectory` (about its centre, in EQJ axes whatever `plane` it was given in), or a ready-made body, moon or elements body (about its parent). Ready-made and elements bodies answer at any date; only a moment outside an `addTrajectory` path throws `bad-time`. A planet's or fitted moon's data loads with `await scene.load({ data })` (or at `mount`, once `ready` resolves); before that it throws `missing-data`. `const au = Math.hypot(...scene.stateOf("earth", "2026-08-12T00:00:00Z").positionKm) / 149597870.7;` |
| `scene.load({ data? })` | Loads what `stateOf` and `provenanceOf` need, without a viewer: the planet series and, for each moon the scene holds, the chunks its data package provides for the scene's window. Pass the same `data` as `mount`. Rejects with `missing-data` (a body needs a package not passed) or `out-of-span`; harmless to call twice, allowed on a mounted scene, and a later `mount` re-uses what it loaded. Works in plain Node. `await scene.load({ data: [jupiterData] });` |
| `scene.check({ data? })` | Runs the checks `mount` runs before it draws and throws the same `SceneError` for a build fault, without loading or freezing anything. `scene.check({ data: [jupiterData] });` |
| `scene.provenanceOf(id)` | Where a body's position comes from, as its info card shows it. Where a comparison with an independent ephemeris exists it carries `accuracyClass` and `maxErrorFraction`. For a body from `addBodyFromElements` it is the limit of its class (0.01 `approximate`, 0.05 `indicative`): an upper bound, not a measured figure. Other bodies carry neither field. |
| `scene.bodies` | What the scene holds, as plain frozen lists you can check in a test without a viewer (a fresh list on every read; they answer on a scene a viewer has taken). `bodies`: `{ id, label, parent?, orbit, enlarge, description?, knownLimitations, listed, facts?, texture? }` in the order added (the first is the scene's centre; `orbit` says its orbit line is on, `enlarge` is 1 unless enlarged; `knownLimitations` are the card's: given, else the catalogue's; `listed` and `facts` are what `addBody` set, `listed` true by default; `texture` is the picture and licence the engine ships for the body, as a credits page lists it, absent for a body drawn from a data package's picture or a flat colour). |
| `scene.paths` | `{ id, label, center, provenance, description?, knownLimitations }` per `addTrajectory`, in the order added. |
| `scene.bodySets` | `{ id, center, count, families }` per `addBodySet`, in the order added; a fresh frozen list on every read. |
| `scene.moonPanel` | `{ count, summary }` of the moon panel, or `undefined` before `setMoonPanel`; `summary` reads like "115 moons in the JPL Horizons list of 18 October 2026". |
| `scene.picker` | The picker as set (`{ id, label, options, value }`, frozen), or `undefined` before `setPicker`. |
| `scene.places` | `{ body, count }` per `addPlaces`, in the order added; a fresh frozen list on every read. |
| `scene.skyFigures` | `{ id, label, kind }` per `addSkyFigures` figure, in the order added; a fresh frozen list on every read. |
| `scene.groups` | `{ id, label, count, center, plane, provenance, description, knownLimitations }` per `addGroup`: `provenance`, `description` and `knownLimitations` are what the group's card shows (always illustrative, with the engine's placement and motion limits). |
| `scene.activities` | `{ id, label, unit, windowStartUtcMs, windowEndUtcMs, peak: { label, value, timeUtcMs? }, samples: [{ timeUtcMs, value }], provenance?: [{ stretchStartUtcMs, stretchEndUtcMs, provenance }], type? }` per `addActivity`, in the order added; a fresh frozen copy. `peak.value` is the highest sample when no peak moment was given. |
| `scene.events` | `{ id, label, timeUtcMs, type?, object?, withinSeconds?, provenance? }` per `addEvents`, sorted by time; `provenance` is the event's own, else the batch's. |
| `scene.panels` | `{ id, timeUtcMs, title, body, details, provenance, object? }` per `addStoryPanels`, sorted by time, the times resolved as `mount` resolves them (a bad panel throws `bad-panels`). |
| `scene.views` | `{ startId, place, items: [{ id, label, objects, events, panels }] }` as named with `setViews`; undefined when none were named. `objects`, `events` and `panels` are the ids each view shows, as the viewer resolves them: what the view names plus whatever no view names (shared bodies show in every view). Fresh frozen lists on every read. The ids are checked as `mount` checks them, so an unknown one throws `bad-view`. |
| `scene.scales` | The scale choices the viewer will offer, in order, as ids (`"true-scale"`, `"readable-scale"`, `"solar-system"`); the first is the opening scale. |
| `scene.timeline` | `{ windowStartUtcMs, windowEndUtcMs, openUtcMs, rates, rate, loop }`: the span and opening moment in UTC milliseconds, the speeds offered, the opening speed and whether playback wraps. With nothing setting a span or moment and no path or activity, the span is a month about the moment of the read. Planet orbit lines and the far plane answer from `scene.bodies[].orbit` and `scene.camera.farEarthRadii` (when none was given, the far plane is 2.5 times `scene.camera.reachEarthRadii`). |
| `scene.camera.follow(id, { azimuthDeg?, elevationDeg?, distance? })` | Opens framed on a body or trajectory already added, and already following it. `distance` is in Earth radii. |
| `scene.camera.focus(id, { azimuthDeg?, elevationDeg?, distance? })` | The same opening view without following. The last of `follow` and `focus` wins. The viewer's camera menu gets a Focus and a Follow entry for every body and path. |
| `mount(element, scene, { data?, onChange?, address?, developerTools? })` | Draws the scene with the full viewer. Returns `{ ready, unmount(), timeUtcMs, rate, playing, view, camera, eventZones, selected, look, scale, switches, skyFigures, pick, setTime(t), setRate(r), setPlaying(p), setView(id), setCamera(target), setSelected(id), setLook(look), setScale(id), setSwitch(id), traceSkyFigure(id), setPick(value), onChange(fn), onEventZone(fn), onSelect(fn), onCameraChange(fn), onFirstDraw(fn), onPick(fn) }`. `data` is a list of data packages (below); `address` is off by default (see "Page address"); `developerTools` is off by default (the cog and the Developer drawer are not drawn, and the drawer's code is never fetched; the demo site turns it on); the time and speed members are described under "Reading and setting the time". |
| `<AstraeusScene scene data? ref? onReady? onError? time? rate? view? camera? onChange? onEventZone? onPick? onFirstDraw? address? developerTools? className? style? />` | The same viewer as a React component (below). |
| `SceneError` | Thrown for bad input. `error.code` is one of the documented `SceneErrorCode` values (for example `unknown-body`, `bad-time`, `missing-data`, `no-orbit`) and the message says what to do. |

Checking accuracy and records without a scene: the class limits are root exports (`APPROXIMATE_LIMIT_FRACTION`, `INDICATIVE_LIMIT_FRACTION`), `classifyPositionError(maxFraction)` returns `"approximate"`, `"indicative"` or `null` (neither) for a measured largest error fraction, and `parseElementsBodyRecord(record)` validates an elements record (the same check `addBodyFromElements` makes, throwing `bad-element` naming the field):

```js
import { classifyPositionError, parseElementsBodyRecord } from "astraeus";
const accuracyClass = classifyPositionError(0.004); // measured error / distance from the Sun
const record = parseElementsBodyRecord(myRecord);
```

Types (`State`, `Pictures`, `TextureRef`, `AssetLicence`, `DataSource`, `TrajectoryInput` and the like) are exported for TypeScript.

## In a React app

`AstraeusScene` draws the same viewer as `mount`, as a component. It fills its parent, so give the parent a size:

```jsx
import { Scene, earth, moon, AstraeusScene } from "astraeus";

const scene = new Scene().addBody(earth).addBody(moon, { orbit: true });

export const App = () => (
  <div style={{ height: "100vh" }}>
    <AstraeusScene scene={scene} data={[]} onReady={() => console.log("drawn")} onError={(error) => console.error(error)} />
  </div>
);
```

Props: `scene`, `data` (as for `mount`), `ref` (a React 19 ref prop that receives the same handle `mount` returns, minus `ready` and `unmount`: one object for the component's life, reads `undefined` and calls throwing `not-mounted` until drawn and after unmount), `onReady(handle)` (called with that handle once drawn and the viewer's clock is attached, the same moment `mount`'s `ready` resolves, and again after each rebuild; under React StrictMode it still fires once per build), `onError` (a bad scene or failed data load), `className` and `style` for the wrapper. Build the `Scene` once (outside the component or in `useMemo`): a new `Scene` object rebuilds the viewer. It needs React 19 and the peer dependencies (`react`, `react-dom`, `@react-three/fiber`, `three`). See `examples/hello-react` in the repository.

## Reading and setting the time

The viewer has one clock (and, with `setViews`, one current view: rows below). A host page reads it, moves it and hears about changes, from the `mount` handle or from `AstraeusScene` props. Time is Unix milliseconds UTC; speed is simulated seconds per real second. **Order rule:** after `ready`, every call on the handle takes effect or throws, in the order the host made it, and the last host call wins. A `setCamera` made before the scene's first frame is kept and applied after the scene's opening view, not discarded by it. A `setCamera` made inside an `onChange` report of a view switch is applied after the view's own camera rule for that switch. A view's camera rule is a default for a switch, so a later host call replaces it.

| Name | What it does |
|------|--------------|
| `handle.ready` | Resolves once the scene's data has loaded, it is drawn and the host link is attached, so `timeUtcMs`, `rate`, `view` and every `set` call work on the line after `await handle.ready`; no extra frame or wait. Rejects if loading failed, and with `not-mounted` if `unmount` came first; it never stays pending. |
| `handle.timeUtcMs`, `handle.rate` | The clock now. `undefined` until `ready` has resolved and after `unmount`. |
| `handle.setTime(time)` | Moves the viewer to `time` (ISO text, a `Date` or milliseconds). Outside the timeline throws `bad-time`. It counts as a seek for story panels, as the visitor's slider does: moving across a panel's time opens nothing by itself. Before `ready` or after `unmount` throws `not-mounted`. |
| `handle.setRate(rate)` | Sets the speed to one the timeline offers (`setTimeline({ rates })`). Any other number throws `bad-timeline`: the speed menu always shows what is running, so a custom speed is refused, not added. `handle.setRate("auto")` hands the speed back to the scene's pacing (below); without pacing it throws `bad-timeline`. |
| `handle.playing` and `handle.setPlaying(playing)` | `playing` reads whether the viewer is playing (undefined before `ready` and after `unmount`). `setPlaying(true)` or `setPlaying(false)` plays or pauses through the same handler as the visitor's play button; `onChange` hears it with `cause: "host"` and the new `playing`. A non-boolean, or a scene with `setTimeline({ none: true })` (no play control for a visitor either), throws `bad-timeline`. |
| `handle.look`, `handle.setLook(look)` | `look` reads the looks in force with every one filled in (`starBrightness`, `milkyWay`, `milkyWayBrightness`, `skyVisible`, `sunGlow?` as `{ sizePx, brightness, scale }`, `markerSwapRadiusPx`, `featureMinBodyPx`, `loadFadeSeconds`, `desktopPictures`, `skyLines` and `labels` as filled-in objects), whoever set them: the scene's `setLook`, the page address, your `setLook` or a visitor in the Developer drawer. `setLook(look)` replaces the whole look (a look not named takes its default) and is checked as `Scene.setLook` checks it (`bad-look`); a live `setLook` wins over the same look in the page address, which only starts the viewer. Presentation only. `look` is `undefined` until `ready` and after `unmount`; `setLook` before `ready` or after `unmount` throws `not-mounted`. |
| `handle.onFirstDraw(fn)` or `<AstraeusScene onFirstDraw />` | `fn()` once when the scene's first frame has been drawn (not `ready`, which resolves a moment earlier, when the clock attaches), for fading your own loading cover; returns a function that stops it. A listener added after that frame is called at once. A rebuild with a new `scene` draws a new first frame and calls the listeners still added again (the React prop is called again). A listener that throws is reported to the page (`reportError`) and does not stop the next; nothing arrives after `unmount`. |
| `handle.pick`, `handle.setPick(value)`, `handle.onPick(fn)` or `<AstraeusScene onPick />` | `pick` reads the value of the pressed option of the scene's picker (`undefined` until `ready`, after `unmount`, and without a picker). `setPick(value)` moves the pressed option and does nothing else (no signal); a scene without a picker, or an unknown value, throws `bad-picker`; before `ready` or after `unmount`, `not-mounted`. `fn({ picker, value })` is called when a visitor presses an option other than the pressed one; the pressed option stays where it was until the host calls `setPick` (or builds a new scene). To keep the clock across a choice, read `handle.timeUtcMs` inside `fn`, build the next scene and call `setTime` on it once ready. Returns a function that stops it. A listener that throws is reported to the page (`reportError`) and does not stop the next; nothing arrives after `unmount`. |
| `handle.scale`, `handle.setScale(id)` | The id of the scale showing, and a switch to one of `scene.scales` as if a visitor pressed the scale button; any other id throws `bad-scale`. |
| `handle.switches`, `handle.setSwitch(id, on)` | The display switches the scene placed with `setSwitches` (`orbitLines`, `labels`, `milkyWay`, `skyFigures`, `skyBoundaries`, `ecliptic`, `celestialEquator`; wherever it placed them) that have something to act on, each `true` (on) or `false`; `{}` when it placed none. `setSwitch` turns one on or off as the visitor's button does; an id the scene did not place, or a non-boolean, throws `bad-switch`. |
| `handle.skyFigures` | The sky figures the viewer draws (`scene.addSkyFigures`), `{ id, label, kind }` each, in the order added; `[]` when the scene added none; undefined before `ready` and after `unmount`. |
| `handle.traceSkyFigure(id, { durationSeconds?, after? })` | Draws the sky figure `id` (one of `handle.skyFigures`) line by line: its segments in the order added, each growing from its first end, over `durationSeconds` (0.1 to 60, default 2) in the look's `skyLines.traced` colour. Then `after` decides: `"stay"` (default) keeps the traced lines until the figure is traced again, `"fade"` eases them to `skyLines.faded` over a second and removes them, `"clear"` removes them at once. The trace is drawn over the figure and follows its switch (`skyFigures` or `skyBoundaries`): with the switch off it runs unseen. It runs on real time, so pausing or changing the speed of the scene clock does not change it, and it starts only when the app asks (no trace is timed by the scene clock). Calling again restarts it. With `prefers-reduced-motion: reduce` the whole figure shows at once, stays for `durationSeconds`, and then `after` applies (a `fade` ends at once). An id the viewer does not draw throws `unknown-sky-figure`; bad options throw `bad-sky-trace`; before `ready` or after `unmount`, `not-mounted`. Like every host call it lands in call order. |
| `handle.onChange(fn)` or `mount(..., { onChange })` | `fn({ timeUtcMs, rate, playing, view?, scale, look, switches?, cause })` on every change (`view` only in a scene with views; `switches` only in a scene that placed some); returns a function that stops it. `cause` is `playback` (the clock ran on; about ten calls a second while playing), `visitor` (someone used the timeline, the view choice, the scale, a display switch or the Developer drawer) or `host` (your own `setTime`, `setRate`, `setPlaying`, `setView`, `setScale`, `setSwitch` or `setLook`). Nothing arrives after `unmount`. |
| `<AstraeusScene ref onReady />` | The `ref` and the `onReady(handle)` argument are the handle above (`timeUtcMs`, `rate`, `playing`, `view`, `camera`, `eventZones`, `selected`, the `set` calls, `onChange`, `onEventZone`, `onSelect`, `onCameraChange`): `onReady={(handle) => handle.setTime(...)}` or `ref.current` after it. |
| `<AstraeusScene time rate onChange />` | `time` and `rate` are applied once the viewer is drawn and again whenever their value changes (a new `Date` of the same moment does not seek again); they are not controlled values, so read the live time from `onChange`. A bad one goes to `onError`. |
| `handle.selected`, `handle.setSelected(id)` | The id of the selected object, and a choice of another (or `undefined` to clear): see "Selection" below. An id the showing view does not show throws `bad-selection`; before `ready` or after `unmount`, `not-mounted`. `onSelect` hears it with `cause: "host"`. |
| `handle.view`, `handle.setView(id)` | The id of the view showing (`setViews`), and a switch to another, as if a visitor pressed its button: the same camera rule applies. `view` is `undefined` until `ready`, after `unmount`, and in a scene without views. `setView` with an unknown id, or on a scene without views, throws `bad-view`; before `ready` or after `unmount`, `not-mounted`. `onChange` hears it with `cause: "host"` (a visitor's own choice is `"visitor"`). |
| `<AstraeusScene view />` | Switches to that view once drawn and whenever it changes; not a controlled value (a visitor can switch too), so read the live view from `onChange`. An unknown id goes to `onError` as `bad-view`. |
| `handle.setCamera(target)` | Points the camera, through the same request path a view's camera rule uses; it eases there. `{ follow: id }` keeps the distance, `{ focus: id }` frames the object, `{ lookOut: id, direction?, fovDeg? }` stands inside the body looking out (`direction` is `{ raDeg, decDeg }`, J2000 equatorial degrees, or the id of an object to turn toward; omitted, it keeps the direction already looked along, else right ascension 0, declination 0; `fovDeg` is 5 to 100 degrees, omitted keeps the current one, else 60; Focus, Follow, Overview or an orbit pose return to the orbit camera), and a pose from `handle.camera` (either kind) puts the camera back (below). Every id must be an object the showing view shows: an unknown or hidden id (the body, or the object to turn toward), a direction or field of view out of range, or a malformed argument, throws `bad-camera`; before `ready` or after `unmount`, `not-mounted`. |
| `handle.camera` | The camera now as a plain value of one of two kinds, a `CameraPose`, which is an `OrbitPose` or a `SkyPose`. Tell them apart with `"lookOut" in pose` (a sky pose has no `distance`): an app that reads `pose.distance` must first check `if ("lookOut" in pose) { /* sky pose: lookOut, raDeg, decDeg, fovDeg */ } else { /* orbit pose */ }`. While the camera orbits an object it is the orbit pose `{ focus, azimuthDeg, elevationDeg, distance }`; while it stands inside a body looking out it is the sky pose `{ lookOut, raDeg, decDeg, fovDeg }` (the body's id; where it points in J2000 equatorial degrees, right ascension 0 up to 360 and declination within ±90, rounded to 0.01; the vertical field of view in degrees, 5 to 100) and the copied view link carries it as `?view=body,raDeg,decDeg,fovDeg,sky`. For an orbit pose (the pose a copied view link carries: the object's id, angles about the up direction in degrees to 0.01, distance in Earth radii to five figures). Safe to keep, store or `JSON.stringify`. `undefined` until `ready` and after `unmount`; from `ready` on it is always defined (before the scene's first frame it is the opening pose, the scene's start view or default framing). `setCamera(handle.camera)` after the visitor has moved the camera puts it back at the same angles and distance from the same object, within the rounding; the offset is the object's own, so an object that moved meanwhile is followed from where it is now. A camera held in place by a view's `"stay"` rule reads as its last object, which is not where it looks. |
| `<AstraeusScene camera />` | `{ follow: id }`, `{ focus: id }`, `{ lookOut: id, direction?, fovDeg? }` or a pose (either kind), applied once drawn and whenever its value changes (a new object with the same target, or a pose with its keys in another order, does not apply again); not a controlled value. A bad one goes to `onError` as `bad-camera`. |

```ts
const mounted = mount(el, scene);
await mounted.ready;
mounted.setTime("2026-08-12T21:00:00Z");           // jump to the flyby
mounted.setRate(3600);                              // one hour per second (must be in setTimeline's rates)
const stop = mounted.onChange(({ timeUtcMs, cause }) => {
  if (cause !== "host") console.log(new Date(time).toISOString());
});
```

The speed menu shows exactly the `rates` the scene gives (`setTimeline({ rates })`) and no others.

### Views of one scene

Two probes, one shared Earth, three views that keep the clock, the speed and the camera's distance when you switch (the Object list, timeline events, story panels, markers and paths follow the chosen view):

```ts
const scene = new Scene()
  .addBody(earth)
  .addTrajectory({ id: "probe-a", label: "Probe A", samples: samplesA })
  .addTrajectory({ id: "probe-b", label: "Probe B", samples: samplesB })
  .addEvents([{ id: "a-burn", label: "A burn", time: t0 + HOUR }, { id: "b-burn", label: "B burn", time: t0 + 2 * HOUR }])
  .setViews([
    { id: "a", label: "Probe A", objects: ["probe-a"], events: ["a-burn"], camera: "stay" },       // the camera holds where it is
    { id: "b", label: "Probe B", objects: ["probe-b"], events: ["b-burn"], camera: { follow: "probe-b" } },
    { id: "both", label: "Both", objects: ["probe-a", "probe-b"], events: ["a-burn", "b-burn"] },
  ], { place: "top-bar" });
const mounted = mount(el, scene);
await mounted.ready;
mounted.setView("b");                                 // as if the visitor pressed Probe B; onChange hears cause "host"
```

### Paced playback

A long journey wants fast cruising and slow encounters. `setTimeline` takes `pacing`, a list of pieces; outside every piece playback runs at the timeline's `rate`.

| Piece | Meaning |
|-------|---------|
| `{ start, end, rate, rampSeconds? }` | Plays at `rate` between the two moments. |
| `{ near: { type, withinSeconds }, rate, rampSeconds? }` | Plays at `rate` within `withinSeconds` seconds (simulated) of every event whose `type` matches (`addEvents`). |

Speeds ease between pieces in log space over `rampSeconds` simulated seconds (default: `withinSeconds` for an event rule, a tenth of the span for a span; `rampSeconds: 0` steps), so a jump from cruise to encounter is smooth both ways. The paced speed depends only on the time, so seeking or looping lands on the right speed at once. Spans may not overlap (touching is fine); where an event rule meets a span or another rule, the slowest speed wins, whichever contains the other and in whatever order they are listed. A piece's `rate` is any positive number and need not be in `rates`. Mistakes throw `bad-timeline` naming the field (`pacing[1].rate`); an event `type` that matches no event is refused too, since a typo would otherwise slow nothing.

In a scene with views (`setViews`), an event rule slows playback only near the events the showing view has (an event no view names is in every view); spans apply in every view. A switch that changes the paced speed eases to the new one in log space over about a second, while seeking lands on the paced speed at once. A scene without views paces exactly as before.

Selection: `mounted.selected` reads the id of the object whose information the viewer has open (undefined before `ready`, after `unmount`, and when nothing is selected), and `mounted.onSelect(listener)` calls `listener({ object?, timeUtcMs, cause })` when it changes: `object` is the new id (absent when the selection was dropped and nothing took its place), `cause` is `visitor` for the object menu, a click or a time, speed or view the visitor chose, `host` for `setSelected` and for a drop caused by the host's own `setTime`, `setRate`, `setPlaying` or `setView`, and `playback` for a drop caused by the clock running (for example past the end of a path's samples); a drop names the same cause `onChange` gave the move that caused it. The selection the viewer opens with is read, not reported. `mounted.setSelected(id)` selects an object the showing view shows, or clears the selection with `undefined`: `selected` reads it at once and `onSelect` hears it with `cause: "host"` (nothing is reported when the selection is already that). An unknown or hidden id, an empty or non-string id throws `bad-selection`; before `ready` or after `unmount`, `not-mounted`. It follows the order rule: made straight after `await ready`, or inside an `onChange` report of a view switch, it holds over the view's own framing. It selects as the object menu does, minus the camera: the object's card opens and the camera stays (`setCamera` points it); a clear closes the card. A selection cleared by the host stays cleared until someone selects again. `onSelect` returns the function that stops it; nothing arrives after `unmount`.

The mount handle's members live on its prototype (the same builder serves the React `ref`), so spreading it (`{ ...handle }`) or `Object.keys(handle)` shows only `ready` and `unmount`. Read and call members by name (`handle.timeUtcMs`, `handle.setTime(...)`, or destructure them); they are all there.

Camera: `mounted.onCameraChange(listener)` calls `listener(pose)` with the camera as a plain value (an orbit pose `{ focus, azimuthDeg, elevationDeg, distance }` or a sky pose `{ lookOut, raDeg, decDeg, fovDeg }`, what `mounted.camera` reads; check `"lookOut" in pose` before reading `distance`) when it changes: a visitor's drag, zoom or pick, a view's camera rule, or your own `setCamera` (it reports as the camera eases, then stops when the pose settles). At most about ten reports a second; an unchanged pose reports nothing, and a camera following a moving object at a fixed pose reports nothing. The opening pose is read from `camera`, not reported. It returns the function that stops it; nothing arrives after `unmount`; a listener that throws is reported to the page and does not stop the others.

An event has one zone, as wide as its widest pacing rule: when several rules match the same event the event is in its zone while playback is inside any of them (the rules' stretches are centred on the event, so the widest one), and `onEventZone` reports it once, not once per rule. An event's own `withinSeconds` replaces each rule's width for that event.

Event zones: `mounted.onEventZone(listener)` (React: the `onEventZone` prop) tells the page when playback enters or leaves the zone of an event (its `withinSeconds`, or a pacing `near` rule), for an event the showing view has, in a scene with pacing or without. `listener({ event, type?, object?, entered, timeUtcMs, cause, via })` gets the event's id, its `type` and `object`, `entered` true on entering and false on leaving, the viewer's time, and `cause`: `playback` (the clock ran), `visitor` (timeline or view choice) or `host` (`setTime`, `setView`); and `via`: `"time"` (playback crossed the zone, or a seek moved the clock across it) or `"view"` (a view switch showed or hid it). After a `"view"` leave the view's own camera rule owns the camera, so a page that restores a camera does so only for `via === "time"`. The zones are the ones pacing uses (an event's own `withinSeconds` wins over a rule's `withinSeconds`), never a span, and only the showing view's events. A view switch that hides an active zone reports leave and one that shows a zone the time is inside reports enter; overlapping zones report separately. A zone the time is already inside when the viewer opens reports `entered` once, with the first report after `ready` (within a tenth of a second, cause `playback`), so a listener added right after `await ready` hears it; a rebuilt viewer starts over the same way. `onEventZone` returns the function that stops it; nothing arrives after `unmount`. `mounted.eventZones` reads the ids of the zones active now (`[]` in a scene with no event zones; `undefined` before `ready` and after `unmount`). The engine moves nothing in response; the page composes its own behaviour:

```ts
// Camera to the encounter and back: the page decides, the engine only says when.
let saved = mounted.camera;
mounted.onEventZone(({ entered, object, via }) => {
  if (entered) { saved = mounted.camera; if (object) mounted.setCamera({ follow: object }); } // follow the probe at the flyby
  else if (via === "time" && saved) mounted.setCamera(saved);                               // and put the camera back after it
  if (!entered) saved = undefined;                                                          // a view switch's camera rule owns the camera: nothing to restore
});
```

In React the same composition goes through the handle that `AstraeusScene` gives through `ref` (or `onReady(handle)`):

```tsx
const handle = useRef<ViewerHandle>(null);
const saved = useRef<CameraPose>(undefined);
const onEventZone = ({ entered, object, via }: EventZoneChange) => {
  const viewer = handle.current;
  if (!viewer) return;
  if (entered) { saved.current = viewer.camera; if (object) viewer.setCamera({ follow: object }); }
  else if (via === "time" && saved.current) viewer.setCamera(saved.current);
  if (!entered) saved.current = undefined;
};
return <AstraeusScene ref={handle} scene={scene} onEventZone={onEventZone} />;
```

With pacing the speed menu gains an **Auto** choice, selected from the start. Picking a speed (menu, or `setRate(number)`) takes over until the visitor chooses Auto or the host calls `setRate("auto")`. `onChange` reports the speed pacing runs at (`cause: "playback"`), and `handle.rate` reads it.

```ts
const scene = new Scene()
  .addBody(earth)
  .addEvents([{ id: "jupiter", label: "Jupiter flyby", time: "2030-06-01", type: "flyby" }])
  .setTimeline({
    start: "2030-01-01", end: "2031-01-01", rate: 86_400, rates: [3_600, 86_400, 604_800],
    pacing: [
      { start: "2030-02-01", end: "2030-04-01", rate: 604_800 },      // a week per second through the long coast
      { near: { type: "flyby", withinSeconds: 3 * 86_400 }, rate: 600 },    // ten minutes per second within 3 days of each flyby
    ],
  });
mounted.setRate(3_600);   // the visitor's choice wins ...
mounted.setRate("auto");  // ... until it is released
```

## Inside someone else's page

The viewer is built to sit in a host page without taking it over. It never changes `document.title`. It isolates its own layers (`isolation: isolate` on the element given to `mount` and on the `AstraeusScene` wrapper), so its `z-index` values (0 to 9) stay inside the viewer and cannot cover or sit under your page's layers; `mount` does not restore the element's old `isolation` on `unmount`. Its Escape handlers (story panel, phone drawer, switch panel) ignore a keydown your page already stopped with `preventDefault()`. It honours `prefers-reduced-motion`: the viewer's own animations and transitions are switched off.

### Several viewers on one page

You can mount more than one viewer on a page. Each keeps its own data (moon positions load per planet and are shared only as fetched files), its own pictures (a viewer draws only the pictures of the data packages passed to it), its own element ids (generated; do not select viewer parts by id) and its own styles (every viewer rule sits under the viewer's root class `.astraeus-shell`, so the viewer's rules never reach your page's elements; your page's generic rules, such as `button { ... }`, can still reach the viewer's elements for any property the viewer does not set itself). Give each element a size. Escape closes a viewer's drawer, story panel or switch panel only when pressed inside that viewer or on the bare page, never in another viewer or in your own controls (call the handle yourself for those). The viewer never looks up page elements outside its own, and the Developer drawer is not drawn unless you pass `developerTools`. Panel sizes follow the browser window, not the viewer's element, so a small viewer keeps the desktop layout of its panels.

A scene with no `setTime`, `setTimeline` or trajectory opens on the current time, with a window of a month around it.

Story panels (`addStoryPanels`): a panel opens only when forward playback crosses its time, so one at the opening instant never opens by itself. `at.time` may be any moment inside the timeline, in any year. When a panel opens by itself, `pauseSeconds` (default 6) holds playback and then restarts it, unless the visitor pressed Play during the hold. On a phone, a wheel or pinch over an open story sheet zooms the scene behind it. `camera.setReach(d)` sets how far the camera can zoom out and also sets the far plane to 2.5 times `d`.

## Page address

The viewer leaves your page's address alone. By default it reads no address parameter, never calls `history.replaceState`, and shows no "Copy view link" button, so your own `?view=` or `?t=` means nothing to it. Turn it on with `mount(element, scene, { address: true })` or `<AstraeusScene scene={scene} address />` (read once, when the viewer is built). With it on the viewer reads the parameters below when it opens, and the "Copy view link" button, which is part of the Developer tools (so it appears only with `developerTools` on as well; `address: true` alone reads the address but has no copy button), writes `view`, `scale`, `up`, `t` and, in a scene with views, `show` into the address (other parameters are kept) and copies the link. Everything the viewer does with the address goes through one file in the engine's source, so this table is complete.

Behaviour change from 0.7.0: 0.7.0 read these parameters and wrote the address whatever the host did, which made a host's own `?view=` or `?t=` move the viewer and let a copied link overwrite the host's address. Hosts that want the old behaviour pass `address: true`; the demo site does.

| Parameter | Meaning | Format | Read | Written |
|-----------|---------|--------|------|---------|
| `view` | Camera view at the start | `focus,azimuthDeg,elevationDeg,distance` (focus is an id in the scene; a bad value is ignored) | yes | yes |
| `t` | Time at the start | ISO UTC, such as `2026-08-12T21:00:00Z` | yes | yes, to the second |
| `scale` | Distance scale at the start | an id the scene's scale menu offers (others ignored) | yes | yes |
| `up` | Which direction is up for the camera | `ecliptic` or `equatorial` | yes | yes |
| `show` | The view showing, in a scene with `setViews` | a view id; an unknown id opens the scene's `start` view | yes | yes, with views only |
| `stars` | Star brightness | number 0 to 2 | yes | no |
| `milkyway` | The Milky Way picture | `on` or `off` | yes | no |
| `milkywaybrightness` | Milky Way brightness | number 0 to 2 | yes | no |
| `sky` | The whole sky | `off` hides it | yes | no |
| `labels` | Object labels at the start | `id:on` or `id:off`, comma-separated | yes | no |
| `loop` | Looping playback | `on` or `off` | yes | no |
| `markerpx` | Size below which a sphere is drawn as a marker | number 0 to 100 | yes | no |
| `featurepx` | Narrowest body that still shows its feature markers | number 0 to 2000 | yes | no |
| `sunglow`, `sunbrightness`, `sunglowscale` | The Sun's glow: size in pixels, brightness, scale | numbers 0 to 400, 0 to 2, 1 to 6 | yes | no |
| `loadfade` | Seconds the loading cover fades | number 0 to 3 | yes | no |
| `desktop` | Larger desktop pictures on a wide screen | `on` or `off` | yes | no |

Each parameter from `stars` to `desktop` that is not `labels`, `loop` or `view` has a matching `scene.setLook` key (`stars` is `starBrightness`, `markerpx` is `markerSwapRadiusPx`, `loadfade` is `loadFadeSeconds`, `desktop` is `desktopPictures`, and so on), so a look no longer needs the address; the address overrides the scene when it is on.

The demo site's own switchers (`experience`, `planet`, `shower`, and the Developer tools' data choice) change the page address to rebuild the page; they belong to the site, not to `mount` or `AstraeusScene`.

## Errors

Every call that refuses its input throws a `SceneError`, a `RangeError` with a stable `code` to branch on and a message that names the offending value and what to do. One code means one cause. The table is generated from the doc comments of `SceneErrorCode` (`npm run api:errors` rewrites it) and a test keeps it in sync.

<!-- error-table:start (generated from the SceneErrorCode doc comments in packages/astraeus/src/api/errors.ts by `npm run api:errors`) -->
| `code` | Meaning |
|---|---|
| `unknown-body` | A body or path id is not in the catalogue or the scene. |
| `duplicate-id` | An id is already used in the scene, so the new body, path, group, orbit line, activity, event or story panel cannot take it. |
| `bad-time` | A moment is not a valid time, or lies outside the span it must fall in. |
| `bad-trajectory` | A path (`addTrajectory`) is malformed: its id, provider, bounds, plane, spans or line stretches. |
| `bad-data` | A data package passed to the viewer is malformed, for example moon positions that name a planet without a moon system. |
| `bad-scale` | The scale is not one of the engine's scales, or does not suit this scene. |
| `missing-data` | Position data a body needs was not given to the viewer: pass its data package. |
| `not-mounted` | The viewer is not drawn yet, or has been unmounted: a handle call before `ready` or after `unmount`. |
| `out-of-span` | The timeline reaches outside the years a body's data package covers. |
| `scene-mounted` | The scene was edited after a viewer took it; build a new scene instead. |
| `empty-scene` | The scene has no bodies to show. |
| `bad-element` | An orbital-elements record, or the element to mount into, is malformed. |
| `no-orbit` | An orbit line was asked for a body whose data give no closed orbit, or about a body not in the scene. |
| `bad-anchor` | A path anchor is malformed, repeated or outside the path. |
| `bad-readout` | A readout is of an unknown kind, or lacks or misnames the body or activity it measures. |
| `bad-event` | An event is malformed or names an object that is not in the scene. |
| `bad-panels` | The story panels are malformed. |
| `bad-timeline` | The timeline, its pacing or its speeds are malformed, or a call needs pacing the scene lacks. |
| `bad-switch` | A display switch is unknown or malformed. |
| `bad-body` | An option of `addBody` is malformed. |
| `bad-group` | A point group is malformed or refers to a body that is not in the scene. |
| `bad-body-set` | A body set (`addBodySet`) is malformed, or names a centre, moon, body or balance point the scene cannot draw it with. |
| `bad-moon-panel` | The moon panel (`setMoonPanel`) is malformed, or names a moon the scene does not hold. |
| `bad-picker` | The picker (`setPicker`, `setPick`) is malformed, or a pick names an option it does not have. |
| `bad-places` | A body's places (`addPlaces`) are malformed, or name a body the scene does not hold. |
| `bad-sky-figure` | A sky figure (`addSkyFigures`) is malformed: its id, label, kind, segments, points or label position. |
| `unknown-sky-figure` | `traceSkyFigure` was given a figure id the viewer does not draw (see `handle.skyFigures`). |
| `bad-sky-trace` | `traceSkyFigure` was given options that are not `{ durationSeconds?, after? }`, a `durationSeconds` outside 0.1 to 60, or an `after` other than `stay`, `fade` or `clear`. |
| `unknown-star` | A sky figure names a star whose Hipparcos number is not in the engine's star list (stars of magnitude 6.5 or brighter). Found when the scene is built, as the star list loads then. |
| `bad-activity` | An activity curve is malformed. |
| `bad-camera` | A camera call or pose is malformed, or names an object the view cannot show. |
| `bad-view` | A scene view is malformed, repeated, or not one of the scene's views. |
| `bad-selection` | `setSelected` was given something other than an id of an object the showing view shows, or `undefined`. |
| `bad-look` | A look (`setLook`) is unknown or out of its range. |
| `renamed` | An input field was given under a name it no longer has; the message names the old field and its replacement. |
<!-- error-table:end -->

## Loading in your build and in tests

`planetModels` (the planet series), the Developer drawer's panels and `MoonFamilyPanel` are separate files that your build loads later, on demand. After you redeploy, a tab left open may ask for a file name that no longer exists. In a Vite host, reload the page when that happens:

```js
window.addEventListener("vite:preloadError", () => window.location.reload());
```

(The Developer drawer also says when its file cannot be fetched and asks for a reload.)

For tests, the package has a `node` export condition: Node and Vitest's Node environment import a copy of the package without the stylesheet import, so `new Scene()...check()` and the `scene.bodies`-style reads work with no `test.server.deps.inline` setting. The jsdom and happy-dom Vitest environments also take the `node` condition, so the viewer's CSS is not loaded there; this does not matter for tests that check what a scene holds or how it behaves. Bundlers do not use the `node` condition and load the normal build.

First download: the packed `examples/hello-scene` loads 1,716,429 bytes (492,249 gzip) of code and styles, measured at this commit on first open (`npm run measure:example`; pictures and data files are not counted).

## What `astraeus-data` adds

The engine alone draws the Sun, Earth, Moon and the eight planets with their pictures and positions for 1950 to 2045. Everything heavier is a separate, optional package you import and hand to `mount`, so you only download what you use. A moon-position package is thousands of small files; your build copies them as separate files and the page fetches only the ones for the time window on screen (each chunk URL ends `?no-inline`, so Vite does not paste them into your script):

| Package | Adds | Download |
|---|---|---|
| `astraeus-data` | Moon pictures (Io to Charon), the 8k Venus map, the Milky Way | about 39 MB |
| `astraeus-data-jupiter`, `-saturn`, `-uranus`, `-neptune`, `-mars`, `-pluto` | Moon positions for that planet's system | 1.5 to 53 MB each (Saturn 53, Uranus 41, Jupiter 31, Neptune 19, Mars 5, Pluto 1.5) |

Years each package covers: the main moons and the planet reach back to 1950 in `astraeus-data-jupiter` (Io, Europa, Ganymede, Callisto), `-saturn` (Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Hyperion, Iapetus, Phoebe), `-uranus` (Miranda, Ariel, Umbriel, Titania, Oberon) and `-neptune` (Triton, Nereid), 1950 to 2030; every other moon, and all of `-mars` and `-pluto`, covers 2010 to 2030. A scene whose timeline reaches outside a body's years fails once at mount with `SceneError` code `out-of-span`.

Planet positions are JPL Horizons' (DE441, with each planet's satellite ephemeris), fitted within 1 km: each planet's series is its system barycentre, and a planet's moon package, when loaded for the date, adds the planet's own offset from it, so the planet sits on Horizons' planet centre. Measured against Horizons on 2 January of each year 1972 to 2044 and at the Voyager closest approaches (a probe's Horizons samples about a planet then land on the engine's planet):

| Planet | With its moon package (years it covers) | Without it (the system barycentre) |
|---|---|---|
| Mercury, Venus | within 0.6 km (no moons) | same |
| Mars | within 0.6 km (2010 to 2029) | under a metre further |
| Jupiter, Saturn | within 0.5 km (1950 to 2029); 0.11 to 0.31 km at the Voyager flybys | up to 216 km (Jupiter), 304 km (Saturn) |
| Uranus, Neptune | within 0.6 km (1950 to 2029); 0.20 and 0.27 km at the Voyager 2 flybys | up to 45 km (Uranus), 74 km (Neptune) |
| Pluto | within 1.5 km (2010 to 2029) | up to about 2,100 km |

Before 1972 a date can sit up to 0.7 s from Horizons' reading of it (Horizons uses UT1 to 1962 and UTC's rubber seconds to 1972), up to 35 km along Mercury's path. Earth stays on the EPV00 model: within 7.3 km of Horizons 1972 to 2044.

```js
import { Scene, jupiter, io, mount } from "astraeus";
import { dataSource as jupiterMoons } from "astraeus-data-jupiter";

mount(el, new Scene().addBody(jupiter).addBody(io), { data: [jupiterMoons] });
```

Nothing is looked up behind your back. A moon added without its data package makes `mount` throw a `missing-data` error that names the package to install; nothing is invented to fill the gap.

## What counts as internal

Only what `import ... from "astraeus"` (and `astraeus/style.css`) gives you is public. Deep imports, file paths inside the package and the repository's other workspaces (the demos and the site) are internal and may change in any release.

The public surface is locked: a test compares what `astraeus` exports with a checked-in lock (`api-surface.lock.json`), so a change to it cannot slip in unnoticed. Every change to it is listed in the [CHANGELOG](CHANGELOG.md).

## Licence

MIT for the code. Pictures and data carry their own credits and licences: see `NOTICE` and `licenses/`, and each picture's `licence` record.

---

## Working on the engine in the repository

Inside the repository the engine is used as TypeScript source (the demos and the site build it). For npm it is compiled by `npm run build:packages` into `dist/`, the folder that gets packed (`npm run check:pack` builds and checks it). `docs/RELEASING.md` is the release procedure.

## What it holds

| Folder | Purpose |
|---|---|
| `src/core/` | Scientific core: clock, frames, bodies, providers and curve-fit state. No Three.js or React. |
| `src/assets/` | Body catalogue, compositions, visuals, rings and sky. |
| `src/app/` | The scene and app adapter (floating origin, camera, paths, labels, `App`). |
| `src/shell/` | The generic UI: shell, top bar, timeline, drawers, info panel, story panels. |
| `src/experiences/` | Shared helpers a demo builds on (settings reader, metrics, switch chooser). |
| `src/synthetic/` | Made-up experiences that prove the plug-in contract. |
| `data/`, `licenses/` | Core data (bodies, ephemerides, orbits) and the notices for the libraries it uses. |
| `tests/` | The engine's tests, plus helpers its demos' tests reuse. |

## How a demo plugs in

A demo is a package that depends on `astraeus`, builds an `ExperienceDefinition` (type in `src/app/experienceDefinition.ts`) from its own data, and is listed by the site. It imports the engine only through the package entries in `package.json` `exports` (for example `astraeus/app/experienceDefinition`), never by a relative path into this folder.

A complete small example with no real data is `src/synthetic/syntheticDefinition.ts`: a made-up object on a tilted loop with marks, events and story panels. Read it first; the site lists it as the `synthetic` experience (`packages/astraeus-site/src/main.tsx`).

The source `exports` list is broad (one pattern per folder) for the demos and the site; the published package exports only `.` (the public API), `./style.css` and `./package.json`, written into `dist/package.json` from the `x-publish` block of this manifest.

## Check it alone

From the repository root, `npm run check:engine-alone` copies this package and the shared config into a scratch folder with no demo or site, then type-checks, lints and tests it there. A file or import that reaches outside the package fails the run.
