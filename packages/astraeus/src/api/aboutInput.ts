import { SceneError } from "./errors";
import { isPlainObject } from "./plainObject";

/** The title and About content (`Scene.setAbout`). The engine adds "Built with Astraeus" and its version. */
export interface AboutInput {
  /** The bar's title. */
  readonly title: string;
  /** Used when the bar is tight (then "i"). */
  readonly shortTitle?: string;
  /** A line of status. */
  readonly status?: string;
  /** Credits; an http(s) `url` adds a Source link. */
  readonly credits?: readonly { readonly text: string; readonly url?: string }[];
  /** Links; `url` is http(s). */
  readonly links?: readonly { readonly text: string; readonly url: string }[];
}


const isText = (value: unknown): value is string => typeof value === "string" && value !== "";
const isWebAddress = (value: unknown): value is string => typeof value === "string" && /^https?:\/\/\S+$/i.test(value);

/** Checks an About and returns a frozen copy of it; throws `bad-about` naming the field. `who` names the call in the message. */
export function checkedAbout(input: AboutInput, who: string): AboutInput {
  const bad = (message: string): SceneError => new SceneError("bad-about", `${who}: ${message}`);
  if (!isPlainObject(input)) throw bad("give an { title, shortTitle?, status?, credits?, links? } object");
  if (!isText(input.title)) throw bad("title must be a non-empty string");
  if (input.shortTitle !== undefined && !isText(input.shortTitle)) throw bad("shortTitle must be a non-empty string when given");
  if (input.status !== undefined && typeof input.status !== "string") throw bad("status must be a string when given");
  if (input.credits !== undefined && !Array.isArray(input.credits)) throw bad("credits must be a list when given");
  if (input.links !== undefined && !Array.isArray(input.links)) throw bad("links must be a list when given");
  const credits = (input.credits ?? []).map((credit, index) => {
    if (!isPlainObject(credit)) throw bad(`credits[${index}] must be a { text, url? } object`);
    if (!isText(credit.text)) throw bad(`credits[${index}].text must be a non-empty string`);
    if (credit.url !== undefined && !isWebAddress(credit.url)) throw bad(`credits[${index}].url must be an http or https address when given`);
    return Object.freeze({ text: credit.text, ...(credit.url === undefined ? {} : { url: credit.url }) });
  });
  const links = (input.links ?? []).map((link, index) => {
    if (!isPlainObject(link)) throw bad(`links[${index}] must be a { text, url } object`);
    if (!isText(link.text)) throw bad(`links[${index}].text must be a non-empty string`);
    if (!isWebAddress(link.url)) throw bad(`links[${index}].url must be an http or https address`);
    return Object.freeze({ text: link.text, url: link.url });
  });
  return Object.freeze({
    title: input.title,
    ...(input.shortTitle === undefined ? {} : { shortTitle: input.shortTitle }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.credits === undefined ? {} : { credits: Object.freeze(credits) }),
    ...(input.links === undefined ? {} : { links: Object.freeze(links) }),
  });
}
