import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Flame from './Flame'

interface Props {
  position: [number, number, number]
  extinguish: number
  color?: string
  withLight?: boolean
}

export default function Candle({ position, extinguish, color = '#ffeaa7', withLight = true }: Props) {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!lightRef.current) return
    const flicker = 0.86 + Math.sin(clock.getElapsedTime() * 18) * 0.1
    lightRef.current.intensity = Math.max(0, 1 - extinguish) * 1.7 * flicker
  })

  return (
    <group position={position}>
      {/* Body */}
      <mesh>
        <cylinderGeometry args={[0.065, 0.07, 0.5, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.55} />
      </mesh>

      {/* Wick */}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.06, 4]} />
        <meshStandardMaterial color="#2d3436" />
      </mesh>

      {/* Flame + glow — positioned at wick tip */}
      <group position={[0, 0.30, 0]}>
        <Flame extinguish={extinguish} />
        {withLight && (
          <pointLight
            ref={lightRef}
            color="#ff9922"
            intensity={(1 - extinguish) * 1.7}
            distance={3.5}
            decay={2}
          />
        )}
      </group>
    </group>
  )
}
