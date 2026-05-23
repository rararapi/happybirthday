import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
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
  const celebrationTimerRef = useRef<number | null>(null)

  const cancelAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startHold = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (appState !== 'idle') return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    cancelAnimation()
    holdStartRef.current = performance.now()
    setAppState('blowing')

    const tick = () => {
      if (holdStartRef.current === null) return

      const nextProgress = Math.min((performance.now() - holdStartRef.current) / HOLD_MS, 1)
      setProgress(nextProgress)
      setExtinguish(nextProgress)

      if (nextProgress < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      holdStartRef.current = null
      rafRef.current = null
      setProgress(1)
      setExtinguish(1)
      setAppState('blown')
      fireConfetti()
      celebrationTimerRef.current = window.setTimeout(() => {
        setAppState('celebrated')
      }, 1600)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [appState, cancelAnimation, fireConfetti])

  const cancelHold = useCallback(() => {
    if (appState !== 'blowing' || holdStartRef.current === null) return

    holdStartRef.current = null
    cancelAnimation()
    setAppState('idle')
    setProgress(0)
    setExtinguish(0)
  }, [appState, cancelAnimation])

  useEffect(() => {
    return () => {
      cancelAnimation()
      if (celebrationTimerRef.current !== null) {
        window.clearTimeout(celebrationTimerRef.current)
      }
    }
  }, [cancelAnimation])

  const isInteractive = appState === 'idle' || appState === 'blowing'

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0.8, 6.5], fov: 52 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene extinguish={extinguish} />
      </Canvas>

      {isInteractive && (
        <div
          className="absolute inset-0"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
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
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke="#fdcb6e"
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 38 38)"
        />
      </svg>
      <p className="text-white/70 text-sm mt-3">そのまま長押ししてね</p>
    </div>
  )
}
