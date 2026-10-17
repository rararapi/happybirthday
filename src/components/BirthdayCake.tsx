import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import Candles, { type Vec3 } from "./Candles";

interface TierConfig {
  radius: number;
  height: number;
  color: string;
  pipingColor: string;
  baseY: number;
}

// height にはクリームの盛り上がり分（0.07）を含めない。上面は tierTopY() を使う
const TIERS: TierConfig[] = [
  { radius: 1.45, height: 0.9, color: "#efc3cb", pipingColor: "#fff8ef", baseY: 0.0 },
  { radius: 1.08, height: 0.72, color: "#f7eee3", pipingColor: "#f3c9d0", baseY: 0.9 },
  { radius: 0.78, height: 0.58, color: "#f3d1d7", pipingColor: "#fff8ef", baseY: 1.62 },
];

// 段上面のY座標
function tierTopY(tier: TierConfig) {
  return tier.baseY + tier.height + 0.07;
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

function buildCandlePositions(count: number): Vec3[] {
  const positions: Vec3[] = [];
  let remaining = Math.min(Math.max(count, 1), MAX_CANDLES);

  for (const ring of CANDLE_RINGS) {
    if (remaining <= 0) break;
    const n = Math.min(remaining, ring.capacity);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring.angleOffset;
      positions.push([Math.cos(a) * ring.radius, ring.y, Math.sin(a) * ring.radius]);
    }
    remaining -= n;
  }

  return positions;
}

// 同じ段のろうそくと重ならない位置か（飾りの間引き用）
function clearOfCandles(x: number, y: number, z: number, candles: Vec3[], minDist: number) {
  return candles.every(([cx, cy, cz]) => Math.abs(cy - 0.3 - y) > 0.12 || Math.hypot(cx - x, cz - z) > minDist);
}

function seeded(i: number) {
  const x = Math.sin(i * 91.7 + 17.3) * 12731.31;
  return x - Math.floor(x);
}

// クリーム表面の細かな凹凸（ノーマルマップ）を手続き生成する
function makeCreamNormalMap() {
  const size = 128;
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      height[y * size + x] =
        Math.sin(u * 3 + Math.sin(v * 2) * 1.5) * 0.5 +
        Math.sin(u * 7 + v * 5 + Math.sin(u * 2)) * 0.25 +
        Math.sin(u * 17 - v * 13) * 0.12 +
        (seeded(y * size + x) - 0.5) * 0.18;
    }
  }
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h = (xx: number, yy: number) => height[((yy + size) % size) * size + ((xx + size) % size)];
      const dx = (h(x + 1, y) - h(x - 1, y)) * 1.5;
      const dy = (h(x, y + 1) - h(x, y - 1)) * 1.5;
      const n = new THREE.Vector3(-dx, -dy, 1).normalize();
      const o = (y * size + x) * 4;
      data[o] = (n.x * 0.5 + 0.5) * 255;
      data[o + 1] = (n.y * 0.5 + 0.5) * 255;
      data[o + 2] = (n.z * 0.5 + 0.5) * 255;
      data[o + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.needsUpdate = true;
  return tex;
}

// 角を丸めた段の回転体（側面 + 上面）
function makeTierGeometry(radius: number, height: number) {
  const h = height + 0.07;
  const bevel = 0.07;
  const pts: THREE.Vector2[] = [new THREE.Vector2(radius * 0.985, 0), new THREE.Vector2(radius, 0.03)];
  for (let i = 0; i <= 5; i++) {
    // 側面に緩いうねり（手塗りのクリーム）
    const y = 0.03 + ((h - bevel - 0.03) * i) / 5;
    pts.push(new THREE.Vector2(radius + Math.sin(i * 1.7) * 0.004, y));
  }
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(radius - bevel + Math.cos(a) * bevel, h - bevel + Math.sin(a) * bevel));
  }
  pts.push(new THREE.Vector2(radius * 0.5, h + 0.004));
  pts.push(new THREE.Vector2(0, h));
  return new THREE.LatheGeometry(pts, 72);
}

