import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { useGiftName } from './hooks/useGiftName'
import { useAgeParam } from './hooks/useAgeParam'
import { useCardParams } from './hooks/useCardParams'
import { useConfetti } from './hooks/useConfetti'
import * as audio from './audio/audioManager'
import { isMicSupported, startMicBlow, type MicBlow } from './audio/micBlow'
import { blowState, DARK_PAUSE_SEC, nowSec } from './state/blowState'
import Scene from './components/Scene'
import CTAOverlay, { type MicState } from './components/CTAOverlay'
import MessageCard from './components/MessageCard'
import MuteButton from './components/MuteButton'

type AppState = 'idle' | 'blowing' | 'blown' | 'celebrated'

const HOLD_SEC = 1.4
const MESSAGE_DELAY_MS = 2200
/** マイクの強さがこれ未満なら吹いていない扱い */
const MIC_THRESHOLD = 0.12
/** 息が途切れてから「吹くのをやめた」とみなすまでの猶予（秒） */
const MIC_RELEASE_SEC = 0.25

// 影マップはスマホでは重いので、精密なポインタの端末（PC）のみ有効にする
const ENABLE_SHADOWS = !window.matchMedia('(pointer: coarse)').matches
const INITIAL_DPR = Math.min(window.devicePixelRatio || 1, 1.75)
const MIC_SUPPORTED = isMicSupported()

