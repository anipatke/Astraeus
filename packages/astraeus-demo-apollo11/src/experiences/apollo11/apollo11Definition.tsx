import type { ExperienceDefinition } from "astraeus/app/experienceDefinition";
import { resolverTrajectory } from "astraeus/app/bodyMetrics";
import { earthMoonSystem } from "astraeus/assets/compositions";
import { apolloMetrics } from "./apolloMetrics";
import { apollo11Experience, apollo11Mission } from "./apollo11";
import { DebugControls } from "./DebugControls";
import { JourneyProgress, MissionSummary, MissionTelemetry } from "./MissionPanel";

/** Apollo 11: the Earth–Moon composition, plus the spacecraft, events and panels that are its own. */
export const apollo11Definition: ExperienceDefinition = {
  label: "Apollo 11",
  experience: apollo11Experience,
  clock: { startUtcMs: apollo11Mission.window.startUtcMs, rate: 3_600 },
  sceneLayers: ["tracked-bodies"],
  composition: earthMoonSystem,
  // True scale only: this story is about scale, so no Readable view that changes the planets' size (owner, 2026-10-17, O-020 Decision 10).
  scaleChoices: ["true-scale"],
  // Seen from above: Earth, the Moon and the whole outbound and return path in frame (owner-chosen angle, T-063).
  startView: { focus: "earth", azimuthDeg: 0, elevationDeg: 70, distance: 130 },
  trackedBodies: apollo11Mission.bodies,
  createMetrics: ({ resolver }) => apolloMetrics(apollo11Mission.bodies, resolver),
  developerSections: [
    {
      id: "clock",
      heading: "Time and playback",
      placement: "before-scene",
      render: ({ clock }) => (
        <>
          <DebugControls clock={clock} mission={apollo11Mission} />
          <JourneyProgress mission={apollo11Mission} clock={clock} />
        </>
      ),
    },
    {
      id: "telemetry",
      heading: "Spacecraft telemetry",
      placement: "before-scene",
      render: ({ clock, resolver }) => <MissionTelemetry mission={apollo11Mission} clock={clock} moon={resolverTrajectory(resolver, "moon", "earth")} />,
    },
    {
      id: "mission",
      heading: "Mission context",
      placement: "after-scene",
      render: () => <MissionSummary mission={apollo11Mission} />,
    },
  ],
};
