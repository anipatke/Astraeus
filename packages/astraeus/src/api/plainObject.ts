/**
 * Whether `value` is a plain object, as an options or look argument must be: made by a literal, `Object.create(null)` or JSON, from any realm.
 * Arrays, a `Map`, a `Date`, a class instance and every other object with its own prototype chain are not (I-183: a `Map` read as `{}` used to pass as an empty look).
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === null || Object.getPrototypeOf(proto) === null;
}
