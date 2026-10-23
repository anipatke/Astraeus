// Scene sky: per-frame update of the sky view from the camera and the sky look settings.
import type { PerspectiveCamera } from "three";
import { setDatum } from "./sceneDebug";
import type { SkyView } from "./SkyView";

export interface SkyLook {
  readonly showMilkyWay: boolean;
  readonly starBrightness: number;
  readonly milkyWayBrightness: number;
}

/** Keeps the sky centred on the camera and applies the live sky settings; `probe` also reads the sky back so its invariance can be checked from outside. */
export function updateSky(sky: SkyView, camera: PerspectiveCamera, canvas: HTMLElement, look: SkyLook, probe: boolean): void {
  sky.follow(camera);
  sky.setPictureVisible(look.showMilkyWay);
  if (look.showMilkyWay) sky.requestPicture();
  sky.setStarBrightness(look.starBrightness);
  sky.setMilkyWayBrightness(look.milkyWayBrightness);
  setDatum(canvas, "skyStarBrightness", String(look.starBrightness));
  setDatum(canvas, "skyPicture", look.showMilkyWay ? "on" : "off");
  setDatum(canvas, "skyMilkyWayBrightness", String(look.milkyWayBrightness));
  setDatum(canvas, "skyPictureShown", String(sky.pictureVisible));
  // Developer mode reads the sky back (orientation in, screen position out).
  if (probe) canvas.dataset.skyProbe = JSON.stringify(sky.probe(camera));
}
