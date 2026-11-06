import { readJson } from "../../tools/import/test-io.mjs";
import { moonDataFolder } from "../moonData";
import type { MoonFamilyList } from "../../src/shell/moonFamilies";

interface RawList { asOf: string; families: { id: string; label: string; description: string }[]; moons: { id: string; name: string; family: string; named?: boolean; bodyPackage: string | null }[] }

/** Jupiter's real moon list (astraeus-data-jupiter), as the moon panel's list: the way the planets demo hands it to `Scene.setMoonPanel`, with a picture address for each mapped moon. */
export const jupiterRawList = (): RawList => readJson(`${moonDataFolder("jupiter")}list.json`) as RawList;

export function jupiterMoonPanel(): MoonFamilyList {
  const raw = jupiterRawList();
  return {
    planetLabel: "Jupiter",
    listSource: "JPL Horizons",
    listDate: raw.asOf,
    featuredFamilyId: "galilean",
    families: raw.families.map((family) => ({
      id: family.id,
      label: family.label,
      description: family.description,
      moons: raw.moons.filter((moon) => moon.family === family.id).map((moon) => ({ id: moon.id, label: moon.name, named: moon.named !== false, ...(moon.bodyPackage === null ? {} : { pictureUrl: `/pictures/${moon.id}.jpg` }) })),
    })),
  };
}
