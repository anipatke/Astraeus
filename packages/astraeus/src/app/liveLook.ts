/**
 * The looks of a running viewer (O-056 T-262). `skySettingsOf` is the sky as a look lays it over the experience's own; `lookReadOf` reads the looks in force back from the scene's live controls
 * (the one place the Developer drawer, the host's `setLook` and the page address all end up), every one filled in; `applyLook` replaces the whole look. Presentation only (ARCH-02).
 */
import type { LookInput, LookRead } from "../api/look";
import { bootFadeSeconds } from "../shell/bootLoader";
import type { SceneControls } from "./AstraeusScene";
import { glowLookOf, markerSettingsOf, type GlowLook } from "./bodyDraw";
import type { ExperienceDefinition } from "./experienceDefinition";
import { featureMinBodyPxOf } from "./FeatureMarkers";
import { resolveLook } from "./look";
import type { DisplaySwitchItem } from "../shell/DisplaySwitches";
import { resolveSkySettings } from "./skyModel";
import { labelStyleOf } from "./labelStyle";
import { skyColoursOf } from "./skyFigures";

/** The sky settings in force: the experience's own, then the look (the scene's `setLook`, with the address over it). The Milky Way switch's start sits between the two. */
export function skySettingsOf(definition: ExperienceDefinition, look: LookInput) {
  const settings = resolveSkySettings(definition.sky);
  return {
    ...settings,
    milkyWay: look.milkyWay ?? definition.displaySwitches?.milkyWay?.on ?? settings.milkyWay,
    starBrightness: look.starBrightness ?? settings.starBrightness,
    milkyWayBrightness: look.milkyWayBrightness ?? settings.milkyWayBrightness,
    visible: look.skyVisible ?? settings.visible,
    live: true,
  };
}

/** Whether wide screens draw the larger desktop pictures: the look's `desktopPictures` (the scene's, with the address over it), else the definition's own opt-in (default off). Read once when the viewer is built. */
export function desktopPicturesOf(definition: Pick<ExperienceDefinition, "desktopTextures">, look: LookInput): boolean {
  return look.desktopPictures ?? definition.desktopTextures === true;
}

/** The looks the scene's live controls hold now, every one filled in. */
export function lookReadOf(controls: SceneControls): LookRead {
  return {
    starBrightness: controls.starBrightness,
    milkyWay: controls.showMilkyWay,
    milkyWayBrightness: controls.milkyWayBrightness,
    skyVisible: controls.skyVisible !== false,
    ...(controls.glowLook === undefined ? {} : { sunGlow: { sizePx: controls.glowLook.sizePx, brightness: controls.glowLook.brightness, scale: controls.glowLook.scale } }),
    markerSwapRadiusPx: controls.bodyMarker.minSpherePx,
    featureMinBodyPx: featureMinBodyPxOf({ featureMinBodyPx: controls.featureMinBodyPx }),
    loadFadeSeconds: controls.loadFadeSeconds ?? bootFadeSeconds(),
    desktopPictures: controls.desktopPictures,
    skyLines: { ...controls.skyColours },
    labels: { ...controls.labelStyle },
  };
}

/**
 * Replaces the whole look in the live controls with `input` (a look not named takes its default) and returns the looks now in force. The one resolver (`resolveLook`) takes it with no page address:
 * a host's live set wins over the address, which only starts the viewer.
 */
export function applyLook(controls: SceneControls, definition: ExperienceDefinition, glowBase: GlowLook | null, input: LookInput): LookRead {
  const look = resolveLook(input, "");
  const sky = skySettingsOf(definition, look);
  controls.starBrightness = sky.starBrightness;
  controls.milkyWayBrightness = sky.milkyWayBrightness;
  controls.showMilkyWay = sky.milkyWay;
  controls.skyVisible = sky.visible;
  if (glowBase !== null) controls.glowLook = glowLookOf(look, glowBase);
  controls.bodyMarker = { ...controls.bodyMarker, minSpherePx: markerSettingsOf(look).minSpherePx };
  controls.featureMinBodyPx = featureMinBodyPxOf(look);
  controls.loadFadeSeconds = bootFadeSeconds(look);
  controls.skyColours = skyColoursOf(look);
  controls.labelStyle = labelStyleOf(look);
  return lookReadOf(controls);
}

/** What the viewer lets a host do to its presentation: read the display switches, and set the looks, the scale and a switch. Rebuilt every render over the live controls. */
export interface LivePresentation {
  switches(): Readonly<Record<string, boolean>>;
  setLook(look: LookInput): void;
  setScale(id: string): void;
  setSwitch(id: string, on: boolean): void;
}

/** The host's view of the presentation: `items` (read fresh each time) are the display switches the scene placed (those with something to act on), so a switch is read and set exactly as its visible button does. */
export function presentationOf(
  parts: { readonly setLook: (look: LookInput) => void; readonly setScale: (id: string) => void; readonly items: () => readonly DisplaySwitchItem[] },
): LivePresentation {
  return {
    switches: () => Object.fromEntries(parts.items().map(({ id, on }) => [id, on])),
    setLook: parts.setLook,
    setScale: parts.setScale,
    setSwitch: (id, on) => {
      const item = parts.items().find((candidate) => candidate.id === id);
      if (item !== undefined && item.on !== on) item.onToggle();
    },
  };
}
