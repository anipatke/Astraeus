import type { DisplaySwitchSettings } from "../app/displaySwitches";
import type { ViewSettings } from "../app/views";
import type { StoryPanelSet } from "../core/storyPanels";
import { switchesOf, type SwitchesInput } from "./switches";
import type { SceneViewsRead } from "./sceneReads";
import { resolveViews, viewsOf, type ViewInput, type ViewScope, type ViewsOptions, type ViewsPlan } from "./views";
import { frozenList } from "./sceneReads";

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

  /** The views as the public read states them, each with the objects, events and panels it shows (the lists the viewer uses, resolved against the finished scene); absent when none were named. `scope` is asked for only when views were named. */
  read(scope: () => ViewScope): SceneViewsRead | undefined {
    const plan = this.#views;
    if (plan === undefined) return undefined;
    const { place, start, views } = resolveViews(plan, scope());
    return Object.freeze({
      startId: start, place,
      items: frozenList(views.map(({ id, label, objects, events, panels }) => ({ id, label, objects: Object.freeze([...objects]), events: Object.freeze([...events]), panels: Object.freeze([...panels]) }))),
    });
  }

  /** The `displaySwitches` entry of the definition (absent when none were placed). */
  switchesEntry(): { displaySwitches?: DisplaySwitchSettings } {
    return this.#switches === undefined ? {} : { displaySwitches: this.#switches };
  }

  /** The `views` entry of the definition: the views resolved against the finished scene once (absent when none was named). */
  viewsEntry(scene: { readonly objects: readonly string[]; readonly events: readonly string[] }, storyPanels: StoryPanelSet | undefined): { views?: ViewSettings } {
    if (this.#views === undefined) return {};
    return { views: resolveViews(this.#views, { objects: scene.objects, events: scene.events, panels: [...(storyPanels?.panels ?? []), ...(storyPanels?.steps ?? [])].map(({ id }) => id) }) };
  }
}
