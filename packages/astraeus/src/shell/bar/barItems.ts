// The bar's item model: one ordered list of what the bar can show, each with the forms it can take and the priority that says what leaves the row first
// (viewer-interface note, section 4). Job: describe items as plain data for the fit rule and the measuring row. It must not render, measure or decide a place
// (`fitBar.ts` decides, `Bar.tsx` draws). Adding a bar item means adding its entry here (kind, priority, forms) and its component; the fit rule needs no change.

/** The shapes an item takes, longest first: `full`; `short` (short labels, the short title); `i` (the title as "i"); `compact` (a switch as a drop-down). */
export type BarForm = "full" | "short" | "i" | "compact";

/** Title place, switch tabs, story buttons (O-080), engine controls and the menu button. */
export type BarKind = "title" | "switch" | "story" | "engine" | "menu";

/** What a measuring row draws for one item in one form, so the real width is read from the page rather than guessed. */
export interface Ghost {
  readonly shape: "title" | "text" | "icon" | "select" | "scale";
  readonly text?: string;
}

export interface BarItem {
  readonly id: string;
  readonly kind: BarKind;
  /**
   * Engine items: 1 stays longest, higher leaves the row sooner (the table below). Story buttons: their order in the story (1 first); the last leaves first.
   * Other kinds: 0.
   */
  readonly priority: number;
  /** The forms the item can take, each as the ghosts that measure it. `full` is always present. */
  readonly forms: Readonly<Partial<Record<BarForm, readonly Ghost[]>>>;
}

/** The engine items' priorities (note section 4): object picker and Info 1, scale and its help 2, camera presets 3, display switches and moons 4, related objects 5, the developer cog 6. */
export const ENGINE_PRIORITY = { picker: 1, info: 1, scale: 2, camera: 3, display: 4, moons: 4, related: 5, developer: 6 } as const;

export const MENU_ITEM_ID = "menu";

const text = (value: string): Ghost => ({ shape: "text", text: value });
const titleGhost = (value: string): Ghost => ({ shape: "title", text: value });

/** The title place: the About title (or the selected object's name until About lands). Forms: full, short title (when given), "i". */
export function titleItem(id: string, full: string, short?: string): BarItem {
  return { id, kind: "title", priority: 0, forms: { full: [titleGhost(full)], ...(short === undefined ? {} : { short: [titleGhost(short)] }), i: [titleGhost("i")] } };
}

/** A switch (the host's picker, or the views): tabs with their labels, short labels when any option has one, and a compact drop-down. */
export function switchItem(id: string, options: readonly { readonly label: string; readonly shortLabel?: string; readonly active?: boolean }[]): BarItem {
  const shorts = options.some((option) => option.shortLabel !== undefined);
  const current = options.find((option) => option.active === true) ?? options[0];
  return {
    id, kind: "switch", priority: 0,
    forms: {
      full: options.map((option) => text(option.label)),
      ...(shorts ? { short: options.map((option) => text(option.shortLabel ?? option.label)) } : {}),
      compact: [{ shape: "select", text: current?.label ?? "" }],
    },
  };
}

/** A story button (O-080): full label, short label when given. `order` is its place in the story's order. */
export function storyItem(id: string, order: number, label: string, shortLabel?: string): BarItem {
  return { id, kind: "story", priority: order, forms: { full: [text(label)], ...(shortLabel === undefined ? {} : { short: [text(shortLabel)] }) } };
}

/** An engine control: icon, text button, drop-down or the scale pair. It has one form. */
export function engineItem(id: string, priority: number, ghosts: readonly Ghost[]): BarItem {
  return { id, kind: "engine", priority, forms: { full: ghosts } };
}

/** The menu button (a phone's ☰, a wide bar's ⋯): shown only when the menu holds something. */
export function menuItem(): BarItem {
  return { id: MENU_ITEM_ID, kind: "menu", priority: 0, forms: { full: [{ shape: "icon" }] } };
}

/** What the shell knows, as parts of the list. */
export interface BarParts {
  readonly title?: BarItem | undefined;
  readonly switches: readonly BarItem[];
  readonly story: readonly BarItem[];
  /** In row order. */
  readonly engine: readonly BarItem[];
}

/** The one ordered list: title, switches, story buttons, engine items, then the menu button. */
export function buildBarItems(parts: BarParts): readonly BarItem[] {
  return [...(parts.title === undefined ? [] : [parts.title]), ...parts.switches, ...parts.story, ...parts.engine, menuItem()];
}
