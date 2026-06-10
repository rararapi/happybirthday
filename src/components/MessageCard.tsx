import { useState } from 'react'
import { birthdayMessage } from '../data/messages'

interface Props {
  name: string
  age: number | null
  onReplay: () => void
}

export default function MessageCard({ name, age, onReplay }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Happy Birthday!', url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // ユーザーによるシェアキャンセル（AbortError）などは無視
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-5 pointer-events-none">
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center animate-fade-in pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div className="text-5xl mb-3">🎂</div>

        <h1 className="text-3xl font-bold text-white mb-1 leading-tight">
          Happy Birthday!
        </h1>
        {name && (
          <p className="text-2xl font-bold mb-1" style={{ color: '#fdcb6e' }}>
            {name}
          </p>
        )}
        {age !== null && (
          <p className="text-base text-white/80 mb-2">🎉 {age}さい おめでとう!</p>
        )}

        <p className="text-white/70 text-sm mt-5 leading-relaxed px-2">
          {birthdayMessage}
        </p>

        <div className="flex justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={onReplay}
            className="px-5 py-2 rounded-full text-sm text-white/90"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            🕯️ もう一度
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="px-5 py-2 rounded-full text-sm text-white/90"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            🔗 シェア
          </button>
        </div>
        {copied && (
          <p className="text-xs text-white/60 mt-3">リンクをコピーしました</p>
        )}
      </div>
    </div>
  )
}
