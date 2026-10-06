import { useEffect, useState } from "react";
import type { SimulationClock } from "../core/clock";
import { formatUtcTimestamp } from "./DebugOverlay";
import { jumpToEvent, mergeSpeeds, type MissionConfig } from "./mission";

export const SPEEDS: ReadonlyArray<{ readonly label: string; readonly rate: number }> = [
  { label: "1×", rate: 1 },
  { label: "1 hour/sec", rate: 3_600 },
  { label: "1 day/sec", rate: 86_400 },
  { label: "7 days/sec", rate: 604_800 },
];

const DAY_MS = 86_400_000;
export const SCRUB_HALF_SPAN_MS = 30 * DAY_MS;
export const SCRUB_STEP_MS = 60_000;
/** Typed dates stay within the years the spike's ephemeris models are meant for. */
export const MIN_SEEK_UTC_MS = Date.UTC(1900, 0, 1);
export const MAX_SEEK_UTC_MS = Date.UTC(2100, 0, 1);

export interface ScrubWindow {
  readonly startUtcMs: number;
  readonly endUtcMs: number;
}

export type ParsedUtc =
  | { readonly ok: true; readonly timeUtcMs: number }
  | { readonly ok: false; readonly error: string };

const UTC_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?Z?$/;

/** Strict UTC parser: rejects impossible dates (e.g. Feb 30) instead of letting Date roll them over. */
export function parseUtcInput(text: string): ParsedUtc {
  const match = UTC_PATTERN.exec(text.trim());
  if (!match) return { ok: false, error: "Use UTC format YYYY-MM-DD HH:MM[:SS]." };
  const [year, month, day, hour, minute, second] = match.slice(1).map((part) => Number(part ?? 0));
  const timeUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const d = new Date(timeUtcMs);
  const roundTrips = d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
    && d.getUTCHours() === hour && d.getUTCMinutes() === minute && d.getUTCSeconds() === second;
  if (!roundTrips) return { ok: false, error: "That calendar date or time does not exist." };
  if (timeUtcMs < MIN_SEEK_UTC_MS || timeUtcMs > MAX_SEEK_UTC_MS) {
    return { ok: false, error: "Date must be between 1900-01-01 and 2100-01-01 UTC." };
  }
  return { ok: true, timeUtcMs };
}

export function scrubWindowAround(centerUtcMs: number): ScrubWindow {
  return { startUtcMs: centerUtcMs - SCRUB_HALF_SPAN_MS, endUtcMs: centerUtcMs + SCRUB_HALF_SPAN_MS };
}

export function clampToWindow(timeUtcMs: number, window: ScrubWindow): number {
  return Math.min(window.endUtcMs, Math.max(window.startUtcMs, timeUtcMs));
}

/**
 * Seeks without touching play/pause or rate: a paused clock stays paused at the new time and a
 * playing clock keeps advancing from it. Returns the new window, re-centred on the target.
 */
export function seekClock(clock: SimulationClock, timeUtcMs: number): ScrubWindow {
  clock.seek(timeUtcMs);
  return scrubWindowAround(timeUtcMs);
}

/** Plays/pauses without changing the requested timestamp. */
export function setPlaying(clock: SimulationClock, playing: boolean): void {
  if (playing) clock.play();
  else clock.pause();
}

export function formatUtcInput(timeUtcMs: number): string {
  return formatUtcTimestamp(timeUtcMs).slice(0, 19).replace("T", " ");
}

interface Props {
  readonly clock: SimulationClock;
  /** Adds the mission-window preset, its extra rates and the event-jump control. */
  readonly mission?: MissionConfig;
}

export function DebugControls({ clock, mission }: Props) {
  const speeds = mission === undefined ? SPEEDS : mergeSpeeds(SPEEDS, mission.rates);
  const [presetActive, setPresetActive] = useState(false);
  const [eventId, setEventId] = useState(() => mission?.events[0]?.id ?? "");
  const fixedWindow = presetActive && mission !== undefined ? mission.window : null;
  const [followWindow, setWindow] = useState<ScrubWindow>(() => scrubWindowAround(clock.now()));
  const window = fixedWindow ?? followWindow;
  const [snapshot, setSnapshot] = useState(() => clock.snapshot());
  const [text, setText] = useState(() => formatUtcInput(clock.now()));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = globalThis.setInterval(() => {
      const next = clock.snapshot();
      setSnapshot(next);
      // Playback walked out of the shown window: re-centre it rather than pinning the slider.
      if (fixedWindow === null) setWindow((current) => (next.timeUtcMs < current.startUtcMs || next.timeUtcMs > current.endUtcMs
        ? scrubWindowAround(next.timeUtcMs)
        : current));
    }, 200);
    return () => globalThis.clearInterval(id);
  }, [clock, fixedWindow]);

  const refresh = () => setSnapshot(clock.snapshot());
  const seek = (timeUtcMs: number) => {
    setWindow(seekClock(clock, timeUtcMs));
    setText(formatUtcInput(timeUtcMs));
    setError(null);
    refresh();
  };

  return (
    <div className="controls">
      <div className="row">
        <button aria-pressed={snapshot.playing} onClick={() => { setPlaying(clock, !snapshot.playing); refresh(); }}>
          {snapshot.playing ? "Pause" : "Play"}
        </button>
        {speeds.map((option) => (
          <button key={option.rate} aria-pressed={snapshot.rate === option.rate} onClick={() => { clock.setRate(option.rate); refresh(); }}>
            {option.label}
          </button>
        ))}
        <span className="readout" aria-live="off">
          {formatUtcTimestamp(snapshot.timeUtcMs)} · {snapshot.playing ? "playing" : "paused"}
        </span>
      </div>
      {mission !== undefined && (
        <div className="row">
          <button
            aria-pressed={presetActive}
            onClick={() => {
              if (!presetActive) seek(mission.window.startUtcMs);
              setPresetActive(!presetActive);
            }}
          >
            Mission window
          </button>
          <select aria-label="Mission event" value={eventId} onChange={(event) => setEventId(event.target.value)}>
            {mission.events.map((event) => <option key={event.id} value={event.id}>{event.label}</option>)}
          </select>
          <button onClick={() => seek(jumpToEvent(clock, mission.events, eventId))}>Jump to event</button>
        </div>
      )}
      <form
        className="row"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = parseUtcInput(text);
          if (parsed.ok) seek(parsed.timeUtcMs);
          else setError(parsed.error);
        }}
      >
        <input
          type="text"
          aria-label="UTC date and time"
          aria-invalid={error !== null}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="YYYY-MM-DD HH:MM:SS"
          size={20}
        />
        <button type="submit">Seek (UTC)</button>
        {error && <span role="alert" className="error">{error}</span>}
      </form>
      <div className="row">
        <input
          type="range"
          aria-label="Scrub time within window"
          min={window.startUtcMs}
          max={window.endUtcMs}
          step={SCRUB_STEP_MS}
          value={clampToWindow(snapshot.timeUtcMs, window)}
          onChange={(event) => {
            // Scrubbing keeps the window fixed so the thumb does not jump under the pointer.
            const timeUtcMs = Number(event.target.value);
            clock.seek(timeUtcMs);
            setText(formatUtcInput(timeUtcMs));
            setError(null);
            refresh();
          }}
        />
        <span className="readout">
          {formatUtcTimestamp(window.startUtcMs).slice(0, 10)} … {formatUtcTimestamp(window.endUtcMs).slice(0, 10)}
        </span>
      </div>
    </div>
  );
}
