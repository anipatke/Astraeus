import type { Provenance } from "../core/provenance";
import type { CardFactInput } from "./scene";
import type { TimeInput } from "./time";

/** One moon of a family in the moon panel. */
export interface MoonPanelMoonInput {
  /** A body or body-set member of the scene; checked when the scene is built. Its label comes from there. */
  readonly id: string;
  /** False for a provisional designation, folded under "+N unnamed". Default true. */
  readonly named?: boolean;
}

/** One family of moons in the moon panel. */
export interface MoonPanelFamilyInput {
  readonly id: string;
  readonly label: string;
  /** One plain line. */
  readonly description: string;
  readonly moons: readonly MoonPanelMoonInput[];
}

/** The sliding panel of a planet's moons by family (`Scene.setMoonPanel`). */
export interface MoonPanelInput {
  /** The name in the panel's heading ("<label>'s moons"). */
  readonly label: string;
  readonly families: readonly MoonPanelFamilyInput[];
  /** A family id listed first, with pictures; the others fold. */
  readonly featuredFamily?: string;
  /** Where the list comes from, such as "JPL Horizons". */
  readonly listSource?: string;
  /** When the list was taken. */
  readonly listDate?: TimeInput;
}

/** One tagged place's category: its key, label and marker colour. */
export interface PlaceCategoryInput {
  readonly key: string;
  readonly label: string;
  /** A CSS hex colour such as "#9de3a8". */
  readonly color: string;
}

/** One tagged place on a body's surface. */
export interface PlaceInput {
  /** Unique within the body. */
  readonly id: string;
  readonly name: string;
  /** Shown as the place's kind, such as "Crater". */
  readonly kind: string;
  /** One of `categories`; an unknown one draws white. */
  readonly category: string;
  readonly latitudeDeg: number;
  /** East-positive as the marker draws it; a caller with west longitudes converts first. */
  readonly longitudeDeg: number;
  readonly description: string;
  readonly details?: readonly CardFactInput[];
}

/** The tagged surface places of one body (`Scene.addPlaces`). */
export interface PlacesInput {
  readonly categories: readonly PlaceCategoryInput[];
  readonly places: readonly PlaceInput[];
  /** Shown with every place's information (PROV-01). */
  readonly provenance: Provenance;
  readonly knownLimitations?: readonly string[];
}
