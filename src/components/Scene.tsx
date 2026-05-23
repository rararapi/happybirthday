import { Stars, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import BirthdayCake from './BirthdayCake'

interface Props {
  extinguish: number
}

export default function Scene({ extinguish }: Props) {
  return (
    <>
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.4} />

      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 4]} intensity={0.9} color="#ffffff" />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} color="#aa99ff" />

      <BirthdayCake extinguish={extinguish} />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.7}
        enableRotate={false}
        enableZoom={false}
        enablePan={false}
      />

      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.25} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </>
  )
}
