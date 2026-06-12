import Candle from "./Candle";

interface TierConfig {
  radius: number;
  height: number;
  color: string;
  frostColor: string;
  baseY: number;
}

const TIERS: TierConfig[] = [
  {
    radius: 1.45,
    height: 0.9,
    color: "#f8b4c8",
    frostColor: "#fff0f5",
    baseY: 0.0,
  },
  {
    radius: 1.08,
    height: 0.72,
    color: "#d4b8e0",
    frostColor: "#f5f0ff",
    baseY: 0.9,
  },
  {
    radius: 0.78,
    height: 0.58,
    color: "#b4e4d4",
    frostColor: "#f0fff8",
    baseY: 1.62,
  },
];

const CANDLE_COLORS = ["#fdcb6e", "#fd79a8", "#74b9ff", "#55efc4", "#a29bfe"];

interface CakeTierProps extends TierConfig {}

function CakeTier({ radius, height, color, frostColor, baseY }: CakeTierProps) {
  const centerY = baseY + height / 2;
  return (
    <group position={[0, centerY, 0]}>
      {/* Main body */}
      <mesh>
        <cylinderGeometry args={[radius, radius * 1.015, height, 40]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.45}
        />
      </mesh>

      {/* Frosting cap on top */}
      <mesh position={[0, height / 2 + 0.035, 0]}>
        <cylinderGeometry args={[radius + 0.03, radius + 0.03, 0.07, 40]} />
        <meshStandardMaterial
          color={frostColor}
          emissive={frostColor}
          emissiveIntensity={0.15}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

// 段上面のY座標（フロスティングキャップの上面）
function tierTopY(tier: TierConfig) {
  return tier.baseY + tier.height + 0.07;
}

interface DecorRing {
  radius: number;
  y: number;
  count: number;
  angleOffset: number;
}

// イチゴ: 各段の外縁寄りに配置（ろうそくリングと半径をずらして干渉回避）
const STRAWBERRY_RINGS: DecorRing[] = [
  { radius: 1.35, y: tierTopY(TIERS[0]), count: 6, angleOffset: 0 },
  { radius: 1.0, y: tierTopY(TIERS[1]), count: 4, angleOffset: Math.PI / 4 },
];

function Strawberry({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.09, 0]} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial
          color="#e84545"
          emissive="#e84545"
          emissiveIntensity={0.2}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.035, 0.05, 6]} />
        <meshStandardMaterial color="#4caf6d" roughness={0.6} />
      </mesh>
    </group>
  );
}

function CreamDollop({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} scale={[1, 0.85, 1]}>
      <sphereGeometry args={[0.06, 8, 6]} />
      <meshStandardMaterial
        color="#fffaf2"
        emissive="#fffaf2"
        emissiveIntensity={0.18}
        roughness={0.25}
      />
    </mesh>
  );
}

function CakeDecorations() {
  const topY = tierTopY(TIERS[2]);

  return (
    <group>
      {/* イチゴ + 間の生クリーム */}
      {STRAWBERRY_RINGS.map((ring, ri) => (
        <group key={ri}>
          {Array.from({ length: ring.count }, (_, i) => {
            const a = (i / ring.count) * Math.PI * 2 + ring.angleOffset;
            const mid = a + Math.PI / ring.count;
            return (
              <group key={i}>
                <Strawberry
                  position={[
                    Math.cos(a) * ring.radius,
                    ring.y,
                    Math.sin(a) * ring.radius,
                  ]}
                />
                <CreamDollop
                  position={[
                    Math.cos(mid) * ring.radius,
                    ring.y + 0.05,
                    Math.sin(mid) * ring.radius,
                  ]}
                />
              </group>
            );
          })}
        </group>
      ))}

      {/* 上段の縁を囲む生クリームリング */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return (
          <CreamDollop
            key={i}
            position={[Math.cos(a) * 0.68, topY + 0.03, Math.sin(a) * 0.68]}
          />
        );
      })}

      {/* チョコスティック */}
      {[
        { a: 0.7, tilt: 0.35 },
        { a: 2.4, tilt: -0.3 },
        { a: 4.4, tilt: 0.28 },
      ].map(({ a, tilt }, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 0.45, topY + 0.18, Math.sin(a) * 0.45]}
          rotation={[tilt, a, tilt * 0.6]}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.45, 6]} />
          <meshStandardMaterial color="#5a3825" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ろうそくリング定義（上から順に埋める）
