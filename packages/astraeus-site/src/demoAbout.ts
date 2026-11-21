// O-079 T-327: the About every demo the site mounts sets (`Scene.setAbout`), built from records that already exist, so no title or credit text is copied here.
// Title: the demo's label (the one the page heading reads), with a short label for a tight phone row. Credits: the demo package's own credit lines (`credits/CREDITS.md`, each
// ending with its source link), then the licence record of every picture the viewer can draw for the scene (a body's own texture, else the data's picture of that body, and the
// data's Milky Way), each with its credit line and source. Story data stays in the demo packages; this module only reads them and what a scene exposes through the public API.
import type { AboutInput, AssetLicence, DataSource, Scene } from "astraeus";
import { PAGE_TITLE } from "./pageTitle";

/** What an About is built from: the scene, the data handed to `mount`, the demo's label and short label, and its package's credit file. */
export interface DemoAboutSource {
  readonly scene: Scene;
  readonly data: readonly DataSource[];
  readonly label?: string;
  readonly shortLabel?: string;
  /** The text of the demo package's `credits/CREDITS.md` (read through the package's declared `./credits/*` entry), whose lines come first; absent for the made-up scenes. */
  readonly credits?: string;
}

type Credit = NonNullable<AboutInput["credits"]>[number];

/** The credit lines of a credit file: each `- ` line, its trailing `<url>` as the source link. */
export function creditLines(file: string): Credit[] {
  return file.split("\n").filter((line) => line.startsWith("- ")).map((line) => {
    const match = /^- (.*?)\s*(?:<(https?:\/\/\S+)>)?\s*$/.exec(line)!;
    return { text: match[1]!, ...(match[2] === undefined ? {} : { url: match[2] }) };
  });
}

/** The picture name the data's sky picture is kept under. */
const MILKY_WAY = "milky-way";

/** The licence record of every picture the viewer can draw for the scene, in body order, then the sky picture. */
function pictureLicences(scene: Scene, data: readonly DataSource[]): AssetLicence[] {
  const picture = (name: string): AssetLicence | undefined => data.map((source) => source.pictures?.[name]?.licence).find((licence) => licence !== undefined);
  return [...scene.bodies.map((body) => body.texture?.licence ?? picture(body.id)), picture(MILKY_WAY)].filter((licence): licence is AssetLicence => licence !== undefined);
}

/** The credits: the package's credit lines, then one per distinct picture record (the credit line it asks for, else its source and licence), each linking to its source. */
export function demoCredits(source: DemoAboutSource): Credit[] {
  const credits = new Map<string, Credit>();
  const add = (credit: Credit): void => { if (!credits.has(credit.text)) credits.set(credit.text, credit); };
  if (source.credits !== undefined) creditLines(source.credits).forEach(add);
  for (const licence of pictureLicences(source.scene, source.data)) add({ text: licence.attribution ?? `${licence.source}, ${licence.licence}`, url: licence.url });
  return [...credits.values()];
}

/** The demo's About: its label as the title (the product name when it declares none), its short label when that differs, and its credits. */
export function demoAbout(source: DemoAboutSource): AboutInput {
  const title = source.label === undefined || source.label.trim() === "" ? PAGE_TITLE : source.label;
  const shortTitle = source.shortLabel !== undefined && source.shortLabel !== title ? source.shortLabel : undefined;
  return { title, ...(shortTitle === undefined ? {} : { shortTitle }), credits: demoCredits(source) };
}
