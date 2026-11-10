// What a look may hold (O-065 T-296): whether a text is a CSS colour the viewer would take, checked here without a browser so a bad colour fails at `setLook` / `addSkyFigures` in Node too (API-04, API-05).
const NAMED = new Set(("aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan "
  + "darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink "
  + "deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush "
  + "lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow "
  + "lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin "
  + "navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue "
  + "saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen").split(" "));
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
// The comma forms only: the drawing library that paints the lines reads these (and hex and names), not the space-separated or newer colour functions.
const FUNCTION = /^(?:rgb|hsl)a?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+%?\s*)?\)$/i;

/** True for a hex colour, a comma-form `rgb()`, `rgba()`, `hsl()` or `hsla()` or a named colour. */
export function isCssColour(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const text = value.trim();
  return HEX.test(text) || FUNCTION.test(text) || NAMED.has(text.toLowerCase());
}

/** True for a non-blank font family text (any CSS font-family list, or `inherit`). */
export function isFontFamily(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && !/[;{}]/.test(value);
}

/** Label size range in pixels: small enough for a crowded sky, large enough to read on a phone. */
export const LABEL_SIZE_LIMITS = Object.freeze({ min: 8, max: 24 });
