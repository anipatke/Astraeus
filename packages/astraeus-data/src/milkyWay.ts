// The Milky Way picture and its licence record (PROV-02), kept in its own module so a sky-only app can take the picture without the moon and
// Venus maps: `astraeus-data/milky-way` exports `milkyWaySource`, and `pictures.ts` re-uses this record for the whole package (Zodiac review F-06).
import type { AssetLicence, DataSource, TextureRef } from "astraeus";
import milkyWayUrl from "./textures/milky-way.jpg";

export const MILKY_WAY_LICENCE: AssetLicence = Object.freeze({
  source: "Milky Way 360 equirectangular rendering with foreground stars removed (Wikimedia Commons), Kevinmloch, bsrender, from Gaia EDR3",
  url: "https://commons.wikimedia.org/wiki/File:Milky_Way_360_equirectangular_rendering_with_foreground_stars_removed.png",
  licence: "CC BY-SA 4.0",
  attribution: "Milky Way render by Kevinmloch (bsrender) from Gaia EDR3, ESA/Gaia/DPAC, CC BY-SA 4.0. The 8000x4000 original was resized to 3840x1920 by Wikimedia Commons and re-encoded as JPEG here; no other change (it is dimmed when drawn, not in the file)."
,
  accessed: "2026-10-29",
});

/** The Milky Way picture the engine draws behind the stars, with its licence. */
export const MILKY_WAY_PICTURE: TextureRef = Object.freeze({ url: milkyWayUrl, widthPx: 3840, heightPx: 1920, licence: MILKY_WAY_LICENCE });

/**
 * Hand this to `mount(element, scene, { data: [milkyWaySource] })` to give the sky its Milky Way and nothing else: a build copies this one picture,
 * not the moon and Venus maps that `astraeus-data`'s main export carries. It provides no bodies.
 */
export const milkyWaySource: DataSource = Object.freeze({ name: "astraeus-data/milky-way", provides: [], pictures: Object.freeze({ "milky-way": MILKY_WAY_PICTURE }) });
