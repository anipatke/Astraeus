// O-048 T-204 (I-117): the renderer uses a logarithmic depth buffer, and every custom shader in src/app carries the log-depth chunks.
import { describe, expect, it } from "vitest";
import { PerspectiveCamera } from "three";
import { Scene, earth, sun } from "astraeus";
import { solarSystemScale } from "../src/core/scalePolicy";
import { cameraReachOf } from "../src/app/experienceDefinition";
import { createOrbitCameraState, poseCamera } from "../src/app/CameraController";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { focusRadius, liveReach, scaleLength } from "../src/app/sceneFraming";
import { solarSystemPolicyForTest } from "./scalePolicies";

const sources = import.meta.glob("../src/app/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*/g, "$1");
const AU_KM = 149_597_870.7;

/** Files whose custom shader materials may omit the log-depth chunks, each with the reason. */
const ALLOWED: Record<string, string> = {
  "SkyView.ts": "both sky materials are drawn with depthTest and depthWrite off, so they never touch depth",
};

describe("logarithmic depth buffer", () => {
  it("the Canvas asks for it, engine-wide", () => {
    expect(code(sources["../src/app/AstraeusScene.tsx"])).toMatch(/gl=\{\{[^}]*logarithmicDepthBuffer:\s*true/);
  });

  it("every ShaderMaterial in src/app carries the log-depth chunks, or is allowlisted with a reason and draws without depth", () => {
    const offenders: string[] = [];
    for (const [path, source] of Object.entries(sources)) {
      const text = code(source);
      const count = (text.match(/new\s+(Raw)?ShaderMaterial\s*\(/g) ?? []).length;
      if (count === 0) continue;
      const file = path.split("/").pop()!;
      if (file in ALLOWED) {
        // Every material in an allowlisted file must really be drawn without a depth test.
        if ((text.match(/depthTest:\s*false/g) ?? []).length < count) offenders.push(`${file}: allowlisted but a material tests depth`);
        continue;
      }
      for (const chunk of ["logdepthbuf_pars_vertex", "logdepthbuf_vertex", "logdepthbuf_pars_fragment", "logdepthbuf_fragment"]) {
        if (!new RegExp(`#include <${chunk}>`).test(text)) offenders.push(`${file}: missing ${chunk}`);
      }
      if (/\bRawShaderMaterial\b/.test(text)) offenders.push(`${file}: RawShaderMaterial does not get the chunks`);
    }
    expect(offenders).toEqual([]);
  });

  it("the patched stock-material shaders keep the built-in chunks", () => {
    for (const file of ["PointsView.ts", "KeplerPoints.ts"]) {
      const text = code(sources[`../src/app/${file}`]);
      expect(text).toContain("dotMaterial(");
      expect(text).not.toMatch(/vertexShader\s*=\s*`/);
    }
  });
});

describe("the depth set-up of the I-117 scene (Sun-centred, 170 AU path, camera 0.01 AU from Saturn)", () => {
  it("has near 0.1 x the gap and a far plane over the whole path, drawn with the logarithmic buffer", () => {
    const policy = solarSystemPolicyForTest({ earth: 60 });
    const samples = [0, 1].map((i) => ({ time: Date.UTC(1977, 0, 1) + i * 86_400_000 * 365 * 100, positionKm: [170 * AU_KM * i, 0, 0] }));
    const definition = new Scene().addBody(sun).addBody(earth, { enlarge: 60 }).setTime(samples[0]!.time).addTrajectory({ id: "far", center: "sun", samples, lineFixedTo: "sun" }).setScale(solarSystemScale).toDefinition();
    const reach = liveReach(cameraReachOf(definition), policy, 1.6);
    const gap = scaleLength(policy, 0.01 * AU_KM);
    const radius = focusRadius("saturn", policy);
    const camera = new PerspectiveCamera(45, 1.6);
    poseCamera(camera, createOrbitCameraState(gap, "saturn"), radius, new FloatingOrigin(), reach.far);
    // A linear 24-bit buffer resolves about z^2 / (near x 2^24) at distance z, which grows with the square of z (the step is far coarser for anything much beyond the focus); log depth resolves a constant fraction of z.
    const linearStepAt = (z: number) => (z * z) / (camera.near * 2 ** 24);
    console.info(`I-117 depth set-up: near=${camera.near} far=${camera.far} mode=logarithmic gap=${gap} saturnRadius=${radius} linearStep(gap)=${linearStepAt(gap)} linearStep(1e5)=${linearStepAt(1e5)}`);
    expect(camera.near).toBeCloseTo(Math.max(1e-3, 0.1 * (gap - radius)), 12);
    expect(camera.far).toBeGreaterThan(2 * scaleLength(policy, 170 * AU_KM));
    expect(camera.far / camera.near).toBeGreaterThan(1e6);
  });
});
