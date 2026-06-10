import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGiftName } from './hooks/useGiftName'
import { useAgeParam } from './hooks/useAgeParam'
import { useConfetti } from './hooks/useConfetti'
import * as audio from './audio/audioManager'
import Scene from './components/Scene'
import CTAOverlay from './components/CTAOverlay'
import MessageCard from './components/MessageCard'
import MuteButton from './components/MuteButton'

type AppState = 'idle' | 'blowing' | 'blown' | 'celebrated'

const HOLD_MS = 1400

export default function App() {
  const name = useGiftName()
  const age = useAgeParam()
  const { fireConfetti } = useConfetti()

  const [appState, setAppState] = useState<AppState>('idle')
  const [extinguish, setExtinguish] = useState(0)
  const [progress, setProgress] = useState(0)

  const holdStartRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const celebrationTimerRef = useRef<number | null>(null)
  const stopBlowingRef = useRef<(() => void) | null>(null)
  const melodyCancelRef = useRef<(() => void) | null>(null)

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
    audio.unlock()
    stopBlowingRef.current = audio.startBlowing()
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
      stopBlowingRef.current?.()
      stopBlowingRef.current = null
      audio.playBlowOut()
      audio.playConfettiPops()
      melodyCancelRef.current = audio.playMelody()
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
    stopBlowingRef.current?.()
    stopBlowingRef.current = null
    setAppState('idle')
    setProgress(0)
    setExtinguish(0)
  }, [appState, cancelAnimation])

  const replay = useCallback(() => {
    melodyCancelRef.current?.()
    melodyCancelRef.current = null
    if (celebrationTimerRef.current !== null) {
      window.clearTimeout(celebrationTimerRef.current)
      celebrationTimerRef.current = null
    }
    cancelAnimation()
    audio.playRelight()
    setProgress(0)
    setAppState('idle')

    // 炎をゆっくり復活させる（extinguish 1 → 0）
    const RELIGHT_MS = 700
    const start = performance.now()
    const tick = () => {
      const k = Math.min((performance.now() - start) / RELIGHT_MS, 1)
      setExtinguish(1 - k)
      rafRef.current = k < 1 ? requestAnimationFrame(tick) : null
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [cancelAnimation])

  useEffect(() => {
    return () => {
      cancelAnimation()
      stopBlowingRef.current?.()
      melodyCancelRef.current?.()
      if (celebrationTimerRef.current !== null) {
        window.clearTimeout(celebrationTimerRef.current)
      }
    }
  }, [cancelAnimation])

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        touchAction: 'none',
      }}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0.8, 6.5], fov: 52 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene extinguish={extinguish} candleCount={age ?? undefined} />
      </Canvas>

      <MuteButton />

      {appState === 'idle' && <CTAOverlay />}

      {appState === 'blowing' && <BlowProgress progress={progress} />}

      {appState === 'celebrated' && <MessageCard name={name} age={age} onReplay={replay} />}
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
