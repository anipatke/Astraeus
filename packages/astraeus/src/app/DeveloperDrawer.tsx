// The Developer drawer: its header and eight folds (camera, timeline, orbit lines, moons and rings, sky and Sun, labels, phone layout, under the hood), loaded on demand
// (`developerPanels.tsx`), and the readings only it shows. App owns the settings it mirrors and hands them in; this file draws them and writes the scene's live controls.
// Must not: decide where the drawer sits (the shell's `developer` area does), or keep a setting the shell or the host reads (App keeps those).
import { useEffect, useState, type ComponentProps, type MutableRefObject, type ReactNode } from "react";
import { viewUpVector, type ViewUp } from "./viewUp";
import type { DebugReadout } from "./debugReadout";
import { Collapsible } from "../shell/Collapsible";
import { BOOT_FADE_LIMITS, saveBootFadeSeconds } from "../shell/bootLoader";
import { SettingButtons, SettingColor, SettingGroup, SettingSlider } from "./SettingControls";
import { DEFAULT_TIMELINE_GLOW, type TimelineGlowLook } from "../shell/timelineGlow";
import { DEFAULT_PHONE_LAYOUT, PHONE_LAYOUT_LIMITS, type PhoneLayoutSettings } from "../shell/phoneLayout";
import type { GroupFill } from "./FrameRateSection";
import { FrameStats, type FrameSnapshot } from "./frameStats";
import type { SceneControls, SceneRuntime } from "./AstraeusScene";
import { ORBIT_LOOK_LIMITS, type OrbitLook } from "../assets/orbitLook";
import { INTERNAL_LOOK_COLOURS, type InterfaceLookRead } from "../shell/look/interfaceLook";
import { shareViewLink } from "./address";
import type { CameraView } from "./viewLink";
import {
  LabelSettings,
  MoonsAndRingsSettings,
  SkyAndSunSettings,
  StoryPanelSettings,
  UnderTheHoodSettings,
  ViewLinkReadout,
} from "./DeveloperSettings";

/** Frames-per-second readings kept for the graph: one per 250 ms poll, so about 15 seconds. */
const FPS_HISTORY = 60;

/** The colours the Developer drawer's glow pickers show: the set colour, else the look token in force (the internal glow colour, the viewer's accent; I-186). */
function glowColoursShown(glow: TimelineGlowLook, accent: string): { readonly ahead: string; readonly played: string } {
  return { ahead: glow.color ?? INTERNAL_LOOK_COLOURS.glow, played: glow.playedColor ?? accent };
}

/** The "Copy view link" button and its readout: offered only when the host turned the address option on (nothing else writes the address). */
function ViewLinkGroup({
  offered,
  onCopy,
  ...readout
}: { readonly offered: boolean; readonly onCopy: () => void } & ComponentProps<typeof ViewLinkReadout>) {
  if (!offered) return null;
  return (
    <div className="view-link" role="group" aria-label="Camera view">
      <SettingButtons label="Camera view">
        <button onClick={onCopy}>Copy view link</button>
      </SettingButtons>
      <ViewLinkReadout {...readout} />
    </div>
  );
}

