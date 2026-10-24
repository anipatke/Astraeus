# astraeus

A 3D solar system for the browser. Place bodies and recorded paths in a scene, mount it, and get time controls, camera, scale choice and body information, with no React and no 3D code of your own.

> **0.2 preview.** The public API below is the promise: it is small on purpose and may still change between `0.x` versions, with every change listed in [CHANGELOG.md](./CHANGELOG.md). Anything not exported from `astraeus` is internal and may change or disappear in any release.

## Install

```sh
npm install astraeus react react-dom @react-three/fiber three
```

`react` (19), `react-dom` (19), `@react-three/fiber` (9.8.2 or later 9.x) and `three` (0.169 or later) are peer dependencies: your app's own copies are used, so install them beside `astraeus` (npm 7 and later installs missing peers for you).

You need a bundler. These were each built and run with the packed packages (a scene with Saturn and Titan from `astraeus-data-saturn`): Vite 8, webpack 5 (5.112) and Parcel 2 (2.16, which needs `"@parcel/resolver-default": { "packageExports": true }` in your `package.json` so it reads the package `exports`). Others are untried. The package is plain ES modules that reference their pictures with `new URL(..., import.meta.url)`; loading it straight in Node or from a bare `<script type="module">` will not work.

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

## The public API

The full reference, generated from the types and doc comments, is at <https://astraeus.anipatke.com/api/>. The table below is the short form.

