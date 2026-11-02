/** Scenes a viewer has taken. Kept outside `Scene` so the freeze adds nothing to the public surface. */
const mounted = new WeakSet<object>();

/** Freezes a scene: every later edit throws `scene-mounted`. Called once its definition is built. */
export function markMounted(scene: object): void {
  mounted.add(scene);
}

/** Whether a viewer has taken the scene. */
export function isMounted(scene: object): boolean {
  return mounted.has(scene);
}
