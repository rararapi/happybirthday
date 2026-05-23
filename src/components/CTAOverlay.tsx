export default function CTAOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 pointer-events-none">
      <div className="flex flex-col items-center gap-2 animate-bounce">
        <p className="text-white text-lg font-bold tracking-wide drop-shadow-lg">
          🕯️ 長押しでろうそくを吹き消そう
        </p>
        <p className="text-white/50 text-xs tracking-widest uppercase">
          Hold anywhere
        </p>
      </div>
    </div>
  )
}
