import { useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { fireMiniConfetti } from '../hooks/useConfetti'
import * as audio from '../audio/audioManager'

const BALLOON_DATA = [
  { pos: [-3.5,  1.5, -2.5], color: '#ff6b6b', phase: 0.0, speed: 0.7 },
  { pos: [ 3.2,  2.2, -3.0], color: '#4ecdc4', phase: 1.2, speed: 0.9 },
  { pos: [-2.8,  3.0, -3.5], color: '#fdcb6e', phase: 0.5, speed: 0.6 },
  { pos: [ 2.5,  1.0, -2.0], color: '#a29bfe', phase: 2.1, speed: 0.8 },
  { pos: [-1.5,  3.5, -4.0], color: '#fd79a8', phase: 1.7, speed: 1.0 },
  { pos: [ 1.2,  2.8, -3.2], color: '#55efc4', phase: 0.9, speed: 0.75 },
]

const POP_DURATION = 0.08
const HIDDEN_DURATION = 7
const RESPAWN_DURATION = 1.5

type BalloonMode = 'floating' | 'popping' | 'hidden' | 'respawning'

const tmpVec = new THREE.Vector3()

function Balloon({ pos, color, phase, speed }: typeof BALLOON_DATA[0]) {
  const groupRef = useRef<THREE.Group>(null)
  const modeRef = useRef<BalloonMode>('floating')
  const modeStartRef = useRef(0)
  const { camera } = useThree()

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const t = clock.getElapsedTime()
    if (Number.isNaN(modeStartRef.current)) modeStartRef.current = t
    const elapsed = t - modeStartRef.current

    switch (modeRef.current) {
      case 'floating':
        group.position.y = pos[1] + Math.sin(t * speed + phase) * 0.15
        break
      case 'popping': {
        const k = Math.min(elapsed / POP_DURATION, 1)
        group.scale.setScalar(1 + k * 0.35)
        if (k >= 1) {
          group.visible = false
          modeRef.current = 'hidden'
          modeStartRef.current = t
        }
        break
      }
      case 'hidden':
        if (elapsed >= HIDDEN_DURATION) {
          group.visible = true
          group.scale.setScalar(0)
          modeRef.current = 'respawning'
          modeStartRef.current = t
        }
        break
      case 'respawning': {
        const k = Math.min(elapsed / RESPAWN_DURATION, 1)
        // ease-out でふわっと復帰
        const eased = 1 - Math.pow(1 - k, 3)
        group.scale.setScalar(eased)
        group.position.y = pos[1] - 0.3 * (1 - eased) + Math.sin(t * speed + phase) * 0.15 * eased
        if (k >= 1) {
          group.scale.setScalar(1)
          modeRef.current = 'floating'
        }
        break
      }
    }
  })

  const handlePop = (e: ThreeEvent<PointerEvent>) => {
    // 3D内の伝播とDOMバブリングの両方を止める（長押し開始を防ぐ）
    e.stopPropagation()
    e.nativeEvent.stopPropagation()

    if (modeRef.current !== 'floating' || !groupRef.current) return

    audio.unlock()
    audio.playBalloonPop()

    // 風船のスクリーン座標にミニ紙吹雪
    groupRef.current.getWorldPosition(tmpVec).project(camera)
    fireMiniConfetti({ x: (tmpVec.x + 1) / 2, y: (1 - tmpVec.y) / 2 }, color)

    modeRef.current = 'popping'
    // 開始時刻は次の useFrame で clock 基準にセットする
    modeStartRef.current = Number.NaN
  }

  return (
    <group ref={groupRef} position={pos as [number, number, number]}>
      {/* 風船本体 */}
      <mesh scale={[1, 1.2, 1]} onPointerDown={handlePop}>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.35} metalness={0} />
      </mesh>
      {/* ひも */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.8, 4]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} roughness={1} />
      </mesh>
    </group>
  )
}

export default function Balloons() {
  return (
    <group>
      {BALLOON_DATA.map((b, i) => <Balloon key={i} {...b} />)}
    </group>
  )
}
