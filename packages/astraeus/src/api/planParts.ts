import { SceneError } from "./errors";
import { badPart, isMade, partOf, type PanelPart } from "../shelf/part";
import { idsOfPart, type ShelfPart } from "../app/shelfContract";
import type { StoryPanelSet } from "../core/storyPanels";

/** What a `Scene` has planned for its shelf parts (`addParts`), in the order added. */
export class PartPlan {
  readonly #parts: ShelfPart[] = [];
  readonly #ids = new Set<string>();

  /** Appends parts, all or none: a value no factory made is `bad-part`, and an id (a part's or a block's) already used in the scene, or twice in this call, is `duplicate-id`. */
  add(parts: readonly PanelPart[]): void {
    if (!Array.isArray(parts)) throw badPart("addParts", "give a list of parts, such as [panel({ ... })]");
    const taken = new Set(this.#ids);
    const added: ShelfPart[] = [];
    parts.forEach((part, index) => {
      if (!isMade(part) || (part as { kind?: unknown }).kind !== "panel") throw badPart("addParts", `parts[${index}] is not a part made by a shelf factory (a panel); blocks go in a panel's blocks`);
      const internal = partOf(part);
      for (const id of idsOfPart(internal)) {
        if (taken.has(id)) throw new SceneError("duplicate-id", `addParts: "${id}" is already the id of a part or block in this scene`);
        taken.add(id);
      }
      added.push(internal);
    });
    this.#parts.push(...added);
    for (const id of taken) this.#ids.add(id);
  }

  /** The parts, in the order added. */
  get parts(): readonly ShelfPart[] { return this.#parts; }

  /** The ids views may name: the parts' own. */
  get ids(): readonly string[] { return this.#parts.map(({ id }) => id); }

  /** Build-time check: a part id may not also be a story panel's id (a view names both in `panels`). */
  checkAgainst(storyPanels: StoryPanelSet | undefined): void {
    const story = new Set([...(storyPanels?.panels ?? []), ...(storyPanels?.steps ?? [])].map(({ id }) => id));
    for (const id of this.#ids) if (story.has(id)) throw new SceneError("duplicate-id", `addParts: "${id}" is also the id of a story panel; part and story panel ids share \`ViewInput.panels\``);
  }

  /** The definition's entry; absent when none was added. */
  entry(): { readonly parts: readonly ShelfPart[] } | Record<string, never> {
    return this.#parts.length === 0 ? {} : { parts: Object.freeze([...this.#parts]) };
  }
}
