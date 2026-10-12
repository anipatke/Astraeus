import type { ExperienceDefinition } from "../../app/experienceDefinition";
import { resolverTrajectory } from "../../app/bodyMetrics";
import { earthMoonSystem } from "../../assets/compositions";
import { apolloMetrics } from "./apolloMetrics";
import { apollo11Experience, apollo11Mission } from "./apollo11";
import { DebugControls } from "./DebugControls";
import { JourneyProgress, MissionSummary, MissionTelemetry } from "./MissionPanel";

/** Apollo 11: the Earth–Moon composition, plus the spacecraft, events and panels that are its own. */
export const apollo11Definition: ExperienceDefinition = {
  experience: apollo11Experience,
  clock: { startUtcMs: apollo11Mission.window.startUtcMs, rate: 3_600 },
  sceneLayers: ["tracked-bodies"],
  composition: earthMoonSystem,
  scaleChoices: ["true-scale", "readable-scale"],
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