// 星口金で絞ったクリーム（ねじれた溝のある玉ねぎ形）
function makeRosetteGeometry() {
  const pts: THREE.Vector2[] = [];
  const steps = 9;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = Math.pow(1 - t, 0.75) * (1 + 0.35 * Math.sin(Math.PI * t));
    pts.push(new THREE.Vector2(Math.max(r, 0.0001), t * 1.25));
  }
  const geo = new THREE.LatheGeometry(pts, 20);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const twist = Math.atan2(z, x) + y * 1.6;
    const f = 1 + 0.14 * Math.cos(8 * twist);
    pos.setXYZ(i, x * f, y, z * f);
  }
  geo.computeVertexNormals();
  return geo;
}

// 先端が上を向いたイチゴ
function makeStrawberryGeometry() {
  const pts: THREE.Vector2[] = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // 0 = ヘタ側, 1 = 先端
    const r = Math.sin(Math.PI * (0.12 + t * 0.88)) * (1.05 - t * 0.45);
    pts.push(new THREE.Vector2(Math.max(r * 0.5, 0.0001), t * 1.15));
  }
  pts.unshift(new THREE.Vector2(0.0001, 0));
  const geo = new THREE.LatheGeometry(pts, 16);
  geo.computeVertexNormals();
  return geo;
}

interface Placement {
  position: Vec3;
  scale: number;
  rotY: number;
  tilt: number;
  color: string;
}

function InstancedPlacements({
  geometry,
  items,
  children,
  castShadow = false,
}: {
  geometry: THREE.BufferGeometry;
  items: Placement[];
  children: ReactNode;
  castShadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      e.set(it.tilt, it.rotY, it.tilt * 0.5);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(...it.position), q, new THREE.Vector3(it.scale, it.scale, it.scale));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.set(it.color));
    });
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);

  if (items.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, items.length]}
      castShadow={castShadow}
      receiveShadow
      key={items.length}
    >
      {children}
    </instancedMesh>
  );
}

