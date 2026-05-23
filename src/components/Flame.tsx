import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
uniform float time;
uniform float height;
uniform float width;
uniform float flicker;
varying vec2 vUv;

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
  vUv = uv;

  float y = uv.y;
  vec3 pos = position;

  float n = noise(vec2(y * 3.0 + time * 2.4, time * 0.7));
  float sway = (n - 0.5) * 0.08 * y * flicker;

  pos.x = pos.x * width + sway;
  pos.y = y * height;
  pos.z = 0.0;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform vec3 baseColor;
uniform vec3 midColor;
uniform vec3 tipColor;
uniform float opacity;
varying vec2 vUv;

void main() {
  float x = abs(vUv.x - 0.5) * 2.0;
  float y = vUv.y;

  float body = pow(sin(y * 3.14159265), 0.55) * (1.0 - y * 0.28);
  float edge = smoothstep(body + 0.16, body - 0.04, x);
  float baseFade = smoothstep(0.0, 0.08, y);
  float tipFade = 1.0 - smoothstep(0.78, 1.0, y);
  float alpha = edge * baseFade * tipFade * opacity;

  if (alpha < 0.01) discard;

  vec3 lower = mix(baseColor, midColor, smoothstep(0.0, 0.52, y));
  vec3 color = mix(lower, tipColor, smoothstep(0.54, 1.0, y));
  gl_FragColor = vec4(color, alpha);
}
`

interface Props {
  extinguish: number
}

function makeUniforms(base: string, mid: string, tip: string, opacity: number) {
  return {
    time: { value: 0 },
    height: { value: 0.54 },
    width: { value: 0.22 },
    flicker: { value: 1 },
    opacity: { value: opacity },
    baseColor: { value: new THREE.Color(base) },
    midColor: { value: new THREE.Color(mid) },
    tipColor: { value: new THREE.Color(tip) },
  }
}

export default function Flame({ extinguish }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const outerMatRefs = useRef<Array<THREE.ShaderMaterial | null>>([])
  const innerMatRefs = useRef<Array<THREE.ShaderMaterial | null>>([])
  const extinguishRef = useRef(extinguish)
  const outerUniforms = useMemo(
    () => [
      makeUniforms('#5f1200', '#ff6a00', '#ffd36a', 0.72),
      makeUniforms('#5f1200', '#ff6a00', '#ffd36a', 0.72),
    ],
    [],
  )
  const innerUniforms = useMemo(
    () => [
      makeUniforms('#fff7d1', '#ffe66d', '#ff8a00', 0.95),
      makeUniforms('#fff7d1', '#ffe66d', '#ff8a00', 0.95),
    ],
    [],
  )
  extinguishRef.current = extinguish

  useFrame(({ clock }) => {
    const remaining = Math.max(0, 1 - extinguishRef.current)
    const time = clock.getElapsedTime()
    const flicker = 0.9 + Math.sin(time * 16) * 0.08 + Math.sin(time * 29) * 0.05
    const height = THREE.MathUtils.lerp(0.035, 0.54, remaining) * flicker
    const width = THREE.MathUtils.lerp(0.012, 0.22, remaining)

    if (groupRef.current) {
      groupRef.current.visible = remaining > 0.015
    }

    outerMatRefs.current.forEach((mat, index) => {
      if (!mat) return
      mat.uniforms.time.value = time + index * 0.16
      mat.uniforms.height.value = height
      mat.uniforms.width.value = width
      mat.uniforms.flicker.value = flicker
      mat.uniforms.opacity.value = remaining * 0.72
    })

    innerMatRefs.current.forEach((mat, index) => {
      if (!mat) return
      mat.uniforms.time.value = time + 0.2 + index * 0.16
      mat.uniforms.height.value = height * 0.78
      mat.uniforms.width.value = width * 0.48
      mat.uniforms.flicker.value = flicker
      mat.uniforms.opacity.value = remaining * 0.95
    })
  })

  if (extinguish >= 1) return null

  return (
    <group ref={groupRef}>
      {[0, Math.PI / 2].map((rotation, index) => (
        <mesh key={`outer-${rotation}`} rotation={[0, rotation, 0]}>
          <planeGeometry args={[1, 1, 18, 28]} />
          <shaderMaterial
            ref={(mat) => {
              outerMatRefs.current[index] = mat
            }}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={outerUniforms[index]}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {[Math.PI / 4, -Math.PI / 4].map((rotation, index) => (
        <mesh key={`inner-${rotation}`} rotation={[0, rotation, 0]}>
          <planeGeometry args={[1, 1, 18, 28]} />
          <shaderMaterial
            ref={(mat) => {
              innerMatRefs.current[index] = mat
            }}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={innerUniforms[index]}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}
