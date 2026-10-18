// OS の「視差効果を減らす / アニメーションを減らす」設定。揺れや紙吹雪を控えめにする
export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
