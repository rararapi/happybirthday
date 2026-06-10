interface GiftConfig {
  angle: number
  radius: number
  size: [number, number, number]
  rotY: number
  boxColor: string
  ribbonColor: string
}

const GIFTS: GiftConfig[] = [
  { angle: 35, radius: 2.0, size: [0.46, 0.4, 0.46], rotY: 0.4, boxColor: '#ff6b6b', ribbonColor: '#fdcb6e' },
  { angle: 140, radius: 2.05, size: [0.38, 0.5, 0.38], rotY: -0.3, boxColor: '#4ecdc4', ribbonColor: '#ff85c0' },
  { angle: 215, radius: 1.95, size: [0.5, 0.35, 0.42], rotY: 0.9, boxColor: '#fdcb6e', ribbonColor: '#ff6b6b' },
  { angle: 310, radius: 2.1, size: [0.4, 0.42, 0.4], rotY: -0.7, boxColor: '#a29bfe', ribbonColor: '#55efc4' },
]

function GiftBox({ angle, radius, size, rotY, boxColor, ribbonColor }: GiftConfig) {
  const rad = (angle / 180) * Math.PI
  const [w, h, d] = size
  const ribbonW = 0.07

  return (
    <group
      position={[Math.cos(rad) * radius, h / 2, Math.sin(rad) * radius]}
      rotation={[0, rotY, 0]}
    >
      {/* 箱本体 */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={boxColor} emissive={boxColor} emissiveIntensity={0.15} roughness={0.5} />
      </mesh>

      {/* 交差リボン */}
      <mesh>
        <boxGeometry args={[w * 1.02, h * 1.02, ribbonW]} />
        <meshStandardMaterial color={ribbonColor} emissive={ribbonColor} emissiveIntensity={0.2} roughness={0.4} />
      </mesh>
      <mesh>
        <boxGeometry args={[ribbonW, h * 1.02, d * 1.02]} />
        <meshStandardMaterial color={ribbonColor} emissive={ribbonColor} emissiveIntensity={0.2} roughness={0.4} />
      </mesh>

      {/* リボン結び */}
      <group position={[0, h / 2 + 0.04, 0]}>
        <mesh position={[-0.06, 0, 0]} scale={[1.4, 0.7, 0.9]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshStandardMaterial color={ribbonColor} emissive={ribbonColor} emissiveIntensity={0.2} roughness={0.4} />
        </mesh>
        <mesh position={[0.06, 0, 0]} scale={[1.4, 0.7, 0.9]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshStandardMaterial color={ribbonColor} emissive={ribbonColor} emissiveIntensity={0.2} roughness={0.4} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshStandardMaterial color={ribbonColor} emissive={ribbonColor} emissiveIntensity={0.25} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

// テーブルクロス上（ケーキ皿の外側）に置かれたプレゼント箱
export default function GiftBoxes() {
  return (
    <group position={[0, -1.92, 0]}>
      {GIFTS.map((g, i) => (
        <GiftBox key={i} {...g} />
      ))}
    </group>
  )
}
