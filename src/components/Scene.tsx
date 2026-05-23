import { Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import GiftBox from './GiftBox'
import type { GiftState } from '../App'

interface Props {
  state: GiftState
  onOpen: () => void
}

export default function Scene({ state, onOpen }: Props) {
  return (
    <>
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-4, 3, -4]} intensity={0.4} color="#cc88ff" />

      <GiftBox state={state} onOpen={onOpen} />

      <EffectComposer>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
