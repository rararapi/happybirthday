import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { GiftShadow, TABLE_TOP_Y } from './Table'
import { blowState, DARK_PAUSE_SEC, nowSec } from '../state/blowState'
import * as audio from '../audio/audioManager'

type Kind = 'bear' | 'rabbit' | 'chick'

interface CharacterConfig {
  kind: Kind
  x: number
  z: number
  rotY: number
  scale: number
  color: string
  accent: string
  /** 点灯からの登場遅れ（秒） */
  delay: number
  /** 拍手の速さ（回/秒） */
  rate: number
  /** タップしたときの鳴き声の高さ */
  voice: number
}

// ケーキ皿の外側、プレゼント箱の間に立つ
const CHARACTERS: CharacterConfig[] = [
  { kind: 'bear', x: -1.9, z: -0.15, rotY: 0.35, scale: 1.1, color: '#b07a52', accent: '#f1d3b3', delay: 0, rate: 3.1, voice: 0.85 },
  { kind: 'rabbit', x: 1.9, z: -0.2, rotY: -0.35, scale: 1.0, color: '#f6efe8', accent: '#ffb7c5', delay: 0.15, rate: 3.4, voice: 1.2 },
  { kind: 'chick', x: -0.7, z: 2.0, rotY: 0.15, scale: 0.75, color: '#ffd84d', accent: '#ff9f43', delay: 0.3, rate: 3.8, voice: 1.6 },
]

const APPEAR_SEC = 0.55
/** 1回の拍手の長さ（秒）。CYCLE_SEC ごとに繰り返し、合間はバンザイで揺れる */
const CLAP_SEC = 3.6
const CYCLE_SEC = 7
/** タップでジャンプして1回転する時間（秒） */
const TAP_SEC = 0.7

const HEAD_Y = 0.56
const SHOULDER: [number, number, number] = [0.17, 0.34, 0.1]

// 最初の拍手の手が合わさる時刻（部屋の点灯からの秒）。拍手音をこれに合わせる
export function applauseTimes(): number[] {
  const times: number[] = []
  for (const c of CHARACTERS) {
    const start = c.delay + APPEAR_SEC
    for (let k = 0; (k + 0.5) / c.rate < CLAP_SEC; k++) times.push(start + (k + 0.5) / c.rate)
  }
  return times
}

function backOut(k: number) {
  const s = 1.9
  const u = k - 1
  return 1 + (s + 1) * u * u * u + s * u * u
}

// 頭の表面上の点（顔パーツの配置用）
function onHead(hr: number, x: number, y: number, lift = 0.003): [number, number, number] {
  return [x, y, Math.sqrt(Math.max(hr * hr - x * x - y * y, 0)) + lift]
}

function makeMaterials(color: string, accent: string) {
  // ぬいぐるみらしいふんわりした質感（sheen）
  const plush = (c: string) =>
    new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.85, sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffffff') })
  return {
    fur: plush(color),
    accent: plush(accent),
    dark: new THREE.MeshStandardMaterial({ color: '#2b1d16', roughness: 0.35 }),
    cheek: new THREE.MeshStandardMaterial({ color: '#ff8fa3', roughness: 0.7 }),
    beak: new THREE.MeshStandardMaterial({ color: '#ff9f43', roughness: 0.5 }),
  }
}

type Materials = ReturnType<typeof makeMaterials>

