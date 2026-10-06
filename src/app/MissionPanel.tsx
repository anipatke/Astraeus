import { useEffect, useState } from "react";
import type { SimulationClock } from "../core/clock";
import { trackedReadouts, type MissionConfig, type TrackedReadout } from "./mission";

interface Props {
  readonly mission: MissionConfig;
  readonly clock: SimulationClock;
}

const fmt = (value: number, digits: number) => value.toLocaleString("en-US", { maximumFractionDigits: digits });

export function MissionPanel({ mission, clock }: Props) {
  const [rows, setRows] = useState<readonly TrackedReadout[]>([]);
  useEffect(() => {
    const id = globalThis.setInterval(() => setRows(trackedReadouts(mission.bodies, clock.now())), 250);
    return () => globalThis.clearInterval(id);
  }, [mission, clock]);

  return (
    <div className="mission" aria-label="Mission">
      <strong>{mission.title}</strong>
      {mission.notes.map((note) => <span key={note}>{note}</span>)}
      {rows.map((row) => (
        <span key={row.id} className="readout">
          {row.label}: {fmt(row.rangeFromEarthKm, 0)} km from Earth centre
          {row.speedKmS === null ? "" : ` · ${fmt(row.speedKmS, 3)} km/s (inertial)`}
        </span>
      ))}
    </div>
  );
}
