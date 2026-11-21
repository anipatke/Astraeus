import { SceneError } from "./errors";
import { callListeners } from "./listeners";
import type { LinkAccess } from "./viewerLink";
import type { ShelfControl, ViewerControl } from "../app/viewerPort";
import { isMade, type CustomBlockPart, type PanelPart } from "../shelf/part";
import type { CustomBlockControl } from "../shelf/customBlock/factory";
import type { PanelControl, PanelOpenChange } from "../shelf/panel/factory";

/** The host link's shelf parts: the typed control `handle.part(descriptor)` gives for this viewer, and the visitor's panel changes it hears. */
export class ViewerParts {
  readonly #open = new Map<string, Set<(change: PanelOpenChange) => void>>();
  #shelf: ShelfControl | undefined;

  constructor(private readonly access: LinkAccess) {}

  /** The viewer attached (its parts are the live ones) or detached (none). Listeners stay until `clearListeners`, as the picker's do across a rebuild. */
  reset(control: ViewerControl | undefined): void { this.#shelf = control?.parts; }

  clearListeners(): void { this.#open.clear(); }

  /** A visitor changed the panel `id`: its `onOpen` listeners hear it. */
  press(id: string, open: boolean): void {
    const listeners = this.#open.get(id);
    if (listeners !== undefined) callListeners(listeners, { part: id, open });
  }

  /** The typed control of a part of this viewer's scene; a value no factory made, or a part this scene does not hold, throws `bad-part`; before the viewer is drawn or after it is gone, `not-mounted`. */
  part(descriptor: PanelPart): PanelControl;
  part(descriptor: CustomBlockPart): CustomBlockControl;
  part(descriptor: PanelPart | CustomBlockPart): PanelControl | CustomBlockControl {
    this.access.open("part");
    if (!isMade(descriptor)) throw new SceneError("bad-part", "part: give the object a shelf factory (panel, customBlock) returned");
    const { id, kind } = descriptor;
    if (this.#shelf?.kinds.get(id) !== kind) throw new SceneError("bad-part", `part: the ${kind} "${id}" is not in this viewer's scene (add it with scene.addParts)`);
    return kind === "panel" ? this.#panelControl(id) : this.#blockControl(id);
  }

  #panelControl(id: string): PanelControl {
    const shelf = (what: string): ShelfControl => { this.access.open(what); return this.#shelf!; };
    return {
      get open() { return shelf("PanelControl.open").isOpen(id); },
      setOpen: (open) => {
        if (typeof open !== "boolean") throw new SceneError("bad-part", `PanelControl.setOpen: open must be true or false, got ${JSON.stringify(open)}`);
        shelf("PanelControl.setOpen").setOpen(id, open);
      },
      onOpen: (listener) => {
        const set = this.#open.get(id) ?? new Set();
        this.#open.set(id, set);
        set.add(listener);
        return () => { set.delete(listener); };
      },
    };
  }

  #blockControl(id: string): CustomBlockControl {
    const shelf = (): ShelfControl | undefined => (this.access.control() === undefined ? undefined : this.#shelf);
    return { get element() { return shelf()?.elements.get(id); } };
  }
}
