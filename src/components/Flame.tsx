import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
uniform float time;
uniform float flicker;
uniform float size;
varying float vY;
varying float vRadial;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec3 pos = position;
  vY = clamp((pos.y + 0.25) / 0.5, 0.0, 1.0);
  vRadial = length(pos.xz);

  float n = noise(vec2(pos.x * 12.0 + time * 2.8, vY * 5.0 + time * 3.2));
  float sway = (n - 0.5) * 0.12 * vY * flicker;
  pos.x += sway;
  pos.z += sway * 0.35;
  pos.xz *= mix(0.7, 1.0, size);
  pos.y = -0.25 + (pos.y + 0.25) * size * mix(0.92, 1.08, flicker);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform vec3 bottomColor;
uniform vec3 middleColor;
uniform vec3 topColor;
uniform float opacity;
varying float vY;
varying float vRadial;

void main() {
  float baseFade = smoothstep(0.0, 0.16, vY);
  float tipFade = 1.0 - smoothstep(0.72, 1.0, vY);
  float radialFade = 1.0 - smoothstep(0.0, 0.095, vRadial);
  float alpha = baseFade * tipFade * mix(0.42, 1.0, radialFade) * opacity;

  if (alpha < 0.01) discard;

  vec3 warm = mix(bottomColor, middleColor, smoothstep(0.0, 0.55, vY));
  vec3 color = mix(warm, topColor, smoothstep(0.58, 1.0, vY));
  gl_FragColor = vec4(color, alpha);
}
`

interface Props {
  extinguish: number
}

function makeUniforms(bottom: string, middle: string, top: string, opacity: number) {
  return {
    time: { value: 0 },
    flicker: { value: 1 },
    size: { value: 1 },
    opacity: { value: opacity },
    bottomColor: { value: new THREE.Color(bottom) },
    middleColor: { value: new THREE.Color(middle) },
    topColor: { value: new THREE.Color(top) },
  }
}

export default function Flame({ extinguish }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const outerMatRef = useRef<THREE.ShaderMaterial>(null)
  const innerMatRef = useRef<THREE.ShaderMaterial>(null)
  const extinguishRef = useRef(extinguish)
  extinguishRef.current = extinguish

  useFrame(({ clock }) => {
    const remaining = Math.max(0, 1 - extinguishRef.current)
    const time = clock.getElapsedTime()
    const flicker = 0.86 + Math.sin(time * 18) * 0.08 + Math.sin(time * 31) * 0.04

    if (groupRef.current) {
      groupRef.current.visible = remaining > 0.02
    }

    for (const mat of [outerMatRef.current, innerMatRef.current]) {
      if (!mat) continue
      mat.uniforms.time.value = time
      mat.uniforms.flicker.value = flicker
      mat.uniforms.size.value = remaining
    }

    if (outerMatRef.current) {
      outerMatRef.current.uniforms.opacity.value = remaining * 0.72
    }
    if (innerMatRef.current) {
      innerMatRef.current.uniforms.opacity.value = remaining * 0.95
    }
  })

  if (extinguish >= 1) return null

  return (
    <group ref={groupRef} position={[0, 0.25, 0]}>
      <mesh>
        <coneGeometry args={[0.105, 0.5, 28, 8, true]} />
        <shaderMaterial
          ref={outerMatRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={makeUniforms('#7a1200', '#ff6a00', '#ffd36a', 0.72)}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, -0.015, 0]} scale={[0.52, 0.82, 0.52]}>
        <coneGeometry args={[0.085, 0.48, 28, 8, true]} />
        <shaderMaterial
          ref={innerMatRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={makeUniforms('#fff7d1', '#ffe66d', '#ff8a00', 0.95)}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
