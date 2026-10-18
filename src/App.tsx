import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { useGiftName } from './hooks/useGiftName'
import { useAgeParam } from './hooks/useAgeParam'
import { useConfetti } from './hooks/useConfetti'
import * as audio from './audio/audioManager'
import { blowState, DARK_PAUSE_SEC, nowSec } from './state/blowState'
import Scene from './components/Scene'
import CTAOverlay from './components/CTAOverlay'
import MessageCard from './components/MessageCard'
import MuteButton from './components/MuteButton'
import { applauseTimes } from './components/Characters'

type AppState = 'idle' | 'blowing' | 'blown' | 'celebrated'

const HOLD_MS = 1400
const MESSAGE_DELAY_MS = 2200

// 影マップはスマホでは重いので、精密なポインタの端末（PC）のみ有効にする
const ENABLE_SHADOWS = !window.matchMedia('(pointer: coarse)').matches
const INITIAL_DPR = Math.min(window.devicePixelRatio || 1, 1.75)

export default function App() {
  const name = useGiftName()
  const age = useAgeParam()
  const { fireConfetti } = useConfetti()

  const [appState, setAppState] = useState<AppState>('idle')
  const [progress, setProgress] = useState(0)
  const [dpr, setDpr] = useState(INITIAL_DPR)

  const holdStartRef = useRef<number | null>(null)
  const progressRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])
  const stopBlowingRef = useRef<(() => void) | null>(null)
  const melodyCancelRef = useRef<(() => void) | null>(null)
  const applauseCancelRef = useRef<(() => void) | null>(null)

  const cancelAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  const later = useCallback((ms: number, fn: () => void) => {
    timersRef.current.push(window.setTimeout(fn, ms))
  }, [])

  const startHold = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (appState !== 'idle') return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    cancelAnimation()
    audio.unlock()
    stopBlowingRef.current = audio.startBlowing()
    // 途中で指を離して消えたろうそくは消えたまま。続きから吹き消す
    holdStartRef.current = performance.now() - progressRef.current * HOLD_MS
    blowState.blowing = true
    setAppState('blowing')

    const tick = () => {
      if (holdStartRef.current === null) return

      const nextProgress = Math.min((performance.now() - holdStartRef.current) / HOLD_MS, 1)
      progressRef.current = nextProgress
      blowState.extinguish = nextProgress
      setProgress(nextProgress)

      if (nextProgress < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      holdStartRef.current = null
      rafRef.current = null
      blowState.blowing = false
      blowState.blownAt = nowSec()
      setAppState('blown')
      stopBlowingRef.current?.()
      stopBlowingRef.current = null
      audio.playBlowOut()

      // 暗転 → 部屋の明かりが点いてお祝い
      later(DARK_PAUSE_SEC * 1000, () => {
        audio.playLightSwitch()
        audio.playConfettiPops()
        melodyCancelRef.current = audio.playMelody()
        applauseCancelRef.current = audio.playApplause(applauseTimes())
        fireConfetti()
      })
      later(MESSAGE_DELAY_MS, () => setAppState('celebrated'))
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [appState, cancelAnimation, fireConfetti, later])

  const cancelHold = useCallback(() => {
    if (appState !== 'blowing' || holdStartRef.current === null) return

    holdStartRef.current = null
    blowState.blowing = false
    cancelAnimation()
    stopBlowingRef.current?.()
    stopBlowingRef.current = null
    setAppState('idle')
  }, [appState, cancelAnimation])

  const replay = useCallback(() => {
    melodyCancelRef.current?.()
    melodyCancelRef.current = null
    applauseCancelRef.current?.()
    applauseCancelRef.current = null
    clearTimers()
    cancelAnimation()
    audio.playRelight()
    blowState.blownAt = -1
    progressRef.current = 0
    setProgress(0)
    setAppState('idle')

    // 炎をゆっくり復活させる（extinguish 1 → 0）
    const RELIGHT_MS = 900
    const start = performance.now()
    const tick = () => {
      const k = Math.min((performance.now() - start) / RELIGHT_MS, 1)
      blowState.extinguish = 1 - k
      rafRef.current = k < 1 ? requestAnimationFrame(tick) : null
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [cancelAnimation, clearTimers])

  useEffect(() => {
    return () => {
      cancelAnimation()
      clearTimers()
      stopBlowingRef.current?.()
      melodyCancelRef.current?.()
      applauseCancelRef.current?.()
    }
  }, [cancelAnimation, clearTimers])

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: '#070504', touchAction: 'none' }}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
    >
      <Canvas
        shadows={ENABLE_SHADOWS ? { type: THREE.PCFSoftShadowMap } : false}
        dpr={dpr}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 2, 9], fov: 40, near: 0.1, far: 80 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <Scene candleCount={age ?? undefined} shadows={ENABLE_SHADOWS} />
      </Canvas>

      <MuteButton />

      {appState === 'idle' && <CTAOverlay resumed={progress > 0} />}

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
