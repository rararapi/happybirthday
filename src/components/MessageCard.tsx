import { birthdayMessage } from '../data/messages'

interface Props {
  name: string
}

export default function MessageCard({ name }: Props) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-5 pointer-events-none">
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center animate-fade-in pointer-events-auto"
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
          <p className="text-2xl font-bold mb-4" style={{ color: '#fdcb6e' }}>
            {name}
          </p>
        )}

        <p className="text-white/70 text-sm mt-5 leading-relaxed px-2">
          {birthdayMessage}
        </p>
      </div>
    </div>
  )
}
