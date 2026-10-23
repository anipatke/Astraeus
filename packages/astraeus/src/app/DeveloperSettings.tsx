import type { MutableRefObject } from "react";
import type { GlowLook } from "./bodyDraw";
import { GLOW_LIMITS } from "./bodyDraw";
import { BODY_SET_LOOK_LIMITS, DEFAULT_BODY_SET_LOOK, familyColorOf, type BodySetLayer, type BodySetLook } from "./bodySet";
import { ringBandsWithLook, type RingLook, type RingSystem } from "../assets/rings";
import { HOVER_BRIGHTNESS_LIMITS } from "./scenePicking";
import { MAX_PANEL_PAUSE_SECONDS } from "../shell/storyPanels";
import type { SceneControls } from "./AstraeusScene";
import { DebugOverlay, type DebugReadout } from "./DebugOverlay";
import { FrameRateSection, type GroupFill } from "./FrameRateSection";
import type { FrameSnapshot } from "./frameStats";
import type { ExperienceDefinition } from "./experienceDefinition";
import { formatView, type StartView } from "./viewLink";
import type { ViewUp } from "./viewUp";
import { SettingButtons, SettingColor, SettingGroup, SettingSlider } from "./SettingControls";

/** The Developer tools' settings bodies that App.tsx hands whole to its folds; each only reads its props and writes the scene's live controls. */
type Controls = MutableRefObject<SceneControls>;

export function StoryPanelSettings({ storyAutoOpen, setStoryAutoOpen, storyPauseSeconds, setStoryPauseSeconds }: {
  readonly storyAutoOpen: boolean;
  readonly setStoryAutoOpen: (on: boolean) => void;
  readonly storyPauseSeconds: number;
  readonly setStoryPauseSeconds: (seconds: number) => void;
}) {
  return (
    <SettingGroup id="story-panels" title="Story panels">
              <SettingButtons>
                <button aria-pressed={storyAutoOpen} onClick={() => setStoryAutoOpen(!storyAutoOpen)}>Open panels automatically</button>
              </SettingButtons>
              <SettingSlider label="Pause when a panel opens (s)" ariaLabel="Story panel pause" testId="story-pause-value" display={storyPauseSeconds === 0 ? "off" : storyPauseSeconds.toFixed(1)} min={0} max={MAX_PANEL_PAUSE_SECONDS} step={0.5} value={storyPauseSeconds}
                onChange={setStoryPauseSeconds} />
    </SettingGroup>
  );
}

