import confetti from 'canvas-confetti'

const COLORS = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#ff85c0', '#95e1d3', '#aa96da', '#fdcb6e']

export function useConfetti() {
  function fireConfetti() {
    confetti({ particleCount: 120, spread: 70, origin: { x: 0.5, y: 0.55 }, colors: COLORS })
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: COLORS })
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: COLORS })
    }, 200)
  }
  return { fireConfetti }
}
