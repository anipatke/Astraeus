import type { DisplaySwitchSettings } from "../app/displaySwitches";
import type { ViewSettings } from "../app/views";
import type { StoryPanelSet } from "../core/storyPanels";
import { switchesOf, type SwitchesInput } from "./switches";
import type { SceneViewsRead } from "./sceneReads";
import { resolveViews, viewsOf, type ViewInput, type ViewsOptions, type ViewsPlan } from "./views";

/** What a `Scene` has planned for its presentation: the display switches and the named views. */
export class ViewPlan {
  #switches: DisplaySwitchSettings | undefined;
  #views: ViewsPlan | undefined;

  setSwitches(switches: SwitchesInput): void {
    this.#switches = switchesOf(switches, this.#switches);
  }

  setViews(views: readonly ViewInput[], options: ViewsOptions): void {
    this.#views = viewsOf(views, options);
  }

  /** The views as the public read states them; absent when none were named. */
  read(): SceneViewsRead | undefined {
    const plan = this.#views;
    return plan === undefined ? undefined : Object.freeze({ startId: plan.start, place: plan.place, items: Object.freeze(plan.views.map(({ id, label }) => Object.freeze({ id, label }))) });
  }

  /** The `displaySwitches` entry of the definition (absent when none were placed). */
  switchesEntry(): { displaySwitches?: DisplaySwitchSettings } {
    return this.#switches === undefined ? {} : { displaySwitches: this.#switches };
  }

  /** The `views` entry of the definition: the views resolved against the finished scene once (absent when none was named). */
  viewsEntry(scene: { readonly paths: readonly string[]; readonly bodies: readonly string[]; readonly events: readonly string[] }, storyPanels: StoryPanelSet | undefined): { views?: ViewSettings } {
    if (this.#views === undefined) return {};
    return { views: resolveViews(this.#views, { paths: scene.paths, bodies: scene.bodies, events: scene.events, panels: storyPanels?.panels.map(({ id }) => id) ?? [] }) };
  }
}
