/** The Sun's glow: the halo drawn round it. Every field is optional and keeps the Sun record's own value when absent. Has no effect in a scene without the Sun. */
export interface SunGlowLook {
  /** Least width of the glow on screen, in pixels, 0 to 400. Default 72. */
  readonly sizePx?: number;
  /** Strength of the glow, 0 to 2. Default 1. */
  readonly brightness?: number;
  /** The glow is at least this many times the Sun's projected diameter, 1 to 6, so close up it frames the disc. Default 2.5. */
  readonly scale?: number;
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
}