| Call | What it does |
|---|---|
| `new Scene()` | An empty scene. Every method below returns the scene, so calls chain. |
| `scene.addBody(body, { orbit?, enlarge?, showLabel?, description?, color?, knownLimitations? })` | Adds a catalogued body: a ready-made one (`sun`, `mercury`, `venus`, `earth`, `moon`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune`, `pluto`, and the moons `io`, `europa`, `ganymede`, `callisto`, `mimas`, `enceladus`, `tethys`, `dione`, `rhea`, `titan`, `iapetus`, `triton`, `charon`, `phobos`, `deimos`) or its id. The first body added is the scene's centre. `{ orbit: true }` also draws its orbit line: `moon` about Earth and `io` about Jupiter (the parent must be in the scene), or, with `sun` in the scene, one full turn round the Sun of any body that circles it (the planets, Earth's year, a body from `addBodyFromElements`), from the opening time; anything else throws `no-orbit`. `enlarge` (a number of at least 1) draws the body that many times larger than life (in a Sun-centred scene the viewer then offers its "Solar system" scale, true distances with the named bodies enlarged, as the second scale in place of Readable); `showLabel: false` starts its label off. A scene whose first body is the Sun sets no label reach, so labels stay when zoomed out, and it cannot hold a tracked path (`addTrajectory`; `bad-trajectory`). `color` (a hex colour such as `"#9fd8ff"`) sets the colour on its info card and label; `knownLimitations` (a list of non-empty texts) replaces the catalogue's limits shown with its provenance; a bad value throws `bad-body`. |
| `scene.addTrajectory({ id, label?, color?, center?, samples, provenance?, description?, knownLimitations?, anchors?, readouts? })` | A recorded path. Each sample is `{ time, positionKm, velocityKmS? }` measured from `center` (default `"earth"`); `time` is ISO text, a `Date` or Unix milliseconds. Instead of `samples` you may give `provider` (an object with `stateAt(timeUtcMs)`) and `bounds: { start, end }`. `description` and `knownLimitations` (a list of sentences) go on its info card with `provenance`. `anchors: [{ id, time }]` draw labelled dots where the source published a point (the time must fall within the path). `readouts` are bars on the card, in order: `{ kind: "range", marker? }` (distance from the centre; `marker` names a body to mark), `{ kind: "speed" }`, `{ kind: "distance", to }` and `{ kind: "altitude", above }`; a named body must be in the scene. |
| `scene.addBodyFromElements(record, options?)` | Your own body that circles the Sun, from published orbit elements: `record` is `{ id, label, elements: { semiMajorAxisAu, eccentricity, inclinationDeg, ascendingNodeDeg, argumentOfPerihelionDeg, meanAnomalyDeg or perihelionJdTdb }, epoch: { jd, timeScale, ttMinusUtcSeconds? }, frame: "ecliptic-j2000", source: { name, url, solution, accessed }, radius?, accuracy: { classification, statement, validFromUtc, validToUtc, limitations }, marker?: { color, sizePx } }`. Drawn as a marker on unperturbed two-body motion about the Sun; the source, accuracy and limits show on its info card. `options` are `addBody`'s (`{ orbit: true }` draws its whole orbit from periapsis, smooth even for a sharp comet orbit). A bad record throws `bad-element` naming the field; a repeated id throws `duplicate-id`. |
| `scene.addGroup({ id, orbits, label?, center?, plane?, color?, dotSizePx?, referenceTime?, seed?, clump?, refillAfterMs?, refillSliceMs?, provenance?, description?, knownLimitations? })` | A list of orbits drawn as one group of dots: `orbits` is `[{ id, semiMajorAxisKm, eccentricity, inclinationDeg, raanDeg, argumentOfPeriapsisDeg, time? }]` (bound orbits, ids distinct), measured about `center` (default the scene's centre; it must be in the scene) in `plane` (`"ecliptic-j2000"` default, or `"EQJ"`). One colour (`color`, a hex colour), dot size (`dotSizePx`), menu item, info card, provenance and known limits. Where each dot sits along its orbit is a drawing choice, marked illustrative: an even spread shuffled by `seed`, fixed at `referenceTime` (default the opening time), then two-body motion. `clump: { near, fraction, widthDeg }` draws a share of the dots near a body's place along its orbit (a model; the body must be in the scene and not the centre; it may be one added with `addBodyFromElements` before the group). `refillAfterMs` is how often the dots are placed again; `refillSliceMs` (0 or more) is how much of a frame may go on computing the next fill ahead of time. The id joins the camera menu (`focus-<id>`, `follow-<id>`) and may be a panel's `object`. A mistake throws `bad-group`. |
| `scene.setTime(time)` | The moment the scene opens at. |
| `scene.setScale(trueScale \| readableScale, { only? })` | The opening scale; the viewer can switch to the other unless `{ only: true }` offers that scale alone. |
| `scene.addEvents(events, { provenance? })` | Timed events on the timeline: `[{ id, label, time, type? }]`, ids unique. `provenance` says where the times come from. May be called more than once. |
| `scene.addStoryPanels({ pauseSeconds?, autoOpen?, panels })` | Story panels that open as playback reaches them: `{ id, at: { utc } \| { event } \| { anchor }, title, body, details?, badge, sources, object? }`. `badge` is `observed`, `modelled` or `illustrative`; `sources` is never empty. A mistake throws `bad-panels` naming the panel and field. |
| `scene.setTimeline({ start, end, rates?, rate? })` | The timeline's span, the playback speeds offered (simulated seconds per real second) and the one it opens at. `{ none: true, at?, rate? }` draws no timeline bar: time is frozen at `at`, or runs on at `rate`. |
| `scene.addActivity({ id, label, unit, start, end, samples, peak?, provenance?, type?, peakLabel? })` | A period of activity on the timeline: a rate curve `samples: [{ time, value }]` (at least two, sorted, inside `start` to `end`; straight lines between) that the timeline glows by, with an optional `peak` mark and `provenance: [{ start, end, provenance }]` for where each stretch comes from. A group's `readouts: [{ kind: "rate", activity? }]` shows the live rate (unavailable outside the period) against the peak on its card. Without `setTimeline` the timeline spans the activities. A repeated id or a bad curve, peak or source throws `bad-activity`; a rate readout with no activity is `bad-readout`. |
| `scene.camera.setReach(distance)` | How far the viewer can zoom out, in Earth radii; labels reach as far. A bad value throws `bad-camera`. `camera.follow` and `camera.lookAt` take `up: "ecliptic"` (default `"equatorial"`) to orbit about the ecliptic's pole; any other value throws `bad-camera`. `setTimeline` takes `loop: true` so playback wraps from the end to the start. |
| `scene.setSwitches({ orbitLines?, labels?, milkyWay? })` | Where each display switch shows: `{ place: "top-bar" \| "panel" \| "developer", on? }`. A top-bar switch is a button in the bar, a panel switch is a row in one switch panel opened from the bar, and a developer switch is only in the Developer drawer (where every switch stays). `orbitLines` is the orbit ring, trailing arc and moon orbits; `labels` is body and anchor labels; `milkyWay` is the sky picture. `on` is the starting state (default on). Nothing placed: the bar is as before. A bad name, place or `on` throws `bad-switch`. |
| `scene.stateOf(id, time)` | The state (position km, velocity km/s) of an added path at a moment, for figures a story quotes. |
| `scene.camera.follow(id, { azimuthDeg?, elevationDeg?, distance? })` | Opens framed on a body or trajectory already added, and already following it. `distance` is in Earth radii. |
| `scene.camera.lookAt(id, { azimuthDeg?, elevationDeg?, distance? })` | The same opening view without following. The last of `follow` and `lookAt` wins. The viewer's camera menu gets a Focus and a Follow entry for every body and path. |
| `mount(element, scene, { data? })` | Draws the scene with the full viewer. Returns `{ ready, unmount() }`. `data` is a list of data packages (below). |
| `<AstraeusScene scene data? onReady? onError? />` | The same viewer as a React component (below). |
| `SceneError` | Thrown for bad input. `error.code` is one of the documented `SceneErrorCode` values (for example `unknown-body`, `bad-time`, `missing-data`, `no-orbit`) and the message says what to do. |

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

## What `astraeus-data` adds

The engine alone draws the Sun, Earth, Moon and the eight planets with their pictures and positions for 2010 to 2030. Everything heavier is a separate, optional package you import and hand to `mount`, so you only download what you use. A moon-position package is thousands of small files; your build copies them as separate files and the page fetches only the ones for the time window on screen (each chunk URL ends `?no-inline`, so Vite does not paste them into your script):

| Package | Adds | Download |
|---|---|---|
| `astraeus-data` | Moon pictures (Io to Charon), the 8k Venus map, the Milky Way | about 39 MB |
| `astraeus-data-jupiter`, `-saturn`, `-uranus`, `-neptune`, `-mars`, `-pluto` | Moon positions for that planet's system | 2 to 40 MB each |

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
