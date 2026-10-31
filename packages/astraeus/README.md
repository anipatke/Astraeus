# astraeus

A 3D solar system for the browser. Place bodies and recorded paths in a scene, mount it, and get time controls, camera, scale choice and body information, with no React and no 3D code of your own.

> **0.2 preview.** The public API below is the promise: it is small on purpose and may still change between `0.x` versions, with every change listed in [CHANGELOG.md](./CHANGELOG.md). Anything not exported from `astraeus` is internal and may change or disappear in any release.

## Install

```sh
npm install astraeus react react-dom @react-three/fiber three
```

`react` (19), `react-dom` (19), `@react-three/fiber` (9.8.2 or later 9.x) and `three` (0.169 or later) are peer dependencies: your app's own copies are used, so install them beside `astraeus` (npm 7 and later installs missing peers for you).

A plain-JavaScript page still needs React: `mount` draws the viewer with React and `@react-three/fiber` inside, so all four peers must be installed even if your own code never touches React.

`mount` loads the viewer's stylesheet itself. If you use the `AstraeusScene` component instead, add `import "astraeus/style.css";` once in your app.

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

The element needs a size (for example `height: 100%` all the way up). The probe's circle and the Moon's own orbit (tilted to it, because the circle lies in the reference frame's x-y plane) are both drawn. The finished app, grown into a small made-up story with every call below, is in the repository at `examples/hello-scene`.

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

Positions are about the scene centre (here the Sun, the first body) unless `center` says otherwise. `lineFixedTo: "sun"` keeps the line still against the Sun while the planets move; `plane` turns the ecliptic vectors into the engine's equatorial frame once; `solarSystemScale` keeps the distances true and draws the named bodies larger; the probe's name shows at any distance in a Sun-centred scene. The repository's dev site opens a fuller version at `?experience=synthetic-probe`.

## The public API

The full reference, generated from the types and doc comments, is at <https://astraeus.anipatke.com/api/>. The table below is the short form.

| Call | What it does |
|---|---|
| `new Scene()` | An empty scene. Every method below returns the scene, so calls chain. |
| `scene.addBody(body, { orbit?, enlarge?, showLabel?, labelReach?, description?, color?, knownLimitations? })` | Adds a catalogued body: a ready-made one (`sun`, `mercury`, `venus`, `earth`, `moon`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune`, `pluto`, and the moons `io`, `europa`, `ganymede`, `callisto`, `mimas`, `enceladus`, `tethys`, `dione`, `rhea`, `titan`, `iapetus`, `triton`, `charon`, `phobos`, `deimos`) or its id. The first body added is the scene's centre. `{ orbit: true }` also draws its orbit line: `moon` about Earth and `io` about Jupiter (the parent must be in the scene), or, with `sun` in the scene, one turn round the Sun of any body that circles it (the planets, Earth's year, a body from `addBodyFromElements`), from the opening time: one full turn of the body's own positions where they cover a whole turn, else (Uranus and Neptune, whose turn outlasts the planet series) the two-body ellipse osculating at the opening time, which the info card says; anything else throws `no-orbit`. `camera.fitOrbit` follows the same rule. `enlarge` (a number of at least 1) draws the body that many times larger than life (in a Sun-centred scene the viewer then offers its "Solar system" scale, true distances with the named bodies enlarged, as the second scale in place of Readable); `showLabel: false` starts its label off; `labelReach` (a positive number, in the camera's distance units) shows its label only within that distance of the camera, in place of the scene's shared rule. A scene whose first body is the Sun sets no label reach, so labels stay when zoomed out, and it can hold a path (`addTrajectory`, drawn with `lineFixedTo: "sun"`). `color` (a hex colour such as `"#9fd8ff"`) sets the colour on its info card and label; `knownLimitations` (a list of non-empty texts) replaces the catalogue's limits shown with its provenance; a bad value throws `bad-body`. |
| `scene.addTrajectory({ id, label?, color?, center?, plane?, lineFixedTo?, labelReach?, samples, provenance?, description?, knownLimitations?, anchors?, readouts? })` | A recorded path. Each sample is `{ time, positionKm, velocityKmS? }` measured from `center` (default: the scene's centre, its first body, so a Sun-first scene reads them from the Sun and an Earth-first one from Earth; Earth if no body is added) in equatorial J2000 (EQJ) axes; `plane: "ecliptic-j2000"` instead takes ecliptic J2000 vectors as JPL Horizons publishes them and rotates them to EQJ once on the way in (positions and velocities, from samples or a provider; a provider's `orientation` quaternion passes through unrotated, a known limit; any other `plane` throws `bad-trajectory`); `lineFixedTo` names the body the line is drawn against (default the scene centre): each sample is placed from that body at the sample's own time, then the line is carried to that body's place from the scene centre at the clock time, so `"sun"` fixes a probe's line to the Sun in any scene, Sun-centred ones included, and a body the scene does not hold throws `bad-trajectory`; `labelReach` (a positive number, in the camera's distance units) limits how far from the camera its name shows, in place of the scene's shared rule; a bad value throws `bad-trajectory`; `time` is ISO text, a `Date` or Unix milliseconds. Instead of `samples` you may give `provider` (an object with `stateAt(timeUtcMs)`) and `bounds: { start, end }`. `description` and `knownLimitations` (a list of sentences) go on its info card with `provenance`. `anchors: [{ id, time }]` draw labelled dots where the source published a point (the time must fall within the path). `readouts` are bars on the card, in order: `{ kind: "range", marker? }` (distance from the centre; `marker` names a body to mark), `{ kind: "speed" }`, `{ kind: "distance", to }` and `{ kind: "altitude", above }`; a named body must be in the scene. |
| `scene.addBodyFromElements(record, options?)` | Your own body that circles the Sun, from published orbit elements: `record` is `{ id, label, elements: { semiMajorAxisAu, eccentricity, inclinationDeg, ascendingNodeDeg, argumentOfPerihelionDeg, meanAnomalyDeg or perihelionJdTdb }, epoch: { jd, timeScale, ttMinusUtcSeconds? }, frame: "ecliptic-j2000", source: { name, url, solution, accessed }, radius?, accuracy: { classification, statement, validFromUtc, validToUtc, limitations }, marker?: { color, sizePx } }`. Drawn as a marker on unperturbed two-body motion about the Sun; the source, accuracy and limits show on its info card, with a live "Distance from Sun" row. `options` are `addBody`'s (`{ orbit: true }` draws its whole orbit from periapsis, smooth even for a sharp comet orbit). A bad record throws `bad-element` naming the field; a repeated id throws `duplicate-id`. |
| `scene.addGroup({ id, orbits, label?, center?, plane?, color?, dotSizePx?, referenceTime?, seed?, clump?, refillAfterMs?, refillSliceMs?, provenance?, description?, knownLimitations? })` | A list of orbits drawn as one group of dots: `orbits` is `[{ id, semiMajorAxisKm, eccentricity, inclinationDeg, raanDeg, argumentOfPeriapsisDeg, time? }]` (bound orbits, ids distinct), measured about `center` (default the scene's centre; it must be in the scene) in `plane` (`"ecliptic-j2000"` default, or `"EQJ"`). One colour (`color`, a hex colour), dot size (`dotSizePx`), menu item, info card, provenance and known limits. Where each dot sits along its orbit is a drawing choice, marked illustrative: an even spread shuffled by `seed`, fixed at `referenceTime` (default the opening time), then two-body motion. `clump: { near, fraction, widthDeg }` draws a share of the dots near a body's place along its orbit (a model; the body must be in the scene and not the centre; it may be one added with `addBodyFromElements` before the group). `refillAfterMs` is how often the dots are placed again; `refillSliceMs` (0 or more) is how much of a frame may go on computing the next fill ahead of time. The group's card shows "illustrative" as its source type, with the elements' own type in the accuracy sentence. The id joins the camera menu (`focus-<id>`, `follow-<id>`) and may be a panel's `object`. A mistake throws `bad-group`. |
| `scene.setTime(time)` | The moment the scene opens at. |
| `scene.setScale(trueScale \| readableScale \| solarSystemScale, { only? })` | The opening scale; the viewer can switch to the other unless `{ only: true }` offers that scale alone. `solarSystemScale` (true distances, enlarged bodies drawn larger) needs a Sun-centred scene with an enlarged body, else `bad-scale`; such a scene offers it second in place of `readableScale`. |
| `scene.addEvents(events, { provenance? })` | Timed events on the timeline: `[{ id, label, time, type?, provenance? }]`, ids unique. `provenance` says where the times come from; an event's own `provenance` wins over the batch's. A provenance `sourceType` is `ephemeris`, `observed`, `reconstructed`, `modelled` or `illustrative`; `modelled` is shown as "Modelled". Batch and per-event provenance are checked: a malformed one throws `bad-event`. May be called more than once. |
| `scene.addStoryPanels({ pauseSeconds?, autoOpen?, panels })` | Story panels that open as playback reaches them: `{ id, at: { utc } \| { event } \| { anchor }, title, body, details?, badge, sources, object? }`. `badge` is `observed`, `modelled` or `illustrative`; `sources` is never empty. A mistake throws `bad-panels` naming the panel and field. |
| `scene.setTimeline({ start, end, rates?, rate?, loop?, pacing? })` | The timeline's span, the playback speeds offered (simulated seconds per real second) and the one it opens at. `{ none: true, at?, rate? }` draws no timeline bar: time is frozen at `at`, or runs on at `rate`. The speed menu shows exactly the `rates` you give (ascending), and no others; without `rates` it offers 1 minute, 1 hour and 1 day per second. `pacing` slows playback for encounters and speeds it up for cruise, see "Paced playback" below. |
| `scene.addActivity({ id, label, unit, start, end, samples, peak?, provenance?, type?, peakLabel? })` | A period of activity on the timeline: a rate curve `samples: [{ time, value }]` (at least two, sorted, inside `start` to `end`; straight lines between) that the timeline glows by, with an optional `peak` mark and `provenance: [{ start, end, provenance }]` for where each stretch comes from. A group's `readouts: [{ kind: "rate", activity? }]` shows the live rate (unavailable outside the period) against the peak on its card. Without `setTimeline` the timeline spans the activities. A repeated id or a bad curve, peak or source throws `bad-activity`; a rate readout with no activity is `bad-readout`. |
| `scene.camera.setReach(distance)` | How far the viewer can zoom out, in Earth radii; labels reach as far, a path's own name (at its marker, switched by `labels`) included. A bad value throws `bad-camera`. The object the scene opens on (`camera.follow` or `camera.lookAt`) is selected, and a selected object's label wins every label collision: it is never the one hidden because it overlaps another. Other labels keep their priority order. `camera.follow` and `camera.lookAt` take `up: "ecliptic"` (default `"equatorial"`) to orbit about the ecliptic's pole; any other value throws `bad-camera`. `setTimeline` takes `loop: true` so playback wraps from the end to the start. |
| `scene.camera.fitOrbit(body)` | Sets the farthest zoom-out so the whole orbit of a body that circles the Sun (a planet, the built-in comet, or one from `addBodyFromElements`, already added) fits the canvas from any view direction: 1.1 times its farthest Sun distance over the sine of the narrower half field of view. The fit follows the live canvas shape (a phone turning, a window resizing) and the far plane is 2.5 times the reach. The opening view is not moved, except that it is clamped to the limit like any other. Labels are not limited in a fitted scene. It and `setReach` set the same limit; the later call wins. A body that does not circle the Sun throws `bad-camera`; one not in the scene, `unknown-body`. `scene.camera.fitOrbit("c-2025-a1")` |
| `scene.setSwitches({ orbitLines?, labels?, milkyWay? })` | Where each display switch shows: `{ place: "top-bar" \| "panel" \| "developer", on? }`. A top-bar switch is a button in the bar, a panel switch is a row in one switch panel opened from the bar, and a developer switch is only in the Developer drawer (where every switch stays). `orbitLines` is the orbit ring, trailing arc and moon orbits; `labels` is body and anchor labels; `milkyWay` is the sky picture. `on` is the starting state (default on). Nothing placed: the bar is as before. A bad name, place or `on` throws `bad-switch`. |
| `scene.stateOf(id, time)` | The state of any body in the scene at a moment, for figures a story quotes. `positionKm` is always there; `velocityKmS` (km/s) only where the body's source gives one, so check it before use: a path from `addTrajectory` whose samples or provider carry velocities, and a moon from fitted data (Io); planets, Earth, the Sun, built-in Swift-Tuttle and elements bodies give position only. Bodies: a path from `addTrajectory` (about its centre, in EQJ axes whatever `plane` it was given in), or a ready-made body, moon or elements body (about its parent). Ready-made and elements bodies answer at any date; only a moment outside an `addTrajectory` path throws `bad-time`. A planet's data lives in the planet series, so it answers only once they are loaded (at `mount`), else `missing-data`. `const au = Math.hypot(...scene.stateOf("earth", "2026-08-12T00:00:00Z").positionKm) / 149597870.7;` |
| `scene.provenanceOf(id)` | Where a body's position comes from, as its info card shows it. Where a comparison with an independent ephemeris exists it carries `accuracyClass` and `maxErrorFraction`. For built-in Swift-Tuttle that fraction is measured (0.00857). For a body from `addBodyFromElements` it is the limit of its class (0.01 `approximate`, 0.05 `indicative`): an upper bound, not a measured figure. Other bodies carry neither field. |
| `scene.camera.follow(id, { azimuthDeg?, elevationDeg?, distance? })` | Opens framed on a body or trajectory already added, and already following it. `distance` is in Earth radii. |
| `scene.camera.lookAt(id, { azimuthDeg?, elevationDeg?, distance? })` | The same opening view without following. The last of `follow` and `lookAt` wins. The viewer's camera menu gets a Focus and a Follow entry for every body and path. |
| `mount(element, scene, { data?, onChange? })` | Draws the scene with the full viewer. Returns `{ ready, unmount(), time, rate, setTime(t), setRate(r), onChange(fn) }`. `data` is a list of data packages (below); the time and speed members are described under "Reading and setting the time". |
| `<AstraeusScene scene data? onReady? onError? time? rate? onChange? />` | The same viewer as a React component (below). |
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

Props: `scene`, `data` (as for `mount`), `onReady`, `onError` (a bad scene or failed data load), `className` and `style` for the wrapper. Build the `Scene` once (outside the component or in `useMemo`): a new `Scene` object rebuilds the viewer. It needs React 19 and the peer dependencies (`react`, `react-dom`, `@react-three/fiber`, `three`). See `examples/hello-react` in the repository.

## Reading and setting the time

The viewer has one clock. A host page reads it, moves it and hears about changes, from the `mount` handle or from `AstraeusScene` props. Time is Unix milliseconds UTC; speed is simulated seconds per real second.

| Name | What it does |
|------|--------------|
| `handle.time`, `handle.rate` | The clock now. `undefined` until `ready` has resolved and after `unmount`. |
| `handle.setTime(time)` | Moves the viewer to `time` (ISO text, a `Date` or milliseconds). Outside the timeline throws `bad-time`. Before `ready` or after `unmount` throws `missing-data`. |
| `handle.setRate(rate)` | Sets the speed to one the timeline offers (`setTimeline({ rates })`). Any other number throws `bad-timeline`: the speed menu always shows what is running, so a custom speed is refused, not added. `handle.setRate("auto")` hands the speed back to the scene's pacing (below); without pacing it throws `bad-timeline`. |
| `handle.onChange(fn)` or `mount(..., { onChange })` | `fn({ time, rate, playing, cause })` on every change; returns a function that stops it. `cause` is `playback` (the clock ran on; about ten calls a second while playing), `visitor` (someone used the timeline) or `host` (your own `setTime` or `setRate`). Nothing arrives after `unmount`. |
| `<AstraeusScene time rate onChange />` | `time` and `rate` are applied once the viewer is drawn and again whenever their value changes (a new `Date` of the same moment does not seek again); they are not controlled values, so read the live time from `onChange`. A bad one goes to `onError`. |

```ts
const mounted = mount(el, scene);
await mounted.ready;
mounted.setTime("2026-08-12T21:00:00Z");           // jump to the flyby
mounted.setRate(3600);                              // one hour per second (must be in setTimeline's rates)
const stop = mounted.onChange(({ time, cause }) => {
  if (cause !== "host") console.log(new Date(time).toISOString());
});
```

The speed menu shows exactly the `rates` the scene gives (`setTimeline({ rates })`) and no others.

### Paced playback

A long journey wants fast cruising and slow encounters. `setTimeline` takes `pacing`, a list of pieces; outside every piece playback runs at the timeline's `rate`.

| Piece | Meaning |
|-------|---------|
| `{ from, to, rate, ramp? }` | Plays at `rate` between the two moments. |
| `{ near: { type, within }, rate, ramp? }` | Plays at `rate` within `within` seconds (simulated) of every event whose `type` matches (`addEvents`). |

Speeds ease between pieces in log space over `ramp` simulated seconds (default: `within` for an event rule, a tenth of the span for a span; `ramp: 0` steps), so a jump from cruise to encounter is smooth both ways. The paced speed depends only on the time, so seeking or looping lands on the right speed at once. Spans may not overlap (touching is fine); where an event rule meets a span or another rule, the slower speed wins. A piece's `rate` is any positive number and need not be in `rates`. Mistakes throw `bad-timeline` naming the field (`pacing[1].rate`); an event `type` that matches no event is refused too, since a typo would otherwise slow nothing.

With pacing the speed menu gains an **Auto** choice, selected from the start. Picking a speed (menu, or `setRate(number)`) takes over until the visitor chooses Auto or the host calls `setRate("auto")`. `onChange` reports the speed pacing runs at (`cause: "playback"`), and `handle.rate` reads it.

```ts
const scene = new Scene()
  .addBody(earth)
  .addEvents([{ id: "jupiter", label: "Jupiter flyby", time: "2030-06-01", type: "flyby" }])
  .setTimeline({
    start: "2030-01-01", end: "2031-01-01", rate: 86_400, rates: [3_600, 86_400, 604_800],
    pacing: [
      { from: "2030-02-01", to: "2030-04-01", rate: 604_800 },      // a week per second through the long coast
      { near: { type: "flyby", within: 3 * 86_400 }, rate: 600 },    // ten minutes per second within 3 days of each flyby
    ],
  });
mounted.setRate(3_600);   // the visitor's choice wins ...
mounted.setRate("auto");  // ... until it is released
```

## Inside someone else's page

The viewer is built to sit in a host page without taking it over. It never changes `document.title`. It isolates its own layers (`isolation: isolate` on the element given to `mount` and on the `AstraeusScene` wrapper), so its `z-index` values (0 to 9) stay inside the viewer and cannot cover or sit under your page's layers; `mount` does not restore the element's old `isolation` on `unmount`. Its Escape handlers (story panel, phone drawer, switch panel) ignore a keydown your page already stopped with `preventDefault()`. It honours `prefers-reduced-motion`: the viewer's own animations and transitions are switched off.

A scene with no `setTime`, `setTimeline` or trajectory opens on the current time, with a window of a month around it.

Story panels (`addStoryPanels`): a panel opens only when forward playback crosses its time, so one at the opening instant never opens by itself. `at.utc` may be any instant inside the timeline, in any year. When a panel opens by itself, `pauseSeconds` (default 6) holds playback and then restarts it, unless the visitor pressed Play during the hold. On a phone, a wheel or pinch over an open story sheet zooms the scene behind it. `camera.setReach(d)` sets how far the camera can zoom out and also sets the far plane to 2.5 times `d`.

## Loading in your build and in tests

`planetModels` (the planet series), the Developer drawer's panels and `MoonFamilyPanel` are separate files that your build loads later, on demand. After you redeploy, a tab left open may ask for a file name that no longer exists. In a Vite host, reload the page when that happens:

```js
window.addEventListener("vite:preloadError", () => window.location.reload());
```

(The Developer drawer also says when its file cannot be fetched and asks for a reload.)

For tests, the package has a `node` export condition: Node and Vitest's Node environment import a copy of the package without the stylesheet import, so `new Scene()...toDefinition()` works with no `test.server.deps.inline` setting. The jsdom and happy-dom Vitest environments also take the `node` condition, so the viewer's CSS is not loaded there; this does not matter for tests that check scene definitions or behaviour. Bundlers do not use the `node` condition and load the normal build.

First download: the packed `examples/hello-scene` loads 1,589,214 bytes (454,404 gzip) of code and styles, measured at this commit on first open (`npm run measure:example`; pictures and data files are not counted).

## What `astraeus-data` adds

The engine alone draws the Sun, Earth, Moon and the eight planets with their pictures and positions for 1950 to 2045. Everything heavier is a separate, optional package you import and hand to `mount`, so you only download what you use. A moon-position package is thousands of small files; your build copies them as separate files and the page fetches only the ones for the time window on screen (each chunk URL ends `?no-inline`, so Vite does not paste them into your script):

| Package | Adds | Download |
|---|---|---|
| `astraeus-data` | Moon pictures (Io to Charon), the 8k Venus map, the Milky Way | about 39 MB |
| `astraeus-data-jupiter`, `-saturn`, `-uranus`, `-neptune`, `-mars`, `-pluto` | Moon positions for that planet's system | 1.5 to 53 MB each (Saturn 53, Uranus 41, Jupiter 31, Neptune 19, Mars 5, Pluto 1.5) |

Years each package covers: the main moons and the planet reach back to 1950 in `astraeus-data-jupiter` (Io, Europa, Ganymede, Callisto), `-saturn` (Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Hyperion, Iapetus, Phoebe), `-uranus` (Miranda, Ariel, Umbriel, Titania, Oberon) and `-neptune` (Triton, Nereid), 1950 to 2030; every other moon, and all of `-mars` and `-pluto`, covers 2010 to 2030. A scene whose timeline reaches outside a body's years fails once at mount with `SceneError` code `out-of-span`.

```js
import { Scene, jupiter, io, mount } from "astraeus";
import { dataSource as jupiterMoons } from "astraeus-data-jupiter";

mount(el, new Scene().addBody(jupiter).addBody(io), { data: [jupiterMoons] });
```

Nothing is looked up behind your back. A moon added without its data package makes `mount` throw a `missing-data` error that names the package to install; nothing is invented to fill the gap.

## What counts as internal

Only what `import ... from "astraeus"` (and `astraeus/style.css`) gives you is public. Deep imports, file paths inside the package and the repository's other workspaces (the demos and the site) are internal and may change in any release.

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

The source `exports` list is broad (one pattern per folder) for the demos and the site; the published package exports only `.` (the public API) and `./style.css`, written into `dist/package.json` from the `x-publish` block of this manifest.

## Check it alone

From the repository root, `npm run check:engine-alone` copies this package and the shared config into a scratch folder with no demo or site, then type-checks, lints and tests it there. A file or import that reaches outside the package fails the run.
