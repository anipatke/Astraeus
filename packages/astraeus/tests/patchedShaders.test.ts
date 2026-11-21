// O-085 T-366: the stock three.js point material is patched through `onBeforeCompile` in two places (the blend in PointsView, the Kepler placement in
// KeplerPoints). Each patch is run here against three's own point shader source, so a chunk rename inside the peer range fails this test and not the GPU compile.
import { describe, expect, it } from "vitest";
import {
  ShaderChunk,
  ShaderLib,
  UniformsUtils,
  type BufferGeometry,
  type Material,
  type Points,
  type WebGLProgramParametersWithUniforms,
  type WebGLRenderer,
} from "three";
import type { GroupLayer } from "../src/app/experienceDefinition";
import { KEPLER_ATTRIBUTES_GLSL, KEPLER_BEGIN_VERTEX_GLSL } from "../src/app/keplerShader";
import { PointsView } from "../src/app/PointsView";
import { createOrbitGroup } from "../src/core/orbitGroup";
import { createProvenance } from "../src/core/provenance";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";

const DAY = 86_400_000;
const START = Date.UTC(2030, 0, 1);
const provenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up inside the patched shader tests"],
  accuracy: "None claimed.",
  notes: "Fixture.",
});

/** A made-up two-body group, big enough that the view also builds its shader-placed (Kepler) child. */
function belt(count: number): GroupLayer {
  const group = createOrbitGroup(
    {
      id: "patched",
      count,
      center: "sun",
      plane: "ecliptic-j2000",
      epochUtcMs: START + 100 * DAY,
      provenance,
      seed: 11,
      bounds: { startUtcMs: START, endUtcMs: START + 400 * DAY },
      base: {
        semiMajorAxisKm: 4.2e8,
        eccentricity: 0.15,
        inclinationDeg: 15,
        raanDeg: 100,
        argumentOfPeriapsisDeg: 200,
        trueAnomalyDeg: 90,
      },
      spread: {
        semiMajorAxisKm: 1e8,
        eccentricity: 0.1,
        inclinationDeg: 10,
        raanDeg: 180,
        argumentOfPeriapsisDeg: 180,
        trueAnomalyDeg: 180,
      },
    },
    createOrbTwoBodyAdapter(),
  );
  return {
    group,
    color: "#7fe3c4",
    object: { id: "patched", label: "patched", description: "Made up.", knownLimitations: ["Made up."] },
  };
}

const materialsOf = (view: PointsView) =>
  (view.group.children as Points<BufferGeometry, Material>[]).map((p) => p.material);

interface Row {
  name: string;
  /** Index of the material among the view's drawn parts. */
  part: number;
  uniforms: string[];
  /** What the replacement leaves in the vertex shader, and what it must have removed. */
  inserted: string[];
}

const ROWS: Row[] = [
  {
    name: "PointsView blend (positionTo mixed with position)",
    part: 0,
    uniforms: ["uBlend", "uOffset"],
    inserted: [
      "attribute vec3 positionTo;",
      "uniform float uBlend;",
      "uniform vec3 uOffset;",
      "position + uBlend * (positionTo - position) + uOffset",
    ],
  },
  {
    name: "KeplerPoints placement (the orbit solved in the shader)",
    part: 1,
    uniforms: ["uDt", "uUnitsPerKm", "uOffset"],
    inserted: [KEPLER_ATTRIBUTES_GLSL, KEPLER_BEGIN_VERTEX_GLSL, "keplerKm("],
  },
];

/** The chunks the patched shader must still carry from three. */
const KEPT = ["#include <logdepthbuf_vertex>", "#include <logdepthbuf_pars_vertex>", "#include <project_vertex>"];
const NEEDLES = ["void main() {", "#include <begin_vertex>"];

function patched(row: Row) {
  const view = new PointsView(belt(2500));
  const material = materialsOf(view)[row.part];
  expect(material, "the view draws this part").toBeDefined();
  const shader = {
    vertexShader: ShaderLib.points.vertexShader,
    fragmentShader: ShaderLib.points.fragmentShader,
    uniforms: UniformsUtils.clone(ShaderLib.points.uniforms),
  } as unknown as WebGLProgramParametersWithUniforms;
  material.onBeforeCompile(shader, {} as WebGLRenderer);
  return shader;
}

describe("the patched stock point shaders against three's own source", () => {
  it("three's point vertex shader still holds every needle and every chunk the patches keep", () => {
    for (const text of [...NEEDLES, ...KEPT]) expect(ShaderLib.points.vertexShader, text).toContain(text);
  });

  it.each(ROWS)("$name: every replacement lands, the kept chunks stay, every include resolves", (row) => {
    const shader = patched(row);
    const vertex = shader.vertexShader;
    expect(vertex).not.toBe(ShaderLib.points.vertexShader);
    expect(vertex, "begin_vertex replaced").not.toContain("#include <begin_vertex>");
    for (const text of row.inserted) expect(vertex, text).toContain(text);
    for (const text of KEPT) expect(vertex, text).toContain(text);
    for (const name of row.uniforms) expect(shader.uniforms, name).toHaveProperty(name);
    expect(shader.fragmentShader).toBe(ShaderLib.points.fragmentShader);
    const names = [...vertex.matchAll(/#include <(\w+)>/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(ShaderChunk, `chunk ${name}`).toHaveProperty(name);
  });
});
