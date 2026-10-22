// The meteor stream must be drawn (I-071, C-098): a showers view whose stream failed to load still mounts the Sun, Earth, planets and path lines, so "anything drawn" is not enough.
// `dots` is the scene's own readout (`ui.sceneDotsInView`): point group members in view. Throws, naming the view, when there are none.
export function assertStreamDrawn(dots, label) {
  if (!(dots > 0)) throw new Error(`${label}: the meteor stream is not drawn (${dots} dots in view)`);
  return dots;
}
