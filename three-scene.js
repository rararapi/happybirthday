import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ── Renderer & Scene ──────────────────────────────────────────────────────────
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 600;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

const canvas = renderer.domElement;
canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;';
document.body.appendChild(canvas);

// ── Post-processing ───────────────────────────────────────────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.6,  // strength
  0.9,  // radius
  0.18  // threshold — low so stars/sparks/trails all bloom
);
composer.addPass(bloomPass);

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloomPass.resolution.set(w, h);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function screenToWorld(sx, sy) {
  const v = new THREE.Vector3(
    (sx / window.innerWidth)  * 2 - 1,
    -(sy / window.innerHeight) * 2 + 1,
    0.5
  ).unproject(camera);
  const dir = v.sub(camera.position).normalize();
  const t   = -camera.position.z / dir.z;
  return camera.position.clone().addScaledVector(dir, t);
}

function makeGlowTex(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0,   'rgba(255,255,255,1)');
  g.addColorStop(0.15,'rgba(255,255,255,0.9)');
  g.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
const glowTex = makeGlowTex();

// ── Star Field — 5 twinkling batches ─────────────────────────────────────────
const STAR_COUNT  = 2000;
const NUM_BATCHES = 5;
const starBatches = [];
const starsGroup  = new THREE.Group();
scene.add(starsGroup);

(function initStars() {
  const perBatch = Math.floor(STAR_COUNT / NUM_BATCHES);
  for (let b = 0; b < NUM_BATCHES; b++) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(perBatch * 3);
    const col = new Float32Array(perBatch * 3);
    for (let i = 0; i < perBatch; i++) {
      pos[i*3]   = (Math.random()-0.5) * 1600;
      pos[i*3+1] = (Math.random()-0.5) * 1200;
      pos[i*3+2] = (Math.random()-0.5) * 400;
      const warm = Math.random();
      col[i*3]   = 0.82 + warm * 0.18;
      col[i*3+1] = 0.88;
      col[i*3+2] = 1.0  - warm * 0.25;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 2 + b * 0.6,
      map: glowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const pts = new THREE.Points(geo, mat);
    starsGroup.add(pts);
    starBatches.push({ mat, phase: (b / NUM_BATCHES) * Math.PI * 2, speed: 0.35 + b * 0.28 });
  }
})();

function tickStars(time) {
  starsGroup.rotation.y += 0.0001;
  starBatches.forEach(b => {
    b.mat.opacity = 0.4 + 0.38 * Math.sin(time * b.speed + b.phase);
  });
}

// ── Shell Launch (realistic rising trail) ─────────────────────────────────────
const TRAIL_SIZE  = 22;
const liveShells  = [];

function spawnShell(sx, sy, colors, count, lifetime) {
  const target   = screenToWorld(sx, sy);
  const launchSY = window.innerHeight + 40;
  const start    = screenToWorld(sx, launchSY);
  const travelTime = 0.22 + Math.abs(target.y - start.y) / 750;

  // Trail positions (circular shift each tick)
  const trailBuf = new Float32Array(TRAIL_SIZE * 3);
  for (let i = 0; i < TRAIL_SIZE; i++) {
    trailBuf[i*3] = start.x; trailBuf[i*3+1] = start.y; trailBuf[i*3+2] = start.z;
  }
  // Trail color: warm white at head → dim orange-red at tail
  const colBuf = new Float32Array(TRAIL_SIZE * 3);
  for (let i = 0; i < TRAIL_SIZE; i++) {
    const f = Math.pow(1 - i / TRAIL_SIZE, 1.8);
    colBuf[i*3]   = 1;
    colBuf[i*3+1] = 0.55 * f + 0.1;
    colBuf[i*3+2] = 0.15 * f;
  }

  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailBuf, 3));
  trailGeo.setAttribute('color',    new THREE.BufferAttribute(colBuf,   3));
  const trailMat = new THREE.PointsMaterial({
    size: 7,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    map: glowTex
  });
  const trailPts = new THREE.Points(trailGeo, trailMat);
  scene.add(trailPts);

  liveShells.push({
    start: start.clone(),
    target: target.clone(),
    pos: start.clone(),
    elapsed: 0,
    travelTime,
    trailBuf,
    trailGeo,
    trailMat,
    trailPts,
    colors, count, lifetime
  });
}

