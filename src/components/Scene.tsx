import { memo, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import BirthdayCake from './BirthdayCake'
import Table from './Table'
import Balloons from './Balloons'
import GiftBoxes from './GiftBoxes'
import Bunting from './Bunting'
import { blowState, DARK_PAUSE_SEC, nowSec } from '../state/blowState'

const DARK_BG = new THREE.Color('#070504')
const ROOM_BG = new THREE.Color('#1d1510')

// 部屋の明かり。ろうそくが主光源で、消火→暗転→点灯の流れで room が 0 → 1 になる
function Lighting() {
  const { scene } = useThree()
  const roomHemiRef = useRef<THREE.HemisphereLight>(null)
  const roomKeyRef = useRef<THREE.DirectionalLight>(null)
  const bg = useMemo(() => DARK_BG.clone(), [])
  const fog = useMemo(() => new THREE.Fog(DARK_BG.clone(), 9, 22), [])

  useFrame((_, dt) => {
    const sinceBlown = blowState.blownAt < 0 ? -1 : nowSec() - blowState.blownAt
    const target = sinceBlown >= DARK_PAUSE_SEC ? 1 : 0
    blowState.room = THREE.MathUtils.damp(blowState.room, target, target ? 2.2 : 6, dt)
    const room = blowState.room

    if (roomHemiRef.current) roomHemiRef.current.intensity = room * 1.1
    if (roomKeyRef.current) roomKeyRef.current.intensity = room * 1.4
    bg.lerpColors(DARK_BG, ROOM_BG, room)
    fog.color.copy(bg)
    scene.environmentIntensity = 0.12 + room * 0.45
  })

  return (
    <>
      <primitive object={bg} attach="background" />
      <primitive object={fog} attach="fog" />

      {/* 暗い部屋のごく弱い環境光と、窓からの青い月明かり（輪郭を出す） */}
      <hemisphereLight args={['#3a2f3e', '#0c0806', 0.9]} />
      <directionalLight position={[-4, 3.5, -5]} intensity={0.45} color="#7f8fc4" />

      {/* 部屋の照明（消火後に点灯） */}
      <hemisphereLight ref={roomHemiRef} args={['#fff0dc', '#3a2a20', 0]} />
      <directionalLight ref={roomKeyRef} position={[2.5, 7, 4]} intensity={0} color="#fff3e2" />

      {/* 映り込み用の簡易環境マップ（外部 HDR を読み込まない） */}
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2} color="#ffe6c8" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffb070" position={[3, 1.5, 4]} scale={[3, 2, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#8090c0" position={[-4, 2, -4]} scale={[3, 3, 1]} />
      </Environment>
    </>
  )
}

// 画角に合わせてケーキ全体が収まる距離を求め、ゆっくり漂わせる
const TARGET = new THREE.Vector3(0, -0.45, 0)
const FIT_WIDTH = 4.6
const FIT_HEIGHT = 4.4

function CameraRig() {
  const { camera, size } = useThree()
  const desired = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const fov = aspect < 1 ? 48 : 36
    if (cam.fov !== fov) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }

    const vHalf = THREE.MathUtils.degToRad(fov / 2)
    const hHalf = Math.atan(Math.tan(vHalf) * aspect)
    let dist = Math.max(FIT_HEIGHT / 2 / Math.tan(vHalf), FIT_WIDTH / 2 / Math.tan(hHalf))
    // 吹いている間は少し寄る。部屋が明るくなったら少し引く
    dist *= 1 - 0.07 * blowState.blow + 0.05 * blowState.room

    const t = state.clock.elapsedTime
    const az = state.pointer.x * 0.07 + Math.sin(t * 0.13) * 0.035
    const el = 0.3 + state.pointer.y * 0.03 + Math.sin(t * 0.17) * 0.012
    desired.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist).add(TARGET)

    cam.position.lerp(desired, 1 - Math.exp(-dt * 2.5))
    cam.lookAt(TARGET)

    const fog = state.scene.fog as THREE.Fog | null
    if (fog) {
      fog.near = dist + 1.5
      fog.far = dist + 14
    }
  })

  return null
}

// 背景のボケた暖色の灯り。部屋を作り込まずに奥行きを出す
const bokehVertex = /* glsl */ `
attribute vec3 aCenter;
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
varying vec2 vUv;
varying vec3 vColor;
varying float vPhase;
void main() {
  vUv = uv;
  vColor = aColor;
  vPhase = aPhase;
  vec4 view = modelViewMatrix * vec4(aCenter, 1.0);
  view.xy += position.xy * aSize;
  gl_Position = projectionMatrix * view;
}
`

const bokehFragment = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;
varying vec3 vColor;
varying float vPhase;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float disc = smoothstep(1.0, 0.86, d) * (0.55 + 0.45 * smoothstep(0.45, 0.95, d));
  float twinkle = 0.8 + 0.2 * sin(uTime * 0.7 + vPhase * 6.28);
  vec3 color = vColor * disc * uIntensity * twinkle;
  if (disc < 0.01) discard;
  gl_FragColor = vec4(color, 1.0);
}
`

function Bokeh() {
  const { geo, mat } = useMemo(() => {
    const n = 46
    const centers = new Float32Array(n * 3)
    const sizes = new Float32Array(n)
    const phases = new Float32Array(n)
    const colors = new Float32Array(n * 3)
    const palette = ['#ffb35c', '#ff9a4a', '#ffd08a', '#ffc7a0', '#c9b3ff']
    const c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      const r = (k: number) => {
        const x = Math.sin((i + 1) * (k * 12.9898 + 78.233)) * 43758.5453
        return x - Math.floor(x)
      }
      centers.set([(r(1) - 0.5) * 26, -0.5 + r(2) * 6, -9 - r(3) * 7], i * 3)
      sizes[i] = 0.35 + r(4) * 0.9
      phases[i] = r(5)
      c.set(palette[Math.floor(r(6) * palette.length)])
      colors.set([c.r, c.g, c.b], i * 3)
    }
    const plane = new THREE.PlaneGeometry(1, 1)
    const geo = new THREE.InstancedBufferGeometry()
    geo.index = plane.index
    geo.setAttribute('position', plane.getAttribute('position'))
    geo.setAttribute('uv', plane.getAttribute('uv'))
    geo.setAttribute('aCenter', new THREE.InstancedBufferAttribute(centers, 3))
    geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizes, 1))
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1))
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3))
    geo.instanceCount = n
    const mat = new THREE.ShaderMaterial({
      vertexShader: bokehVertex,
      fragmentShader: bokehFragment,
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 0.22 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geo, mat }
  }, [])

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime
    mat.uniforms.uIntensity.value = 0.22 * (1 - blowState.room * 0.5)
  })

  return <mesh geometry={geo} material={mat} frustumCulled={false} />
}

interface Props {
  candleCount?: number
  shadows: boolean
}

function Scene({ candleCount, shadows }: Props) {
  return (
    <>
      <Lighting />
      <CameraRig />
      <Bokeh />

      <Table />
      <BirthdayCake candleCount={candleCount} castShadows={shadows} />
      <Balloons />
      <GiftBoxes />
      <Bunting />
    </>
  )
}

// App は長押しの進捗表示のため毎フレーム再レンダーされるので、Scene は props 変化時のみ描き直す
export default memo(Scene)
