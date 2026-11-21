import { SceneError } from "./errors";
import { badPart, isMade, partOf, type PanelPart, type TilePart } from "../shelf/part";
import { idsOfPart, type ShelfPart } from "../app/shelfContract";
import { cameraIdsOf, type StoryPanelSet } from "../presentation/storyPanels";
import type { ResolvedView } from "../app/views";
import type { ActionsData } from "../shelf/actions/factory";

/** What a `Scene` has planned for its shelf parts (`addParts`), in the order added. */
export class PartPlan {
  readonly #parts: ShelfPart[] = [];
  readonly #ids = new Set<string>();

  /** Appends parts, all or none: a value no factory made is `bad-part`, and an id (a part's or a block's) already used in the scene, or twice in this call, is `duplicate-id`. */
  add(parts: readonly (PanelPart | TilePart)[]): void {
    if (!Array.isArray(parts)) throw badPart("addParts", "give a list of parts, such as [panel({ ... })]");
    const taken = new Set(this.#ids);
    const added: ShelfPart[] = [];
    parts.forEach((part, index) => {
      if (
        !isMade(part) ||
        ((part as { kind?: unknown }).kind !== "panel" && (part as { kind?: unknown }).kind !== "readoutTile")
      )
        throw badPart(
          "addParts",
          `parts[${index}] is not a part made by a shelf factory (a panel or a readoutTile); blocks go in a panel's blocks`,
        );
      const internal = partOf(part);
      for (const id of idsOfPart(internal)) {
        if (taken.has(id))
          throw new SceneError("duplicate-id", `addParts: "${id}" is already the id of a part or block in this scene`);
        taken.add(id);
      }
      added.push(internal);
    });
    this.#parts.push(...added);
    for (const id of taken) this.#ids.add(id);
  }

  /** The parts, in the order added. */
  get parts(): readonly ShelfPart[] {
    return this.#parts;
  }

  /** The ids views may name: the parts' own. */
  get ids(): readonly string[] {
    return this.#parts.map(({ id }) => id);
  }

  /** Build-time check: a part id may not also be a story panel's id (a view names both in `panels`). */
  checkAgainst(storyPanels: StoryPanelSet | undefined): void {
    const story = new Set([...(storyPanels?.panels ?? []), ...(storyPanels?.steps ?? [])].map(({ id }) => id));
    for (const id of this.#ids)
      if (story.has(id))
        throw new SceneError(
          "duplicate-id",
          `addParts: "${id}" is also the id of a story panel; part and story panel ids share \`ViewInput.panels\``,
        );
  }

  /** Build-time check: an action's camera may only name an object the scene has, or turn toward an object or a sky figure it has (`bad-part`, as a story panel's camera is checked). */
  checkCameras(objectIds: readonly string[], figureIds: readonly string[]): void {
    for (const part of this.#parts) {
      if (part.kind !== "panel") continue;
      for (const block of part.blocks) {
        if (block.kind !== "actions") continue;
        for (const action of (block.data as ActionsData).actions) {
          if (action.camera === undefined) continue;
          const { bodies, toward } = cameraIdsOf(action.camera as Parameters<typeof cameraIdsOf>[0]);
          for (const id of bodies)
            if (!objectIds.includes(id))
              throw new SceneError(
                "bad-part",
                `actions "${block.id}": action "${action.id}" camera names "${id}", which is not an object in the scene`,
              );
          if (toward !== undefined && !objectIds.includes(toward) && !figureIds.includes(toward))
            throw new SceneError(
              "bad-part",
              `actions "${block.id}": action "${action.id}" camera turns toward "${toward}", which is neither an object nor a sky figure in the scene`,
            );
        }
      }
    }
  }

  /**
   * Build-time check: at most one tile shows in a view (`bad-part` naming both). A tile id some view lists shows only in those views; any other tile shows in every view, so it meets every other tile there.
   * Without views, every tile shows in the one view the scene has.
   */
  checkTiles(views: readonly ResolvedView[] | undefined): void {
    const tiles = this.#parts.filter((part) => part.kind === "readoutTile");
    if (tiles.length < 2) return;
    for (const shown of views === undefined
      ? [tiles]
      : views.map((view) => tiles.filter((tile) => view.panels.has(tile.id)))) {
      if (shown.length > 1)
        throw badPart(
          "addParts",
          `the readoutTiles "${shown[0]!.id}" and "${shown[1]!.id}" would show in the same view; at most one tile shows in a view (list each in a different view's panels)`,
        );
    }
  }

  /** The definition's entry; absent when none was added. */
  entry(): { readonly parts: readonly ShelfPart[] } | Record<string, never> {
    return this.#parts.length === 0 ? {} : { parts: Object.freeze([...this.#parts]) };
  }
}
