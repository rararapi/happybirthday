import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { blowState } from '../state/blowState'

export type Vec3 = [number, number, number]

// ろうそく本体の中心から芯先端までの高さ
const WICK_TIP = 0.3
const CANDLE_COLORS = ['#f4e2b8', '#f1bccb', '#bcd3ec', '#c3e3d4', '#d6cbee']

// しきい値の幅。extinguish が [threshold - FADE, threshold] を通過する間に炎が縮んで消える
const FADE = 0.08

const NOISE_GLSL = /* glsl */ `
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
`

// インスタンス属性と共通 uniform。ビルボードはビュー空間でオフセットする
const INSTANCE_GLSL = /* glsl */ `
attribute vec3 aTip;
attribute float aPhase;
attribute float aThreshold;
attribute float aOutTime;
uniform float uTime;
uniform float uExtinguish;
uniform float uBlow;
uniform float uRoom;

float flameStrength() {
  return 1.0 - smoothstep(aThreshold - ${FADE.toFixed(2)}, aThreshold, uExtinguish);
}

vec4 billboard(vec3 center, vec2 offset, float towardCamera) {
  vec4 view = modelViewMatrix * vec4(center, 1.0);
  view.xy += offset;
  view.z += towardCamera;
  return projectionMatrix * view;
}
`

const flameVertex = /* glsl */ `
${NOISE_GLSL}
${INSTANCE_GLSL}
uniform float uHeight;
uniform float uWidth;
varying vec2 vUv;
varying float vStrength;

void main() {
  vUv = uv;
  float s = flameStrength();
  vStrength = s;

  float t = uTime + aPhase * 10.0;
  float gust = (noise(vec2(t * 9.0, aPhase * 13.0)) - 0.5) * uBlow;
  float flicker = 0.9 + sin(t * 16.0) * 0.07 + sin(t * 29.0 + aPhase * 6.0) * 0.05 + gust * 0.6;
  // 吹かれると炎は低く寝る
  float h = mix(0.03, uHeight, s) * flicker * (1.0 - 0.3 * uBlow * s);
  float w = mix(0.012, uWidth, s) * (1.0 + 0.25 * uBlow);

  float y = uv.y;
  float n = noise(vec2(y * 3.0 + t * 2.4, t * 0.7));
  float sway = (n - 0.5) * 0.08 * y * (1.0 + uBlow * 3.0);
  // 中央から外側へなびく
  float dir = aTip.x >= 0.0 ? 1.0 : -1.0;
  float lean = dir * uBlow * y * y * 0.16 * (0.7 + 0.3 * sin(t * 6.0));

  vec2 offset = vec2(position.x * w + sway + lean, y * h);
  gl_Position = billboard(aTip, offset, 0.0);
}
`

const flameFragment = /* glsl */ `
uniform vec3 uBaseColor;
uniform vec3 uMidColor;
uniform vec3 uTipColor;
uniform float uOpacity;
varying vec2 vUv;
varying float vStrength;

void main() {
  float x = abs(vUv.x - 0.5) * 2.0;
  float y = vUv.y;
  float body = pow(sin(y * 3.14159265), 0.55) * (1.0 - y * 0.28);
  float edge = smoothstep(body + 0.16, body - 0.04, x);
  float baseFade = smoothstep(0.0, 0.08, y);
  float tipFade = 1.0 - smoothstep(0.78, 1.0, y);
  float alpha = edge * baseFade * tipFade * uOpacity * vStrength;
  if (alpha < 0.01) discard;

  vec3 lower = mix(uBaseColor, uMidColor, smoothstep(0.0, 0.52, y));
  vec3 color = mix(lower, uTipColor, smoothstep(0.54, 1.0, y));
  gl_FragColor = vec4(color, alpha);
}
`

