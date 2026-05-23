export default function Table() {
  const legPositions: [number, number, number][] = [
    [1.5, -1.0, 0],
    [-1.5, -1.0, 0],
    [0, -1.0, 1.5],
    [0, -1.0, -1.5],
  ];

  return (
    // グループ全体を下に配置
    <group position={[0, -2.05, 0]}>
      {/* 天板（木） */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2.3, 2.3, 0.18, 48]} />
        <meshStandardMaterial
          color="#7B4A1E"
          emissive="#7B4A1E"
          emissiveIntensity={0.08}
          roughness={0.75}
          metalness={0}
        />
      </mesh>

      {/* テーブルクロス（天板より少し大きく） */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[2.45, 2.45, 0.06, 48]} />
        <meshStandardMaterial
          color="#fffbf4"
          emissive="#fffbf4"
          emissiveIntensity={0.12}
          roughness={0.9}
        />
      </mesh>

      {/* テーブルクロス垂れ下がり */}
      <mesh position={[0, -0.38, 0]}>
        <cylinderGeometry args={[2.44, 2.44, 0.75, 48, 1, true]} />
        <meshStandardMaterial
          color="#fffbf4"
          emissive="#fffbf4"
          emissiveIntensity={0.12}
          roughness={0.9}
          side={2}
        />
      </mesh>

      {/* テーブルクロス裾（底） */}
      <mesh position={[0, -0.76, 0]}>
        <cylinderGeometry args={[2.44, 2.44, 0.04, 48]} />
        <meshStandardMaterial
          color="#fffbf4"
          emissive="#fffbf4"
          emissiveIntensity={0.12}
          roughness={0.9}
        />
      </mesh>

      {/* 脚 */}
      {legPositions.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <cylinderGeometry args={[0.09, 0.11, 1.8, 10]} />
          <meshStandardMaterial
            color="#5C3510"
            emissive="#5C3510"
            emissiveIntensity={0.08}
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
