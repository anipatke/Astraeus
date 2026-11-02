import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type ReactElement, type Ref } from "react";
import "../app/style.css";
import { App } from "../app/App";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import { prepareScene } from "./prepared";
import type { DataSource, Scene } from "./scene";
import { type TimeInput } from "./time";
import { viewerHandleOf, type ViewerHandle } from "./viewerHandle";
import { ViewerLink, type CameraTarget, type EventZoneChange, type ViewerChange } from "./viewerLink";

/** Props of `AstraeusScene`. */
export interface AstraeusSceneProps {
  /** The scene to draw. Passing a different `Scene` object rebuilds the viewer; changing the same object in place does not. */
  readonly scene: Scene;
  /** Data packages the scene's bodies need, such as moon pictures or positions. Read when the scene is built, so a new array alone does not rebuild. */
  readonly data?: readonly DataSource[];
  /** The viewer's handle (the same `ViewerHandle` `mount` returns): one object for the component's life, also across a rebuild with a new `scene`. Reads are undefined and calls throw `not-mounted` until the viewer is drawn and after unmount. A React 19 ref prop. */
  readonly ref?: Ref<ViewerHandle>;
  /** Called with the handle once the scene's data has loaded, it is drawn and the viewer's clock is attached, so a host can read and set from here (again, with the same handle, after each rebuild). */
  readonly onReady?: (handle: ViewerHandle) => void;
  /** Called when the scene cannot be built (a `SceneError`) or its data fails to load. */
  readonly onError?: (error: Error) => void;
  /** Moves the viewer to this moment (ISO text, a `Date` or Unix milliseconds) once it is drawn, and again whenever the moment changes. Outside the timeline reports `bad-time` to `onError`. Not a controlled value: the viewer keeps running from there, so the current time arrives through `onChange`. */
  readonly time?: TimeInput;
  /** Sets the playback speed once drawn and whenever it changes; must be one of the speeds the timeline offers (or `"auto"`, to hand it back to the scene's pacing), else `bad-timeline` goes to `onError`. */
  readonly rate?: number | "auto";
  /** Switches to this view (an id from `setViews`) once drawn, and again whenever it changes. Not a controlled value: a visitor can switch too, and the view showing arrives through `onChange`. An unknown id, or a scene without views, reports `bad-view` to `onError`. */
  readonly view?: string;
  /** Points the camera once drawn, and whenever the target changes by value (a new object with the same target does not re-apply): `{ follow: id }`, `{ focus: id }` or a pose read from a `mount` handle. Not a controlled value: a visitor can move the camera afterwards. A bad one reports `bad-camera` to `onError`. */
  readonly camera?: CameraTarget;
  /** Called whenever the viewer's time, speed, playing state or view changes: playback running, a visitor using the timeline or the view choice, or the `time` / `rate` / `view` props. About ten times a second while playing. */
  readonly onChange?: (change: ViewerChange) => void;
  /** Called when playback enters or leaves the pacing zone of an event the showing view has: `{ event, type?, object?, entered, time, cause }` (see `MountedScene.onEventZone`). A zone already active when the viewer opens reports `entered` once, just after `onReady`. */
  readonly onEventZone?: (change: EventZoneChange) => void;
  /** Whether the viewer reads the page address and offers a copy-link button that writes it (default false: the address stays the host page's own). Read when the viewer is built. See the README's "Page address" section. */
  readonly address?: boolean;
  /** Whether the viewer shows the Developer toggle and drawer (default false: no cog, and the drawer's code is never fetched). Read when the viewer is built. "Copy view link" lives in the drawer, so `address` without this has no copy button; a switch placed `"developer"` shows only when this is on. */
  readonly developerTools?: boolean;
  /** Class for the wrapper element, which fills its parent's width and height unless `style` says otherwise. */
  readonly className?: string;
  /** Style for the wrapper element. */
  readonly style?: CSSProperties;
}

