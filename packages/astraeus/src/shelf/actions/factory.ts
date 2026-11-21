// The actions part: labelled buttons a visitor presses, each optionally turning the camera. Job: check its input and build the descriptor that carries its view and its control.
// It must not name an app's choreography: the camera input is the one story panels take, and what else a press does is the host's, through `onAction`.
import type { ShelfBlock } from "../../app/shelfContract";
import type { CameraRequest } from "../../app/CameraController";
import { cameraRequestOf } from "../../api/cameraRequest";
import { SceneError } from "../../api/errors";
import type { CameraTarget } from "../../api/viewerLink";
import { badPart, checkedId, checkedInput, checkedItems, checkedText, registered, type BlockPart } from "../part";
import { ActionsView } from "./View";

/** One button of `actions`. */
export interface ActionInput {
  /** Unique in this block; `onAction` reports it. */
  readonly id: string;
  readonly label: string;
  /** Turns the camera when pressed (anything `setCamera` takes); an object it names must be in the scene. */
  readonly camera?: CameraTarget;
}

/** What `actions` takes. */
export interface ActionsInput {
  /** Unique among part and block ids in the scene. */
  readonly id: string;
  /** The buttons. */
  readonly actions: readonly ActionInput[];
}

/** One press a visitor made (`ActionsControl.onAction`). */
export interface ActionChange {
  readonly part: string;
  /** The action's id. */
  readonly action: string;
}

/** What `handle.part(actions)` gives for one viewer. */
export interface ActionsControl {
  /** Calls `listener` when a visitor presses a button, after its camera turns; returns the stop function. */
  onAction(listener: (change: ActionChange) => void): () => void;
}

/** The part's own data: what the view reads. */
export interface ActionsData { readonly actions: readonly { readonly id: string; readonly label: string; readonly camera: CameraRequest | undefined }[] }

/**
 * Buttons in a panel, each optionally turning the camera as a story panel's camera does; the host hears presses through `handle.part(block).onAction`.
 * @shelf
 * @example
 * actions({ id: "fly", actions: [{ id: "ceres", label: "Fly to Ceres", camera: { focus: "ceres" } }] })
 */
export function actions(input: ActionsInput): BlockPart<"actions"> {
  const who = "actions";
  const fields = checkedInput(input, who, "an { id, actions } object");
  const id = checkedId(fields, who);
  const seen = new Set<string>();
  const list = checkedItems(fields.actions, who, "actions", "{ id, label, camera? } objects", (record, at) => {
    const actionId = checkedText(record.id, who, `${at}.id`);
    if (seen.has(actionId)) throw badPart(who, `${at}.id "${actionId}" is used twice in this block`);
    seen.add(actionId);
    return Object.freeze({ id: actionId, label: checkedText(record.label, who, `${at}.label`), camera: record.camera === undefined ? undefined : cameraOf(record.camera, who, at) });
  });
  const block: ShelfBlock = {
    kind: "actions", id, view: ActionsView, data: Object.freeze({ actions: list } satisfies ActionsData),
    control: (link) => ({ onAction: (listener: (change: ActionChange) => void) => link.listen((event) => listener(event as ActionChange)) } satisfies ActionsControl),
  };
  return registered(block) as unknown as BlockPart<"actions">;
}

/** The camera shape, checked as a story panel checks its camera (a look-out keeps the direction already looked along); a mistake is `bad-part` naming the field. */
function cameraOf(target: unknown, who: string, at: string): CameraRequest {
  try {
    return cameraRequestOf(target, "camera", undefined, true);
  } catch (error) {
    throw badPart(who, `${at}.camera is not a camera target (${error instanceof SceneError ? error.message : String(error)})`);
  }
}
