import type { ExperienceDefinition } from "../src/app/experienceDefinition";

/** The parts of the Jupiter view the planets builder must leave unchanged (O-033 T-117): window, bodies, story panels, families, tagged places, look. */
export function jupiterViewSnapshot(definition: ExperienceDefinition): unknown {
  const { experience, composition, bodySets, visualOverrides } = definition;
  return JSON.parse(JSON.stringify({
    label: definition.label,
    window: experience.window,
    clock: definition.clock,
    objects: experience.objects,
    cameraPresets: experience.cameraPresets,
    rates: experience.rates,
    storyPanels: experience.storyPanels,
    moonFamilies: experience.moonFamilies,
    bodyFeatures: experience.bodyFeatures,
    composition,
    bodySets: (bodySets ?? []).map((set) => ({ id: set.id, members: set.members, families: set.families, bodyFamilies: set.bodyFamilies, extraFamilies: set.extraOrbits?.families, extraMembers: set.extraOrbits?.group.members, centre: set.centreGmKm3S2, groupMembers: set.group.members })),
    visualOverrides,
    camera: definition.camera,
    scaleChoices: definition.scaleChoices,
    startView: definition.startView,
    trackedBodies: definition.trackedBodies,
  }));
}
