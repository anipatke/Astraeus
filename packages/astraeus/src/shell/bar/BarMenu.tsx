// The menu's content: what the fit rule put in the menu, as the phone drawer and the wide ⋯ drop-down show it. Job: lay out the placed items ("This story" buttons
// first, then the engine controls with their names). It places nothing itself and opens through the panel rule (`ControlsDrawer`).
import type { BarEntry } from "./Bar";
import type { BarFit } from "./fitBar";

export function BarMenu({ entries, fit }: { readonly entries: readonly BarEntry[]; readonly fit: BarFit }) {
  const held = entries.filter((entry) => entry.kind !== "menu" && fit.placements[entry.id]?.place === "menu");
  const story = held.filter((entry) => entry.kind === "story");
  const rest = held.filter((entry) => entry.kind !== "story");
  return (
    <div className="bar-menu-list">
      {story.length > 0 && (
        <section className="bar-menu-story" aria-label="This story">
          {story.map((entry) => <span key={entry.id} className="bar-menu-item">{entry.render("full")}</span>)}
        </section>
      )}
      {rest.map((entry) => <span key={entry.id} className="bar-menu-item" data-bar-item={entry.id}>{entry.render("full")}</span>)}
    </div>
  );
}