// 炎まわりの光（ブルームの代わり）と、消火後の芯の残り火
const haloVertex = /* glsl */ `
${INSTANCE_GLSL}
uniform float uSize;
varying vec2 vP;
varying float vStrength;
varying float vEmber;

void main() {
  float s = flameStrength();
  vStrength = s;
  float age = uTime - aOutTime;
  vEmber = aOutTime >= 0.0 ? exp(-age * 0.8) * (0.85 + 0.15 * sin(age * 23.0 + aPhase * 40.0)) : 0.0;
  vP = position.xy * uSize;
  // 炎の中心付近に置き、ケーキ面との交差で切れ目が出ないようカメラ側へ寄せる
  gl_Position = billboard(aTip + vec3(0.0, 0.1, 0.0), vP, 0.22);
}
`

const haloFragment = /* glsl */ `
uniform vec3 uGlowColor;
uniform float uGain;
varying vec2 vP;
varying float vStrength;
varying float vEmber;

void main() {
  float r2 = dot(vP, vP);
  float glow = (exp(-r2 * 16.0) * 0.6 + exp(-r2 * 140.0) * 0.5) * vStrength * uGain;
  vec2 q = vP - vec2(0.0, -0.1);
  float ember = exp(-dot(q, q) * 3000.0) * vEmber;
  vec3 color = uGlowColor * glow + vec3(1.0, 0.32, 0.06) * ember * 1.4;
  if (max(color.r, max(color.g, color.b)) < 0.002) discard;
  gl_FragColor = vec4(color, 1.0);
}
`

// 消火後に芯から立ち上る煙
const smokeVertex = /* glsl */ `
${INSTANCE_GLSL}
varying vec2 vUv;
varying float vAge;
varying float vSeed;

const float LIFE = 4.0;

void main() {
  vUv = uv;
  vSeed = aPhase;
  float age = uTime - aOutTime;
  vAge = age;
  if (aOutTime < 0.0 || age > LIFE) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  vec2 offset = vec2(position.x * 0.34, (position.y + 0.5) * 1.3);
  gl_Position = billboard(aTip + vec3(0.0, 0.01, 0.0), offset, 0.0);
}
`

const smokeFragment = /* glsl */ `
${NOISE_GLSL}
uniform float uRoom;
varying vec2 vUv;
varying float vAge;
varying float vSeed;

void main() {
  float y = vUv.y * 1.3;
  float x = (vUv.x - 0.5) * 0.34;

  float head = 1.0 - smoothstep(vAge * 0.5 - 0.2, vAge * 0.5, y);
  float tailStart = max(vAge - 1.0, 0.0) * 0.45;
  float tail = smoothstep(tailStart, tailStart + 0.15, y);

  float curl = (noise(vec2(y * 3.5 - vAge * 1.2, vSeed * 17.0)) - 0.5) * 0.18 * y
             + sin(y * 7.0 - vAge * 2.2 + vSeed * 6.28) * 0.02 * y;
  float width = 0.004 + y * 0.035;
  float d = x - curl;
  float line = exp(-d * d / (width * width));

  float life = 1.0 - smoothstep(1.6, 4.0, vAge);
  float alpha = line * head * tail * life * (1.0 - smoothstep(0.6, 1.25, y)) * 0.5;
  if (alpha < 0.004) discard;

  vec3 color = vec3(0.62, 0.6, 0.58) * (0.7 + 0.3 * uRoom);
  gl_FragColor = vec4(color, alpha);
}
`

function rand(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
  return t * t * (3 - 2 * t)
}

function makeInstancedQuad(
  count: number,
  attrs: Record<string, THREE.InstancedBufferAttribute>,
  segX: number,
  segY: number,
) {
  const plane = new THREE.PlaneGeometry(1, 1, segX, segY)
  const geo = new THREE.InstancedBufferGeometry()
  geo.index = plane.index
  geo.setAttribute('position', plane.getAttribute('position'))
  geo.setAttribute('uv', plane.getAttribute('uv'))
  for (const [name, attr] of Object.entries(attrs)) geo.setAttribute(name, attr)
  geo.instanceCount = count
  return geo
}

interface Props {
  /** ろうそく本体中心の座標（親グループのローカル座標） */
  positions: Vec3[]
  castShadows: boolean
}

