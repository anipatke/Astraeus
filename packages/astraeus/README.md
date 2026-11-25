# astraeus

A 3D solar system for the browser. Place bodies and recorded paths in a scene, mount it, and get time controls, camera, scale choice and body information, with no React and no 3D code of your own.

> **Before 1.0.** The public API is the promise: it is small on purpose and may still change between `0.x` versions, with every change listed in [CHANGELOG.md](./CHANGELOG.md). Anything not exported from `astraeus` is internal and may change or disappear in any release.

This page is the guide. Every call, option, default and error is in the **[API reference](https://astraeus.anipatke.com/api/)**, generated from the package's types and doc comments (the same text your editor shows on hover).

## Install

```sh
npm install astraeus react react-dom @react-three/fiber three
```

`react` (19), `react-dom` (19), `@react-three/fiber` (9.8.2 or later 9.x) and `three` (0.169 up to, not including, 0.188) are peer dependencies: your app's own copies are used, so install them beside `astraeus` (npm 7 and later installs missing peers for you).

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

The element needs a size (for example `height: 100%` all the way up). The viewer styles nothing outside its element: it sets no style on `html`, `body` or `#app`, so give the element its size (and, for a full-page viewer, your own `html, body { height: 100%; margin: 0 }` and background) yourself; it makes its own element a containing block (`position: relative` if static, `overflow: hidden` if visible). The probe's circle and the Moon's own orbit (tilted to it, because the circle lies in the reference frame's x-y plane) are both drawn. The finished app, grown into a small made-up story with every call below, is [`examples/hello-scene`](https://github.com/anipatke/Astraeus/tree/main/examples/hello-scene) in the repository; [`examples/hello-planets`](https://github.com/anipatke/Astraeus/tree/main/examples/hello-planets) shows the same calls with a page's own controls.

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

Positions are about the scene centre (here the Sun, the first body) unless `center` says otherwise. `lineFixedTo: "sun"` keeps the line still against the Sun while the planets move (`"auto"` picks the Sun or a planet for each stretch from the path's own samples); `plane` turns the ecliptic vectors into the engine's equatorial frame once; `solarSystemScale` keeps the distances true and draws the named bodies larger.

### Your own controls

The viewer's looks, scale and switches are settings, so a page can draw its own controls and drive them through the handle: `handle.look` and `handle.setLook(look)`, `handle.scale` and `handle.setScale(id)`, `handle.switches` and `handle.setSwitch(id, on)`. [`examples/hello-planets`](https://github.com/anipatke/Astraeus/tree/main/examples/hello-planets) is a plain `mount` app of the Sun to Mars with no data package and three sliders and a scale button of its own under the viewer.

## The public API

The short form. Each call's options, defaults, ranges and errors are on the [API reference](https://astraeus.anipatke.com/api/); the input type named in the last column is its section there. Every `Scene` method returns the scene, so calls chain.

### Bodies and paths

| Call | What it does | Reference |
|---|---|---|
| `new Scene()` | An empty scene. | [`Scene`](https://astraeus.anipatke.com/api/#scene) |
| `scene.addBody(body, options?)` | Adds a ready-made body (`sun`, the planets, `moon` and the main moons) or a listed moon by id. Moons with pictures: Io, Europa, Ganymede, Callisto, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton and Charon. Every other listed moon, among them Uranus's Miranda, Ariel, Umbriel, Titania and Oberon, draws flat-coloured with this package loaded. The first body added is the scene's centre. | [`AddBodyOptions`](https://astraeus.anipatke.com/api/#addbodyoptions) |
| `scene.addTrajectory(path)` | A recorded path, from samples or from a provider with `stateAt(time)`. | [`TrajectoryInput`](https://astraeus.anipatke.com/api/#trajectoryinput) |
| `scene.addBodyFromElements(record, options?)` | Your own body circling the Sun, from published orbit elements, on two-body motion. | [`ElementsBodyRecord`](https://astraeus.anipatke.com/api/#elementsbodyrecord) |
| `scene.addBodySet(set)` | Many small bodies about one centre as one batch of selectable dots, with orbit lines by family. | [`BodySetInput`](https://astraeus.anipatke.com/api/#bodysetinput) |
| `scene.addPlaces(body, places)` | Tagged surface places on one body, as markers with cards. | [`PlacesInput`](https://astraeus.anipatke.com/api/#placesinput) |
| `scene.addGroup(group)` | A list of orbits drawn as one group of dots, placed from catalogue mean anomalies or marked illustrative. | [`GroupInput`](https://astraeus.anipatke.com/api/#groupinput) |

A shown name is a tap target: a tap or click on a body's or a group's name selects it exactly as choosing it from the object list does (a drag that starts on a name still turns or pans the camera). Names stay out of the tab order; the object list is the keyboard path.

### Time, events and story

| Call | What it does | Reference |
|---|---|---|
| `scene.setTime(time)` | The moment the scene opens at. | [`TimeInput`](https://astraeus.anipatke.com/api/#timeinput) |
| `scene.setTimeline(timeline)` | The timeline's span, offered speeds, opening speed, looping, opening play state and pacing; `{ none: true }` draws no bar. | [`TimelineInput`](https://astraeus.anipatke.com/api/#timelineinput) |
| `scene.addEvents(events, options?)` | Timed events on the timeline, each with optional object, zone and provenance. | [`EventInput`](https://astraeus.anipatke.com/api/#eventinput) |
| `scene.addStoryPanels(panels)` | Story panels that open at a moment, event or anchor, or steps with Back and Next. | [`StoryPanelInput`](https://astraeus.anipatke.com/api/#storypanelinput) |
| `scene.setStoryPanelPlayback(playback)` | How long playback holds on a panel, whether panels open by themselves, and when playback closes them. | [`StoryPanelPlaybackInput`](https://astraeus.anipatke.com/api/#storypanelplaybackinput) |
| `scene.addActivity(activity)` | A rate curve the timeline glows by, with an optional peak. | [`ActivityInput`](https://astraeus.anipatke.com/api/#activityinput) |

### Sky, camera, looks and views

| Call | What it does | Reference |
|---|---|---|
| `scene.addSkyFigures(figures)` | Figures and outlines drawn on the sky, traced with `handle.traceSkyFigure`. | [`SkyFigureInput`](https://astraeus.anipatke.com/api/#skyfigureinput) |
| `scene.addLabels(labels)` | Labels the host places: on a point, or on the dots of one or more groups, each selecting a group, several groups or a panel when tapped. | [`LabelInput`](https://astraeus.anipatke.com/api/#labelinput) |
| `scene.camera.follow(id)`, `.focus(id)`, `.lookOut(body)`, `.setStartView(pose)` | The opening camera; the last call wins. | [`SceneCamera`](https://astraeus.anipatke.com/api/#scenecamera) |
| `scene.camera.setReach(distance)`, `.fitOrbit(body)` | How far the viewer can zoom out. | [`SceneCamera`](https://astraeus.anipatke.com/api/#scenecamera) |
| `scene.camera.setFollowChoices(ids)`, `.setFocusChoices(ids)`, `.setLookOutChoices(ids)`, `.setOverview(on)` | What the camera menu offers. | [`SceneCamera`](https://astraeus.anipatke.com/api/#scenecamera) |
| `scene.setScale(scale, { only? })` | The opening scale: `trueScale`, `readableScale` or `solarSystemScale`. | [`ScaleId`](https://astraeus.anipatke.com/api/#scaleid) |
| `scene.setLook(look)` | Presentation settings: star and Milky Way brightness, Sun glow, sky line colours, labels, time zone, the interface's colours and fonts. | [`LookInput`](https://astraeus.anipatke.com/api/#lookinput) |
| `scene.setSwitches(switches)` | Where each display switch shows, its starting state and its name. | [`SwitchesInput`](https://astraeus.anipatke.com/api/#switchesinput) |
| `scene.setViews(views, options)` | Named views of one scene, each showing its own objects, events and panels. | [`ViewInput`](https://astraeus.anipatke.com/api/#viewinput) |
| `scene.setBodyReadouts(kinds)` | Which rows a body's card shows. | [`BodyReadoutKind`](https://astraeus.anipatke.com/api/#bodyreadoutkind) |
| `scene.setMoonPanel(panel)` | The sliding panel of a planet's moons by family. | [`MoonPanelInput`](https://astraeus.anipatke.com/api/#moonpanelinput) |
| `scene.setPicker(picker)` | A choice in the bar that only tells the host (`handle.onPick`). | [`PickerInput`](https://astraeus.anipatke.com/api/#pickerinput) |
| `scene.setAbout(about)` | The viewer's title and About panel. | [`AboutInput`](https://astraeus.anipatke.com/api/#aboutinput) |
| `scene.addParts(parts)` | Story parts from the shelf: panels with their blocks, and the readout tile. | [Shelf parts](https://astraeus.anipatke.com/api/shelf.html) |

A sky-only viewer (Look out and its switches, no orbit-camera buttons): `scene.camera.setFocusChoices([]).setFollowChoices([]).setOverview(false).setLookOutChoices(["earth"])`, with `scene.setScale(x, { only: true })` to drop the scale choice.

### Numbers without a viewer

| Call | What it does |
|---|---|
| `scene.load({ data? })` | Loads what `stateOf` and `provenanceOf` need (the planet series, each moon's chunks for the scene's window), without a viewer. Works in plain Node. |
| `scene.stateOf(id, time)` | The state of any body at a moment, for figures a story quotes. `velocityKmS` only where the body's source gives one. |
| `scene.check({ data? })` | Runs the checks `mount` runs, throwing the same `SceneError`, without loading or drawing. |
| `scene.provenanceOf(id)` | Where a body's position comes from, as its card shows it. |
| `scene.bodies`, `scene.paths`, `scene.events`, `scene.timeline`, `scene.look` and the other reads | What the scene holds, as plain frozen values you can check in a test. |

```js
await scene.load({ data: [jupiterData] });
const au = Math.hypot(...scene.stateOf("earth", "2026-08-12T00:00:00Z").positionKm) / 149597870.7;
```

Checking accuracy and records without a scene: `classifyPositionError(maxFraction)`, `parseElementsBodyRecord(record)` and the class limits `APPROXIMATE_LIMIT_FRACTION` and `INDICATIVE_LIMIT_FRACTION` are root exports.

### Drawing it

| Call | What it does |
|---|---|
| `mount(element, scene, { data?, onChange?, address?, developerTools? })` | Draws the scene with the full viewer. Returns `{ ready, unmount(), timeUtcMs, rate, playing, view, camera, eventZones, selected, panel, look, scale, switches, skyFigures, pick, about, setTime(t), setRate(r), setPlaying(p), setView(id), setCamera(target), setSelected(id), setPanel(id), setLook(look), setScale(id), setSwitch(id), groupLook(id), setGroupLook(id), traceSkyFigure(id), clearSkyTrace(id), setPick(value), setAbout(about), part(descriptor), onChange(fn), onEventZone(fn), onSelect(fn), onPanel(fn), onCameraChange(fn), onFirstDraw(fn), onPick(fn) }`. `data` is a list of data packages (below); `address` is off by default (see "Page address"); `developerTools` is off by default (the cog and the Developer drawer are not drawn, and the drawer's code is never fetched). See [`MountedScene`](https://astraeus.anipatke.com/api/#mountedscene). |
| `<AstraeusScene scene data? ref? onReady? onError? time? rate? view? camera? onChange? onEventZone? onPick? onFirstDraw? address? developerTools? className? style? />` | The same viewer as a React component (below). |
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

Props: `scene`, `data` (as for `mount`), `ref` (a React 19 ref prop that receives the same handle `mount` returns, minus `ready` and `unmount`: one object for the component's life, reads `undefined` and calls throwing `not-mounted` until drawn and after unmount), `onReady(handle)` (called with that handle once drawn and the viewer's clock is attached, the same moment `mount`'s `ready` resolves, and again after each rebuild; under React StrictMode it still fires once per build), `onError` (a bad scene, a failed data load, or a bad `time`, `rate`, `view` or `camera` prop; without it each error goes to `console.error`, so a failure is never silent), `className` and `style` for the wrapper. `time`, `rate`, `view` and `camera` are applied once drawn and whenever their value changes; they are not controlled values, so read the live state from `onChange`. Build the `Scene` once (outside the component or in `useMemo`): a new `Scene` object rebuilds the viewer. Without WebGL 2 neither `mount` (its `ready` rejects with `no-webgl`) nor `AstraeusScene` (`onError` hears `no-webgl`) draws anything: a short message stays in the viewer's place. See [`examples/hello-react`](https://github.com/anipatke/Astraeus/tree/main/examples/hello-react) and [`AstraeusSceneProps`](https://astraeus.anipatke.com/api/#astraeussceneprops).

## The handle: lifecycle, time and events

The viewer has one clock (and, with `setViews`, one current view). A host page reads it, moves it and hears about changes, from the `mount` handle or from the `AstraeusScene` ref. Time is Unix milliseconds UTC; speed is simulated seconds per real second.

**Order rule:** after `ready`, every call on the handle takes effect or throws, in the order the host made it, and the last host call wins. A `setCamera` made before the scene's first frame is kept and applied after the scene's opening view, not discarded by it. A `setCamera` made inside an `onChange` report of a view switch is applied after the view's own camera rule for that switch. A view's camera rule is a default for a switch, so a later host call replaces it.

Before `ready` and after `unmount` every read is `undefined` and every call throws `not-mounted`. Listeners return a function that stops them; nothing arrives after `unmount`, and a listener that throws is reported to the page (`reportError`) without stopping the others. The handle's members live on its prototype (the same builder serves the React `ref`), so spreading it (`{ ...handle }`) or `Object.keys(handle)` shows only `ready` and `unmount`; read and call members by name.

| Name | What it does |
|------|--------------|
| `handle.ready` | Resolves once the scene's data has loaded, it is drawn and the host link is attached, so every read and `set` call works on the line after `await handle.ready`. Rejects if loading failed, with `no-webgl` if the browser offers no WebGL 2, and with `not-mounted` if `unmount` came first; it never stays pending. |
| `handle.onFirstDraw(fn)` | `fn()` once the first frame is drawn, for fading your own loading cover. |
| `handle.timeUtcMs`, `handle.rate`, `handle.playing` | The clock now. |
| `handle.setTime(time)`, `handle.setRate(rate)`, `handle.setPlaying(playing)` | Move, speed (one of the timeline's `rates`, or `"auto"` with pacing) and play or pause the clock. |
| `handle.onChange(fn)` | Hears every change of time, speed, play state, view, scale, look or switches, with its `cause`: `playback`, `visitor` or `host`. |
| `handle.camera`, `handle.setCamera(target)`, `handle.onCameraChange(fn)` | The camera as a plain pose you can store and hand back; follow, focus or look out from an object. Check `"lookOut" in pose` before reading `distance`. |
| `handle.selected`, `handle.setSelected(id)`, `handle.onSelect(fn)` | The object whose card is open. |
| `handle.panel`, `handle.setPanel(id)`, `handle.onPanel(fn)` | The open story panel or step. |
| `handle.view`, `handle.setView(id)` | The view showing (`setViews`). |
| `handle.eventZones`, `handle.onEventZone(fn)` | When playback enters or leaves an event's zone. The engine moves nothing in response. |
| `handle.look`, `handle.setLook(look)`, `handle.scale`, `handle.setScale(id)`, `handle.switches`, `handle.setSwitch(id, on)` | Looks, scale and display switches, for a page's own controls. |
| `handle.groupLook(id)`, `handle.setGroupLook(id, look)` | A point group's colour and dot size, changed without a rebuild. |
| `handle.skyFigures`, `handle.traceSkyFigure(id)`, `handle.clearSkyTrace(id)` | Draw a sky figure line by line, and remove the trace. |
| `handle.pick`, `handle.setPick(value)`, `handle.onPick(fn)` | The scene's picker: a visitor's press only tells the host. |
| `handle.about`, `handle.setAbout(about)` | The About the viewer shows. |
| `handle.part(descriptor)` | The typed control of one shelf part (open a panel, fill a custom block, set a chart's bins). |

Every member, with its errors, is on [`ViewerHandle`](https://astraeus.anipatke.com/api/#viewerhandle).

```ts
const mounted = mount(el, scene);
await mounted.ready;
mounted.setTime("2026-08-12T21:00:00Z"); // jump to the flyby
mounted.setRate(3600); // one hour per second (must be in setTimeline's rates)
const stop = mounted.onChange(({ timeUtcMs, cause }) => {
  if (cause !== "host") console.log(new Date(timeUtcMs).toISOString());
});
```

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

### Paced playback and event zones

A long journey wants fast cruising and slow encounters. `setTimeline` takes `pacing`, a list of spans (`{ start, end, rate }`) and event rules (`{ near: { type, withinSeconds }, rate }`); outside every piece playback runs at the timeline's `rate`, and speeds ease between pieces. With pacing the speed menu gains an **Auto** choice; a picked speed holds until Auto or `setRate("auto")`. The rules are on [`PacingInput`](https://astraeus.anipatke.com/api/#pacinginput).

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

`onEventZone` says when playback enters or leaves an event's zone (its `withinSeconds`, or a pacing `near` rule); the engine moves nothing, so the page composes its own behaviour:

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

## Inside someone else's page

The viewer is built to sit in a host page without taking it over. It never changes `document.title`. It isolates its own layers (`isolation: isolate` on the element given to `mount` and on the `AstraeusScene` wrapper), so its `z-index` values stay inside the viewer and cannot cover or sit under your page's layers; `unmount` gives the element back the inline `isolation`, `position` and `overflow` it had. Its Escape handlers (story panel, phone drawer, switch panel) ignore a keydown your page already stopped with `preventDefault()`. It honours `prefers-reduced-motion`: the viewer's own animations and transitions are switched off.

### Several viewers on one page

You can mount more than one viewer on a page. Each keeps its own data: a scene answers only from the moon packages passed to its own `load` or `mount`, so a planet in a scene without its moon package is placed at its system's barycentre and its moons are refused with `missing-data`, whatever another scene or the page loaded; decoded moon files are shared per data package and fetched once. Each keeps its own pictures (a viewer draws only the pictures of the data packages passed to it), its own element ids (generated; do not select viewer parts by id) and its own styles (every viewer rule sits under the viewer's root class `.astraeus-shell`, so the viewer's rules never reach your page's elements; your page's generic rules, such as `button { ... }`, can still reach the viewer's elements for any property the viewer does not set itself). Give each element a size. Escape closes a viewer's drawer, story panel or switch panel only when pressed inside that viewer or on the bare page, never in another viewer or in your own controls (call the handle yourself for those). The viewer never looks up page elements outside its own, and the Developer drawer is not drawn unless you pass `developerTools`. Panel sizes follow the browser window, not the viewer's element, so a small viewer keeps the desktop layout of its panels.

A scene with no `setTime`, `setTimeline` or trajectory opens on the current time, with a window of a month around it.

## Page address

The viewer leaves your page's address alone. By default it reads no address parameter, never calls `history.replaceState`, and shows no "Copy view link" button, so your own `?view=` or `?t=` means nothing to it. Turn it on with `mount(element, scene, { address: true })` or `<AstraeusScene scene={scene} address />` (read once, when the viewer is built). With it on the viewer reads the parameters below when it opens, and the "Copy view link" button, which is part of the Developer tools (so it appears only with `developerTools` on as well; `address: true` alone reads the address but has no copy button), writes `view`, `scale`, `up`, `t` and, in a scene with views, `show` into the address (other parameters are kept) and copies the link. Everything the viewer does with the address goes through one file in the engine's source, so this table is complete.

Behaviour change from 0.7.0: 0.7.0 read these parameters and wrote the address whatever the host did, which made a host's own `?view=` or `?t=` move the viewer and let a copied link overwrite the host's address. Hosts that want the old behaviour pass `address: true`.

| Parameter | Meaning | Format | Read | Written |
|-----------|---------|--------|------|---------|
| `view` | Camera view at the start | `focus,azimuthDeg,elevationDeg,distance` (focus is an id in the scene; a bad value is ignored), or `body,raDeg,decDeg,fovDeg,sky` for a look-out | yes | yes |
| `t` | Time at the start | ISO text that carries a zone, such as `2026-08-12T21:00:00Z` (a `t` with no zone is ignored) | yes | yes, to the second |
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

## Errors

Every call that refuses its input throws a `SceneError`, a `RangeError` with a stable `code` to branch on and a message that names the offending value and what to do. One code means one cause. The table is generated from the doc comments of `SceneErrorCode` (`npm run api:errors` rewrites it) and a test keeps it in sync. `AstraeusScene` sends these to `onError`, or to `console.error` when it has none.

<!-- error-table:start (generated from the SceneErrorCode doc comments in packages/astraeus/src/api/errors.ts by `npm run api:errors`) -->
| `code` | Meaning |
|---|---|
| `unknown-body` | A body or path id is not in the catalogue or the scene. |
| `duplicate-id` | An id is already used in the scene, so the new body, path, group, orbit line, activity, event or story panel cannot take it. |
| `bad-time` | A moment is not a valid or whole time, or lies outside the span it must fall in. |
| `bad-trajectory` | A path (`addTrajectory`) is malformed: its id, provider, bounds, plane, spans or line stretches. |
| `bad-data` | A data package passed to the viewer is malformed or cannot be read, for example moon positions that name a planet without a moon system, or a file or address that does not load. |
| `bad-scene` | What was given as a scene is not a `Scene` (`mount`, `AstraeusScene`, a check or load of something else). |
| `bad-scale` | The scale is not one of the engine's scales, or does not suit this scene. |
| `too-many-bodies` | The scene holds more lit bodies (spheres, not markers) than the viewer can draw (30); drop some or draw them as markers. |
| `missing-data` | Position data a body needs was not given to the viewer: pass its data package. |
| `not-mounted` | The viewer is not drawn yet, or has been unmounted: a handle call before `ready` or after `unmount`. |
| `out-of-span` | The timeline, or a moment asked of `stateOf`, reaches outside the years a body's data covers (a planet's series or a moon's data package). |
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
| `unknown-sky-figure` | `traceSkyFigure` or `clearSkyTrace` was given a figure id the viewer does not draw (see `handle.skyFigures`). |
| `bad-sky-trace` | `traceSkyFigure` was given options that are not `{ durationSeconds?, after? }`, a `durationSeconds` outside 0.1 to 60, or an `after` other than `stay` or `fade`; or `clearSkyTrace` was given options that are not `{ durationSeconds? }` or a `durationSeconds` outside 0 to 60. |
| `unknown-star` | A sky figure names a star whose Hipparcos number is not in the engine's star list (stars of magnitude 6.5 or brighter). Found when the scene is built, as the star list loads then. |
| `bad-activity` | An activity curve is malformed. |
| `bad-camera` | A camera call or pose is malformed, or names an object the view cannot show. |
| `bad-view` | A scene view is malformed, repeated, or not one of the scene's views. |
| `bad-selection` | `setSelected` was given something other than an id of an object the showing view shows, a sky figure, or `undefined`. |
| `bad-look` | A look (`setLook`) is unknown or out of its range. |
| `bad-about` | The About (`setAbout`) is malformed; the message names the field. |
| `bad-part` | A shelf part is malformed: a shelf factory (`panel`, `customBlock`, `explainer`, `actions`, `filterChips`, `colourKey`, `chart`, `readoutTile`) or a part control's setter given a bad value, `addParts` given a value no factory made, an action's camera naming what the scene lacks (at build), or `handle.part` given a part this viewer's scene does not hold. The message names the field. |
| `bad-label` | A label (`addLabels`) is malformed, or names a group, panel or centre the scene does not hold. |
| `no-webgl` | The browser or device offers no WebGL 2, so the viewer cannot draw; the viewer shows a short message in its place. |
| `renamed` | An input field was given under a name it no longer has; the message names the old field and its replacement. |
<!-- error-table:end -->

## Loading in your build and in tests

`planetModels` (the planet series), the Developer drawer's panels and `MoonFamilyPanel` are separate files that your build loads later, on demand. After you redeploy, a tab left open may ask for a file name that no longer exists. In a Vite host, reload the page when that happens:

```js
window.addEventListener("vite:preloadError", () => window.location.reload());
```

(The Developer drawer also says when its file cannot be fetched and asks for a reload.)

For tests, the package has a `node` export condition: Node and Vitest's Node environment import a copy of the package without the stylesheet import, so `new Scene()...check()` and the `scene.bodies`-style reads work with no `test.server.deps.inline` setting. The jsdom and happy-dom Vitest environments also take the `node` condition, so the viewer's CSS is not loaded there; this does not matter for tests that check what a scene holds or how it behaves. Bundlers do not use the `node` condition and load the normal build.

## What `astraeus-data` adds

The engine alone draws the Sun, Earth, Moon and the eight planets with their pictures and positions for 1950 to 2045. Everything heavier is a separate, optional package you import and hand to `mount`, so you only download what you use. A moon-position package is thousands of small files; your build copies them as separate files and the page fetches only the ones for the time window on screen (each chunk URL ends `?no-inline`, so Vite does not paste them into your script):

| Package | Adds | Download |
|---|---|---|
| `astraeus-data` | Moon pictures (Io to Charon), the 8k Venus map, the Milky Way | about 35.5 MB |
| `astraeus-data-jupiter`, `-saturn`, `-uranus`, `-neptune`, `-mars`, `-pluto` | Moon positions for that planet's system | 1.5 to 53 MB each (Saturn 53, Uranus 41, Jupiter 31, Neptune 19, Mars 5, Pluto 1.5) |
| `astraeus-data-constellations` | The 88 IAU constellations as sky figures and boundary outlines, ready for `scene.addSkyFigures(await constellations("all"))` | under 0.1 MB |

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

The public surface is locked: a test compares what `astraeus` exports with a checked-in lock, so a change to it cannot slip in unnoticed. Every change to it is listed in the [CHANGELOG](./CHANGELOG.md).

## Licence

MIT for the code. Pictures and data carry their own credits and licences: see `NOTICE` and `licenses/` in this package, and each picture's `licence` record.

## Working on the engine

The engine's source, tests and design notes are in the repository. Start at the [contributor guide](https://github.com/anipatke/Astraeus/blob/main/docs/architecture/viewer-interface.md#9-module-structure-and-contributor-guide) (module layout, interface rules, adding a bar item or a panel).
