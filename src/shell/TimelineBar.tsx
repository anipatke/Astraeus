import type { ClockSnapshot } from "../core/clock";
import type { TimelineEvent } from "../core/events";
import type { TimelineWindow } from "../core/timeWindow";
import { eventContextAt, eventPositionPercent, formatUtcTimestamp, formatWindowRate, navigationStops, windowContextAt, windowCurvePath, timePositionPercent, windowPositionPercent, type NavigationStop, mergeSpeeds, DEFAULT_PLAYBACK_SPEEDS, TIMELINE_STEP_MS, clampToBounds } from "./timelineModel";
import type { ExperienceConfig } from "./experience";
import { Label } from "./Label";

interface Props {
  readonly experience: ExperienceConfig;
  readonly snapshot: ClockSnapshot;
  readonly onTogglePlayback: () => void;
  readonly onRateChange: (rate: number) => void;
  readonly onSeek: (timeUtcMs: number) => void;
  /** Seeks to the event; an open event panel follows it. */
  readonly onEventSeek: (event: TimelineEvent) => void;
  /** Opens the event's details without changing time. */
  readonly onEventInfo: (event: TimelineEvent) => void;
  /** Seeks to a time inside the window; an open window panel follows it. */
  readonly onWindowSeek: (window: TimelineWindow, timeUtcMs: number) => void;
  /** Opens the window's details without changing time. */
  readonly onWindowInfo: (window: TimelineWindow) => void;
}

export function TimelineBar({ experience, snapshot, onTogglePlayback, onRateChange, onSeek, onEventSeek, onEventInfo, onWindowSeek, onWindowInfo }: Props) {
  const context = eventContextAt(experience.events, snapshot.timeUtcMs);
  const windows = experience.windows ?? [];
  const navigation = navigationStops(experience.events, windows, snapshot.timeUtcMs);
  const inside = windowContextAt(windows, snapshot.timeUtcMs);
  const goToStop = (stop: NavigationStop) => {
    if (stop.event !== undefined) onEventSeek(stop.event);
    else if (stop.window !== undefined) onWindowSeek(stop.window, stop.timeUtcMs);
  };
  const stopLabel = (direction: "Previous" | "Next", stop: NavigationStop | null) =>
    windows.length === 0 || stop === null ? `${direction} event` : `${direction}: ${stop.label}`;
  const speeds = mergeSpeeds(DEFAULT_PLAYBACK_SPEEDS, experience.rates);
  const timestamp = formatUtcTimestamp(snapshot.timeUtcMs);

  return (
    <section className="timeline-bar" aria-label="Timeline controls">
      <div className="timeline-main-row">
        <div className="timeline-transport">
          <button type="button" onClick={onTogglePlayback} aria-label={snapshot.playing ? "Pause playback" : "Play playback"}>
            {snapshot.playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            aria-label={stopLabel("Previous", navigation.previous)}
            disabled={navigation.previous === null}
            onClick={() => { if (navigation.previous !== null) goToStop(navigation.previous); }}
          >
            Previous
          </button>
          <button
            type="button"
            aria-label={stopLabel("Next", navigation.next)}
            disabled={navigation.next === null}
            onClick={() => { if (navigation.next !== null) goToStop(navigation.next); }}
          >
            Next
          </button>
        </div>

        <time className="timeline-time" dateTime={timestamp}>{timestamp}</time>

        <label className="timeline-speed">
          <span>Playback rate</span>
          <select aria-label="Playback speed" value={snapshot.rate} onChange={(event) => onRateChange(Number(event.target.value))}>
            {speeds.map((speed) => <option key={speed.rate} value={speed.rate}>{speed.label}</option>)}
          </select>
        </label>

        <details className="timeline-event-list">
          <summary>Events <span>({experience.events.length})</span></summary>
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
        </details>
      </div>

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

      <div className="timeline-scrubber">
        <div className="timeline-track">
          <div className="timeline-windows" aria-label="Timeline windows">
            {windows.map((window) => {
              const { startPercent, endPercent } = windowPositionPercent(window, experience.window);
              const curve = windowCurvePath(window, experience.window);
              return (
                <div key={window.id} className="timeline-window-group">
                  <button
                    type="button"
                    className="timeline-window"
                    aria-label={`${window.label}, ${formatUtcTimestamp(window.startUtcMs)} to ${formatUtcTimestamp(window.endUtcMs)}`}
                    title={window.label}
                    style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
                    onClick={() => { onWindowSeek(window, window.startUtcMs); onWindowInfo(window); }}
                  />
                  {curve !== null && (
                    <svg className="timeline-window-curve" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                      <path d={curve} vectorEffect="non-scaling-stroke" />
                    </svg>
                  )}
                  {window.peakUtcMs !== undefined && (
                    <button
                      type="button"
                      className="timeline-window-peak"
                      aria-label={`Go to peak of ${window.label}`}
                      title={`${window.label} peak`}
                      style={{ left: `${timePositionPercent(window.peakUtcMs, experience.window)}%` }}
                      onClick={() => { if (window.peakUtcMs !== undefined) onWindowSeek(window, window.peakUtcMs); onWindowInfo(window); }}
                    />
                  )}
                </div>
              );
            })}
          </div>
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
    </section>
  );
}