export function MoonsAndRingsSettings({ bodySets, ringSystems, setLook, changeSetLook, ringLook, changeRing, controls, setSetLook, setRingLook }: {
  readonly bodySets: readonly BodySetLayer[];
  readonly ringSystems: readonly RingSystem[];
  readonly setLook: BodySetLook;
  readonly changeSetLook: (change: Partial<BodySetLook>) => void;
  readonly ringLook: RingLook;
  readonly changeRing: (band: string, change: { color?: string; opacity?: number }) => void;
  readonly controls: Controls;
  readonly setSetLook: (look: BodySetLook) => void;
  readonly setRingLook: (look: RingLook) => void;
}) {
  return (
        <>
          {bodySets.length > 0 && (
            <SettingGroup id="body-set-dots" title="Small moons">
              <SettingSlider label="Dot size (px)" ariaLabel="Small moon dot size" testId="body-set-dot-px" display={setLook.dotPx.toFixed(1)} min={BODY_SET_LOOK_LIMITS.dotPx.min} max={BODY_SET_LOOK_LIMITS.dotPx.max} step={0.5} value={setLook.dotPx} onChange={(dotPx) => changeSetLook({ dotPx })} />
              <SettingColor label="Dot colour" ariaLabel="Small moon dot colour" testId="body-set-dot-color" value={setLook.dotColor} onChange={(dotColor) => changeSetLook({ dotColor })} />
              <SettingSlider label="Name when ball is (px)" ariaLabel="Small moon name distance" testId="body-set-label-px" display={setLook.labelNearPx.toFixed(0)} min={BODY_SET_LOOK_LIMITS.labelNearPx.min} max={BODY_SET_LOOK_LIMITS.labelNearPx.max} step={1} value={setLook.labelNearPx} onChange={(labelNearPx) => changeSetLook({ labelNearPx })} />
            </SettingGroup>
          )}
          {bodySets.length > 0 && (
            <SettingGroup id="body-set-orbits" title="Moon orbits by family">
              <SettingButtons>
                <button aria-pressed={setLook.orbitsOn} onClick={() => changeSetLook({ orbitsOn: !setLook.orbitsOn })}>Moon orbits</button>
              </SettingButtons>
              <SettingSlider label="Orbit opacity" ariaLabel="Moon orbit opacity" testId="body-set-orbit-opacity" display={setLook.orbitOpacity.toFixed(2)} min={BODY_SET_LOOK_LIMITS.orbitOpacity.min} max={BODY_SET_LOOK_LIMITS.orbitOpacity.max} step={0.01} value={setLook.orbitOpacity} onChange={(orbitOpacity) => changeSetLook({ orbitOpacity })} />
              <SettingSlider label="Zoom boost" ariaLabel="Moon orbit zoom boost" testId="body-set-orbit-boost" display={setLook.orbitZoomBoost.toFixed(2)} min={BODY_SET_LOOK_LIMITS.orbitZoomBoost.min} max={BODY_SET_LOOK_LIMITS.orbitZoomBoost.max} step={0.01} value={setLook.orbitZoomBoost} onChange={(orbitZoomBoost) => changeSetLook({ orbitZoomBoost })} />
              <SettingColor label="Highlight colour" ariaLabel="Moon family highlight colour" testId="body-set-highlight-color" value={setLook.highlightColor} onChange={(highlightColor) => changeSetLook({ highlightColor })} />
              <SettingSlider label="Highlight orbit brightness" ariaLabel="Moon family highlight orbit brightness" testId="body-set-highlight-gain" display={setLook.highlightOrbitGain.toFixed(1)} min={BODY_SET_LOOK_LIMITS.highlightOrbitGain.min} max={BODY_SET_LOOK_LIMITS.highlightOrbitGain.max} step={0.5} value={setLook.highlightOrbitGain} onChange={(highlightOrbitGain) => changeSetLook({ highlightOrbitGain })} />
              {bodySets.flatMap((layer) => layer.families.map((family) => (
                <SettingColor key={`${layer.id}-${family.id}`} label={family.label} ariaLabel={`${family.label} orbit colour`} testId={`body-set-family-${family.id}`} value={familyColorOf(layer, setLook, family.id)} onChange={(color) => changeSetLook({ familyColors: { ...setLook.familyColors, [family.id]: color } })} />
              )))}
              <SettingButtons>
                <button onClick={() => { delete controls.current.bodySetLook; setSetLook(DEFAULT_BODY_SET_LOOK); }}>Reset moons</button>
              </SettingButtons>
            </SettingGroup>
          )}
          {ringSystems.map((rings) => (
            <SettingGroup key={rings.body} id={`rings-${rings.body}`} title="Rings">
              {ringBandsWithLook(rings, ringLook).map((band) => (
                <div key={band.id}>
                  <SettingColor label={band.label} ariaLabel={`${band.label} colour`} testId={`ring-${band.id}-color`} value={band.color} onChange={(color) => changeRing(band.id, { color })} />
                  <SettingSlider label={`${band.label} opacity`} ariaLabel={`${band.label}: opacity`} testId={`ring-${band.id}-opacity`} display={band.opacity.toFixed(3)} min={0} max={1} step={0.005} value={band.opacity} onChange={(opacity) => changeRing(band.id, { opacity })} />
                </div>
              ))}
              <SettingButtons>
                <button onClick={() => { delete controls.current.ringLook; setRingLook({}); }}>Reset rings</button>
              </SettingButtons>
            </SettingGroup>
          ))}
        </>
  );
}

