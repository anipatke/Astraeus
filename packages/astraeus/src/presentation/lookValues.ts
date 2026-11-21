// What a look may hold (O-065 T-296): whether a text is a CSS colour the viewer would take, checked here without a browser so a bad colour fails at `setLook` / `addSkyFigures` in Node too (API-04, API-05).
const NAMED = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan " +
    "darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink " +
    "deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush " +
    "lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow " +
    "lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin " +
    "navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue " +
    "saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen"
  ).split(" "),
);
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
// The comma forms only: the drawing library that paints the lines reads these (and hex and names), not the space-separated or newer colour functions.
const FUNCTION = /^(?:rgb|hsl)a?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+%?\s*)?\)$/i;

/** True for a hex colour, a comma-form `rgb()`, `rgba()`, `hsl()` or `hsla()` or a named colour. */
export function isCssColour(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const text = value.trim();
  return HEX.test(text) || FUNCTION.test(text) || NAMED.has(text.toLowerCase());
}

const FUNCTION_PARTS = /^(rgb|hsl)a?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*(?:,\s*([\d.]+%?)\s*)?\)$/i;

function alphaOf(text: string | undefined): number {
  if (text === undefined) return 1;
  const value = text.endsWith("%") ? Number.parseFloat(text) / 100 : Number.parseFloat(text);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
}

/** A CSS colour split into its opaque part (what the drawing library can take) and its alpha, 0 to 1 (1 for a colour with none): `#rrggbbaa`, `#rgba`, `rgba()` and `hsla()` carry one. The drawing library ignores an alpha in a colour, so a line multiplies it into its opacity. */
export function splitColourAlpha(colour: string): { readonly colour: string; readonly alpha: number } {
  const text = colour.trim();
  if (/^#[0-9a-f]{4}$/i.test(text))
    return { colour: `#${text[1]}${text[2]}${text[3]}`, alpha: Number.parseInt(text[4]! + text[4]!, 16) / 255 };
  if (/^#[0-9a-f]{8}$/i.test(text))
    return { colour: text.slice(0, 7), alpha: Number.parseInt(text.slice(7), 16) / 255 };
  const parts = FUNCTION_PARTS.exec(text);
  if (parts === null || parts[5] === undefined) return { colour: text, alpha: 1 };
  return { colour: `${parts[1]!.toLowerCase()}(${parts[2]}, ${parts[3]}, ${parts[4]})`, alpha: alphaOf(parts[5]) };
}

/** True for a non-blank font family text (any CSS font-family list, or `inherit`). */
export function isFontFamily(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && !/[;{}]/.test(value);
}

/** Label size range in pixels: small enough for a crowded sky, large enough to read on a phone. */
export const LABEL_SIZE_LIMITS = Object.freeze({ min: 8, max: 24 });

/** The precisions a time can be shown to. */
export const TIME_PRECISIONS = Object.freeze(["day", "minute", "second"] as const);
/** How precisely a time reads: `"day"`, `"minute"` or `"second"`. */
export type TimePrecision = (typeof TIME_PRECISIONS)[number];

/** True for a time precision name. */
export function isTimePrecision(value: unknown): value is TimePrecision {
  return typeof value === "string" && (TIME_PRECISIONS as readonly string[]).includes(value);
}

/** True for a zone the time look takes: `"UTC"`, `"local"` (the visitor's own) or an IANA name the runtime's `Intl` accepts. */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") return false;
  if (value === "UTC" || value === "local") return true;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