function Face({ kind, hr, m }: { kind: Kind; hr: number; m: Materials }) {
  return (
    <>
      {/* にっこり目（∩ の弧） */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={onHead(hr, s * 0.07, 0.02)} material={m.dark}>
          <torusGeometry args={[0.026, 0.008, 6, 12, Math.PI]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={onHead(hr, s * 0.115, -0.045, -0.01)} scale={[1, 0.6, 0.35]} material={m.cheek}>
          <sphereGeometry args={[0.035, 10, 8]} />
        </mesh>
      ))}

      {kind === 'bear' && (
        <>
          <mesh position={[0, -0.045, hr * 0.88]} scale={[1.15, 0.85, 0.6]} material={m.accent}>
            <sphereGeometry args={[0.08, 14, 10]} />
          </mesh>
          <mesh position={[0, -0.015, hr * 0.88 + 0.046]} scale={[1.3, 0.9, 0.8]} material={m.dark}>
            <sphereGeometry args={[0.024, 10, 8]} />
          </mesh>
          <mesh position={[0, -0.075, hr * 0.88 + 0.04]} scale={[1.2, 0.8, 0.5]} material={m.dark}>
            <sphereGeometry args={[0.018, 8, 6]} />
          </mesh>
        </>
      )}
      {kind === 'rabbit' && (
        <>
          <mesh position={onHead(hr, 0, -0.03)} material={m.cheek}>
            <sphereGeometry args={[0.017, 8, 6]} />
          </mesh>
          <mesh position={onHead(hr, 0, -0.07, -0.004)} scale={[1.2, 0.8, 0.5]} material={m.dark}>
            <sphereGeometry args={[0.02, 8, 6]} />
          </mesh>
        </>
      )}
      {kind === 'chick' && (
        <mesh position={onHead(hr, 0, -0.03, 0.02)} rotation={[Math.PI / 2, 0, 0]} material={m.beak}>
          <coneGeometry args={[0.04, 0.08, 10]} />
        </mesh>
      )}
    </>
  )
}

let stripeTexture: THREE.CanvasTexture | null = null

// パーティー帽のしま模様（白地に色を乗せる前提でグレースケール）
function getStripeTexture() {
  if (!stripeTexture) {
    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 64
    const g = canvas.getContext('2d')!
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#ffffff' : '#9a9a9a'
      g.fillRect(0, i * 8, 8, 8)
    }
    stripeTexture = new THREE.CanvasTexture(canvas)
    stripeTexture.colorSpace = THREE.SRGBColorSpace
  }
  return stripeTexture
}

function PartyHat({ hr, color, pompom }: { hr: number; color: string; pompom: string }) {
  const h = 0.2
  return (
    <group position={[0.04, hr * 0.9, 0]} rotation={[0, 0, -0.28]}>
      <mesh position={[0, h / 2, 0]}>
        <coneGeometry args={[0.085, h, 20, 1, true]} />
        <meshStandardMaterial color={color} map={getStripeTexture()} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, h + 0.012, 0]}>
        <sphereGeometry args={[0.028, 10, 8]} />
        <meshStandardMaterial color={pompom} roughness={0.9} />
      </mesh>
    </group>
  )
}

function Bow({ hr, color }: { hr: number; color: string }) {
  return (
    <group position={[0.1, hr * 0.78, 0.07]} rotation={[0.2, 0, -0.35]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.035, 0, 0]} rotation={[0, 0, s * 0.3]} scale={[1.4, 0.8, 0.6]}>
          <sphereGeometry args={[0.03, 10, 8]} />
          <meshStandardMaterial color={color} roughness={0.45} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
    </group>
  )
}

function Ears({ kind, hr, m }: { kind: Kind; hr: number; m: Materials }) {
  if (kind === 'bear') {
    return (
      <>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.14, 0.15, -0.02]}>
            <mesh material={m.fur}>
              <sphereGeometry args={[0.07, 12, 10]} />
            </mesh>
            <mesh position={[0, 0, 0.035]} scale={[1, 1, 0.5]} material={m.accent}>
              <sphereGeometry args={[0.04, 10, 8]} />
            </mesh>
          </group>
        ))}
      </>
    )
  }
  if (kind === 'rabbit') {
    return (
      <>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.075, hr + 0.06, -0.02]} rotation={[0, 0, -s * 0.15]}>
            <mesh scale={[0.42, 1.5, 0.28]} material={m.fur}>
              <sphereGeometry args={[0.1, 12, 10]} />
            </mesh>
            <mesh position={[0, 0, 0.018]} scale={[0.35, 1.3, 0.2]} material={m.accent}>
              <sphereGeometry args={[0.07, 10, 8]} />
            </mesh>
          </group>
        ))}
      </>
    )
  }
  // ひよこの頭の毛
  return (
    <>
      <mesh position={[0, hr + 0.02, 0]} scale={[0.6, 1.4, 0.6]} material={m.fur}>
        <sphereGeometry args={[0.035, 8, 6]} />
      </mesh>
      <mesh position={[0.035, hr + 0.005, 0]} rotation={[0, 0, -0.6]} scale={[0.6, 1.2, 0.6]} material={m.fur}>
        <sphereGeometry args={[0.03, 8, 6]} />
      </mesh>
    </>
  )
}

