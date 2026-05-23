import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BALLOON_DATA = [
  { pos: [-3.5,  1.5, -2.5], color: '#ff6b6b', phase: 0.0, speed: 0.7 },
  { pos: [ 3.2,  2.2, -3.0], color: '#4ecdc4', phase: 1.2, speed: 0.9 },
  { pos: [-2.8,  3.0, -3.5], color: '#fdcb6e', phase: 0.5, speed: 0.6 },
  { pos: [ 2.5,  1.0, -2.0], color: '#a29bfe', phase: 2.1, speed: 0.8 },
  { pos: [-1.5,  3.5, -4.0], color: '#fd79a8', phase: 1.7, speed: 1.0 },
  { pos: [ 1.2,  2.8, -3.2], color: '#55efc4', phase: 0.9, speed: 0.75 },
]

function Balloon({ pos, color, phase, speed }: typeof BALLOON_DATA[0]) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.position.y = pos[1] + Math.sin(t * speed + phase) * 0.15
  })

  return (
    <group ref={groupRef} position={pos as [number, number, number]}>
      {/* 風船本体 */}
      <mesh scale={[1, 1.2, 1]}>
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