function tickShells(dt) {
  for (let i = liveShells.length - 1; i >= 0; i--) {
    const s = liveShells[i];
    s.elapsed += dt;
    const t = Math.min(s.elapsed / s.travelTime, 1);
    s.pos.lerpVectors(s.start, s.target, t);

    // Shift trail positions toward tail
    const arr = s.trailBuf;
    for (let j = TRAIL_SIZE - 1; j > 0; j--) {
      arr[j*3]   = arr[(j-1)*3];
      arr[j*3+1] = arr[(j-1)*3+1];
      arr[j*3+2] = arr[(j-1)*3+2];
    }
    arr[0] = s.pos.x;
    arr[1] = s.pos.y;
    arr[2] = s.pos.z;
    s.trailGeo.attributes.position.needsUpdate = true;

    if (t >= 1) {
      spawnExplosion(s.target, s.colors, s.count, s.lifetime);
      scene.remove(s.trailPts);
      s.trailGeo.dispose();
      s.trailMat.dispose();
      liveShells.splice(i, 1);
    }
  }
}

// ── Firework Explosion (physics: drag + gravity) ───────────────────────────────
const FIREWORK_COLORS = [
  0xff6b6b, 0x4ecdc4, 0xffd93d, 0xff85c0,
  0x95e1d3, 0xf38181, 0xaa96da, 0xff9f43,
  0x54a0ff, 0xffeaa7, 0xa29bfe, 0xfd79a8
];
const RAINBOW_COLORS = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3];
const FW_GRAVITY     = 85;  // world units/s²
const liveFireworks  = [];

function spawnExplosion(origin, colors, count, lifetime) {
  const isRainbow = colors === RAINBOW_COLORS;
  const mainColor = isRainbow ? null : new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);

  const vx  = new Float32Array(count);
  const vy  = new Float32Array(count);
  const vz  = new Float32Array(count);
  const drg = new Float32Array(count); // drag coefficient per second (0–1)
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Uniform sphere distribution
    const cosT = Math.random() * 2 - 1;
    const sinT = Math.sqrt(1 - cosT * cosT);
    const phi  = Math.random() * Math.PI * 2;
    const spd  = 42 + Math.random() * 115;

    vx[i]  = sinT * Math.cos(phi) * spd;
    vy[i]  = sinT * Math.sin(phi) * spd;
    vz[i]  = cosT * spd * 0.18;
    drg[i] = 0.87 + Math.random() * 0.08; // spread of drag → longer/shorter trails

    pos[i*3] = origin.x; pos[i*3+1] = origin.y; pos[i*3+2] = origin.z;

    // First 15% of particles: bright white glitter core
    let c;
    if (i < count * 0.15) {
      c = new THREE.Color(1, 0.97, 0.88);
    } else {
      c = isRainbow
        ? new THREE.Color(RAINBOW_COLORS[i % 7])
        : mainColor.clone().multiplyScalar(0.75 + Math.random() * 0.5);
    }
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: isRainbow ? 10 : 8,
    map: glowTex,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);

  liveFireworks.push({
    pts, geo, mat, vx, vy, vz, drg,
    lifetime, elapsed: 0, count,
    gravity: isRainbow ? FW_GRAVITY * 1.7 : FW_GRAVITY
  });
}

