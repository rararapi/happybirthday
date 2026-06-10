import { useSyncExternalStore } from 'react'

// Web Audio API によるサウンド合成（外部音声ファイル不使用）
// AudioContext はユーザージェスチャ内の unlock() で初期化する（autoplay ポリシー対応）

const MUTE_KEY = 'hb-muted'

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
let muted = false

try {
  muted = localStorage.getItem(MUTE_KEY) === '1'
} catch {
  muted = false
}

const muteListeners = new Set<() => void>()

export function unlock() {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
    masterGain = ctx.createGain()
    masterGain.gain.value = muted ? 0 : 1
    masterGain.connect(ctx.destination)
  }
  void ctx.resume()
}

function ready(): boolean {
  if (!ctx || !masterGain) return false
  // iOS Safari はバックグラウンド復帰などで再サスペンドすることがある
  void ctx.resume()
  return true
}

export function getMuted() {
  return muted
}

export function setMuted(next: boolean) {
  muted = next
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0')
  } catch {
    // localStorage 不可の環境では永続化のみ諦める
  }
  if (ctx && masterGain) {
    masterGain.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.05)
  }
  muteListeners.forEach((fn) => fn())
}

export function useMuted(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      muteListeners.add(onChange)
      return () => muteListeners.delete(onChange)
    },
    () => muted,
  )
}

function getNoiseBuffer(audio: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const length = audio.sampleRate
    noiseBuffer = audio.createBuffer(1, length, audio.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1
    }
  }
  return noiseBuffer
}

function makeNoise(audio: AudioContext, loop: boolean): AudioBufferSourceNode {
  const src = audio.createBufferSource()
  src.buffer = getNoiseBuffer(audio)
  src.loop = loop
  return src
}

// 長押し中の「ふーっ」という風音。stop クロージャを返す
export function startBlowing(): () => void {
  if (!ready() || !ctx || !masterGain) return () => {}
  const audio = ctx
  const now = audio.currentTime

  const src = makeNoise(audio, true)
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 900
  filter.Q.value = 0.7

  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.setTargetAtTime(0.18, now, 0.25)

  src.connect(filter).connect(gain).connect(masterGain)
  src.start(now)

  let stopped = false
  return () => {
    if (stopped) return
    stopped = true
    const t = audio.currentTime
    gain.gain.cancelScheduledValues(t)
    gain.gain.setTargetAtTime(0.0001, t, 0.06)
    src.stop(t + 0.3)
  }
}

// 消火の「ふっ」
export function playBlowOut() {
  if (!ready() || !ctx || !masterGain) return
  const audio = ctx
  const now = audio.currentTime

  const src = makeNoise(audio, false)
  const filter = audio.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(500, now)
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.3)
  filter.Q.value = 1.2

  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(0.35, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

  src.connect(filter).connect(gain).connect(masterGain)
  src.start(now)
  src.stop(now + 0.4)
}

function popAt(audio: AudioContext, dest: AudioNode, t: number, sharp: boolean) {
  // ノイズクリック
  const noise = makeNoise(audio, false)
  const hp = audio.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = sharp ? 1200 : 600
  const nGain = audio.createGain()
  nGain.gain.setValueAtTime(sharp ? 0.4 : 0.3, t)
  nGain.gain.exponentialRampToValueAtTime(0.0001, t + (sharp ? 0.05 : 0.06))
  noise.connect(hp).connect(nGain).connect(dest)
  noise.start(t)
  noise.stop(t + 0.1)

  // ピッチが落ちる「ポンッ」
  const osc = audio.createOscillator()
  osc.type = sharp ? 'sine' : 'triangle'
  osc.frequency.setValueAtTime(sharp ? 250 : 700, t)
  osc.frequency.exponentialRampToValueAtTime(sharp ? 90 : 150, t + 0.09)
  const oGain = audio.createGain()
  oGain.gain.setValueAtTime(0.3, t)
  oGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
  osc.connect(oGain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.15)
}

