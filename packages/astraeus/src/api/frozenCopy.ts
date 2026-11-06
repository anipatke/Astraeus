/** Whether `value` is a plain object (an object literal or one with no prototype), the only objects a copy walks into. */
function isPlain(value: object): boolean {
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * A deep, frozen copy of what a caller handed a `Scene` call (API-04): plain objects, lists, number arrays and dates are copied. Anything that behaves rather than holds data is kept as it is: functions,
 * class instances (built-in bodies, providers) and plain objects with a method (a `stateAt` provider, which may keep state of its own). A later edit of the caller's object, or the same object
 * used for another scene, then changes nothing here.
 */
export function frozenCopy<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  if (value instanceof Date) return Object.freeze(new Date(value.getTime())) as T;
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) return (value as unknown as { slice(): T }).slice();
  if (Array.isArray(value)) return Object.freeze(value.map(frozenCopy)) as T;
  if (!isPlain(value)) return value;
  const entries = Object.entries(value);
  if (entries.some(([, item]) => typeof item === "function")) return value;
  return Object.freeze(Object.fromEntries(entries.map(([key, item]) => [key, frozenCopy(item)]))) as T;
}