function tickFireworks(dt) {
  for (let i = liveFireworks.length - 1; i >= 0; i--) {
    const fw = liveFireworks[i];
    fw.elapsed += dt;
    const t = fw.elapsed / fw.lifetime;

    if (t >= 1) {
      scene.remove(fw.pts);
      fw.geo.dispose();
      fw.mat.dispose();
      liveFireworks.splice(i, 1);
      continue;
    }

    const pos = fw.geo.attributes.position.array;
    for (let j = 0; j < fw.count; j++) {
      const d = Math.pow(fw.drg[j], dt); // frame-rate independent drag
      fw.vx[j] *= d;
      fw.vy[j] *= d;
      fw.vz[j] *= d;
      fw.vy[j] -= fw.gravity * dt;
      pos[j*3]   += fw.vx[j] * dt;
      pos[j*3+1] += fw.vy[j] * dt;
      pos[j*3+2] += fw.vz[j] * dt;
    }
    fw.geo.attributes.position.needsUpdate = true;

    // Bright for first 55% of life, then smooth fade
    fw.mat.opacity = t < 0.55 ? 1.0 : Math.pow((1 - t) / 0.45, 1.3);
  }
}

// ── Confetti (air drag + terminal velocity) ────────────────────────────────────
const CONFETTI_COLORS = [
  0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xffd93d,
  0xff85c0, 0x95e1d3, 0xf38181, 0xaa96da, 0xff9f43
];
const confettiGeo = new THREE.PlaneGeometry(3, 6);
const liveConfetti = [];
const CONFETTI_MAX  = 350;
const CONFETTI_G    = -30; // world units/s²

function spawnConfetti() {
  while (liveConfetti.length + 100 > CONFETTI_MAX) {
    const old = liveConfetti.shift();
    scene.remove(old.mesh);
    old.mat.dispose();
  }

  const topY = screenToWorld(window.innerWidth / 2, -20).y;

  for (let i = 0; i < 100; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(confettiGeo, mat);
    const startX = screenToWorld(Math.random() * window.innerWidth, 0).x;
    mesh.position.set(startX, topY + Math.random() * 60, (Math.random()-0.5) * 80);
    mesh.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    liveConfetti.push({
      mesh, mat,
      vx: (Math.random()-0.5) * 22,
      vy: -(55 + Math.random() * 45),
      vz: (Math.random()-0.5) * 7,
      rx: (Math.random()-0.5) * 2.5,
      ry: (Math.random()-0.5) * 4.5,
      rz: (Math.random()-0.5) * 2,
      dragH:   0.90 + Math.random() * 0.06,
      termVel: -(38 + Math.random() * 22),
      life: 5 + Math.random() * 3
    });
    scene.add(mesh);
  }
}

function tickConfetti(dt, time) {
  const wind = Math.sin(time * 0.38) * 14 + Math.sin(time * 1.07) * 7;
  for (let i = liveConfetti.length - 1; i >= 0; i--) {
    const p = liveConfetti[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mat.dispose();
      liveConfetti.splice(i, 1);
      continue;
    }
    p.vx *= Math.pow(p.dragH, dt);
    p.vx += wind * dt * 0.07;
    p.vy += CONFETTI_G * dt;
    if (p.vy < p.termVel) p.vy = p.termVel;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    p.mesh.rotation.x += p.rx * dt;
    p.mesh.rotation.y += p.ry * dt;
    p.mesh.rotation.z += p.rz * dt;
    if (p.life < 1.5) p.mat.opacity = p.life / 1.5;
  }
}

// ── Gold Sparkles ─────────────────────────────────────────────────────────────
const SPARKLE_COLORS = [0xffd700, 0xffeaa7, 0xffa500, 0xffffff, 0xffe4b5];
const liveSparkles   = [];
let lastSparkleT     = 0;

function tickSparkles(dt, time) {
  if (time - lastSparkleT >= 0.38) {
    lastSparkleT = time;
    const n   = 2 + Math.floor(Math.random() * 3);
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const w = screenToWorld(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight * 0.9
      );
      pos[i*3] = w.x; pos[i*3+1] = w.y; pos[i*3+2] = w.z;
      const sc = new THREE.Color(SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)]);
      col[i*3] = sc.r; col[i*3+1] = sc.g; col[i*3+2] = sc.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 18,
      map: glowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    liveSparkles.push({ pts, geo, mat, life: 1.0 });
  }

  for (let i = liveSparkles.length - 1; i >= 0; i--) {
    const s = liveSparkles[i];
    s.life -= dt;
    if (s.life <= 0) {
      scene.remove(s.pts);
      s.geo.dispose();
      s.mat.dispose();
      liveSparkles.splice(i, 1);
      continue;
    }
    const t = 1 - s.life;
    s.mat.opacity = Math.sin(t * Math.PI);
    s.pts.scale.setScalar(0.4 + Math.sin(t * Math.PI) * 1.1);
  }
}