function CakeDecorations({ candles }: { candles: Vec3[] }) {
  const geos = useMemo(
    () => ({
      rosette: makeRosetteGeometry(),
      strawberry: makeStrawberryGeometry(),
      calyx: new THREE.ConeGeometry(0.55, 0.12, 6, 1, true),
    }),
    []
  );

  const { piping, strawberries, calyxes } = useMemo(() => {
    const piping: Placement[] = [];
    TIERS.forEach((tier, ti) => {
      const top = tierTopY(tier);
      // 上面の縁の絞り
      const nTop = Math.round((Math.PI * 2 * (tier.radius - 0.05)) / 0.125);
      for (let i = 0; i < nTop; i++) {
        const a = (i / nTop) * Math.PI * 2;
        const r = tier.radius - 0.05;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        if (!clearOfCandles(x, top, z, candles, 0.11)) continue;
        piping.push({
          position: [x, top - 0.015, z],
          scale: 0.062 + seeded(ti * 100 + i) * 0.006,
          rotY: seeded(i + ti * 7) * 6.28,
          tilt: 0,
          color: tier.pipingColor,
        });
      }
      // 段の付け根の絞り（寝かせ気味）
      const nBase = Math.round((Math.PI * 2 * tier.radius) / 0.1);
      const baseY = ti === 0 ? 0 : tierTopY(TIERS[ti - 1]);
      for (let i = 0; i < nBase; i++) {
        const a = (i / nBase) * Math.PI * 2 + 0.05;
        piping.push({
          position: [Math.cos(a) * (tier.radius + 0.005), baseY - 0.01, Math.sin(a) * (tier.radius + 0.005)],
          scale: 0.048,
          rotY: seeded(i * 3 + ti) * 6.28,
          tilt: 0,
          color: tier.pipingColor,
        });
      }
    });

    const strawberries: Placement[] = [];
    const calyxes: Placement[] = [];
    const rings = [
      { tier: TIERS[0], radius: 1.3, count: 9, offset: 0 },
      { tier: TIERS[1], radius: 0.95, count: 7, offset: 0.4 },
    ];
    rings.forEach((ring, ri) => {
      const y = tierTopY(ring.tier);
      for (let i = 0; i < ring.count; i++) {
        const a = (i / ring.count) * Math.PI * 2 + ring.offset;
        const x = Math.cos(a) * ring.radius;
        const z = Math.sin(a) * ring.radius;
        if (!clearOfCandles(x, y, z, candles, 0.16)) continue;
        const s = 0.15 + seeded(i + ri * 31) * 0.03;
        const tilt = (seeded(i * 5 + ri) - 0.5) * 0.35;
        strawberries.push({ position: [x, y - 0.01, z], scale: s, rotY: a, tilt, color: "#ffffff" });
        calyxes.push({ position: [x, y + 0.005, z], scale: s * 0.9, rotY: a, tilt, color: "#ffffff" });
      }
    });

    return { piping, strawberries, calyxes };
  }, [candles]);

  const topY = tierTopY(TIERS[2]);

  return (
    <group>
      <InstancedPlacements geometry={geos.rosette} items={piping}>
        <meshPhysicalMaterial roughness={0.55} sheen={0.6} sheenRoughness={0.5} sheenColor="#ffffff" />
      </InstancedPlacements>

      <InstancedPlacements geometry={geos.strawberry} items={strawberries} castShadow>
        <meshPhysicalMaterial color="#b0112a" roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.25} />
      </InstancedPlacements>
      <InstancedPlacements geometry={geos.calyx} items={calyxes}>
        <meshStandardMaterial color="#3f7a3a" roughness={0.7} side={THREE.DoubleSide} />
      </InstancedPlacements>

      {/* チョコスティック */}
      {[
        { a: 0.7, tilt: 0.35 },
        { a: 2.4, tilt: -0.3 },
        { a: 4.4, tilt: 0.28 },
      ].map(({ a, tilt }, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 0.45, topY + 0.16, Math.sin(a) * 0.45]}
          rotation={[tilt, a, tilt * 0.6]}
          castShadow
        >
          <cylinderGeometry args={[0.022, 0.022, 0.42, 8]} />
          <meshStandardMaterial color="#3b2116" roughness={0.38} />
        </mesh>
      ))}
    </group>
  );
}

// 磁器の皿
function makePlateGeometry() {
  const pts = [
    new THREE.Vector2(0.0001, -0.07),
    new THREE.Vector2(1.45, -0.07),
    new THREE.Vector2(1.56, -0.05),
    new THREE.Vector2(1.66, -0.01),
    new THREE.Vector2(1.7, 0.012),
    new THREE.Vector2(1.67, 0.016),
    new THREE.Vector2(1.55, -0.012),
    new THREE.Vector2(1.45, -0.02),
    new THREE.Vector2(0.0001, -0.02),
  ];
  return new THREE.LatheGeometry(pts, 72);
}

interface Props {
  candleCount?: number;
  castShadows: boolean;
}

export default function BirthdayCake({ candleCount = 5, castShadows }: Props) {
  const candlePositions = useMemo(() => buildCandlePositions(candleCount), [candleCount]);
  const { tierGeos, plateGeo, creamNormal } = useMemo(
    () => ({
      tierGeos: TIERS.map((t) => makeTierGeometry(t.radius, t.height)),
      plateGeo: makePlateGeometry(),
      creamNormal: makeCreamNormalMap(),
    }),
    []
  );

  return (
    <group position={[0, -1.86, 0]}>
      <mesh geometry={plateGeo} receiveShadow>
        <meshPhysicalMaterial color="#f4f1ea" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>

      {TIERS.map((t, i) => (
        <mesh key={i} geometry={tierGeos[i]} position={[0, t.baseY, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={t.color}
            roughness={0.6}
            sheen={0.5}
            sheenRoughness={0.55}
            sheenColor="#ffffff"
            normalMap={creamNormal}
            normalScale={new THREE.Vector2(0.07, 0.07)}
          />
        </mesh>
      ))}

      <CakeDecorations candles={candlePositions} />
      <Candles positions={candlePositions} castShadows={castShadows} />
    </group>
  );
}
