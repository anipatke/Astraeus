// O-047 T-203: the Jupiter and Saturn moon positions for the made-up journey (dev server only), as data sources the way a host gets them from `astraeus-data-jupiter` and `-saturn`.
// The dev server cannot read those packages' generated chunk list (tools/build-packages.mjs writes it at build time), so the chunk files the journey needs are globbed here:
// the four large Jupiter moons and the seven inner Saturn moons it shows, with each planet's own series, every year of the index (1950 to 2030).
import type { DataSource } from "astraeus";

const JUPITER_FILES = import.meta.glob("../../astraeus-data-jupiter/data/jupiter-moons/{jupiter,io,europa,ganymede,callisto}/*.bin", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const SATURN_FILES = import.meta.glob("../../astraeus-data-saturn/data/saturn-moons/{saturn,mimas,enceladus,tethys,dione,rhea,titan,iapetus}/*.bin", { query: "?url", import: "default", eager: true }) as Record<string, string>;

/** File paths keyed as the moon loader looks them up: `<body>/<year>.bin`, relative to the system's folder. */
const keyed = (files: Readonly<Record<string, string>>, folder: string): Readonly<Record<string, string>> =>
  Object.fromEntries(Object.entries(files).map(([path, url]) => [path.slice(path.indexOf(`/${folder}/`) + folder.length + 2), url]));

export const journeyData: readonly DataSource[] = [
  { name: "astraeus-data-jupiter", provides: ["io", "europa", "ganymede", "callisto"], moonPositions: { centre: "jupiter", loadIndex: async () => (await import("astraeus-data-jupiter/index.json")).default as unknown, chunkUrls: keyed(JUPITER_FILES, "jupiter-moons") } },
  { name: "astraeus-data-saturn", provides: ["mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus"], moonPositions: { centre: "saturn", loadIndex: async () => (await import("astraeus-data-saturn/index.json")).default as unknown, chunkUrls: keyed(SATURN_FILES, "saturn-moons") } },
];
