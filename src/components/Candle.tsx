import Flame from './Flame'

interface Props {
  position: [number, number, number]
  extinguish: number
  color?: string
}

export default function Candle({ position, extinguish, color = '#ffeaa7' }: Props) {
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
        <pointLight
          color="#ff9922"
          intensity={(1 - extinguish) * 1.5}
          distance={3}
          decay={2}
        />
      </group>
    </group>
  )
}
