import type { CSSProperties } from "react";
import type { ClockSnapshot } from "../core/clock";
import type { TimelineEvent } from "../core/events";
import type { TimelineWindow } from "../core/timeWindow";
import { eventContextAt, eventPositionPercent, formatUtcTimestamp, formatWindowRate, navigationStops, windowContextAt, windowCurvePath, windowAreaPath, windowPeakHeightPercent, windowPeakRateText, windowTimeAtFraction, timePositionPercent, windowPositionPercent, type NavigationStop, mergeSpeeds, DEFAULT_PLAYBACK_SPEEDS, TIMELINE_STEP_MS, clampToBounds } from "./timelineModel";
import type { ExperienceConfig } from "./experience";
import { Label } from "./Label";
import type { StoryPanel } from "./storyPanels";
import "./TimelineBar.css";

interface Props {
  readonly experience: ExperienceConfig;
  readonly snapshot: ClockSnapshot;
  readonly onTogglePlayback: () => void;
  readonly onRateChange: (rate: number) => void;
  readonly onSeek: (timeUtcMs: number) => void;
  /** Story panels drawn as markers on the track; pressing one seeks to it and opens it. */
  readonly panels?: readonly StoryPanel[];
  readonly openPanelId?: string | null;
  readonly onPanelOpen?: (panel: StoryPanel) => void;
  /** Seeks to the event; an open event panel follows it. */
  readonly onEventSeek: (event: TimelineEvent) => void;
  /** Opens the event's details without changing time. */
  readonly onEventInfo: (event: TimelineEvent) => void;
  /** Seeks to a time inside the window; an open window panel follows it. */
  readonly onWindowSeek: (window: TimelineWindow, timeUtcMs: number) => void;
  /** Opens the window's details without changing time. */
  readonly onWindowInfo: (window: TimelineWindow) => void;
}