// ── Candle Glow (3-layer: core + mid + outer) ─────────────────────────────────
const candleLightData = [];
const glowGeo = new THREE.SphereGeometry(4, 10, 10);

function initCandleLights() {
  const candles = document.querySelectorAll('.candle');
  candles.forEach((el, i) => {
    const target = el.querySelector('.flame') || el;
    const rect   = target.getBoundingClientRect();
    const wp     = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const z      = 62;

    const matCore = new THREE.MeshBasicMaterial({
      color: 0xfff8e0, transparent: true, opacity: 1.0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const core = new THREE.Mesh(glowGeo, matCore);
    core.position.set(wp.x, wp.y + 5, z);
    core.scale.setScalar(0.45);
    scene.add(core);

    const matMid = new THREE.MeshBasicMaterial({
      color: 0xff9922, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const mid = new THREE.Mesh(glowGeo, matMid);
    mid.position.copy(core.position);
    mid.scale.setScalar(1.3);
    scene.add(mid);

    const matOuter = new THREE.MeshBasicMaterial({
      color: 0xff4400, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const outer = new THREE.Mesh(glowGeo, matOuter);
    outer.position.copy(core.position);
    outer.scale.setScalar(2.8);
    scene.add(outer);

    candleLightData.push({
      core, matCore,
      mid,  matMid,
      outer, matOuter,
      // Three independent sine waves at different frequencies for organic flicker
      offset: i * 1.27 + Math.random() * 0.6,
      active: true
    });
  });
}

function tickCandleLights(time) {
  candleLightData.forEach(cl => {
    if (!cl.active) return;
    const f = 1
      + Math.sin(time * 11.3  + cl.offset)        * 0.14
      + Math.sin(time * 19.7  + cl.offset * 1.8)  * 0.07
      + Math.sin(time *  5.1  + cl.offset * 0.7)  * 0.04;

    cl.matCore.opacity  = Math.min(1.0, f);
    cl.matMid.opacity   = Math.max(0, 0.48 * f);
    cl.matOuter.opacity = Math.max(0, 0.16 * f);

    cl.core.scale.setScalar(0.45 * f);
    cl.mid.scale.setScalar(1.3  * f);
    cl.outer.scale.setScalar(2.8 * f);
  });
}

// ── Animation Loop ────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt   = Math.min(clock.getDelta(), 0.05);
  const time = clock.getElapsedTime();

  tickStars(time);
  tickShells(dt);
  tickFireworks(dt);
  tickConfetti(dt, time);
  tickSparkles(dt, time);
  tickCandleLights(time);

  composer.render();
}

// ── Public API ────────────────────────────────────────────────────────────────
window.ThreeScene = {
  firework(sx, sy) {
    spawnShell(sx, sy, FIREWORK_COLORS, 100, 2.2);
  },
  rainbowFirework(sx, sy) {
    spawnShell(sx, sy, RAINBOW_COLORS, 130, 2.8);
  },
  confetti() {
    spawnConfetti();
  },
  blowCandle(index) {
    const cl = candleLightData[index];
    if (!cl || !cl.active) return;
    cl.active = false;
    const t0 = performance.now();
    const io = cl.matCore.opacity, mo = cl.matMid.opacity, oo = cl.matOuter.opacity;
    const fade = () => {
      const p    = Math.min((performance.now() - t0) / 500, 1);
      const ease = 1 - p * p;
      cl.matCore.opacity  = io * ease;
      cl.matMid.opacity   = mo * ease;
      cl.matOuter.opacity = oo * ease;
      if (p < 1) requestAnimationFrame(fade);
    };
    fade();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initCandleLights, 300));
} else {
  setTimeout(initCandleLights, 300);
}

animate();
