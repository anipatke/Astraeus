import { SceneError } from "./errors";
import type { LinkAccess } from "./viewerLink";

/** The host link's views: which one shows, and `setView`. */
export class ViewerViews {
  constructor(private readonly access: LinkAccess) {}

  /** The id of the view showing; undefined before the viewer is drawn, after it is gone, and in a scene without views. */
  get view(): string | undefined { return this.access.control()?.read().view; }

  /** Switches to the view with this id. An id the scene does not name, or a scene without views, throws `bad-view`; before the viewer is drawn or after it is gone, `not-mounted`. */
  setView(id: string): void {
    const control = this.access.open("setView");
    if (!control.views.includes(id)) {
      throw new SceneError("bad-view", control.views.length === 0 ? "setView: the scene has no views; name them with setViews" : `setView: "${String(id)}" is not one of the scene's views (${control.views.join(", ")})`);
    }
    control.setView(id);
  }
}
