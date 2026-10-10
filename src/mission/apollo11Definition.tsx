import { createObjectMetrics } from "../app/metricReadouts";
import { DebugControls } from "../app/DebugControls";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import { JourneyProgress, MissionSummary, MissionTelemetry } from "../app/MissionPanel";
import { apollo11Experience, apollo11Mission } from "./apollo11";

/** Apollo 11 as the first experience supplied to the generic app. */
export const apollo11Definition: ExperienceDefinition = {
  experience: apollo11Experience,
  clock: { startUtcMs: apollo11Mission.window.startUtcMs, rate: 3_600 },
  sceneLayers: ["earth-moon", "tracked-bodies"],
  trackedBodies: apollo11Mission.bodies,
  createMetrics: ({ moon }) => createObjectMetrics({ bodies: apollo11Mission.bodies, moon, earthId: "earth", moonId: "moon" }),
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
      render: ({ clock, moon }) => <MissionTelemetry mission={apollo11Mission} clock={clock} moon={moon} />,
    },
    {
      id: "mission",
      heading: "Mission context",
      placement: "after-scene",
      render: () => <MissionSummary mission={apollo11Mission} />,
    },
  ],
};
