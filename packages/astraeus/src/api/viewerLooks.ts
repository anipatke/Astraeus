import type { ScaleId } from "../presentation/scalePolicy";
import { SceneError } from "./errors";
import type { LookInput, LookRead } from "./look";
import { checkedLook } from "./lookInput";
import { checkedGroupLook, type GroupLookInput, type GroupLookRead } from "./groupLookInput";
import type { LinkAccess } from "./viewerLink";

/** The host link's presentation: the looks, the scale and the display switches, their reads and their setters. */
export class ViewerLooks {
  constructor(private readonly access: LinkAccess) {}

  /** The looks in force, every one filled in; undefined before the viewer is drawn and after it is gone. */
  get look(): LookRead | undefined {
    return this.access.control()?.read().look;
  }

  /** The id of the scale showing; undefined like `look`. */
  get scale(): ScaleId | undefined {
    return this.access.control()?.read().scale;
  }

  /** The display switches the scene placed, each on or off (empty when it placed none); undefined like `look`. */
  get switches(): Readonly<Record<string, boolean>> | undefined {
    return this.access.control()?.read().switches;
  }

  /** Sets the whole look, checked as `Scene.setLook` checks it (`bad-look`). */
  setLook(look: LookInput): void {
    const control = this.access.open("setLook");
    control.setLook(checkedLook(look));
  }

  /** Switches to one of the scales the viewer offers (`Scene.scales`); any other id throws `bad-scale`. */
  setScale(id: ScaleId): void {
    const control = this.access.open("setScale");
    if (!control.scales.includes(id))
      throw new SceneError(
        "bad-scale",
        `setScale: "${String(id)}" is not one of the scales this viewer offers (${control.scales.join(", ")})`,
      );
    control.setScale(id);
  }

  /** The colour and dot size the group `id` is drawn with now; undefined before the viewer is drawn, after it is gone, and for an id that is not a group. */
  groupLook(id: string): GroupLookRead | undefined {
    const look = this.access.control()?.groupLook?.(id);
    return look === undefined ? undefined : { color: look.color, dotSizePx: look.dotSizePx };
  }

  /** Changes a group's colour and dot size, the fields left out kept (`bad-group` for a non-group id or a bad value); the dots take it at the next frame. */
  setGroupLook(id: string, look: GroupLookInput): void {
    const control = this.access.open("setGroupLook");
    const checked = checkedGroupLook(
      id,
      look,
      typeof id === "string" ? control.groupLook?.(id) : undefined,
      control.groups ?? [],
    );
    control.setGroupLook?.(id, checked);
  }

  /** Turns a display switch the scene placed on or off; an id it did not place, or a non-boolean, throws `bad-switch`. */
  setSwitch(id: string, on: boolean): void {
    const control = this.access.open("setSwitch");
    const placed = Object.keys(control.read().switches);
    if (!placed.includes(id))
      throw new SceneError(
        "bad-switch",
        placed.length === 0
          ? "setSwitch: the scene placed no display switches; place them with setSwitches"
          : `setSwitch: "${String(id)}" is not a switch the scene placed (${placed.join(", ")})`,
      );
    if (typeof on !== "boolean")
      throw new SceneError("bad-switch", `setSwitch: expected true or false, got ${String(on)}`);
    control.setSwitch(id, on);
  }
}