function Character({ cfg, castShadows }: { cfg: CharacterConfig; castShadows: boolean }) {
  const m = useMemo(() => makeMaterials(cfg.color, cfg.accent), [cfg.color, cfg.accent])
  const rootRef = useRef<THREE.Group>(null)
  const shadowRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  // 腕ごとに [yaw, roll, pitch] の入れ子グループ
  const armRefs = useRef<THREE.Group[]>([])
  const setArm = (i: number) => (g: THREE.Group | null) => {
    if (g) armRefs.current[i] = g
  }
  const anim = useRef({ scale: 0, clap: 0, tapAt: -1 })

  const hr = cfg.kind === 'chick' ? 0.17 : 0.2
  const paw = cfg.kind === 'bear' ? m.accent : m.fur
  const isChick = cfg.kind === 'chick'

  useLayoutEffect(() => {
    rootRef.current?.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = castShadows
    })
  }, [castShadows])

  useFrame((state, dt) => {
    const root = rootRef.current
    const body = bodyRef.current
    const head = headRef.current
    if (!root || !body || !head) return
    const a = anim.current

    // 部屋が点いたら跳ねて登場、再点火で縮んで隠れる
    const since = blowState.blownAt < 0 ? -1 : nowSec() - blowState.blownAt - DARK_PAUSE_SEC - cfg.delay
    let hop = 0
    if (since >= 0) {
      const k = Math.min(since / APPEAR_SEC, 1)
      a.scale = backOut(k)
      hop = Math.sin(k * Math.PI) * 0.25
    } else {
      a.scale = THREE.MathUtils.damp(a.scale, 0, 10, dt)
    }
    const visible = a.scale > 0.002
    root.visible = visible
    if (shadowRef.current) {
      shadowRef.current.visible = visible
      shadowRef.current.scale.setScalar(Math.max(a.scale, 0.001))
    }
    if (!visible) return
    root.scale.setScalar(cfg.scale * a.scale)

    // タップ: ぴょんと跳ねてくるっと1回転
    const tk = a.tapAt < 0 ? 1 : Math.min((nowSec() - a.tapAt) / TAP_SEC, 1)
    const spin = tk < 1 ? tk * tk * (3 - 2 * tk) : 0
    root.position.y = hop + Math.sin(tk * Math.PI) * 0.3 * (tk < 1 ? 1 : 0)
    root.rotation.y = spin * Math.PI * 2

    const t = state.clock.elapsedTime
    const inCycle = since - APPEAR_SEC >= 0 ? (since - APPEAR_SEC) % CYCLE_SEC : -1
    a.clap = THREE.MathUtils.damp(a.clap, inCycle >= 0 && inCycle < CLAP_SEC ? 1 : 0, 8, dt)
    const w = a.clap
    // s = 1 で手が合わさる。累乗で「パチッ」と素早く閉じる
    const s = Math.pow(0.5 - 0.5 * Math.cos(2 * Math.PI * cfg.rate * Math.max(inCycle, 0)), 1.5)

    body.position.y = w * s * 0.015 + (1 - w) * Math.abs(Math.sin(t * 3.2 + cfg.delay * 4)) * 0.03
    body.rotation.z = (1 - w) * Math.sin(t * 1.6 + cfg.delay * 4) * 0.08
    head.rotation.z = Math.sin(t * 2.1 + cfg.delay * 5) * 0.1
    head.rotation.x = -w * s * 0.08

    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? 1 : -1
      const [yaw, roll, pitch] = armRefs.current.slice(side * 3, side * 3 + 3)
      if (!yaw || !roll || !pitch) continue
      yaw.rotation.y = sign * w * (0.15 + 0.57 * s)
      roll.rotation.z = -sign * (1 - w) * (0.9 + 0.2 * Math.sin(t * 7 + side * Math.PI))
      pitch.rotation.x = -(w * 1.3 + (1 - w) * 0.15)
    }
  })

  const handleTap = (e: ThreeEvent<PointerEvent>) => {
    // 隠れている間は長押しの邪魔をしない
    if (anim.current.scale < 0.5) return
    // 3D内の伝播とDOMバブリングの両方を止める（長押し開始を防ぐ）
    e.stopPropagation()
    e.nativeEvent.stopPropagation()
    const now = nowSec()
    if (anim.current.tapAt >= 0 && now - anim.current.tapAt < TAP_SEC) return
    audio.unlock()
    audio.playSqueak(cfg.voice)
    anim.current.tapAt = now
  }

  return (
    <group position={[cfg.x, TABLE_TOP_Y, cfg.z]} rotation={[0, cfg.rotY, 0]}>
      <group ref={shadowRef} scale={0.001} visible={false}>
        <GiftShadow size={0.85 * cfg.scale} />
      </group>

      <group ref={rootRef} scale={0.001} visible={false} onPointerDown={handleTap}>
        {/* 足 */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.09, 0.03, 0.08]} scale={[1, 0.6, 1.3]} material={isChick ? m.beak : m.accent}>
            <sphereGeometry args={[0.07, 12, 8]} />
          </mesh>
        ))}

        <group ref={bodyRef}>
          <mesh position={[0, 0.23, 0]} scale={[1, 1.05, 0.95]} material={m.fur}>
            <sphereGeometry args={[0.22, 24, 18]} />
          </mesh>
          {!isChick && (
            <mesh position={[0, 0.21, 0.14]} scale={[1, 1.1, 0.5]} material={cfg.kind === 'bear' ? m.accent : m.fur}>
              <sphereGeometry args={[0.15, 16, 12]} />
            </mesh>
          )}
          {cfg.kind !== 'chick' && (
            <mesh position={[0, 0.14, -0.2]} material={cfg.kind === 'rabbit' ? m.fur : m.accent}>
              <sphereGeometry args={[0.055, 10, 8]} />
            </mesh>
          )}

          {[0, 1].map((side) => (
            <group key={side} position={[(side === 0 ? -1 : 1) * SHOULDER[0], SHOULDER[1], SHOULDER[2]]} ref={setArm(side * 3)}>
              <group ref={setArm(side * 3 + 1)}>
                <group ref={setArm(side * 3 + 2)}>
                  {isChick ? (
                    <mesh position={[0, -0.11, 0]} scale={[0.5, 1.9, 1.1]} material={m.fur}>
                      <sphereGeometry args={[0.065, 12, 10]} />
                    </mesh>
                  ) : (
                    <>
                      <mesh position={[0, -0.1, 0]} scale={[1, 2, 1]} material={m.fur}>
                        <sphereGeometry args={[0.055, 12, 10]} />
                      </mesh>
                      <mesh position={[0, -0.2, 0]} material={paw}>
                        <sphereGeometry args={[0.05, 12, 10]} />
                      </mesh>
                    </>
                  )}
                </group>
              </group>
            </group>
          ))}

          <group ref={headRef} position={[0, isChick ? 0.5 : HEAD_Y, 0]}>
            <mesh material={m.fur}>
              <sphereGeometry args={[hr, 24, 18]} />
            </mesh>
            <Ears kind={cfg.kind} hr={hr} m={m} />
            {cfg.kind === 'bear' && <PartyHat hr={hr} color="#ff6b6b" pompom="#fdcb6e" />}
            {cfg.kind === 'chick' && <PartyHat hr={hr} color="#4ecdc4" pompom="#ff85c0" />}
            {cfg.kind === 'rabbit' && <Bow hr={hr} color="#ff85c0" />}
            <Face kind={cfg.kind} hr={hr} m={m} />
          </group>
        </group>
      </group>
    </group>
  )
}

// 部屋の明かりが点くと登場して拍手するキャラクターたち
export default function Characters({ castShadows }: { castShadows: boolean }) {
  return (
    <>
      {CHARACTERS.map((c) => (
        <Character key={c.kind} cfg={c} castShadows={castShadows} />
      ))}
    </>
  )
}
