import Candle from './Candle'

interface TierConfig {
  radius: number
  height: number
  color: string
  frostColor: string
  baseY: number
}

const TIERS: TierConfig[] = [
  { radius: 1.45, height: 0.90, color: '#f8b4c8', frostColor: '#fff0f5', baseY: 0.00 },
  { radius: 1.08, height: 0.72, color: '#d4b8e0', frostColor: '#f5f0ff', baseY: 0.90 },
  { radius: 0.78, height: 0.58, color: '#b4e4d4', frostColor: '#f0fff8', baseY: 1.62 },
]

const CANDLE_COLORS = ['#fdcb6e', '#fd79a8', '#74b9ff', '#55efc4', '#a29bfe']

interface CakeTierProps extends TierConfig {}

function CakeTier({ radius, height, color, frostColor, baseY }: CakeTierProps) {
  const centerY = baseY + height / 2
  return (
    <group position={[0, centerY, 0]}>
      {/* Main body */}
      <mesh>
        <cylinderGeometry args={[radius, radius * 1.015, height, 40]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.45} />
      </mesh>

      {/* Frosting cap on top */}
      <mesh position={[0, height / 2 + 0.035, 0]}>
        <cylinderGeometry args={[radius + 0.03, radius + 0.03, 0.07, 40]} />
        <meshStandardMaterial color={frostColor} emissive={frostColor} emissiveIntensity={0.15} roughness={0.25} />
      </mesh>

      {/* Frosting drip ring */}
      <mesh position={[0, height / 2 - 0.02, 0]}>
        <torusGeometry args={[radius + 0.01, 0.045, 6, 40]} />
        <meshStandardMaterial color={frostColor} emissive={frostColor} emissiveIntensity={0.15} roughness={0.25} />
      </mesh>
    </group>
  )
}

interface Props {
  extinguish: number
}

export default function BirthdayCake({ extinguish }: Props) {
  const topTier = TIERS[TIERS.length - 1]
  const cakeTopY = topTier.baseY + topTier.height + 0.12

  // 5 candles: 1 center + 4 in a ring
  const candlePositions: [number, number, number][] = [
    [0, cakeTopY + 0.25, 0],
  ]
  const ringR = topTier.radius * 0.58
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    candlePositions.push([Math.cos(a) * ringR, cakeTopY + 0.25, Math.sin(a) * ringR])
  }

  return (
    <group position={[0, -1.86, 0]}>
      {/* Plate */}
      <mesh position={[0, -0.045, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 0.09, 48]} />
        <meshStandardMaterial color="#f5f5f0" emissive="#f5f5f0" emissiveIntensity={0.12} roughness={0.15} metalness={0.1} />
      </mesh>

      {/* Cake tiers */}
      {TIERS.map((t, i) => <CakeTier key={i} {...t} />)}

      {/* Candles */}
      {candlePositions.map((pos, i) => (
        <Candle
          key={i}
          position={pos}
          extinguish={extinguish}
          color={CANDLE_COLORS[i % CANDLE_COLORS.length]}
        />
      ))}
    </group>
  )
}
