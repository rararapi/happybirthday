import { getAudioContext } from './audioManager'

// マイクで息の吹きかけを検出する。
// マイクに息が当たると大きなノイズになるので、静かなときの音量（ノイズフロア）からの持ち上がりで判定する。

export interface MicBlow {
  /** 吹く強さ 0〜1.5。毎フレーム呼ぶ */
  level(): number
  stop(): void
}

export function isMicSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

export async function startMicBlow(): Promise<MicBlow> {
  const audio = getAudioContext()
  if (!audio) throw new Error('AudioContext is not ready')

  const stream = await navigator.mediaDevices.getUserMedia({
    // ノイズ抑制は息の音そのものを消してしまうので切る
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  })

  const source = audio.createMediaStreamSource(stream)
  // 息の「ボボボ」は低〜中域に強く出る。高域の話し声や物音は弱める
  const lowpass = audio.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 1500
  const analyser = audio.createAnalyser()
  analyser.fftSize = 1024
  source.connect(lowpass).connect(analyser)

  const buf = new Float32Array(analyser.fftSize)
  let floor = 0.01

  return {
    level() {
      analyser.getFloatTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
      const rms = Math.sqrt(sum / buf.length)
      // 静かなときはノイズフロアに素早く追従し、うるさい環境ではゆっくり持ち上げる
      floor += (rms - floor) * (rms < floor * 2 ? 0.02 : 0.002)
      const threshold = Math.max(floor * 3, 0.02)
      return Math.min(Math.max((rms - threshold) / 0.12, 0), 1.5)
    },
    stop() {
      source.disconnect()
      lowpass.disconnect()
      stream.getTracks().forEach((t) => t.stop())
    },
  }
}
