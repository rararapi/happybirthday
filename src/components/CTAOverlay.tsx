export default function CTAOverlay() {
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-20 pointer-events-none">
      <div className="text-center animate-bounce">
        <p className="text-white text-xl font-bold tracking-wide drop-shadow-lg">
          🎁 タップしてギフトを開けよう！
        </p>
        <p className="text-white/60 text-sm mt-1 tracking-widest uppercase">
          Tap to open your gift
        </p>
      </div>
    </div>
  )
}