export function SkyAndSunSettings({ illuminateAll, setIlluminateAll, visible, glowShown, setGlowShown, controls, milkyWayOn, setMilkyWayOn, starBrightness, setStarBrightness, milkyWayBrightness, setMilkyWayBrightness }: {
  /** Light every body from the camera's side, keeping its shading; off is true sunlight. */
  readonly illuminateAll: boolean;
  readonly setIlluminateAll: (on: boolean) => void;
  readonly visible: boolean;
  readonly glowShown: GlowLook | null;
  readonly setGlowShown: (look: GlowLook) => void;
  readonly controls: Controls;
  readonly milkyWayOn: boolean;
  readonly setMilkyWayOn: (on: boolean) => void;
  readonly starBrightness: number;
  readonly setStarBrightness: (value: number) => void;
  readonly milkyWayBrightness: number;
  readonly setMilkyWayBrightness: (value: number) => void;
}) {
  return (
        <>
          <SettingGroup id="lighting" title="Lighting">
            <SettingButtons>
              <button aria-pressed={illuminateAll} aria-label="Illuminate all" onClick={() => { controls.current.illuminateAll = !illuminateAll; setIlluminateAll(!illuminateAll); }}>Illuminate all</button>
            </SettingButtons>
          </SettingGroup>
          {visible && (
            <SettingGroup id="sky" title="Sky">
              <SettingButtons>
                <button aria-pressed={milkyWayOn} onClick={() => { controls.current.showMilkyWay = !milkyWayOn; setMilkyWayOn(!milkyWayOn); }}>Milky Way picture</button>
              </SettingButtons>
              <SettingSlider label="Star brightness" ariaLabel="Star brightness" testId="star-brightness-value" display={starBrightness.toFixed(2)} min={0} max={2} step={0.05} value={starBrightness}
                onChange={(value) => { controls.current.starBrightness = value; setStarBrightness(value); }} />
              <SettingSlider label="Milky Way brightness" ariaLabel="Milky Way brightness" testId="milky-way-brightness-value" display={milkyWayBrightness.toFixed(2)} min={0} max={2} step={0.05} value={milkyWayBrightness}
                onChange={(value) => { controls.current.milkyWayBrightness = value; setMilkyWayBrightness(value); }} />
            </SettingGroup>
          )}
          {glowShown !== null && (
            <SettingGroup id="glow" title="Sun glow">
              <SettingSlider label="Glow size (px)" ariaLabel="Sun glow size" testId="sun-glow-size-value" display={glowShown.sizePx.toFixed(0)} min={GLOW_LIMITS.sizePx.min} max={GLOW_LIMITS.sizePx.max} step={1} value={glowShown.sizePx}
                onChange={(value) => { controls.current.glowLook!.sizePx = value; setGlowShown({ ...controls.current.glowLook! }); }} />
              <SettingSlider label="Glow brightness" ariaLabel="Sun glow brightness" testId="sun-glow-brightness-value" display={glowShown.brightness.toFixed(2)} min={GLOW_LIMITS.brightness.min} max={GLOW_LIMITS.brightness.max} step={0.05} value={glowShown.brightness}
                onChange={(value) => { controls.current.glowLook!.brightness = value; setGlowShown({ ...controls.current.glowLook! }); }} />
              <SettingSlider label="Glow reach (× disc)" ariaLabel="Sun glow reach" testId="sun-glow-scale-value" display={glowShown.scale.toFixed(1)} min={GLOW_LIMITS.scale.min} max={GLOW_LIMITS.scale.max} step={0.1} value={glowShown.scale}
                onChange={(value) => { controls.current.glowLook!.scale = value; setGlowShown({ ...controls.current.glowLook! }); }} />
            </SettingGroup>
          )}
        </>
  );
}