export default function Candles({ positions, castShadows }: Props) {
  const count = positions.length
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const wickRef = useRef<THREE.InstancedMesh>(null)
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const bounceRef = useRef<THREE.PointLight>(null)

  const data = useMemo(() => {
    const tips = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const thresholds = new Float32Array(count)
    const outTimes = new Float32Array(count).fill(-1)
    const centroid = new THREE.Vector3()
    let topY = -Infinity

    positions.forEach(([x, y, z], i) => {
      tips.set([x, y + WICK_TIP, z], i * 3)
      phases[i] = rand(i)
      centroid.add(new THREE.Vector3(x, y + WICK_TIP, z))
      topY = Math.max(topY, y + WICK_TIP)
    })
    centroid.divideScalar(Math.max(count, 1))

    // 手前（カメラ側 = z が大きい）から順に消える。少し揺らぎを入れて機械的な順番を避ける
    const order = positions
      .map((p, i) => ({ i, key: p[2] + (rand(i + 99) - 0.5) * 0.6 }))
      .sort((a, b) => b.key - a.key)
    order.forEach(({ i }, rank) => {
      thresholds[i] = count === 1 ? 0.85 : 0.3 + (0.62 * rank) / (count - 1)
    })

    const attrs = {
      aTip: new THREE.InstancedBufferAttribute(tips, 3),
      aPhase: new THREE.InstancedBufferAttribute(phases, 1),
      aThreshold: new THREE.InstancedBufferAttribute(thresholds, 1),
      aOutTime: new THREE.InstancedBufferAttribute(outTimes, 1),
    }
    attrs.aOutTime.setUsage(THREE.DynamicDrawUsage)

    // ろうそく群の上に集約ライトを1灯置く（ろうそくごとの pointLight は使わない）
    const lightPos: Vec3 = [centroid.x * 0.5, Math.max(centroid.y + 0.35, topY - 0.1), centroid.z * 0.5]
    return { thresholds, outTimes, attrs, lightPos }
  }, [positions, count])

  const shared = useMemo(
    () => ({
      uTime: { value: 0 },
      uExtinguish: { value: 0 },
      uBlow: { value: 0 },
      uRoom: { value: 0 },
    }),
    [],
  )

  const parts = useMemo(() => {
    const flameGeo = makeInstancedQuad(count, data.attrs, 6, 16)
    const haloGeo = makeInstancedQuad(count, data.attrs, 1, 1)
    const smokeGeo = makeInstancedQuad(count, data.attrs, 1, 1)

    const flameMat = (height: number, width: number, opacity: number, colors: [string, string, string]) =>
      new THREE.ShaderMaterial({
        vertexShader: flameVertex,
        fragmentShader: flameFragment,
        uniforms: {
          ...shared,
          uHeight: { value: height },
          uWidth: { value: width },
          uOpacity: { value: opacity },
          uBaseColor: { value: new THREE.Color(colors[0]) },
          uMidColor: { value: new THREE.Color(colors[1]) },
          uTipColor: { value: new THREE.Color(colors[2]) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })

    const outer = flameMat(0.36, 0.14, 0.75, ['#5f1200', '#ff6a00', '#ffd36a'])
    const inner = flameMat(0.28, 0.065, 0.95, ['#fff7d1', '#ffe66d', '#ff8a00'])

    const halo = new THREE.ShaderMaterial({
      vertexShader: haloVertex,
      fragmentShader: haloFragment,
      uniforms: {
        ...shared,
        uSize: { value: 0.8 },
        uGain: { value: THREE.MathUtils.clamp(1.2 / Math.sqrt(count), 0.1, 0.55) },
        uGlowColor: { value: new THREE.Color('#ff8a2a') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const smoke = new THREE.ShaderMaterial({
      vertexShader: smokeVertex,
      fragmentShader: smokeFragment,
      uniforms: { ...shared },
      transparent: true,
      depthWrite: false,
    })

    return { flameGeo, haloGeo, smokeGeo, outer, inner, halo, smoke }
  }, [count, data, shared])

  useEffect(() => {
    return () => {
      Object.values(parts).forEach((p) => p.dispose())
    }
  }, [parts])

  useLayoutEffect(() => {
    const body = bodyRef.current
    const wick = wickRef.current
    if (!body || !wick) return
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    positions.forEach(([x, y, z], i) => {
      m.makeRotationY(rand(i + 7) * Math.PI * 2).setPosition(x, y, z)
      body.setMatrixAt(i, m)
      body.setColorAt(i, c.set(CANDLE_COLORS[i % CANDLE_COLORS.length]))
      m.makeTranslation(x, y + 0.27, z)
      wick.setMatrixAt(i, m)
    })
    body.instanceMatrix.needsUpdate = true
    if (body.instanceColor) body.instanceColor.needsUpdate = true
    wick.instanceMatrix.needsUpdate = true
  }, [positions])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const ext = blowState.extinguish
    blowState.blow = THREE.MathUtils.damp(blowState.blow, blowState.blowing ? 1 : 0, blowState.blowing ? 4 : 7, dt)

    shared.uTime.value = t
    shared.uExtinguish.value = ext
    shared.uBlow.value = blowState.blow
    shared.uRoom.value = blowState.room

    // CPU 側でもシェーダーと同じ式で炎の強さを求め、消えた瞬間の時刻を記録する（煙と残り火用）
    let sum = 0
    let changed = false
    for (let i = 0; i < count; i++) {
      const th = data.thresholds[i]
      const s = 1 - smoothstep(th - FADE, th, ext)
      sum += s
      if (s < 0.02 && data.outTimes[i] < 0) {
        data.outTimes[i] = t
        changed = true
      } else if (s > 0.5 && data.outTimes[i] >= 0) {
        data.outTimes[i] = -1
        changed = true
      }
    }
    if (changed) data.attrs.aOutTime.needsUpdate = true

    const flicker =
      0.88 + Math.sin(t * 17) * 0.06 + Math.sin(t * 31.7) * 0.04 + blowState.blow * (Math.random() - 0.5) * 0.35
    if (lightRef.current) lightRef.current.intensity = 2.8 * Math.sqrt(sum) * flicker
    if (bounceRef.current) bounceRef.current.intensity = (2.6 * sum * flicker) / count
    // 炎に照らされたロウの温かみ
    if (bodyMatRef.current) bodyMatRef.current.emissiveIntensity = (0.12 * sum) / count
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]} receiveShadow>
        <cylinderGeometry args={[0.062, 0.066, 0.5, 14]} />
        <meshStandardMaterial ref={bodyMatRef} roughness={0.45} emissive="#ff8a3c" emissiveIntensity={0} />
      </instancedMesh>

      <instancedMesh ref={wickRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.007, 0.009, 0.06, 5]} />
        <meshStandardMaterial color="#1c1612" roughness={0.9} />
      </instancedMesh>

      <mesh geometry={parts.haloGeo} material={parts.halo} frustumCulled={false} renderOrder={1} />
      <mesh geometry={parts.flameGeo} material={parts.outer} frustumCulled={false} renderOrder={2} />
      <mesh geometry={parts.flameGeo} material={parts.inner} frustumCulled={false} renderOrder={3} />
      <mesh geometry={parts.smokeGeo} material={parts.smoke} frustumCulled={false} renderOrder={4} />

      {/* 炎の光がテーブルや壁に回り込んだ柔らかな照り返し（ケーキ正面を照らす） */}
      <pointLight ref={bounceRef} position={[0, 2.0, 3.2]} color="#ff9b55" intensity={0} decay={2} />
      <pointLight
        ref={lightRef}
        position={data.lightPos}
        color="#ff9a4a"
        intensity={0}
        decay={2}
        castShadow={castShadows}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.004}
        shadow-normalBias={0.03}
        shadow-camera-near={0.05}
        shadow-camera-far={10}
      />
    </group>
  )
}
