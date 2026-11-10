/** The Sun's glow: the halo drawn round it. Every field is optional and keeps the Sun record's own value when absent. Has no effect in a scene without the Sun. */
export interface SunGlowLook {
  /** Least width of the glow on screen, in pixels, 0 to 400. Default 72. */
  readonly sizePx?: number;
  /** Strength of the glow, 0 to 2. Default 1. */
  readonly brightness?: number;
  /** The glow is at least this many times the Sun's projected diameter, 1 to 6, so close up it frames the disc. Default 2.5. */
  readonly scale?: number;
}

/** The colours of the lines drawn on the sky and of their names, as CSS colour texts (`#8fb4ff`, `rgb(143, 180, 255)`, `hsl(...)` with commas, or a colour name). Every field is optional and keeps its default when absent. A figure's own colours (`SkyFigureInput`) win over these. */
export interface SkyLinesLook {
  /** Lines of figures added with `addSkyFigures`. Default `"#8fb4ff"`. */
  readonly figure?: string;
  /** The names of the sky figures and outlines. Default `"#cfe0ff"`. */
  readonly label?: string;
  /** Outlines (`kind: "boundary"`). Default `"#5f7a9c"`. */
  readonly boundary?: string;
  /** The ecliptic circle. Default `"#e0b25a"`. */
  readonly ecliptic?: string;
  /** The celestial equator circle. Default `"#7fd1b9"`. */
  readonly equator?: string;
  /** A figure line that has been traced. Default `"#ffd166"`. */
  readonly traced?: string;
  /** A figure line that is fading back after a trace. Default `"#44546d"`. */
  readonly faded?: string;
  /** The lines and name of the selected sky figure. Default `"#ffffff"`. */
  readonly selected?: string;
}

/** The font and size of every label in the viewer (bodies, paths, sky figures and anchors). Every field is optional and keeps its default when absent. A sky figure's own `labelFont` and `labelSizePx` win over these. */
export interface LabelsLook {
  /** A CSS font-family text such as `"Georgia, serif"`; not empty. Default `"inherit"`: the page's own font. */
  readonly fontFamily?: string;
  /** Text size in pixels, 8 to 24. Default 12. */
  readonly sizePx?: number;
}

/** The looks a scene may set with `Scene.setLook`: presentation settings that change how the scene is drawn, never where anything is. Each is optional and keeps its default when absent. */
export interface LookInput {
  /** Brightness of the catalogue stars, 0 to 2; 1 is the baseline star curve and 0 hides them in effect. Default 1. */
  readonly starBrightness?: number;
  /** Whether the Milky Way picture is drawn behind the stars (needs the `milky-way` picture in the viewer's `pictures`). Default off, unless `setSwitches` starts the Milky Way switch on. */
  readonly milkyWay?: boolean;
  /** Brightness of the Milky Way picture, 0 to 2; 1 is the baseline strength. Default 1. */
  readonly milkyWayBrightness?: number;
  /** False hides the whole sky (stars and Milky Way), for a comparison. Default true. */
  readonly skyVisible?: boolean;
  /** The Sun's glow. Default: the Sun record's own. */
  readonly sunGlow?: SunGlowLook;
  /** A sphere whose drawn radius is under this many screen pixels is drawn as a marker dot instead, 0 to 100; 0 never swaps. Default 3. */
  readonly markerSwapRadiusPx?: number;
  /** The narrowest body, in screen pixels across, that still shows its surface feature markers, 0 to 2000. Default 60. */
  readonly featureMinBodyPx?: number;
  /** How long the host's loading cover fades out at the first drawn frame, in seconds, 0 to 3. Default 0.6 (a value saved from the Developer drawer stands in its place). */
  readonly loadFadeSeconds?: number;
  /** Whether bodies with a larger desktop picture use it on a wide screen (default false: the phone-sized picture everywhere). Read when the viewer is built: a later `setLook` neither swaps pictures nor changes what `look` reads. */
  readonly desktopPictures?: boolean;
  /** Colours of the sky lines and their names. Default: see `SkyLinesLook`. */
  readonly skyLines?: SkyLinesLook;
  /** The font and size of every label. Default: the page's font at 12 pixels, as before. */
  readonly labels?: LabelsLook;
}

/** The looks a running viewer shows, every one filled in (`ViewerHandle.look`): the scene's `setLook`, the page address and the Developer drawer laid over the defaults. `sunGlow` is absent in a scene without the Sun. */
export interface LookRead {
  readonly starBrightness: number;
  readonly milkyWay: boolean;
  readonly milkyWayBrightness: number;
  readonly skyVisible: boolean;
  readonly sunGlow?: { readonly sizePx: number; readonly brightness: number; readonly scale: number };
  readonly markerSwapRadiusPx: number;
  readonly featureMinBodyPx: number;
  readonly loadFadeSeconds: number;
  /** Whether wide screens use the larger desktop pictures: the value the viewer was built with (the scene's look, or the page address); `setLook` does not change it. */
  readonly desktopPictures: boolean;
  /** The sky line colours in force, every one filled in. */
  readonly skyLines: { readonly figure: string; readonly label: string; readonly boundary: string; readonly ecliptic: string; readonly equator: string; readonly traced: string; readonly faded: string; readonly selected: string };
  /** The label font and size in force. */
  readonly labels: { readonly fontFamily: string; readonly sizePx: number };
}