export function LabelSettings({ controls, hoverBrightness, setHoverBrightness, labelToggles, trackedCount, anchorLabels, setAnchorLabels, hiddenLabels, setHiddenLabels }: {
  readonly controls: Controls;
  readonly hoverBrightness: number;
  readonly setHoverBrightness: (value: number) => void;
  readonly labelToggles: readonly { readonly id: string; readonly label: string }[];
  readonly trackedCount: number;
  readonly anchorLabels: boolean;
  readonly setAnchorLabels: (on: boolean) => void;
  readonly hiddenLabels: ReadonlySet<string>;
  readonly setHiddenLabels: (hidden: ReadonlySet<string>) => void;
}) {
  return (
        <>
          <SettingSlider label="Hover name brightness" ariaLabel="Hover name brightness" testId="hover-brightness-value" display={hoverBrightness.toFixed(2)} min={HOVER_BRIGHTNESS_LIMITS.min} max={HOVER_BRIGHTNESS_LIMITS.max} step={0.05} value={hoverBrightness}
            onChange={(value) => { controls.current.hoverBrightness = value; setHoverBrightness(value); }} />
          {(labelToggles.length > 0 || trackedCount > 0) && <SettingButtons>
            {trackedCount > 0 && <button aria-pressed={anchorLabels} onClick={() => { controls.current.showAnchorLabels = !anchorLabels; setAnchorLabels(!anchorLabels); }}>Anchor labels</button>}
            {labelToggles.map((object) => (
              <button key={object.id} aria-pressed={!hiddenLabels.has(object.id)} onClick={() => {
                const hidden = controls.current.hiddenLabels ?? new Set<string>();
                if (hidden.has(object.id)) hidden.delete(object.id);
                else hidden.add(object.id);
                controls.current.hiddenLabels = hidden;
                setHiddenLabels(new Set(hidden));
              }}>{`${object.label} label`}</button>
            ))}
          </SettingButtons>}
        
        </>
  );
}

export function ViewLinkReadout({ viewNow, viewLink, scale, upChoice }: {
  readonly viewNow: StartView | null;
  readonly viewLink: { readonly url: string; readonly copied: boolean } | null;
  readonly scale: string;
  readonly upChoice: ViewUp;
}) {
  return (
    <>
          {viewNow !== null && <p className="view-link-values" data-testid="view-values">{`View: ${formatView(viewNow).replace(/%2C/g, ",")} (focus, azimuth °, elevation °, distance) · scale ${scale} · up ${upChoice}`}</p>}
          {viewLink !== null && (
            <p className="view-link-field">
              <input readOnly aria-label="View link" data-testid="view-link" value={viewLink.url} onFocus={(event) => event.currentTarget.select()} />
              <span>{viewLink.copied ? "Copied to the clipboard." : "Clipboard unavailable: select the link above and copy it."}</span>
            </p>
          )}
    </>
  );
}

export function UnderTheHoodSettings({ hud, frames, fills, fpsHistory, alternates }: {
  readonly hud: DebugReadout | null;
  readonly frames: FrameSnapshot | null;
  readonly fills: readonly GroupFill[];
  readonly fpsHistory: readonly number[];
  /** The experience's alternate data sets; absent or empty: no Data group. */
  readonly alternates: ExperienceDefinition["alternates"];
}) {
  return (
        <>
          {hud !== null && (
            <section className="hud-section" aria-labelledby="developer-scene-heading">
              <h4 id="developer-scene-heading">Scene instrumentation</h4>
              <DebugOverlay readout={hud} />
            </section>
          )}
          <FrameRateSection frames={frames} fills={fills} fpsHistory={fpsHistory} />
          {alternates !== undefined && alternates.length > 0 && (
            <SettingGroup id="data" title="Data">
              <SettingButtons>
                {alternates?.map((alternate) => (
                  <button key={`${alternate.param}=${alternate.value}`} aria-pressed={alternate.active} onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set(alternate.param, alternate.value);
                    window.location.assign(url.toString());
                  }}>{alternate.label}</button>
                ))}
              </SettingButtons>
            </SettingGroup>
          )}
        </>
  );
}
