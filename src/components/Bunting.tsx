import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const FLAG_COLORS = ['#ff6b6b', '#4ecdc4', '#fdcb6e', '#ff85c0', '#a29bfe', '#55efc4']

interface GarlandConfig {
  start: [number, number, number]
  end: [number, number, number]
  sagY: number
  flags: number
}

const GARLANDS: GarlandConfig[] = [
  { start: [-4.2, 2.7, -3.2], end: [4.2, 2.7, -3.2], sagY: 1.75, flags: 11 },
  { start: [-3.4, 3.4, -4.2], end: [3.4, 3.4, -4.2], sagY: 2.6, flags: 9 },
]

function Garland({ start, end, sagY, flags }: GarlandConfig) {
  const { tubeGeometry, flagPoints } = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3((start[0] + end[0]) / 2, sagY, (start[2] + end[2]) / 2),
      new THREE.Vector3(...end),
    )
    const tube = new THREE.TubeGeometry(curve, 32, 0.012, 4, false)
    const points: THREE.Vector3[] = []
    for (let i = 0; i < flags; i++) {
      points.push(curve.getPoint((i + 0.5) / flags))
    }
    return { tubeGeometry: tube, flagPoints: points }
  }, [start, end, sagY, flags])

  const flagGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.14, 0)
    shape.lineTo(0.14, 0)
    shape.lineTo(0, -0.32)
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [])

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial color="#f5f0ff" emissive="#f5f0ff" emissiveIntensity={0.15} roughness={0.8} />
      </mesh>
      {flagPoints.map((p, i) => (
        <mesh key={i} geometry={flagGeometry} position={[p.x, p.y - 0.02, p.z]}>
          <meshStandardMaterial
            color={FLAG_COLORS[i % FLAG_COLORS.length]}
            emissive={FLAG_COLORS[i % FLAG_COLORS.length]}
            emissiveIntensity={0.2}
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// ケーキ後方のフラッグガーランド（旗飾り）
export default function Bunting() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.02
  })

  return (
    <group ref={groupRef}>
      {GARLANDS.map((g, i) => (
        <Garland key={i} {...g} />
      ))}
    </group>
  )
}
