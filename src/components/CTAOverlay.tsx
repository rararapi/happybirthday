export type MicState = 'off' | 'starting' | 'on' | 'denied'

interface Props {
  resumed?: boolean
  mic: MicState
  /** マイク非対応の環境では undefined */
  onEnableMic?: () => void
}

export default function CTAOverlay({ resumed = false, mic, onEnableMic }: Props) {
  const listening = mic === 'on'

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 pointer-events-none">
      <div className="flex flex-col items-center gap-2 animate-bounce">
        <p className="text-white text-lg font-bold tracking-wide drop-shadow-lg text-center px-4">
          {listening
            ? resumed
              ? 'もう一息！ マイクに ふーっ'
              : 'マイクに向かって ふーっ と吹いてね'
            : resumed
              ? 'もう一息！長押しで続きを吹き消そう'
              : '長押しでろうそくの火を吹き消そう'}
        </p>
        <p className="text-white/50 text-xs tracking-widest uppercase">
          {listening ? 'Blow into the mic · or hold anywhere' : 'Hold anywhere'}
        </p>
      </div>

      {onEnableMic && !listening && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onEnableMic}
          disabled={mic === 'starting'}
          className="mt-5 px-5 py-2 rounded-full text-sm text-white/90 pointer-events-auto disabled:opacity-50"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            touchAction: 'manipulation',
          }}
        >
          🎤 マイクで本当に吹き消す
        </button>
      )}
      {mic === 'denied' && (
        <p className="mt-2 text-xs text-white/50">マイクが使えないため、長押しで吹き消してね</p>
      )}
    </div>
  )
}
