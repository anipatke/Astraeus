// Adapted from planetary-explorer src/features/moon/AtmosphereGlow.tsx (owner's donor checkout).
import { useMemo } from "react";
import { AdditiveBlending, BackSide, Color } from "three";

const VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float ndotv = abs(dot(viewDir, normalize(vNormal)));
    float edge = clamp(1.0 - ndotv, 0.0, 1.0);
    float rim = smoothstep(0.72, 0.98, edge);
    float alpha = pow(edge, uPower) * rim * uIntensity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export interface AtmosphereConfig {
  readonly color: string;
  readonly intensity?: number;
  readonly power?: number;
  readonly scale?: number;
}

/** Donor Earth atmosphere parameters (src/entities/earth.ts). */
export const EARTH_ATMOSPHERE: AtmosphereConfig = { color: "#6eaaff", intensity: 0.4, power: 4.5, scale: 1.04 };

export function AtmosphereGlow({ radius, atmosphere, layer }: { radius: number; atmosphere: AtmosphereConfig; layer: number }) {
  const { color, intensity = 0.9, power = 3.5, scale = 1.08 } = atmosphere;
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power },
    }),
    [color, intensity, power],
  );
  return (
    <mesh layers={layer}>
      <sphereGeometry args={[radius * scale, 64, 64]} />
      <shaderMaterial
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={BackSide}
        toneMapped={false}
      />
    </mesh>
  );
}
