import { SceneError } from "./errors";
import type { LookInput, LookRead } from "./look";
import { checkedLook } from "./lookInput";
import type { LinkAccess } from "./viewerLink";

/** The host link's presentation: the looks, the scale and the display switches, their reads and their setters. */
export class ViewerLooks {
  constructor(private readonly access: LinkAccess) {}

  /** The looks in force, every one filled in; undefined before the viewer is drawn and after it is gone. */
  get look(): LookRead | undefined { return this.access.control()?.read().look; }

  /** The id of the scale showing; undefined like `look`. */
  get scale(): string | undefined { return this.access.control()?.read().scale; }

  /** The display switches the scene placed, each on or off (empty when it placed none); undefined like `look`. */
  get switches(): Readonly<Record<string, boolean>> | undefined { return this.access.control()?.read().switches; }

  /** Sets the whole look, checked as `Scene.setLook` checks it (`bad-look`). */
  setLook(look: LookInput): void {
    const control = this.access.open("setLook");
    control.setLook(checkedLook(look));
  }

  /** Switches to one of the scales the viewer offers (`Scene.scales`); any other id throws `bad-scale`. */
  setScale(id: string): void {
    const control = this.access.open("setScale");
    if (!control.scales.includes(id)) throw new SceneError("bad-scale", `setScale: "${String(id)}" is not one of the scales this viewer offers (${control.scales.join(", ")})`);
    control.setScale(id);
  }

  /** Turns a display switch the scene placed on or off; an id it did not place, or a non-boolean, throws `bad-switch`. */
  setSwitch(id: string, on: boolean): void {
    const control = this.access.open("setSwitch");
    const placed = Object.keys(control.read().switches);
    if (!placed.includes(id)) throw new SceneError("bad-switch", placed.length === 0 ? "setSwitch: the scene placed no display switches; place them with setSwitches" : `setSwitch: "${String(id)}" is not a switch the scene placed (${placed.join(", ")})`);
    if (typeof on !== "boolean") throw new SceneError("bad-switch", `setSwitch: expected true or false, got ${String(on)}`);
    control.setSwitch(id, on);
  }
}
