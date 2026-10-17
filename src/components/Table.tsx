import { useMemo } from 'react'
import * as THREE from 'three'

// テーブルクロス上面の Y 座標
export const TABLE_TOP_Y = -1.93

// 放射グラデーションの接地影テクスチャ（影マップを使えないスマホでも接地感を出す）
function makeBlobTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(0,0,0,1)')
  grad.addColorStop(0.55, 'rgba(0,0,0,0.55)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

// 布の織り目（ノーマルマップ）
function makeLinenNormal() {
  const size = 64
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = Math.sin((x / size) * Math.PI * 16) * 0.35
      const ny = Math.sin((y / size) * Math.PI * 16) * 0.35
      const v = new THREE.Vector3(nx, ny, 1).normalize()
      const o = (y * size + x) * 4
      data[o] = (v.x * 0.5 + 0.5) * 255
      data[o + 1] = (v.y * 0.5 + 0.5) * 255
      data[o + 2] = (v.z * 0.5 + 0.5) * 255
      data[o + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(60, 60)
  tex.needsUpdate = true
  return tex
}

export const BLOB_SHADOWS: Array<{ x: number; z: number; size: number; opacity: number }> = [
  { x: 0, z: 0, size: 4.4, opacity: 0.7 },
]

export default function Table() {
  const { blob, linen } = useMemo(() => ({ blob: makeBlobTexture(), linen: makeLinenNormal() }), [])

  return (
    <group position={[0, TABLE_TOP_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#d8cdbb"
          roughness={0.95}
          normalMap={linen}
          normalScale={new THREE.Vector2(0.25, 0.25)}
        />
      </mesh>

      {BLOB_SHADOWS.map((b, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[b.x, 0.002, b.z]} renderOrder={-1}>
          <planeGeometry args={[b.size, b.size]} />
          <meshBasicMaterial map={blob} transparent opacity={b.opacity} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

export function GiftShadow({ size }: { size: number }) {
  const blob = useMemo(() => makeBlobTexture(), [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={blob} transparent opacity={0.55} depthWrite={false} />
    </mesh>
  )
}