// y はろうそく中心: 段上面 + 0.05（めり込み余白）+ 0.25（ろうそく半分の高さ）
// 先頭4リングは従来配置（30本まで見た目を維持）。以降は大人数用のオーバーフローリング。
const CANDLE_RINGS = [
  { radius: 0, y: tierTopY(TIERS[2]) + 0.3, capacity: 1, angleOffset: 0 }, // 上段中央
  { radius: TIERS[2].radius * 0.58, y: tierTopY(TIERS[2]) + 0.3, capacity: 6, angleOffset: 0 }, // 上段リング
  { radius: 0.9, y: tierTopY(TIERS[1]) + 0.3, capacity: 10, angleOffset: 0.3 }, // 中段リング
  { radius: 1.2, y: tierTopY(TIERS[0]) + 0.3, capacity: 13, angleOffset: 0.15 }, // 下段リング
  { radius: 0.65, y: tierTopY(TIERS[2]) + 0.3, capacity: 25, angleOffset: 0.12 }, // 上段外周
  { radius: 0.26, y: tierTopY(TIERS[2]) + 0.3, capacity: 10, angleOffset: 0.5 }, // 上段内周
  { radius: 1.02, y: tierTopY(TIERS[1]) + 0.3, capacity: 36, angleOffset: 0.1 }, // 中段外周
  { radius: 1.38, y: tierTopY(TIERS[0]) + 0.3, capacity: 50, angleOffset: 0.07 }, // 下段外周
  { radius: 1.55, y: 0.3, capacity: 55, angleOffset: 0.05 }, // お皿の縁（皿上面 y=0 基準）
];

export const MAX_CANDLES = CANDLE_RINGS.reduce((sum, r) => sum + r.capacity, 0);

function buildCandlePositions(count: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  let remaining = Math.min(Math.max(count, 1), MAX_CANDLES);

  for (const ring of CANDLE_RINGS) {
    if (remaining <= 0) break;
    const n = Math.min(remaining, ring.capacity);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring.angleOffset;
      positions.push([
        Math.cos(a) * ring.radius,
        ring.y,
        Math.sin(a) * ring.radius,
      ]);
    }
    remaining -= n;
  }

  return positions;
}

// パフォーマンスのため pointLight を持つろうそくは先頭5本まで
// （炎は加算ブレンドで自発光に見えるためライトなしでも違和感がない）
const MAX_CANDLE_LIGHTS = 5;

interface Props {
  extinguish: number;
  candleCount?: number;
}

export default function BirthdayCake({ extinguish, candleCount = 5 }: Props) {
  const candlePositions = buildCandlePositions(candleCount);

  return (
    <group position={[0, -1.86, 0]}>
      {/* Plate */}
      <mesh position={[0, -0.045, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 0.09, 48]} />
        <meshStandardMaterial
          color="#f5f5f0"
          emissive="#f5f5f0"
          emissiveIntensity={0.12}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>

      {/* Cake tiers */}
      {TIERS.map((t, i) => (
        <CakeTier key={i} {...t} />
      ))}

      {/* Decorations */}
      <CakeDecorations />

      {/* Candles */}
      {candlePositions.map((pos, i) => (
        <Candle
          key={i}
          position={pos}
          extinguish={extinguish}
          color={CANDLE_COLORS[i % CANDLE_COLORS.length]}
          withLight={i < MAX_CANDLE_LIGHTS}
        />
      ))}
    </group>
  );
}
