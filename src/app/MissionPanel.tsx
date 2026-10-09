import { useEffect, useMemo, useState } from "react";
import type { SimulationClock } from "../core/clock";
import type { Trajectory } from "../core/trajectory";
import { MetricVisual } from "../shell/MetricVisual";
import { peakAnchorSpeedKmS, referenceInSameFrame, spacecraftRangeMetric, spacecraftSpeedMetric } from "./metricReadouts";
import { trackedReadouts, type MissionConfig, type TrackedReadout } from "./mission";

interface TelemetryProps {
  readonly mission: MissionConfig;
  readonly clock: SimulationClock;
  /** Supplies the Moon's current distance as a reference mark on each range bar. */
  readonly moon: Trajectory;
}

interface TelemetryFrame {
  readonly timeUtcMs: number;
  readonly rows: readonly TrackedReadout[];
}

interface SummaryProps {
  readonly mission: MissionConfig;
}

export function MissionSummary({ mission }: SummaryProps) {
  return (
    <div className="mission-summary">
      <p>Mission identity and reconstruction notes.</p>
      <details>
        <summary>Mission and data notes ({mission.notes.length})</summary>
        <strong>{mission.title}</strong>
        <ul>{mission.notes.map((note) => <li key={note}>{note}</li>)}</ul>
      </details>
    </div>
  );
}

function telemetryAt(mission: MissionConfig, timeUtcMs: number): TelemetryFrame {
  return { timeUtcMs, rows: trackedReadouts(mission.bodies, timeUtcMs) };
}

export function MissionTelemetry({ mission, clock, moon }: TelemetryProps) {
  const [{ timeUtcMs, rows }, setFrame] = useState<TelemetryFrame>(() => telemetryAt(mission, clock.now()));
  useEffect(() => {
    const id = globalThis.setInterval(() => setFrame(telemetryAt(mission, clock.now())), 250);
    return () => globalThis.clearInterval(id);
  }, [mission, clock]);
  const peaks = useMemo(() => new Map(mission.bodies.map((body) => [body.id, peakAnchorSpeedKmS(body)])), [mission]);
  const moonState = rows.length === 0 ? null : moon.stateAt(timeUtcMs);

  return (
    <div className="mission spacecraft-grid" aria-label="Live spacecraft telemetry">
      {rows.length === 0
        ? <p className="mission-empty">No spacecraft are within their trajectory bounds at this time.</p>
        : rows.map((row) => (
          <article key={row.id} className="spacecraft-card readout" aria-label={`${row.label} telemetry`}>
            <header className="spacecraft-card-header">
              <h4>{row.label}</h4>
              <span className="telemetry-state"><span aria-hidden="true" />In bounds</span>
            </header>
            <div className="spacecraft-metrics">
              <MetricVisual metric={spacecraftRangeMetric(row, referenceInSameFrame("Moon now", row, moonState))} />
              <MetricVisual metric={spacecraftSpeedMetric(row, peaks.get(row.id) ?? null)} />
            </div>
          </article>
        ))}
    </div>
  );
}