export default function App() {
  const name = useGiftName()
  const age = useAgeParam()
  const { from, message } = useCardParams()
  const { fireConfetti } = useConfetti()

  const [appState, setAppState] = useState<AppState>('idle')
  const [progress, setProgress] = useState(0)
  const [dpr, setDpr] = useState(INITIAL_DPR)
  const [mic, setMic] = useState<MicState>('off')

  // 吹き消しループは毎フレーム最新の状態を読むので ref にも持つ
  const appStateRef = useRef<AppState>('idle')
  const progressRef = useRef(0)
  const pointerHeldRef = useRef(false)
  const micRef = useRef<MicBlow | null>(null)
  const micWantedRef = useRef(false)
  const lastMicBlowRef = useRef(-Infinity)
  const loopRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const tickRef = useRef<() => void>(() => {})
  const relightRafRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])
  const stopBlowingRef = useRef<(() => void) | null>(null)
  const melodyCancelRef = useRef<(() => void) | null>(null)

  const changeState = useCallback((next: AppState) => {
    appStateRef.current = next
    setAppState(next)
  }, [])

  const cancelRelight = useCallback(() => {
    if (relightRafRef.current !== null) {
      cancelAnimationFrame(relightRafRef.current)
      relightRafRef.current = null
    }
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  const later = useCallback((ms: number, fn: () => void) => {
    timersRef.current.push(window.setTimeout(fn, ms))
  }, [])

  const stopWindSound = useCallback(() => {
    stopBlowingRef.current?.()
    stopBlowingRef.current = null
  }, [])

  const stopMic = useCallback(() => {
    micRef.current?.stop()
    micRef.current = null
  }, [])

  const complete = useCallback(() => {
    pointerHeldRef.current = false
    blowState.blowing = false
    blowState.blownAt = nowSec()
    changeState('blown')
    stopWindSound()
    stopMic()
    audio.playBlowOut()

    // 暗転 → 部屋の明かりが点いてお祝い
    later(DARK_PAUSE_SEC * 1000, () => {
      audio.playLightSwitch()
      audio.playConfettiPops()
      melodyCancelRef.current = audio.playMelody()
      fireConfetti()
    })
    later(MESSAGE_DELAY_MS, () => {
      blowState.card = true
      changeState('celebrated')
    })
  }, [changeState, fireConfetti, later, stopMic, stopWindSound])

  // 長押しとマイクの両方から吹く強さを求め、消火の進み具合を進める
  tickRef.current = () => {
    const now = performance.now() / 1000
    const dt = Math.min(now - lastTickRef.current, 0.1)
    lastTickRef.current = now

    const state = appStateRef.current
    if (state !== 'idle' && state !== 'blowing') {
      loopRef.current = null
      return
    }

    const micLevel = micRef.current?.level() ?? 0
    if (micLevel > MIC_THRESHOLD) lastMicBlowRef.current = now
    const micBlowing = now - lastMicBlowRef.current < MIC_RELEASE_SEC
    const rate = pointerHeldRef.current ? 1 : micBlowing ? Math.min(0.5 + micLevel, 1.5) : 0

    if (rate > 0 && state === 'idle') {
      blowState.blowing = true
      changeState('blowing')
    } else if (rate === 0 && state === 'blowing') {
      // 途中でやめても消えたろうそくは消えたまま。続きから吹き消す
      blowState.blowing = false
      stopWindSound()
      changeState('idle')
    }

    if (rate > 0) {
      const next = Math.min(progressRef.current + (dt * rate) / HOLD_SEC, 1)
      progressRef.current = next
      blowState.extinguish = next
      setProgress(next)
      if (next >= 1) {
        loopRef.current = null
        complete()
        return
      }
    }

    loopRef.current =
      pointerHeldRef.current || micRef.current || appStateRef.current === 'blowing'
        ? requestAnimationFrame(() => tickRef.current())
        : null
  }

  const ensureLoop = useCallback(() => {
    if (loopRef.current !== null) return
    lastTickRef.current = performance.now() / 1000
    loopRef.current = requestAnimationFrame(() => tickRef.current())
  }, [])

  const startHold = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const state = appStateRef.current
    if (state !== 'idle' && state !== 'blowing') return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    cancelRelight()
    audio.unlock()
    pointerHeldRef.current = true
    if (!stopBlowingRef.current) stopBlowingRef.current = audio.startBlowing()
    ensureLoop()
  }, [cancelRelight, ensureLoop])

  const cancelHold = useCallback(() => {
    if (!pointerHeldRef.current) return
    pointerHeldRef.current = false
    stopWindSound()
  }, [stopWindSound])

  // 許可済みなら再点火後にプロンプトなしで再開する
  const listenMic = useCallback(async () => {
    const m = await startMicBlow()
    const state = appStateRef.current
    if (state !== 'idle' && state !== 'blowing') {
      m.stop()
      return
    }
    micRef.current?.stop()
    micRef.current = m
    ensureLoop()
  }, [ensureLoop])

  const enableMic = useCallback(async () => {
    audio.unlock()
    cancelRelight()
    setMic('starting')
    try {
      await listenMic()
      micWantedRef.current = true
      setMic('on')
    } catch {
      setMic('denied')
    }
  }, [cancelRelight, listenMic])

  const replay = useCallback(() => {
    melodyCancelRef.current?.()
    melodyCancelRef.current = null
    clearTimers()
    cancelRelight()
    audio.playRelight()
    blowState.blownAt = -1
    blowState.card = false
    progressRef.current = 0
    setProgress(0)
    changeState('idle')

    // 炎をゆっくり復活させる（extinguish 1 → 0）
    const RELIGHT_MS = 900
    const start = performance.now()
    const tick = () => {
      const k = Math.min((performance.now() - start) / RELIGHT_MS, 1)
      blowState.extinguish = 1 - k
      relightRafRef.current = k < 1 ? requestAnimationFrame(tick) : null
      if (k >= 1 && micWantedRef.current) listenMic().catch(() => setMic('denied'))
    }
    relightRafRef.current = requestAnimationFrame(tick)
  }, [cancelRelight, changeState, clearTimers, listenMic])

  useEffect(() => {
    return () => {
      if (loopRef.current !== null) cancelAnimationFrame(loopRef.current)
      cancelRelight()
      clearTimers()
      stopWindSound()
      stopMic()
      melodyCancelRef.current?.()
    }
  }, [cancelRelight, clearTimers, stopMic, stopWindSound])

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

      {appState === 'idle' && (
        <CTAOverlay
          resumed={progress > 0}
          mic={mic}
          onEnableMic={MIC_SUPPORTED ? enableMic : undefined}
        />
      )}

      {appState === 'blowing' && <BlowProgress progress={progress} byMic={mic === 'on' && !pointerHeldRef.current} />}

      {appState === 'celebrated' && <MessageCard name={name} age={age} from={from} message={message} onReplay={replay} />}
    </div>
  )
}

function BlowProgress({ progress, byMic }: { progress: number; byMic: boolean }) {
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
      <p className="text-white/70 text-sm mt-3">{byMic ? 'その調子！ ふーっと吹き続けて' : 'そのまま長押ししてね'}</p>
    </div>
  )
}
