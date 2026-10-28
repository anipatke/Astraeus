import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import "../app/style.css";
import { App } from "../app/App";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import { prepareScene } from "./prepared";
import type { DataSource, Scene } from "./scene";

/** Props of `AstraeusScene`. */
export interface AstraeusSceneProps {
  /** The scene to draw. Passing a different `Scene` object rebuilds the viewer; changing the same object in place does not. */
  readonly scene: Scene;
  /** Data packages the scene's bodies need, such as moon pictures or positions. Read when the scene is built, so a new array alone does not rebuild. */
  readonly data?: readonly DataSource[];
  /** Called once the scene's data has loaded and it is drawn (again after each rebuild). */
  readonly onReady?: () => void;
  /** Called when the scene cannot be built (a `SceneError`) or its data fails to load. */
  readonly onError?: (error: Error) => void;
  /** Class for the wrapper element, which fills its parent's width and height unless `style` says otherwise. */
  readonly className?: string;
  /** Style for the wrapper element. */
  readonly style?: CSSProperties;
}

const FILL: CSSProperties = { width: "100%", height: "100%" };
const asError = (cause: unknown): Error => (cause instanceof Error ? cause : new Error(String(cause)));

/**
 * The full viewer `mount` draws, as a React component: `<AstraeusScene scene={scene} data={[...]} />`. Waits for the scene's data, then draws; cleans up on unmount.
 * @example
 * const scene = new Scene().addBody(earth).addBody(moon);
 * export function App() {
 *   return <div style={{ height: "100vh" }}><AstraeusScene scene={scene} onError={console.error} /></div>;
 * }
 */
export function AstraeusScene({ scene, data, onReady, onError, className, style }: AstraeusSceneProps): ReactElement {
  const [definition, setDefinition] = useState<ExperienceDefinition | undefined>();
  // The latest data and callbacks, read when the scene is built, so a new array or arrow function each render does not rebuild it.
  const latest = useRef({ data, onReady, onError });
  latest.current = { data, onReady, onError };

  useEffect(() => {
    let open = true;
    setDefinition(undefined);
    try {
      const prepared = prepareScene(scene, latest.current.data);
      prepared.ready.then(
        () => { if (open) { setDefinition(prepared.definition); latest.current.onReady?.(); } },
        (cause: unknown) => { if (open) latest.current.onError?.(asError(cause)); },
      );
    } catch (cause) {
      latest.current.onError?.(asError(cause));
    }
    return () => { open = false; };
  }, [scene]);

  return <div className={className} style={{ ...FILL, isolation: "isolate", ...style }}>{definition ? <App definition={definition} writeTitle={false} /> : null}</div>;
}
