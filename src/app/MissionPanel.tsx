import { useEffect, useState } from "react";
import type { SimulationClock } from "../core/clock";
import { trackedReadouts, type MissionConfig, type TrackedReadout } from "./mission";

interface TelemetryProps {
  readonly mission: MissionConfig;
  readonly clock: SimulationClock;
}

interface SummaryProps {
  readonly mission: MissionConfig;
}

const fmt = (value: number, digits: number) => value.toLocaleString("en-US", { maximumFractionDigits: digits });

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

export function MissionTelemetry({ mission, clock }: TelemetryProps) {
  const [rows, setRows] = useState<readonly TrackedReadout[]>(() => trackedReadouts(mission.bodies, clock.now()));
  useEffect(() => {
    const id = globalThis.setInterval(() => setRows(trackedReadouts(mission.bodies, clock.now())), 250);
    return () => globalThis.clearInterval(id);
  }, [mission, clock]);

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
              <div className="spacecraft-metric">
                <span className="instrument-label">Range</span>
                <strong className="instrument-value">{fmt(row.rangeFromEarthKm, 0)}</strong>
                <span className="instrument-unit">km from Earth centre</span>
              </div>
              <div className="spacecraft-metric">
                <span className="instrument-label">Speed</span>
                <strong className="instrument-value">{row.speedKmS === null ? "—" : fmt(row.speedKmS, 3)}</strong>
                <span className="instrument-unit">{row.speedKmS === null ? "not modeled" : "km/s · inertial"}</span>
              </div>
            </div>
          </article>
        ))}
    </div>
  );
}