/** The readings only the drawer shows, polled every 250 ms while it is mounted (the shell draws it only while developer mode is on). They start from the live values and restart when the runtime changes. */
function useDrawerReadouts(
  runtime: SceneRuntime,
  controls: MutableRefObject<SceneControls>,
  readout: MutableRefObject<DebugReadout | null>,
) {
  const [hud, setHud] = useState<DebugReadout | null>(readout.current);
  const [frames, setFrames] = useState<FrameSnapshot | null>(null);
  const [fpsHistory, setFpsHistory] = useState<readonly number[]>([]);
  const [fills, setFills] = useState<readonly GroupFill[]>(() =>
    controls.current.groupFills.map((fill) => ({ ...fill })),
  );
  const [viewNow, setViewNow] = useState<CameraView | null>(() =>
    controls.current.viewReadout === undefined ? null : { ...controls.current.viewReadout },
  );
  useEffect(() => {
    const stats = new FrameStats();
    controls.current.frameStats = stats;
    const id = window.setInterval(() => {
      setHud(readout.current);
      const snapshot = stats.snapshot();
      setFrames(snapshot);
      if (snapshot.frames > 0) setFpsHistory((history) => [...history.slice(-(FPS_HISTORY - 1)), snapshot.fps]);
      setFills(controls.current.groupFills.map((fill) => ({ ...fill })));
      setViewNow(controls.current.viewReadout === undefined ? null : { ...controls.current.viewReadout });
    }, 250);
    return () => {
      window.clearInterval(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- controls is a stable ref; the cleanup must clear the current stats, not a copy taken at start
      controls.current.frameStats = null;
      setFrames(null);
      setFpsHistory([]);
    };
  }, [controls, readout, runtime]);
  return { hud, frames, fpsHistory, fills, viewNow };
}

type MoonsProps = Omit<ComponentProps<typeof MoonsAndRingsSettings>, "controls">;
type SkyProps = Omit<ComponentProps<typeof SkyAndSunSettings>, "controls">;
type LabelProps = Omit<ComponentProps<typeof LabelSettings>, "controls">;

/** What the drawer reads and writes, grouped by fold. A setter that already writes both the live control and its mirror is passed as one. */
export interface DeveloperDrawerProps {
  readonly controls: MutableRefObject<SceneControls>;
  readonly readout: MutableRefObject<DebugReadout | null>;
  readonly runtime: SceneRuntime;
  /** Whether the display folds (camera, timeline, phone layout) are shown for this scene. */
  readonly showDisplay: boolean;
  readonly camera: {
    readonly upChoice: ViewUp;
    readonly setUpChoice: (choice: ViewUp) => void;
    readonly markerPx: number;
    readonly setMarkerPx: (value: number) => void;
    readonly loadFade: number;
    readonly setLoadFade: (value: number) => void;
    readonly loopOn: boolean;
    readonly setLoopOn: (on: boolean) => void;
    readonly scale: string;
    /** Whether the host turned the address option on: only then is "Copy view link" offered. */
    readonly offered: boolean;
    /** The scene view showing now, for the link (undefined when the scene has no views). */
    readonly viewId: () => string | undefined;
    readonly viewLink: { readonly url: string; readonly copied: boolean } | null;
    readonly setViewLink: (link: { readonly url: string; readonly copied: boolean }) => void;
  };
  readonly timeline: {
    readonly glow: TimelineGlowLook;
    readonly setGlow: (look: TimelineGlowLook) => void;
    readonly accent: string;
    /** The story panel settings, when the scene has story panels. */
    readonly story: ComponentProps<typeof StoryPanelSettings> | undefined;
  };
  readonly orbit: {
    readonly present: boolean;
    readonly shown: OrbitLook;
    readonly set: (change: Partial<OrbitLook>) => void;
    readonly reset: () => void;
  };
  readonly moons: MoonsProps;
  readonly sky: SkyProps;
  readonly labels: LabelProps;
  readonly phone: {
    readonly layout: PhoneLayoutSettings;
    /** The settings App keeps itself (the sheet cap and animation time are the live controls'). */
    readonly own: PhoneLayoutSettings;
    readonly setOwn: (layout: PhoneLayoutSettings) => void;
    readonly setSheetShown: (percent: number) => void;
    readonly setInterfaceShown: (look: InterfaceLookRead) => void;
  };
}

export default function DeveloperDrawer({
  controls,
  readout,
  runtime,
  showDisplay,
  camera,
  timeline,
  orbit,
  moons,
  sky,
  labels,
  phone,
}: DeveloperDrawerProps) {
  const { hud, frames, fpsHistory, fills, viewNow } = useDrawerReadouts(runtime, controls, readout);
  const { upChoice, setUpChoice, markerPx, setMarkerPx, loadFade, setLoadFade, loopOn, setLoopOn, scale } = camera;
  const { offered, viewLink } = camera;
  const { glow: timelineGlow, setGlow: setTimelineGlow, accent, story } = timeline;
  const { present: orbitPresent, shown: orbitShown, set: setOrbit, reset: resetOrbit } = orbit;
  const { layout: phoneLayout, own: phoneLayoutOwn, setOwn: setPhoneLayout, setSheetShown, setInterfaceShown } = phone;
  /** Writes the current view, scale, up direction and time into the address, then copies the full link (or shows it to copy by hand). */
  const copyViewLink = async () => {
    const view = controls.current.viewReadout;
    if (view === undefined) return;
    const shown = camera.viewId();
    camera.setViewLink(
      await shareViewLink({
        view,
        scaleId: scale,
        up: upChoice,
        timeUtcMs: runtime.clock.snapshot().timeUtcMs,
        ...(shown === undefined ? {} : { show: shown }),
      }),
    );
  };
  // Orbit-line sliders: the first four stay in view, the rest sit in a nested "Fine-tune" fold (T-090).
  const orbitSliders = {
    main: [
      ["baseOpacity", "Ring opacity", "orbit-base-opacity", 0.01],
      ["endFade", "End fade (of ring)", "orbit-end-fade", 0.01],
      ["arcFraction", "Arc length (of orbit)", "orbit-arc-fraction", 0.01],
      ["arcPeak", "Arc opacity", "orbit-arc-peak", 0.01],
    ],
    fine: [
      ["arcExponent", "Fade curve (power)", "orbit-arc-exponent", 0.1],
      ["arcSegments", "Arc segments", "orbit-arc-segments", 1],
      ["arcWidth", "Arc width (of orbit)", "orbit-arc-width", 0.0001],
      ["arcMaxWidthPx", "Arc max width (px)", "orbit-arc-max-width", 0.5],
      ["zoomBoostBase", "Zoom boost (ring)", "orbit-zoom-boost-base", 0.01],
      ["zoomBoostArc", "Zoom boost (arc)", "orbit-zoom-boost-arc", 0.01],
    ],
  } as const;
  const orbitSlider = ([key, label, testId, step]: readonly [
    Exclude<keyof typeof orbitShown, "baseOn" | "endFadeOn" | "arcOn" | "zoomOn">,
    string,
    string,
    number,
  ]) => (
    <SettingSlider
      key={key}
      label={label}
      ariaLabel={label}
      testId={`${testId}-value`}
      display={orbitShown[key].toFixed(step === 1 ? 0 : step === 0.5 ? 1 : step < 0.01 ? 4 : 2)}
      min={ORBIT_LOOK_LIMITS[key].min}
      max={ORBIT_LOOK_LIMITS[key].max}
      step={step}
      value={orbitShown[key]}
      onChange={(value) => setOrbit({ [key]: value })}
    />
  );
  // The panel's folds, in order; the first one present opens by default and the rest start closed (T-090).
  const groups: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly className?: string;
    readonly body: ReactNode;
  } | null> = [
    !showDisplay
      ? null
      : {
          id: "camera",
          title: "Camera and view",
          body: (
            <>
              <SettingButtons label="Up direction">
                {(
                  [
                    ["ecliptic", "Planets' plane (ecliptic)"],
                    ["equatorial", "Earth's pole (equatorial)"],
                  ] as const
                ).map(([choice, text]) => (
                  <button
                    key={choice}
                    aria-pressed={upChoice === choice}
                    onClick={() => {
                      controls.current.up = viewUpVector(choice);
                      setUpChoice(choice);
                    }}
                  >
                    {text}
                  </button>
                ))}
              </SettingButtons>
              <SettingSlider
                label="Marker threshold (px)"
                ariaLabel="Body marker threshold"
                testId="body-marker-value"
                display={markerPx.toFixed(1)}
                min={0}
                max={20}
                step={0.5}
                value={markerPx}
                onChange={(value) => {
                  controls.current.bodyMarker = { ...controls.current.bodyMarker, minSpherePx: value };
                  setMarkerPx(value);
                }}
              />
              <SettingSlider
                label="Loading fade (s, next load)"
                ariaLabel="Loading fade"
                testId="load-fade-value"
                display={loadFade.toFixed(1)}
                min={BOOT_FADE_LIMITS.min}
                max={BOOT_FADE_LIMITS.max}
                step={0.1}
                value={loadFade}
                onChange={(value) => {
                  saveBootFadeSeconds(value);
                  controls.current.loadFadeSeconds = value;
                  setLoadFade(value);
                }}
              />
              <ViewLinkGroup
                offered={offered}
                onCopy={() => void copyViewLink()}
                viewNow={viewNow}
                viewLink={viewLink}
                scale={scale}
                upChoice={upChoice}
              />
              <SettingButtons>
                <button
                  aria-pressed={loopOn}
                  onClick={() => {
                    controls.current.loop = !loopOn;
                    setLoopOn(!loopOn);
                  }}
                >
                  Loop playback
                </button>
              </SettingButtons>
            </>
          ),
        },
    !showDisplay
      ? null
      : {
          id: "timeline",
          title: "Timeline and stories",
          body: (
            <>
              <SettingGroup name="timeline-glow" title="Timeline glow">
                <SettingColor
                  label="Glow colour"
                  ariaLabel="Timeline glow colour"
                  testId="glow-color-value"
                  value={glowColoursShown(timelineGlow, accent).ahead}
                  onChange={(color) => setTimelineGlow({ ...timelineGlow, color })}
                />
                <SettingColor
                  label="Played colour"
                  ariaLabel="Timeline played colour"
                  testId="glow-played-value"
                  value={glowColoursShown(timelineGlow, accent).played}
                  onChange={(playedColor) => setTimelineGlow({ ...timelineGlow, playedColor })}
                />
                {(
                  [
                    ["minBrightness", "Quiet brightness", "Timeline quiet brightness", "glow-min-value", 0, 1, 0.01],
                    [
                      "steadyBrightness",
                      "Steady brightness (no rate)",
                      "Timeline steady brightness",
                      "glow-steady-value",
                      0,
                      1,
                      0.01,
                    ],
                    ["curve", "Curve (rate to brightness)", "Timeline glow curve", "glow-curve-value", 0.2, 3, 0.05],
                    ["playedFloor", "Played brightness floor", "Timeline played floor", "glow-floor-value", 0, 1, 0.01],
                    ["thicknessPx", "Thickness (px)", "Timeline glow thickness", "glow-thickness-value", 2, 14, 0.5],
                    ["haloPx", "Halo blur (px)", "Timeline glow halo", "glow-halo-value", 0, 20, 0.5],
                  ] as const
                ).map(([key, label, ariaLabel, testId, min, max, step]) => (
                  <SettingSlider
                    key={key}
                    label={label}
                    ariaLabel={ariaLabel}
                    testId={testId}
                    display={timelineGlow[key].toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}
                    min={min}
                    max={max}
                    step={step}
                    value={timelineGlow[key]}
                    onChange={(value) => setTimelineGlow({ ...timelineGlow, [key]: value })}
                  />
                ))}
                <SettingButtons>
                  <button onClick={() => setTimelineGlow(DEFAULT_TIMELINE_GLOW)}>Reset glow</button>
                </SettingButtons>
              </SettingGroup>
              {story !== undefined && <StoryPanelSettings {...story} />}
            </>
          ),
        },
    !orbitPresent
      ? null
      : {
          id: "orbit-lines",
          title: "Orbit lines",
          body: (
            <>
              <SettingButtons>
                <button aria-pressed={orbitShown.baseOn} onClick={() => setOrbit({ baseOn: !orbitShown.baseOn })}>
                  Orbit ring
                </button>
                <button
                  aria-pressed={orbitShown.endFadeOn}
                  onClick={() => setOrbit({ endFadeOn: !orbitShown.endFadeOn })}
                >
                  Fade ring ends
                </button>
                <button aria-pressed={orbitShown.arcOn} onClick={() => setOrbit({ arcOn: !orbitShown.arcOn })}>
                  Trailing arc
                </button>
                <button aria-pressed={orbitShown.zoomOn} onClick={() => setOrbit({ zoomOn: !orbitShown.zoomOn })}>
                  Brighten when zoomed out
                </button>
              </SettingButtons>
              {orbitSliders.main.map(orbitSlider)}
              <Collapsible fold="orbit-fine-tune" title="Fine-tune" level={4} nested>
                {orbitSliders.fine.map(orbitSlider)}
              </Collapsible>
              <SettingButtons>
                <button onClick={resetOrbit}>Reset orbit lines</button>
              </SettingButtons>
            </>
          ),
        },
    moons.bodySets.length === 0 && moons.ringSystems.length === 0
      ? null
      : {
          id: "moons-rings",
          title: "Moons and rings",
          body: <MoonsAndRingsSettings {...moons} controls={controls} />,
        },
    !(sky.visible || sky.glowShown !== null)
      ? null
      : {
          id: "sky-sun",
          title: "Sky and Sun",
          body: <SkyAndSunSettings {...sky} controls={controls} />,
        },
    {
      id: "labels",
      title: "Labels",
      body: <LabelSettings {...labels} controls={controls} />,
    },
    !showDisplay
      ? null
      : {
          id: "phone-layout",
          title: "Phone layout",
          body: (
            <>
              {(
                [
                  ["animationMs", "Drawer animation (ms)", "Phone drawer animation", "phone-animation-value"],
                  [
                    "controlsDrawerMaxPercent",
                    "Top drawer height (% of screen)",
                    "Phone top drawer height",
                    "phone-controls-height-value",
                  ],
                  [
                    "timelineDrawerMaxPercent",
                    "Timeline drawer height (% of screen)",
                    "Phone timeline drawer height",
                    "phone-timeline-height-value",
                  ],
                  ["sheetMaxPercent", "Sheet height (% of screen)", "Phone sheet height", "phone-sheet-height-value"],
                  ["swipeThresholdPx", "Swipe distance (px)", "Phone swipe distance", "phone-swipe-value"],
                ] as const
              ).map(([key, label, ariaLabel, testId]) => (
                <SettingSlider
                  key={key}
                  label={label}
                  ariaLabel={ariaLabel}
                  testId={testId}
                  display={String(phoneLayout[key])}
                  min={PHONE_LAYOUT_LIMITS[key].min}
                  max={PHONE_LAYOUT_LIMITS[key].max}
                  step={PHONE_LAYOUT_LIMITS[key].step}
                  value={phoneLayout[key]}
                  onChange={(value) => {
                    if (key === "sheetMaxPercent") {
                      controls.current.sheetMaxPercent = value;
                      setSheetShown(value);
                    } else if (key === "animationMs") {
                      controls.current.interfaceLook = { ...controls.current.interfaceLook, motionMs: value };
                      setInterfaceShown(controls.current.interfaceLook);
                    } else setPhoneLayout({ ...phoneLayoutOwn, [key]: value });
                  }}
                />
              ))}
              <SettingButtons>
                <button
                  onClick={() => {
                    setPhoneLayout(DEFAULT_PHONE_LAYOUT);
                    controls.current.sheetMaxPercent = DEFAULT_PHONE_LAYOUT.sheetMaxPercent;
                    setSheetShown(DEFAULT_PHONE_LAYOUT.sheetMaxPercent);
                    controls.current.interfaceLook = {
                      ...controls.current.interfaceLook,
                      motionMs: DEFAULT_PHONE_LAYOUT.animationMs,
                    };
                    setInterfaceShown(controls.current.interfaceLook);
                  }}
                >
                  Reset phone layout
                </button>
              </SettingButtons>
            </>
          ),
        },
    {
      id: "under-the-hood",
      title: "Under the hood",
      body: <UnderTheHoodSettings hud={hud} frames={frames} fills={fills} fpsHistory={fpsHistory} />,
    },
  ];
  const presentGroups = groups.filter((group) => group !== null);
  return (
    <div className="hud">
      <header className="developer-heading">
        <h2>Developer tools</h2>
        <p>Live readouts, controls and diagnostics for this scene.</p>
      </header>
      {presentGroups.map((group, index) => (
        <Collapsible
          key={group.id}
          fold={group.id}
          title={group.title}
          defaultOpen={index === 0}
          className={`dev-group${group.className === undefined ? "" : ` ${group.className}`}`}
        >
          {group.body}
        </Collapsible>
      ))}
    </div>
  );
}
