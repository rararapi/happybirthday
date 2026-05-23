import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGiftName } from './hooks/useGiftName'
import { useConfetti } from './hooks/useConfetti'
import Scene from './components/Scene'
import CTAOverlay from './components/CTAOverlay'
import MessageCard from './components/MessageCard'

export type GiftState = 'closed' | 'opening' | 'opened'

export default function App() {
  const name = useGiftName()
  const [giftState, setGiftState] = useState<GiftState>('closed')
  const { fireConfetti } = useConfetti()

  function handleOpen() {
    if (giftState !== 'closed') return
    setGiftState('opening')
    setTimeout(() => {
      fireConfetti()
      setGiftState('opened')
    }, 1200)
  }

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0.3, 5], fov: 55 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene state={giftState} onOpen={handleOpen} />
      </Canvas>

      {giftState === 'closed' && <CTAOverlay />}
      {giftState === 'opened' && <MessageCard name={name} />}
    </div>
  )
}