export function TimelineBar({ experience, snapshot, onTogglePlayback, onRateChange, onSeek, panels = [], openPanelId = null, onPanelOpen, onEventSeek, onEventInfo, onWindowSeek, onWindowInfo }: Props) {
  const windows = experience.windows ?? [];
  const navigation = navigationStops(experience.events, windows, snapshot.timeUtcMs);
  const goToStop = (stop: NavigationStop) => {
    if (stop.event !== undefined) onEventSeek(stop.event);
    else if (stop.window !== undefined) onWindowSeek(stop.window, stop.timeUtcMs);
  };
  const stopLabel = (direction: "Previous" | "Next", stop: NavigationStop | null) =>
    windows.length === 0 || stop === null ? `${direction} event` : `${direction}: ${stop.label}`;
  const speeds = mergeSpeeds(DEFAULT_PLAYBACK_SPEEDS, experience.rates);
  const timestamp = formatUtcTimestamp(snapshot.timeUtcMs);

  const scrubber = (
  <div className="timeline-scrubber">
    {windows.length > 0 && (
      <div className="timeline-windows" aria-label="Timeline windows">
        {windows.map((window) => {
          const { startPercent, endPercent } = windowPositionPercent(window, experience.window);
          const area = windowAreaPath(window, experience.window);
          const curve = windowCurvePath(window, experience.window);
          const peakHeight = windowPeakHeightPercent(window);
          const peakRate = windowPeakRateText(window);
          return (
            <div key={window.id} className="timeline-window-group">
              {/* One plain caption for the whole shape: what it is (the window's own label) and what the curve measures (its rate, from the data). */}
              <span className="timeline-window-caption" style={{ left: `${startPercent}%` }}>
                <strong>{window.label}</strong>
                {peakRate !== null && <span> · peak {peakRate}</span>}
              </span>
              {area !== null && curve !== null && (
                <svg className="timeline-window-curve" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path className="timeline-window-area" d={area} />
                  <path className="timeline-window-line" d={curve} vectorEffect="non-scaling-stroke" />
                </svg>
              )}
              <button
                type="button"
                className="timeline-window"
                aria-label={`${window.label}, ${formatUtcTimestamp(window.startUtcMs)} to ${formatUtcTimestamp(window.endUtcMs)}`}
                title={`${window.label}${peakRate === null ? "" : ` (the curve is the rate, peak ${peakRate})`}: click to jump to that time and open its details`}
                style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
                onClick={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  const fraction = box.width > 0 ? (event.clientX - box.left) / box.width : 0;
                  onWindowSeek(window, windowTimeAtFraction(window, fraction));
                  onWindowInfo(window);
                }}
              />
              {window.peakUtcMs !== undefined && (
                <button
                  type="button"
                  className="timeline-window-peak"
                  aria-label={`Go to peak of ${window.label}`}
                  title={`${window.label} peak`}
                  style={{ left: `${timePositionPercent(window.peakUtcMs, experience.window)}%`, "--peak": peakHeight ?? 100 } as CSSProperties}
                  onClick={() => { if (window.peakUtcMs !== undefined) onWindowSeek(window, window.peakUtcMs); onWindowInfo(window); }}
                />
              )}
            </div>
          );
        })}
      </div>
    )}
    <div className="timeline-track">
      <div className="timeline-markers" aria-label="Timeline event markers">
        {experience.events.map((event) => (
          <button
            key={event.id}
            className="timeline-marker"
            type="button"
            aria-label={`Go to ${event.label}`}
            title={event.label}
            style={{ left: `${eventPositionPercent(event, experience.window)}%` }}
            onClick={() => { onEventSeek(event); onEventInfo(event); }}
          >
            <Label text={event.label} className="timeline-marker-label" />
          </button>
        ))}
        {panels.map((panel) => (
          <button
            key={panel.id}
            className="timeline-marker timeline-panel-marker"
            type="button"
            data-panel-id={panel.id}
            aria-pressed={openPanelId === panel.id}
            aria-label={`Open story panel: ${panel.title}`}
            title={panel.title}
            style={{ left: `${timePositionPercent(panel.timeUtcMs, experience.window)}%` }}
            onClick={() => onPanelOpen?.(panel)}
          >
            <Label text={panel.title} className="timeline-marker-label" />
          </button>
        ))}
      </div>
      <input
        type="range"
        aria-label="Seek timeline"
        min={experience.window.startUtcMs}
        max={experience.window.endUtcMs}
        step={TIMELINE_STEP_MS}
        value={clampToBounds(snapshot.timeUtcMs, experience.window)}
        onChange={(event) => onSeek(Number(event.target.value))}
      />
    </div>
    <div className="timeline-bounds" aria-hidden="true">
      <time dateTime={formatUtcTimestamp(experience.window.startUtcMs)}>{formatUtcTimestamp(experience.window.startUtcMs).slice(0, 10)}</time>
      <time dateTime={formatUtcTimestamp(experience.window.endUtcMs)}>{formatUtcTimestamp(experience.window.endUtcMs).slice(0, 10)}</time>
    </div>
  </div>
  );

  return (
    <section className="timeline-bar" aria-label="Timeline controls">
      <div className="timeline-main-row">
        <div className="timeline-transport">
          <button type="button" className="timeline-play" title={snapshot.playing ? "Pause" : "Play"} onClick={onTogglePlayback} aria-label={snapshot.playing ? "Pause playback" : "Play playback"}>
            {snapshot.playing ? <Symbol path="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <Symbol path="M7 5v14l12-7z" />}
          </button>
          <button
            type="button"
            className="timeline-previous"
            aria-label={stopLabel("Previous", navigation.previous)}
            title={stopLabel("Previous", navigation.previous)}
            disabled={navigation.previous === null}
            onClick={() => { if (navigation.previous !== null) goToStop(navigation.previous); }}
          >
            <Symbol path="M6 5h2v14H6zM19 5v14L9 12z" />
          </button>
          <button
            type="button"
            className="timeline-next"
            aria-label={stopLabel("Next", navigation.next)}
            title={stopLabel("Next", navigation.next)}
            disabled={navigation.next === null}
            onClick={() => { if (navigation.next !== null) goToStop(navigation.next); }}
          >
            <Symbol path="M16 5h2v14h-2zM5 5v14l10-7z" />
          </button>
        </div>

        <time className="timeline-time" dateTime={timestamp} aria-label={timestamp}>
          <span className="timeline-time-full">{timestamp}</span>
          <span className="timeline-time-short" aria-hidden="true">{timestamp.slice(0, 16).replace("T", " ")}</span>
        </time>

        <label className="timeline-speed">
          <span>Playback rate</span>
          <select aria-label="Playback speed" title="Playback speed" value={snapshot.rate} onChange={(event) => onRateChange(Number(event.target.value))}>
            {speeds.map((speed) => <option key={speed.rate} value={speed.rate}>{speed.label}</option>)}
          </select>
        </label>

        {scrubber}

        <details className="timeline-event-list">
          <summary title="Events: what just happened, what is next, and the full list">Events <span>({experience.events.length})</span></summary>
          <TimelineExpanded experience={experience} snapshot={snapshot} onEventSeek={onEventSeek} onEventInfo={onEventInfo} onWindowInfo={onWindowInfo} />
        </details>
      </div>
    </section>
  );
}

