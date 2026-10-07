import type { ClockSnapshot } from "../core/clock";
import { eventContextAt, eventNavigationTargets, eventPositionPercent, formatUtcTimestamp, mergeSpeeds, DEFAULT_PLAYBACK_SPEEDS, TIMELINE_STEP_MS, clampToBounds } from "./timelineModel";
import type { ExperienceConfig } from "./experience";
import { Label } from "./Label";

interface Props {
  readonly experience: ExperienceConfig;
  readonly snapshot: ClockSnapshot;
  readonly onTogglePlayback: () => void;
  readonly onRateChange: (rate: number) => void;
  readonly onSeek: (timeUtcMs: number) => void;
}

export function TimelineBar({ experience, snapshot, onTogglePlayback, onRateChange, onSeek }: Props) {
  const context = eventContextAt(experience.events, snapshot.timeUtcMs);
  const navigation = eventNavigationTargets(experience.events, snapshot.timeUtcMs);
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
            aria-label="Previous event"
            disabled={navigation.previous === null}
            onClick={() => { if (navigation.previous !== null) onSeek(navigation.previous.timeUtcMs); }}
          >
            Previous
          </button>
          <button
            type="button"
            aria-label="Next event"
            disabled={navigation.next === null}
            onClick={() => { if (navigation.next !== null) onSeek(navigation.next.timeUtcMs); }}
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
                  onClick={() => onSeek(event.timeUtcMs)}
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
        <span><strong>Just happened:</strong> {context.current?.label ?? "No event yet"}</span>
        <span><strong>Up next:</strong> {context.next?.label ?? "No upcoming event"}</span>
      </div>

      <div className="timeline-scrubber">
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
                onClick={() => onSeek(event.timeUtcMs)}
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
