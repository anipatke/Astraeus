// The meteor stream must be drawn (I-071, C-098): a showers view whose stream failed to load still mounts the Sun, Earth, planets and path lines, so "anything drawn" is not enough.
// `dots` is the scene's own readout (`ui.sceneDotsInView`): point group members in view. Throws, naming the view, when there are none.
export function assertStreamDrawn(dots, label) {
  if (!(dots > 0)) throw new Error(`${label}: the meteor stream is not drawn (${dots} dots in view)`);
  return dots;
}

// The scene must draw something of its own (O-088 T-403, AH-33): the experience's bodies, dots and paths in view; the sky's stars alone do not count.
// `drawn` is the driver's `ui.sceneDrawsSomething` readout. Throws, naming the view, when all three are zero.
export function assertSceneDrawn(drawn, label) {
  if (drawn.bodies + drawn.dots + drawn.paths === 0)
    throw new Error(`${label}: the scene shows no body, dot or path in view (${JSON.stringify(drawn)})`);
  return drawn;
}