const FILL: CSSProperties = { width: "100%", height: "100%" };
const asError = (cause: unknown): Error => (cause instanceof Error ? cause : new Error(String(cause)));

/** A camera target as text by value: keys in sorted order, so the same pose with its keys in another order is the same key. */
const cameraValueKey = (camera: CameraTarget): string => JSON.stringify(Object.entries(camera).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

/**
 * The full viewer `mount` draws, as a React component: `<AstraeusScene scene={scene} data={[...]} />`. Waits for the scene's data, then draws; cleans up on unmount.
 * @example
 * const scene = new Scene().addBody(earth).addBody(moon);
 * export function App() {
 *   return <div style={{ height: "100vh" }}><AstraeusScene scene={scene} onError={console.error} /></div>;
 * }
 */
export function AstraeusScene({ ref, scene, data, onReady, onError, time, rate, view, camera, onChange, onEventZone, address, developerTools, className, style }: AstraeusSceneProps): ReactElement {
  const [definition, setDefinition] = useState<ExperienceDefinition | undefined>();
  // The latest data and callbacks, read when the scene is built, so a new array or arrow function each render does not rebuild it.
  const latest = useRef({ data, onReady, onError, onChange, onEventZone });
  latest.current = { data, onReady, onError, onChange, onEventZone };
  const [link] = useState(() => new ViewerLink());
  const [handle] = useState(() => viewerHandleOf(link));
  useImperativeHandle(ref, () => handle, [handle]);
  useEffect(() => {
    link.reopen(); // StrictMode replays this effect after its cleanup closed the link: only a real unmount leaves it closed
    const stop = link.onChange((change) => latest.current.onChange?.(change));
    const stopZones = link.onEventZone((change) => latest.current.onEventZone?.(change));
    return () => { stop(); stopZones(); link.close(); };
  }, [link]);
  // A Date made fresh each render must not seek again, so the moment is compared by value.
  const timeKey = time instanceof Date ? time.getTime() : time;
  // After the viewer is drawn (its own effects have attached the clock by now), each prop takes effect on its own: once when drawn,
  // then only when that prop changes, so a host change to one never overrides a visitor's later choice of another control.
  const apply = (set: () => void) => {
    try { set(); } catch (cause) { latest.current.onError?.(asError(cause)); }
  };
  const cameraKey = camera === undefined ? undefined : cameraValueKey(camera);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const drawn = definition !== undefined;
  useEffect(() => { if (drawn && timeKey !== undefined) apply(() => link.setTime(timeKey)); }, [drawn, link, timeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (drawn && rate !== undefined) apply(() => link.setRate(rate)); }, [drawn, link, rate]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (drawn && view !== undefined) apply(() => link.setView(view)); }, [drawn, link, view]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (drawn && cameraRef.current !== undefined) apply(() => link.setCamera(cameraRef.current!)); }, [drawn, link, cameraKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let open = true;
    setDefinition(undefined);
    link.detach(); // a rebuild: the old viewer is going, so `onReady` below waits for the new one's attach
    try {
      const prepared = prepareScene(scene, latest.current.data);
      prepared.ready.then(
        () => {
          if (!open) return;
          setDefinition(prepared.definition);
          // The viewer attaches its clock in an effect after this render; onReady waits for it, so the handle's reads and sets work inside it.
          void link.whenAttached().then(() => { if (open) latest.current.onReady?.(handle); }, () => undefined); // a closed link (unmounted) rejects the wait: onReady does not fire
        },
        (cause: unknown) => { if (open) latest.current.onError?.(asError(cause)); },
      );
    } catch (cause) {
      latest.current.onError?.(asError(cause));
    }
    return () => { open = false; };
  }, [scene, link, handle]);

  return <div className={className} style={{ ...FILL, isolation: "isolate", ...style }}>{definition ? <App definition={definition} writeTitle={false} address={address === true} developerTools={developerTools === true} host={link} /> : null}</div>;
}