/** A 24x24 filled symbol; the button around it carries the accessible name and tooltip. */
function Symbol({ path }: { readonly path: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={path} /></svg>;
}

interface ExpandedProps {
  readonly experience: ExperienceConfig;
  readonly snapshot: ClockSnapshot;
  readonly onEventSeek: (event: TimelineEvent) => void;
  readonly onEventInfo: (event: TimelineEvent) => void;
  readonly onWindowInfo: (window: TimelineWindow) => void;
}

/**
 * The timeline's expanded content: "Just happened / Up next / Inside" and the full event list.
 * On larger screens it opens from the Events button; the phone drawer shows the same content when expanded.
 */
export function TimelineExpanded({ experience, snapshot, onEventSeek, onEventInfo, onWindowInfo }: ExpandedProps) {
  const context = eventContextAt(experience.events, snapshot.timeUtcMs);
  const inside = windowContextAt(experience.windows ?? [], snapshot.timeUtcMs);
  return (
    <div className="timeline-expanded">
      <div className="timeline-event-context" aria-label="Event context">
        {context.current === null
          ? <span><strong>Just happened:</strong> No event yet</span>
          : (
            <button
              type="button"
              className="timeline-event-current"
              aria-label={`Information about ${context.current.label}`}
              aria-controls="info-panel"
              onClick={() => { if (context.current !== null) onEventInfo(context.current); }}
            >
              <strong>Just happened:</strong> {context.current.label} <span aria-hidden="true">ⓘ</span>
            </button>
          )}
        <span><strong>Up next:</strong> {context.next?.label ?? "No upcoming event"}</span>
        {inside.map(({ window, rate }) => (
          <button
            key={window.id}
            type="button"
            className="timeline-event-current timeline-window-current"
            aria-label={`Information about ${window.label}`}
            aria-controls="info-panel"
            onClick={() => onWindowInfo(window)}
          >
            <strong>Inside:</strong> {window.label}
            {rate !== null && window.rate !== undefined && <> — {formatWindowRate(rate, window.rate.unit)}</>} <span aria-hidden="true">ⓘ</span>
          </button>
        ))}
      </div>
      <ol>
        {experience.events.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              aria-current={context.current?.id === event.id ? "time" : undefined}
              onClick={() => { onEventSeek(event); onEventInfo(event); }}
            >
              <time dateTime={formatUtcTimestamp(event.timeUtcMs)}>{formatUtcTimestamp(event.timeUtcMs)}</time>
              <span>{event.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