// 紙吹雪の3連ポップ（useConfetti のバーストタイミングと同期）
export function playConfettiPops() {
  if (!ready() || !ctx || !masterGain) return
  const now = ctx.currentTime
  popAt(ctx, masterGain, now, false)
  popAt(ctx, masterGain, now + 0.2, false)
  popAt(ctx, masterGain, now + 0.26, false)
}

// 風船の「パンッ」
export function playBalloonPop() {
  if (!ready() || !ctx || !masterGain) return
  popAt(ctx, masterGain, ctx.currentTime, true)
}

// 再点火の「フッ」
export function playRelight() {
  if (!ready() || !ctx || !masterGain) return
  const audio = ctx
  const now = audio.currentTime

  const osc = audio.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, now)
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.12)
  const oGain = audio.createGain()
  oGain.gain.setValueAtTime(0.0001, now)
  oGain.gain.linearRampToValueAtTime(0.15, now + 0.03)
  oGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
  osc.connect(oGain).connect(masterGain)
  osc.start(now)
  osc.stop(now + 0.2)

  const noise = makeNoise(audio, false)
  const hp = audio.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 2000
  const nGain = audio.createGain()
  nGain.gain.setValueAtTime(0.08, now)
  nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)
  noise.connect(hp).connect(nGain).connect(masterGain)
  noise.start(now)
  noise.stop(now + 0.05)
}

// Happy Birthday メロディ（ハ長調 3/4、オルゴール風）
// [周波数, 拍数]
const MELODY: Array<[number, number]> = [
  [392.0, 0.75], [392.0, 0.25], [440.0, 1], [392.0, 1], [523.25, 1], [493.88, 2],
  [392.0, 0.75], [392.0, 0.25], [440.0, 1], [392.0, 1], [587.33, 1], [523.25, 2],
  [392.0, 0.75], [392.0, 0.25], [783.99, 1], [659.25, 1], [523.25, 1], [493.88, 1], [440.0, 2],
  [698.46, 0.75], [698.46, 0.25], [659.25, 1], [523.25, 1], [587.33, 1], [523.25, 2],
]

const BEAT_SEC = 0.42

// メロディ全体を事前スケジュールして再生。キャンセル関数を返す
export function playMelody(): () => void {
  if (!ready() || !ctx || !masterGain) return () => {}
  const audio = ctx

  // メロディバス（lowpass で柔らかく）
  const bus = audio.createBiquadFilter()
  bus.type = 'lowpass'
  bus.frequency.value = 2500
  bus.connect(masterGain)

  const nodes: Array<OscillatorNode> = []
  let t = audio.currentTime + 0.05

  for (const [freq, beats] of MELODY) {
    const dur = beats * BEAT_SEC

    const gain = audio.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.22, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95)
    gain.connect(bus)

    const osc = audio.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    osc.connect(gain)
    osc.start(t)
    osc.stop(t + dur)
    nodes.push(osc)

    // 1オクターブ上を弱く重ねてオルゴールらしいきらめきを足す
    const sparkleGain = audio.createGain()
    sparkleGain.gain.setValueAtTime(0.0001, t)
    sparkleGain.gain.linearRampToValueAtTime(0.055, t + 0.015)
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.9)
    sparkleGain.connect(bus)

    const sparkle = audio.createOscillator()
    sparkle.type = 'triangle'
    sparkle.frequency.value = freq * 2
    sparkle.connect(sparkleGain)
    sparkle.start(t)
    sparkle.stop(t + dur)
    nodes.push(sparkle)

    t += dur
  }

  let cancelled = false
  return () => {
    if (cancelled) return
    cancelled = true
    nodes.forEach((n) => {
      try {
        n.stop()
      } catch {
        // 既に停止済みなら無視
      }
      n.disconnect()
    })
    bus.disconnect()
  }
}
