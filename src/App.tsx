import { useState, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGiftName } from './hooks/useGiftName'
import { useConfetti } from './hooks/useConfetti'
import Scene from './components/Scene'
import CTAOverlay from './components/CTAOverlay'
import MessageCard from './components/MessageCard'

type AppState = 'idle' | 'blowing' | 'blown' | 'celebrated'

const HOLD_MS = 1400

export default function App() {
  const name = useGiftName()
  const { fireConfetti } = useConfetti()

  const [appState, setAppState] = useState<AppState>('idle')
  const [extinguish, setExtinguish] = useState(0)
  const [progress, setProgress] = useState(0)

  const holdStartRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const startHold = useCallback(() => {
    if (appState !== 'idle') return
    holdStartRef.current = performance.now()
    setAppState('blowing')

    const tick = () => {
      if (holdStartRef.current === null) return
      const p = Math.min((performance.now() - holdStartRef.current) / HOLD_MS, 1)
      setProgress(p)
      setExtinguish(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setAppState('blown')
        fireConfetti()
        setTimeout(() => setAppState('celebrated'), 1600)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [appState, fireConfetti])

  const cancelHold = useCallback(() => {
    if (appState !== 'blowing') return
    holdStartRef.current = null
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    setAppState('idle')
    setProgress(0)
    setExtinguish(0)
  }, [appState])

  const isBg = appState !== 'celebrated'

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 1.2, 5.5], fov: 50 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene extinguish={extinguish} />
      </Canvas>

      {/* Interaction overlay — covers canvas to capture hold events */}
      {isBg && (
        <div
          className="absolute inset-0"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          style={{ touchAction: 'none' }}
        />
      )}

      {appState === 'idle' && <CTAOverlay />}

      {appState === 'blowing' && <BlowProgress progress={progress} />}

      {appState === 'celebrated' && <MessageCard name={name} />}
    </div>
  )
}

function BlowProgress({ progress }: { progress: number }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const dash = circ * progress
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 pointer-events-none">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
        <circle
          cx="38" cy="38" r={r}
          fill="none"
          stroke="#fdcb6e"
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 38 38)"
        />
      </svg>
      <p className="text-white/70 text-sm mt-3">そのまま押し続けて！</p>
    </div>
  )
}
