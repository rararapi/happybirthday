import { Stars, OrbitControls } from '@react-three/drei'
import BirthdayCake from './BirthdayCake'
import Table from './Table'
import Balloons from './Balloons'

interface Props {
  extinguish: number
}

export default function Scene({ extinguish }: Props) {
  return (
    <>
      <Stars radius={100} depth={65} count={3600} factor={4.6} saturation={0.35} fade speed={0.9} />

      {/* 照明 — ケーキを明るくする */}
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#ffe8d6', '#1a0a3d', 0.5]} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#fff8f0" />
      <directionalLight position={[-4, 4, -4]} intensity={0.6} color="#c8b8ff" />
      <directionalLight position={[0, -2, 6]} intensity={0.4} color="#ffe0b0" />

      {/* パーティー雰囲気の色付きライト */}
      <pointLight position={[-4, 3, -1]} color="#ff69b4" intensity={0.8} distance={10} decay={2} />
      <pointLight position={[4, 2, -2]} color="#4169e1" intensity={0.6} distance={10} decay={2} />
      <pointLight position={[0, 4, 2]} color="#ffd700" intensity={0.5} distance={10} decay={2} />

      <Table />
      <BirthdayCake extinguish={extinguish} />
      <Balloons />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.6}
        enableRotate={false}
        enableZoom={false}
        enablePan={false}
      />
    </>
  )
}
