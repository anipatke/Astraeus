import { MAX_BODY_SET_FAMILIES } from "../core/bodySetFamilies";
import { listedMoon } from "../core/bodies/listedMoons";
import type { BodySetFamilyInput, BodySetInput, BodySetMemberInput } from "./bodySetInput";
import { SceneError } from "./errors";
import { toUtcMs } from "./time";

const HEX = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
const ELEMENT_KEYS = ["semiMajorAxisKm", "eccentricity", "inclinationDeg", "raanDeg", "argumentOfPeriapsisDeg", "trueAnomalyDeg"] as const;

/** The `bad-body-set` error for a set, naming the call and the set. */
export const bad = (id: unknown, message: string): SceneError => new SceneError("bad-body-set", `addBodySet("${String(id)}"): ${message}`);
/** The id of a body given as a reference or an id. */
export const idOf = (ref: string | { readonly id: string }): string => (typeof ref === "string" ? ref : ref?.id);

const isText = (value: unknown): value is string => typeof value === "string" && value !== "";
const isPositive = (value: unknown): boolean => typeof value === "number" && Number.isFinite(value) && value > 0;
const isTexts = (value: unknown): boolean => Array.isArray(value) && value.every(isText);

/** Checks one family's id, label, colour and brightness. */
function checkFamily(id: string, family: BodySetFamilyInput, seen: Set<string>): void {
  if (!isText(family?.id)) throw bad(id, "every family needs a non-empty id");
  if (seen.has(family.id)) throw bad(id, `family "${family.id}" appears twice`);
  seen.add(family.id);
  if (!isText(family.label)) throw bad(id, `family "${family.id}" needs a label`);
  if (family.color !== undefined && !(typeof family.color === "string" && HEX.test(family.color))) throw bad(id, `family "${family.id}": color "${String(family.color)}" is not a hex colour such as "#9de3a8"`);
  if (family.brightness !== undefined && !isPositive(family.brightness)) throw bad(id, `family "${family.id}": brightness must be above 0`);
}

/** Checks a member's card words: listed flag, facts, known limits, label and radius. */
function checkMemberCard(id: string, member: BodySetMemberInput): void {
  const at = `member "${member.id}"`;
  if (member.listed !== undefined && typeof member.listed !== "boolean") throw bad(id, `${at}: listed must be true or false`);
  const facts = member.facts;
  if (facts !== undefined && !(Array.isArray(facts) && facts.every((fact) => isText(fact?.label) && isText(fact.value)))) throw bad(id, `${at}: facts must be a list of { label, value } with both texts non-empty`);
  if (member.knownLimitations !== undefined && !isTexts(member.knownLimitations)) throw bad(id, `${at}: knownLimitations must be a list of non-empty texts`);
  if (member.label !== undefined && !isText(member.label)) throw bad(id, `${at}: label must be a non-empty text`);
  if (member.radiusKm !== undefined && !isPositive(member.radiusKm)) throw bad(id, `${at}: radiusKm must be above 0`);
}

/** Checks the elements of a made-up member: finite numbers, a bound orbit, a known plane and a valid moment. */
function checkElements(id: string, member: BodySetMemberInput): void {
  const at = `member "${member.id}"`;
  const elements = member.elements!;
  if (member.label === undefined || member.radiusKm === undefined) throw bad(id, `${at} has elements, so it needs a label and a radiusKm`);
  for (const key of ELEMENT_KEYS) if (!(typeof elements[key] === "number" && Number.isFinite(elements[key]))) throw bad(id, `${at}: elements.${key} must be a finite number`);
  if (!(elements.semiMajorAxisKm > 0)) throw bad(id, `${at}: elements.semiMajorAxisKm must be above 0`);
  if (!(elements.eccentricity >= 0 && elements.eccentricity < 1)) throw bad(id, `${at}: elements.eccentricity must be at least 0 and below 1`);
  if (!(elements.inclinationDeg >= 0 && elements.inclinationDeg <= 180)) throw bad(id, `${at}: elements.inclinationDeg must be from 0 to 180`);
  if (elements.plane !== undefined && elements.plane !== "ecliptic-j2000" && elements.plane !== "EQJ") throw bad(id, `${at}: elements.plane "${String(elements.plane)}" is not "ecliptic-j2000" or "EQJ"`);
  if (elements.time !== undefined) toUtcMs(elements.time, `addBodySet("${id}") member "${member.id}" elements.time`);
}

/** Checks one member and says which kind it is: a listed moon (no elements) or a made-up one. */
function checkMember(id: string, member: BodySetMemberInput, families: ReadonlySet<string>): "listed" | "elements" {
  if (!isText(member?.id)) throw bad(id, "every member needs a non-empty id");
  if (!families.has(member.family)) throw bad(id, `member "${member.id}" is in family "${String(member.family)}", which the set does not list`);
  checkMemberCard(id, member);
  if (member.elements === undefined) {
    if (listedMoon(member.id) === undefined) throw bad(id, `member "${member.id}" has no elements and is not a listed moon (listedMoons(planet) names them); give it \`elements\``);
    return "listed";
  }
  checkElements(id, member);
  return "elements";
}

/** Checks the bodies, centre gravity, history and balance point a set was given. */
function checkExtras(id: string, input: BodySetInput, families: ReadonlySet<string>): void {
  const bodies = input.bodies ?? [];
  if (!Array.isArray(bodies) || bodies.some((body) => !isText(idOf(body?.id)) || !families.has(body.family))) throw bad(id, "bodies must be a list of { id, family } with a family the set lists");
  if (new Set(bodies.map((body) => idOf(body.id))).size !== bodies.length) throw bad(id, "a body appears twice in bodies");
  if (input.centerGmKm3S2 !== undefined && !isPositive(input.centerGmKm3S2)) throw bad(id, "centerGmKm3S2 must be above 0");
  if (input.orbitHistoryMs !== undefined && !(Number.isFinite(input.orbitHistoryMs) && input.orbitHistoryMs >= 0)) throw bad(id, "orbitHistoryMs must be 0 or above");
  const balance = input.balancePoint;
  if (balance !== undefined && !(isText(idOf(balance?.body)) && isPositive(balance.gmKm3S2))) throw bad(id, "balancePoint needs a body and a gmKm3S2 above 0");
}

/** Checks what can be checked before the scene is complete, and says whether the members are listed moons or made-up ones. */
export function checkInput(input: BodySetInput): "listed" | "elements" {
  const id = input?.id;
  if (!isText(id)) throw bad(id, "the set needs a non-empty id");
  const { families, members } = input;
  if (!Array.isArray(families) || families.length === 0 || families.length > MAX_BODY_SET_FAMILIES) throw bad(id, `the set needs 1 to ${MAX_BODY_SET_FAMILIES} families`);
  const familyIds = new Set<string>();
  for (const family of families) checkFamily(id, family, familyIds);
  if (!Array.isArray(members) || members.length === 0) throw bad(id, "the set needs at least one member; the list is empty");
  const kinds = new Set(members.map((member) => checkMember(id, member, familyIds)));
  if (kinds.size > 1) throw bad(id, "its members are a mix of listed moons and made-up ones with elements; a set is one kind or the other");
  if (new Set(members.map((member) => member.id)).size !== members.length) throw bad(id, "a member id appears twice");
  if (members.some((member) => member.id === id)) throw bad(id, "a member cannot have the set's own id");
  if (typeof input.provenance !== "object" || input.provenance === null) throw bad(id, "the set needs a provenance");
  checkExtras(id, input, familyIds);
  return [...kinds][0]!;
}
