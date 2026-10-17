// 毎フレーム変化する演出値。React state にすると Scene 全体が毎フレーム再レンダーされるため、
// ミュータブルなオブジェクトに置いて useFrame の中で読む。
export const blowState = {
  /** 0 → 1。ろうそくは手前から順にこの値のしきい値を越えて消える */
  extinguish: 0,
  /** 長押し中かどうか */
  blowing: false,
  /** 吹く強さ（Candles が blowing から平滑化して更新） */
  blow: 0,
  /** 全消灯した時刻（performance.now() 秒）。未消灯は -1 */
  blownAt: -1,
  /** 部屋の明かり 0 → 1（Scene が blownAt から平滑化して更新） */
  room: 0,
}

/** 消灯から部屋の明かりが点くまでの暗転時間（秒） */
export const DARK_PAUSE_SEC = 0.9

export function nowSec() {
  return performance.now() / 1000
}
