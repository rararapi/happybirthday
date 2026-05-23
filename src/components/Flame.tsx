import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vert = /* glsl */`
uniform float time;
uniform float extinguish;
varying float vY;

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
  // vY: 0 at base (bottom/wide), 1 at tip (top/narrow)
  vY = clamp((pos.y + 0.225) / 0.45, 0.0, 1.0);

  float n  = noise(vec2(pos.x * 5.0 + time * 3.5, vY * 3.0 + time * 2.0));
  float n2 = noise(vec2(pos.z * 4.0 - time * 2.0, vY * 4.0 + time * 1.5));
  float sway = ((n * 0.6 + n2 * 0.4) - 0.5) * 0.22 * vY * (1.0 - extinguish);

  pos.x += sway;
  pos.z += sway * 0.7;
  pos.y  = pos.y * (1.0 - extinguish * 0.95) - extinguish * 0.18;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const frag = /* glsl */`
uniform float extinguish;
varying float vY;

void main() {
  vec3 c0 = vec3(1.00, 0.95, 0.25);
  vec3 c1 = vec3(1.00, 0.42, 0.02);
  vec3 c2 = vec3(0.65, 0.06, 0.00);

  vec3 color;
  if (vY < 0.5) {
    color = mix(c0, c1, vY * 2.0);
  } else {
    color = mix(c1, c2, (vY - 0.5) * 2.0);
  }

  float alpha = (1.0 - pow(vY, 0.75)) * (1.0 - extinguish);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(color, alpha);
}
`

interface Props {
  extinguish: number
}

export default function Flame({ extinguish }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const extRef = useRef(extinguish)
  extRef.current = extinguish

  useFrame(({ clock }) => {
    if (!matRef.current) return
    matRef.current.uniforms.time.value = clock.getElapsedTime()
    matRef.current.uniforms.extinguish.value = extRef.current
  })

  return (
    // Offset so cone base (y=-0.225) sits at the wick tip (y=0 of this group)
    <mesh position={[0, 0.225, 0]}>
      <coneGeometry args={[0.08, 0.45, 8, 6, true]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={{
          time: { value: 0 },
          extinguish: { value: 0 },
        }}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
