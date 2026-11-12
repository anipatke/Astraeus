import { lazy, Suspense, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import type { ClockSnapshot } from "../core/clock";
import type { TimelineEvent } from "../core/events";
import type { TimelineWindow } from "../core/timeWindow";
import { StoryPanelView, type StepNav } from "./StoryPanelView";
import { useDrawers } from "./useDrawers";
import { useStoryPanels, type PanelCause, type StoryPanelSettings } from "./useStoryPanels";
import { neighbourStep, type StoryPanel, type StoryStep } from "./storyPanels";
import { TimelineBar } from "./TimelineBar";
import type { TimelineGlowLook } from "./timelineGlow";
import { requestObjectId, type ExperienceCameraPreset, type ExperienceConfig, type ExperienceObject } from "./experience";
import { InfoPanel } from "./InfoPanel";
import { infoView } from "./infoModel";
import type { Metric } from "./metrics";
import { PanelLoadBoundary } from "../app/PanelLoadBoundary";
import { ControlsDrawer } from "./ControlsDrawer";
import { isEmbedded } from "./embedded";
import { labelStyleVars } from "../app/labelStyle";
import { DEFAULT_PHONE_LAYOUT, phoneLayoutStyle, pickOpensInfo, usePhone, type PhoneLayoutSettings } from "./phoneLayout";
import type { DisplaySwitchItem, ViewChoice } from "./DisplaySwitches";
import type { ViewCameraRule } from "../app/views";
import { presetForViewRule } from "./viewCamera";
import type { ExperienceSwitch } from "./SwitchControl";
import { DeveloperToggle, TopBar } from "./TopBar";
import type { ScaleChoice, ScaleId } from "./scaleModel";
import { shownAt } from "../app/viewHiding";
import { availableObjectById, findCameraPreset, firstAvailableObject, focusPresetFor, isObjectAvailable, skyFigureById } from "./objectModel";
import "./controls.css";
import "./style.css";
import "./phone.css";
import "./embedded.css";

/** Keeps `--timeline-space` at the distance from the screen's bottom to the top of the timeline bar, so a phone sheet can sit above it. */
function useTimelineSpace(root: { readonly current: HTMLElement | null }, phone: boolean): void {
  useEffect(() => {
    const shell = root.current;
    const bar = shell?.querySelector<HTMLElement>(".timeline-bar") ?? null;
    if (shell === null || bar === null || typeof ResizeObserver === "undefined") return undefined;
    const measure = () => shell.style.setProperty("--timeline-space", `${Math.ceil(window.innerHeight - bar.getBoundingClientRect().top)}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); shell.style.removeProperty("--timeline-space"); };
  }, [root, phone]);
}

/** The object selected when the shell opens: the first one available at the clock time, else the first listed. */
export function initialObjectId(experience: ExperienceConfig, timeUtcMs: number): string {
  const start = experience.cameraPresets.find((preset) => preset.id === experience.startCameraPresetId)?.request;
  const startId = start === undefined ? undefined : requestObjectId(start);
  if (startId !== undefined && experience.objects.some((object) => object.id === startId)) return startId;
  return firstAvailableObject(experience, timeUtcMs)?.id ?? experience.objects[0]?.id ?? "";
}

/** The story-panel settings the experience carries itself, used when the app gives none live. */
function ownStorySettings(storySet: ExperienceConfig["storyPanels"]): StoryPanelSettings {
  return { autoOpen: storySet?.autoOpen ?? false, pauseSeconds: storySet?.pauseSeconds ?? 0 };
}

/** The timeline bar, or nothing when the experience says it has no timeline. */
function ShellTimeline({ hidden, ...bar }: ComponentProps<typeof TimelineBar> & { readonly hidden: boolean }) {
  return hidden ? null : <TimelineBar {...bar} />;
}

/** The Developer cog and its drawer; drawn only when the host gave the drawer's content (absent: neither, so an outside page never sees a developer cog). */
function DeveloperDrawer({ developerMode, onDeveloperModeChange, children }: { readonly developerMode: boolean; readonly onDeveloperModeChange: (enabled: boolean) => void; readonly children: ReactNode }) {
  const drawerId = `${useId()}-developer-tools`;
  if (children === undefined) return null;
  return (
    <>
      <DeveloperToggle developerMode={developerMode} onDeveloperModeChange={onDeveloperModeChange} drawerId={drawerId} />
      <aside className="developer-tools" id={drawerId} data-developer-panel="" aria-label="Developer diagnostics" hidden={!developerMode}>
        {developerMode ? children : null}
      </aside>
    </>
  );
}

/** The wide-screen moons toggle and the sheet it opens under the toolbar. */
function MoonsSheet({ planetLabel, open, onToggle, onClose, children }: { readonly planetLabel: string | undefined; readonly open: boolean; readonly onToggle: () => void; readonly onClose: () => void; readonly children: ReactNode }) {
  const sheetId = `${useId()}-moons-panel`;
  return (
    <>
      <button type="button" className="moons-toggle ui-pill" aria-expanded={open} aria-controls={sheetId} onClick={onToggle}>
        {planetLabel} moons
      </button>
      <aside id={sheetId} className="moons-sheet" data-open={open} aria-label="Moons by family" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
        {children}
      </aside>
    </>
  );
}

/** Who moved the selection: the visitor, or a move of time or the view (named by whatever last moved them). */
export type SelectionOrigin = "visitor" | "move";

interface Props {
  readonly experience: ExperienceConfig;
  readonly snapshot: ClockSnapshot;
  readonly developerMode: boolean;
  readonly onDeveloperModeChange: (enabled: boolean) => void;
  readonly onTogglePlayback: () => void;
  readonly onRateChange: (rate: number | "auto") => void;
  /** Only for a scene with pacing: whether pacing sets the rate now (the speed menu then shows Auto). */
  readonly paceAuto?: boolean | undefined;
  readonly onSeek: (timeUtcMs: number) => void;
  readonly onCameraRequest: (request: ExperienceCameraPreset["request"]) => void;
  /** Turns the camera toward a sky figure, only while it looks out (an event naming a figure: Go to); the app decides, so an orbiting camera is left alone. */
  readonly onTurnToFigure?: (id: string) => void;
  /** Holds the camera where it is, its target fixed in the scene (a view's `stay` rule); a later camera request replaces it. */
  readonly onCameraHold?: () => void;
  /** True when the host has set the camera since the last view switch: that call answers the switch, so the view's own camera rule does not replace it. */
  readonly hostCameraSet?: () => boolean;
  /** Filled with the shell's story seek note, so a host's time jump re-bases the panel crossing check exactly as a visitor's seek does. */
  readonly storySeekNote?: { current: ((timeUtcMs: number) => void) | null };
  /** `origin` is required so a new selection path must say who chose: "visitor" (a menu choice, pick, preset or marker) or "move" (time or the view moved and the selection followed). */
  readonly onSelectionChange: (objectId: string, origin: SelectionOrigin) => void;
  readonly scaleId: ScaleId;
  readonly onScaleChange: (id: ScaleId) => void;
  readonly scaleChoices?: readonly ScaleChoice[];
  /** A choice between versions of the experience (top bar and phone drawer); absent: none. */
  readonly switcher?: ExperienceSwitch;
  /** Display switches a story placed in the top bar or its switch panel (also in the phone drawer); absent or empty: none. */
  readonly displaySwitches?: readonly DisplaySwitchItem[];
  /** The views the scene names (T-219); absent: none. The experience this shell gets is already the current view's. */
  readonly viewChoice?: ViewChoice;
  /** The view showing and its camera rule (T-220): on a switch of `id`, a followed or focused object the new view does not show is handled by the rule; absent: no views. */
  readonly viewCamera?: { readonly id: string; readonly rule: ViewCameraRule };
  /** Live measurements for an object's info panel, from the app's own State; empty when it has none. */
  readonly metricsFor?: (objectId: string, timeUtcMs: number) => readonly Metric[];
  /** The Developer drawer's content; absent: the shell shows no Developer toggle and no drawer (the host did not ask for developer tools). */
  readonly developerTools?: ReactNode;
  /** The live story-panel settings (auto-open, pause length); absent: the experience's own defaults. */
  readonly storyPanelSettings?: StoryPanelSettings;
  /** The live look of the timeline's activity glow; absent: the defaults. */
  readonly timelineGlow?: TimelineGlowLook;
  /** The phone layout's live numbers (drawer heights, animation, swipe distance); absent: the defaults. */
  readonly phoneLayout?: PhoneLayoutSettings;
  /** The font and size of every label (the look `labels`), carried to them as CSS variables on the root; absent: the stylesheet's own. */
  readonly labelStyle?: { readonly fontFamily: string; readonly sizePx: number };
  /** The family of moons lit up in the scene now (the moon panel's choice), or null; the app draws it. */
  readonly highlightedFamily?: string | null;
  readonly onHighlightFamily?: (familyId: string | null) => void;
  /** Starts or holds playback; the shell uses it to pause while a panel opens by itself. */
  readonly onSetPlaying?: (playing: boolean) => void;
  /** Asks the shell to open a panel (a scene marker was pressed); a new `serial` asks again. */
  readonly panelRequest?: { readonly id: string; readonly serial: number; /** True: the host's `setPanel` (id "" closes the open panel). */ readonly host?: boolean } | null;
  /** Called when the open panel changes, with who changed it, so the app can mark its scene marker and tell the host. */
  readonly onOpenPanelChange?: (panelId: string | null, cause: PanelCause) => void;
  /** Asks the shell to open a tagged place's information (a place marker was pressed); a new `serial` asks again. */
  readonly featureRequest?: { readonly key: string; readonly serial: number } | null;
  /** Called with the key of the place whose information is open, or null, so the app can mark its scene marker. */
  readonly onOpenFeatureChange?: (key: string | null) => void;
  /** Asks the shell to fly to an object a tap or click picked in the scene (focus only, no information); a new `serial` asks again. */
  /** A host `setSelected` (id "" clears the selection), applied after the shell's own view-switch choices so the host's call is the last word; `onSelectRequestApplied` tells the app it has been. */
  readonly selectRequest?: { readonly id: string; readonly serial: number; readonly quiet?: boolean } | null;
  readonly onSelectRequestApplied?: () => void;
  readonly pickRequest?: { readonly id: string; readonly serial: number } | null;
  readonly children: ReactNode;
}

/** What the information panel is about: the selected object, or an event, window or place by id; null: closed. */
type InfoState = { readonly kind: "object" } | { readonly kind: "event"; readonly id: string } | { readonly kind: "window"; readonly id: string } | { readonly kind: "feature"; readonly id: string } | null;

/** The serial of a request that is asked again by sending a new one; absent request: undefined. */
/** Whether the selection has been lost and a fallback must take its place: the object is gone or not available now, unless the host cleared the selection on purpose. */
function selectionLost(selected: ExperienceObject | undefined, timeUtcMs: number, clearedByHost: boolean, isFigure: boolean): boolean {
  // A selected sky figure is never lost: it has no availability and no view hides it.
  return !clearedByHost && !isFigure && (selected === undefined || !isObjectAvailable(selected, timeUtcMs));
}

/** What a camera preset's object asks of the camera at `timeUtcMs`: "hold" when its shown time has ended or not begun (keep the pose), "overview" when it is gone or unavailable, else undefined. */
function cameraTargetLoss(target: ExperienceObject | undefined, timeUtcMs: number): "hold" | "overview" | undefined {
  if (target !== undefined && !shownAt(target, timeUtcMs)) return "hold";
  return target === undefined || !isObjectAvailable(target, timeUtcMs) ? "overview" : undefined;
}

function serialOf(request: { readonly serial: number } | null | undefined): number | undefined {
  return request?.serial;
}

/** Tells a switch of view from any other change of the experience: `takeSwitchRule` gives the new view's camera rule once after the view's id changed, else undefined. */
function useViewSwitch(viewCamera: Props["viewCamera"]) {
  const viewId = viewCamera?.id;
  const last = useRef(viewId);
  const takeSwitchRule = () => {
    const switched = viewId !== last.current;
    last.current = viewId;
    return switched ? viewCamera?.rule : undefined;
  };
  return { viewId, takeSwitchRule };
}

function panelsOf(storySet: ExperienceConfig["storyPanels"]) {
  return storySet?.panels ?? [];
}

/** Back and Next for the open panel when it is a step: each is absent where there is no neighbour. */
function stepNavOf(panel: StoryPanel | StoryStep | null, steps: readonly StoryStep[], open: (id: string) => void): StepNav | undefined {
  if (panel === null || !("step" in panel)) return undefined;
  const to = (by: -1 | 1) => {
    const neighbour = neighbourStep(steps, panel, by);
    return neighbour === undefined ? undefined : () => open(neighbour.id);
  };
  return { number: panel.step, count: steps.length, onBack: to(-1), onNext: to(1) };
}

/** A request to open a panel (a marker press or the host's `setPanel`; id "" closes the open one), told with who made it. */
function applyPanelRequest(story: Pick<ReturnType<typeof useStoryPanels>, "open" | "close">, request: { readonly id: string; readonly host?: boolean } | null | undefined): void {
  if (request === null || request === undefined) return;
  const by = request.host === true ? "host" : "visitor";
  if (request.id === "") story.close(by);
  else story.open(request.id, by);
}

function stepsOf(storySet: ExperienceConfig["storyPanels"]) {
  return storySet?.steps ?? [];
}

function objectLabelOr(experience: ExperienceConfig, objectId: string, fallback: string): string {
  return experience.objects.find((object) => object.id === objectId)?.label ?? skyFigureById(experience, objectId)?.label ?? fallback;
}

/** The information panel's content and, for an object, its live measurements. */
function infoContent(experience: ExperienceConfig, info: InfoState, selectedObjectId: string, timeUtcMs: number, metricsFor: Props["metricsFor"]) {
  const view = info === null
    ? null
    : infoView(experience, info.kind === "object" ? { kind: "object", id: selectedObjectId } : info, timeUtcMs);
  const metrics = view?.target.kind === "object" && metricsFor !== undefined && skyFigureById(experience, view.target.id) === undefined ? metricsFor(view.target.id, timeUtcMs) : [];
  return { view, metrics };
}

/** The moon families load on demand: only an experience with `moonFamilies` draws them (I-089). */
const MoonFamilyPanel = lazy(() => import("./MoonFamilyPanel").then((module) => ({ default: module.MoonFamilyPanel })));

/** Canvas-first layout shared by astronomy experiences. Scene and diagnostics stay app-owned. */
export function AstraeusShell({
  experience,
  snapshot,
  developerMode,
  onDeveloperModeChange,
  onTogglePlayback,
  onRateChange,
  paceAuto,
  onSeek,
  onCameraRequest,
  onTurnToFigure,
  onCameraHold,
  hostCameraSet,
  storySeekNote,
  onSelectionChange,
  scaleId,
  onScaleChange,
  scaleChoices,
  switcher,
  displaySwitches,
  viewChoice,
  viewCamera,
  metricsFor,
  developerTools,
  storyPanelSettings,
  timelineGlow,
  phoneLayout = DEFAULT_PHONE_LAYOUT,
  labelStyle,
  highlightedFamily = null,
  onHighlightFamily,
  onSetPlaying,
  panelRequest,
  onOpenPanelChange,
  featureRequest,
  onOpenFeatureChange,
  pickRequest,
  selectRequest,
  onSelectRequestApplied,
  children,
}: Props) {
  const infoPanelId = `${useId()}-info-panel`;
  const [selectedObjectId, setSelectedObjectId] = useState(() => initialObjectId(experience, snapshot.timeUtcMs));
  const phone = usePhone();
  /** Fixed for the page: a frame does not appear or vanish while the app runs. */
  const [embedded] = useState(isEmbedded);
  const root = useRef<HTMLElement | null>(null);
  // The drawer (with the moons in it) and the bottom sheets want the same screen: the drawer, being the one just asked for, takes it.
  const { controlsOpen, timelineOpen, openControls, openTimeline } = useDrawers(phone, root, () => {
    if (experience.moonFamilies !== undefined) { setInfo(null); story.close(); }
  });
  useTimelineSpace(root, phone);
  const [activePresetId, setActivePresetId] = useState<string | null>(experience.startCameraPresetId ?? null);
  /** The object panel follows the selected object; an event panel names its event. */
  const [info, setInfo] = useState<InfoState>(null);

  const storySet = experience.storyPanels;
  const storyPanels = panelsOf(storySet);
  const storySteps = stepsOf(storySet);
  const story = useStoryPanels(storyPanels, storySteps, storyPanelSettings ?? ownStorySettings(storySet), snapshot, onSetPlaying);
  if (storySeekNote !== undefined) storySeekNote.current = story.noteSeek;
  useEffect(() => () => { if (storySeekNote !== undefined) storySeekNote.current = null; }, [storySeekNote]);
  const openPanelId = story.openPanel?.id ?? null;
  const storyCause = story.cause;
  // Only a change of the open panel is reported; the cause read then is the one that change came with.
  const lastCause = useRef(storyCause);
  lastCause.current = storyCause;
  useEffect(() => { onOpenPanelChange?.(openPanelId, lastCause.current); }, [onOpenPanelChange, openPanelId]);
  const closePanel = () => story.close();
  const stepNav = stepNavOf(story.openPanel, storySteps, story.open);
  const requestedSerial = serialOf(panelRequest);
  useEffect(() => {
    applyPanelRequest(story, panelRequest);
    // Only a new request opens a panel; the open function is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedSerial]);
  const requestedFeatureSerial = serialOf(featureRequest);
  useEffect(() => {
    if (featureRequest !== null && featureRequest !== undefined) setInfo({ kind: "feature", id: featureRequest.key });
    // Only a new request opens a place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedFeatureSerial]);
  const openFeatureKey = info?.kind === "feature" ? info.id : null;
  useEffect(() => { onOpenFeatureChange?.(openFeatureKey); }, [onOpenFeatureChange, openFeatureKey]);
  /** Every time change a person makes goes through here, so a seek is never mistaken for playback crossing a panel. */
  const seek = (timeUtcMs: number) => {
    story.noteSeek(timeUtcMs);
    onSeek(timeUtcMs);
  };
  const openPanelFromTimeline = (panel: { readonly id: string; readonly timeUtcMs: number }) => {
    seek(panel.timeUtcMs);
    story.open(panel.id);
  };

  useEffect(() => {
    onSelectionChange(selectedObjectId, "visitor");
  }, [onSelectionChange, selectedObjectId]);

  /** The host cleared the selection: the fallback that picks the first available object stays off until something is selected again. */
  const hostCleared = useRef(false);
  // A view switch is told from other changes of the experience by the view's id changing.
  const { viewId, takeSwitchRule } = useViewSwitch(viewCamera);
  useEffect(() => {
    const switchRule = takeSwitchRule();
    if (selectedObjectId !== "") hostCleared.current = false;
    const selected = experience.objects.find((object) => object.id === selectedObjectId);
    if (selectionLost(selected, snapshot.timeUtcMs, hostCleared.current && selectedObjectId === "", skyFigureById(experience, selectedObjectId) !== undefined)) {
      const fallbackId = firstAvailableObject(experience, snapshot.timeUtcMs)?.id ?? "";
      setSelectedObjectId(fallbackId);
      onSelectionChange(fallbackId, "move");
      // The card of an object the view took away closes with it.
      if (switchRule !== undefined && selected === undefined) setInfo((now) => (now?.kind === "object" ? null : now));
    }

    const active = experience.cameraPresets.find((preset) => preset.id === activePresetId);
    const activeRequest = active?.request;
    if (switchRule?.rule === "start" && switchRule.framing?.always === true) {
      applyViewRule(switchRule); // opted in: the view's framing applies on every switch to it
    } else if (activeRequest !== undefined && activeRequest.kind !== "overview") {
      const target = experience.objects.find((object) => object.id === requestObjectId(activeRequest));
      if (switchRule !== undefined && target === undefined) {
        applyViewRule(switchRule);
      } else {
        loseCameraTarget(cameraTargetLoss(target, snapshot.timeUtcMs));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePresetId, experience, onCameraRequest, onSelectionChange, selectedObjectId, snapshot.timeUtcMs, viewId]);

  // A host `setSelected`: runs after the view-switch effect above in the same commit, so it wins over that effect's fallback or view rule.
  const requestedSelectSerial = serialOf(selectRequest);
  useEffect(() => {
    if (selectRequest === null || selectRequest === undefined) return;
    hostCleared.current = selectRequest.id === "";
    setSelectedObjectId(selectRequest.id);
    // As a visitor's menu choice does: the object's card opens (the camera is left alone); a clear closes it.
    // A story panel's select (`quiet`) follows the visitor-tap rule: on a phone it selects without opening the card, which would cover the panel's Back and Next.
    const opens = selectRequest.quiet === true ? pickOpensInfo(phone) : true;
    setInfo((now) => (selectRequest.id === "" ? (now?.kind === "object" ? null : now) : opens ? { kind: "object" } : now));
    onSelectRequestApplied?.();
    // Only a new request applies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedSelectSerial]);

  /** The camera's object is gone or not shown: "hold" keeps the pose and stops following (its shown time ended or has not begun, no jump); "overview" frames the overview. */
  const loseCameraTarget = (loss: "hold" | "overview" | undefined) => {
    if (loss === "hold") {
      setActivePresetId(null);
      onCameraHold?.();
    } else if (loss === "overview") {
      const overview = findCameraPreset(experience, "overview");
      if (overview !== undefined) {
        setActivePresetId(overview.id);
        onCameraRequest(overview.request);
      }
    }
  };

  /** The view's camera rule for a followed or focused object the new view does not show: `stay` keeps the pose and stops following; otherwise the rule's framing is requested. */
  const applyViewRule = (rule: ViewCameraRule) => {
    const asked = presetForViewRule(rule, experience);
    const target = asked === undefined || asked.request.kind === "overview" ? undefined : availableObjectById(experience, requestObjectId(asked.request) ?? "", snapshot.timeUtcMs);
    // A framing whose object is not available now falls back to the overview, like any other lost target.
    const preset = asked !== undefined && asked.request.kind !== "overview" && target === undefined ? findCameraPreset(experience, "overview") : asked;
    if (target !== undefined) {
      setSelectedObjectId(target.id);
      onSelectionChange(target.id, "move"); // only the move-driven effect applies a view rule
    }
    setActivePresetId(preset?.id ?? null);
    if (hostCameraSet?.() === true) return; // a host camera call made since the switch answers it and wins over the rule
    if (preset !== undefined) onCameraRequest(preset.request);
    else onCameraHold?.();
  };

  const [moonsOpen, setMoonsOpen] = useState(false);
  /** A moon chosen in the moon panel: flies to it (the same focus as the object picker) and opens its information. */
  const chooseMoon = (id: string) => {
    const object = availableObjectById(experience, id, snapshot.timeUtcMs);
    if (object === undefined) return;
    activatePreset(focusPresetFor(experience, object));
    setInfo({ kind: "object" });
  };

  /** An object tapped or clicked in the scene: the picker's focus; on a wide screen it also opens the card, on a phone it does not (T-138). A tapped body-set member that is no listed object just flies there. */
  const pickObject = (id: string) => {
    const object = availableObjectById(experience, id, snapshot.timeUtcMs);
    if (skyFigureById(experience, id) !== undefined) {
      selectFigure(id, pickOpensInfo(phone));
    } else if (object !== undefined) {
      activatePreset(focusPresetFor(experience, object));
      if (pickOpensInfo(phone)) setInfo({ kind: "object" });
    } else if (!experience.objects.some((candidate) => candidate.id === id)) onCameraRequest({ kind: "focus", target: id });
  };
  const requestedPickSerial = serialOf(pickRequest);
  useEffect(() => {
    if (pickRequest !== null && pickRequest !== undefined) pickObject(pickRequest.id);
    // Only a new request flies; the handler reads the current time and experience.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedPickSerial]);

  /** A sky figure chosen in the object menu or tapped in the scene: it becomes the selection (the one selection path) and its card opens when `open`; the camera is left alone. */
  const selectFigure = (id: string, open: boolean) => {
    setSelectedObjectId(id);
    onSelectionChange(id, "visitor");
    if (open) setInfo({ kind: "object" });
  };

  const selectObject = (id: string) => {
    if (skyFigureById(experience, id) !== undefined) { selectFigure(id, true); return; }
    const object = availableObjectById(experience, id, snapshot.timeUtcMs);
    if (object === undefined) return;
    setSelectedObjectId(id);
    onSelectionChange(id, "visitor");
    setInfo({ kind: "object" });
    const active = experience.cameraPresets.find((preset) => preset.id === activePresetId);
    if (active?.request.kind === "focus" || active?.request.kind === "follow") {
      const next = findCameraPreset(experience, active.request.kind, id)
        ?? (active.request.kind === "follow" ? findCameraPreset(experience, "focus", id) : undefined);
      if (next !== undefined) {
        setActivePresetId(next.id);
        onCameraRequest(next.request);
      } else {
        const overview = findCameraPreset(experience, "overview");
        setActivePresetId(overview?.id ?? null);
        if (overview !== undefined) onCameraRequest(overview.request);
      }
    }
  };

  const activatePreset = (preset: ExperienceCameraPreset, atUtcMs: number = snapshot.timeUtcMs) => {
    const objectId = requestObjectId(preset.request);
    if (objectId !== undefined) {
      const target = availableObjectById(experience, objectId, atUtcMs);
      if (target === undefined) return;
      setSelectedObjectId(target.id);
      onSelectionChange(target.id, "visitor");
    }
    setActivePresetId(preset.id);
    onCameraRequest(preset.request);
  };

  const seekToEvent = (event: TimelineEvent) => {
    seek(event.timeUtcMs);
    // The event's own object, framed as the picker's Focus does (and `camera.focus` opens): the event, never a default body, names it.
    const object = event.object === undefined ? undefined : availableObjectById(experience, event.object, event.timeUtcMs);
    if (object !== undefined) activatePreset(focusPresetFor(experience, object), event.timeUtcMs);
    // A sky figure is selected (its card stays as it is) and turned toward only while the camera looks out.
    else if (event.object !== undefined && skyFigureById(experience, event.object) !== undefined) {
      selectFigure(event.object, false);
      onTurnToFigure?.(event.object);
    }
    if (info?.kind === "event") setInfo({ kind: "event", id: event.id });
  };

  const seekToWindow = (window: TimelineWindow, timeUtcMs: number) => {
    seek(timeUtcMs);
    if (info?.kind === "window") setInfo({ kind: "window", id: window.id });
  };

  const { view, metrics } = infoContent(experience, info, selectedObjectId, snapshot.timeUtcMs, metricsFor);

  // On a wide screen the moons sheet and the information panel share the left column under the toolbar: opening one closes the other.
  const toggleMoons = () => {
    if (!moonsOpen) setInfo(null);
    setMoonsOpen(!moonsOpen);
  };
  useEffect(() => { if (info !== null) setMoonsOpen(false); }, [info]);

  const selectedLabel = objectLabelOr(experience, selectedObjectId, "Controls");
  const topBar = (
    <TopBar
      experience={experience}
      timeUtcMs={snapshot.timeUtcMs}
      selectedObjectId={selectedObjectId}
      activePresetId={activePresetId}
      onSelectObject={selectObject}
      onCameraPreset={activatePreset}
      infoOpen={info?.kind === "object"}
      onToggleInfo={() => setInfo(info?.kind === "object" ? null : { kind: "object" })}
      infoPanelId={infoPanelId}
      scaleId={scaleId}
      onScaleChange={onScaleChange}
      scaleChoices={scaleChoices}
      switcher={switcher}
      displaySwitches={displaySwitches}
      viewChoice={viewChoice}
    />
  );

  const moonPanel = experience.moonFamilies === undefined ? null : (
    <PanelLoadBoundary message="The moon list could not load. Reload the page to try again.">
      <Suspense fallback={null}>
        <MoonFamilyPanel list={experience.moonFamilies} highlightedFamily={highlightedFamily} onHighlight={(id) => onHighlightFamily?.(id)} onSelectMoon={chooseMoon} />
      </Suspense>
    </PanelLoadBoundary>
  );

  return (
    <main className="astraeus-shell" ref={root} data-phone={phone} data-timeline-hidden={experience.hideTimeline === true} data-embedded={embedded} style={{ ...phoneLayoutStyle(phoneLayout), ...labelStyleVars(labelStyle) }}>
      <div className="shell-canvas">{children}</div>
      {phone && <ControlsDrawer label={selectedLabel} open={controlsOpen} onOpenChange={openControls} swipeThresholdPx={phoneLayout.swipeThresholdPx}>{topBar}{moonPanel}</ControlsDrawer>}
      <div className="shell-top">
        {!phone && topBar}
        {!phone && moonPanel !== null && <MoonsSheet planetLabel={experience.moonFamilies?.planetLabel} open={moonsOpen} onToggle={toggleMoons} onClose={() => setMoonsOpen(false)}>{moonPanel}</MoonsSheet>}
        {view !== null && <InfoPanel view={view} metrics={metrics} onClose={() => setInfo(null)} id={infoPanelId} />}
      </div>
      {story.openPanel !== null && (
        <StoryPanelView
          panel={story.openPanel}
          holding={story.holding}
          onClose={closePanel}
          onContinue={story.continuePlayback}
          step={stepNav}
        />
      )}
      <DeveloperDrawer developerMode={developerMode} onDeveloperModeChange={onDeveloperModeChange}>{developerTools}</DeveloperDrawer>
      <ShellTimeline
        hidden={experience.hideTimeline === true}
        experience={experience}
        snapshot={snapshot}
        onTogglePlayback={onTogglePlayback}
        onRateChange={onRateChange}
        paceAuto={paceAuto}
        onSeek={seek}
        panels={storyPanels}
        openPanelId={openPanelId}
        onPanelOpen={openPanelFromTimeline}
        onEventSeek={seekToEvent}
        onEventInfo={(event) => setInfo({ kind: "event", id: event.id })}
        onWindowSeek={seekToWindow}
        onWindowInfo={(window) => setInfo({ kind: "window", id: window.id })}
        glowLook={timelineGlow}
        infoPanelId={infoPanelId}
        drawer={phone ? { open: timelineOpen, onOpenChange: openTimeline, swipeThresholdPx: phoneLayout.swipeThresholdPx } : undefined}
      />
    </main>
  );
}
