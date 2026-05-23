import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { GiftState } from '../App'

interface Props {
  state: GiftState
  onOpen: () => void
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

const BOX_COLOR    = '#d63031'
const LID_COLOR    = '#b71c1c'
const RIBBON_COLOR = '#fdcb6e'
const BOW_COLOR    = '#e17055'

export default function GiftBox({ state, onOpen }: Props) {
  const groupRef     = useRef<THREE.Group>(null)
  const lidGroupRef  = useRef<THREE.Group>(null)
  const innerLightRef = useRef<THREE.PointLight>(null)
  const openProgress  = useRef(0)
  const [hovered, setHovered] = useState(false)

  useFrame((state_r3f, delta) => {
    const time = state_r3f.clock.getElapsedTime()

    if (groupRef.current) {
      if (state === 'closed') {
        groupRef.current.rotation.y += delta * 0.25
        groupRef.current.position.y = Math.sin(time * 1.5) * 0.08
        const targetScale = hovered ? 1.08 : 1.0
        const s = groupRef.current.scale.x + (targetScale - groupRef.current.scale.x) * 0.12
        groupRef.current.scale.setScalar(s)
      }
    }

    if (state === 'opening' || state === 'opened') {
      openProgress.current = Math.min(openProgress.current + delta / 1.0, 1)
    }

    if (lidGroupRef.current) {
      const t = easeOutCubic(openProgress.current)
      lidGroupRef.current.rotation.x = -t * (Math.PI * 0.68)
    }

    if (innerLightRef.current) {
      innerLightRef.current.intensity = easeOutCubic(openProgress.current) * 5
    }
  })

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    if (state === 'closed') onOpen()
  }

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* ── Box body ── */}
      <mesh>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color={BOX_COLOR} roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Body ribbon — vertical */}
      <mesh>
        <boxGeometry args={[0.22, 1.52, 2.02]} />
        <meshStandardMaterial color={RIBBON_COLOR} roughness={0.25} metalness={0.2} />
      </mesh>

      {/* Body ribbon — horizontal */}
      <mesh>
        <boxGeometry args={[2.02, 1.52, 0.22]} />
        <meshStandardMaterial color={RIBBON_COLOR} roughness={0.25} metalness={0.2} />
      </mesh>

      {/* Inner glow on open */}
      <pointLight
        ref={innerLightRef}
        position={[0, 0.4, 0]}
        color="#ffaa33"
        intensity={0}
        distance={8}
        decay={2}
      />

      {/* ── Lid group — pivot at back-center top edge ── */}
      {/* position=[0, 0.75, -1] puts the hinge at back edge of box top */}
      <group ref={lidGroupRef} position={[0, 0.75, -1]}>
        {/* Lid panel (centered at 0.15 up, 1.0 forward from hinge) */}
        <mesh position={[0, 0.15, 1]}>
          <boxGeometry args={[2.1, 0.3, 2.1]} />
          <meshStandardMaterial color={LID_COLOR} roughness={0.4} metalness={0.05} />
        </mesh>

        {/* Lid ribbon — vertical */}
        <mesh position={[0, 0.15, 1]}>
          <boxGeometry args={[0.22, 0.32, 2.12]} />
          <meshStandardMaterial color={RIBBON_COLOR} roughness={0.25} metalness={0.2} />
        </mesh>

        {/* Lid ribbon — horizontal */}
        <mesh position={[0, 0.15, 1]}>
          <boxGeometry args={[2.12, 0.32, 0.22]} />
          <meshStandardMaterial color={RIBBON_COLOR} roughness={0.25} metalness={0.2} />
        </mesh>

        {/* ── Bow ── */}
        <group position={[0, 0.45, 1]}>
          {/* Left loop */}
          <mesh position={[-0.22, 0.1, 0]} rotation={[Math.PI / 2, 0, -0.4]}>
            <torusGeometry args={[0.14, 0.05, 8, 14]} />
            <meshStandardMaterial color={BOW_COLOR} roughness={0.3} metalness={0.1} />
          </mesh>
          {/* Right loop */}
          <mesh position={[0.22, 0.1, 0]} rotation={[Math.PI / 2, 0, 0.4]}>
            <torusGeometry args={[0.14, 0.05, 8, 14]} />
            <meshStandardMaterial color={BOW_COLOR} roughness={0.3} metalness={0.1} />
          </mesh>
          {/* Center knot */}
          <mesh>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color={BOW_COLOR} roughness={0.3} metalness={0.1} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
