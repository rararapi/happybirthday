function decryptName(encryptedValue) {
  var key = CryptoJS.enc.Utf8.parse('12345678901234567890123456789012');
  var iv  = CryptoJS.enc.Utf8.parse('1234567890123456');
  var base64Decoded = encryptedValue.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  var ciphertext = CryptoJS.enc.Base64.parse(base64Decoded);
  var decryptedData = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, {
    iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7
  });
  return decryptedData.toString(CryptoJS.enc.Utf8);
}

function getNameFromURL() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  if (name) return name.toUpperCase();
  const n_enc = params.get('n_enc');
  if (n_enc) return decryptName(n_enc);
  return '';
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function showMessage(msg) {
  const popup = document.getElementById('messagePopup');
  popup.textContent = msg;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 3000);
}

// ── 紙吹雪 ───────────────────────────────────────────────────────────────────
function startConfetti() {
  if (window.ThreeScene) {
    window.ThreeScene.confetti();
    return;
  }
  const container = document.getElementById('confettiContainer');
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#ff85c0', '#95e1d3'];
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.left = Math.random() * 100 + '%';
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.animationDelay = Math.random() * 3 + 's';
      el.style.animationDuration = (Math.random() * 3 + 2) + 's';
      container.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    }, i * 50);
  }
}

// ── バルーン ──────────────────────────────────────────────────────────────────
function createBalloons() {
  const container = document.getElementById('confettiContainer');
  const colors = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#ff85c0', '#95e1d3'];
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'balloon';
      el.style.left = Math.random() * 90 + '%';
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.animationDelay = Math.random() * 2 + 's';
      el.style.animationDuration = (Math.random() * 4 + 6) + 's';
      container.appendChild(el);
      setTimeout(() => el.remove(), 12000);
    }, i * 300);
  }
}

// ── 花火 ──────────────────────────────────────────────────────────────────────
function createFirework(x, y) {
  if (window.ThreeScene) {
    window.ThreeScene.firework(x, y);
    return;
  }
  const container = document.getElementById('confettiContainer');
  const colors = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#ff85c0', '#95e1d3'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div');
    el.className = 'firework-particle';
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.style.backgroundColor = color;
    const angle = (Math.PI * 2 * i) / 30;
    const vel = 2 + Math.random() * 2;
    el.style.setProperty('--tx', Math.cos(angle) * vel * 100 + 'px');
    el.style.setProperty('--ty', Math.sin(angle) * vel * 100 + 'px');
    container.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
}

function launchFireworks() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      createFirework(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight * 0.6
      );
    }, i * 800);
  }
}

// ── キラキラ ──────────────────────────────────────────────────────────────────
function createSparkles() {
  if (window.ThreeScene) return;
  const container = document.getElementById('confettiContainer');
  setInterval(() => {
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.style.left = Math.random() * 100 + '%';
    el.style.top  = Math.random() * 100 + '%';
    container.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }, 300);
}

// ── 虹花火 ────────────────────────────────────────────────────────────────────
function createRainbowFirework(x, y) {
  if (window.ThreeScene) {
    window.ThreeScene.rainbowFirework(x, y);
    vibrate([200, 100, 200]);
    return;
  }
  const container = document.getElementById('confettiContainer');
  const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div');
    el.className = 'firework-particle rainbow-particle';
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.style.backgroundColor = colors[i % colors.length];
    const angle = (Math.PI * 2 * i) / 50;
    const vel = 3 + Math.random() * 3;
    el.style.setProperty('--tx', Math.cos(angle) * vel * 100 + 'px');
    el.style.setProperty('--ty', Math.sin(angle) * vel * 100 + 'px');
    container.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
  vibrate([200, 100, 200]);
}

// ── メガ花火 ──────────────────────────────────────────────────────────────────
function createMegaFireworks() {
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      createFirework(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight * 0.7
      );
    }, i * 200);
  }
}

// ── マイク検知でろうそくを吹く ────────────────────────────────────────────────
let audioCtx = null;
let analyser = null;
let microphone = null;
let isListeningForBlow = false;

async function startBlowDetection() {
  if (isListeningForBlow) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    analyser   = audioCtx.createAnalyser();
    microphone = audioCtx.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 512;
    const data = new Uint8Array(analyser.frequencyBinCount);
    isListeningForBlow = true;
    showMessage('🎤 息を吹きかけて！');
    const check = () => {
      if (!isListeningForBlow) return;
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b) / data.length;
      if (avg > 40) {
        blowOutCandles();
        stopBlowDetection();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  } catch {
    blowOutCandles(); // マイク不可の場合は直接消す
  }
}

function stopBlowDetection() {
  isListeningForBlow = false;
  if (microphone) { microphone.disconnect(); microphone = null; }
  if (audioCtx)   { audioCtx.close(); audioCtx = null; }
}

// ── ろうそくを消す ────────────────────────────────────────────────────────────
function blowOutCandles() {
  const candles = document.querySelectorAll('.candle:not(.blown)');
  if (candles.length === 0) return;
  vibrate([100, 50, 100]);
  candles.forEach((candle, idx) => {
    setTimeout(() => {
      candle.classList.add('blown');
      window.ThreeScene?.blowCandle(parseInt(candle.dataset.index));
      const total = document.querySelectorAll('.candle').length;
      const blown = document.querySelectorAll('.candle.blown').length;
      if (total === blown) {
        setTimeout(() => {
          showMessage('🎂 おめでとう！ 🎉');
          createMegaFireworks();
          vibrate([200, 100, 200, 100, 200]);
        }, 500);
      }
    }, idx * 300);
  });
}

// ── 誕生日の歌 ────────────────────────────────────────────────────────────────
function playBirthdaySong() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const notes = [
    {f:262,d:0.5},{f:262,d:0.5},{f:294,d:1},{f:262,d:1},{f:349,d:1},{f:330,d:2},
    {f:262,d:0.5},{f:262,d:0.5},{f:294,d:1},{f:262,d:1},{f:392,d:1},{f:349,d:2},
    {f:262,d:0.5},{f:262,d:0.5},{f:523,d:1},{f:440,d:1},{f:349,d:1},{f:330,d:1},{f:294,d:2}
  ];
  let t = ctx.currentTime;
  notes.forEach(n => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = n.f;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + n.d);
    osc.start(t);
    osc.stop(t + n.d);
    t += n.d * 0.4;
  });
}

// ── スワイプジェスチャー ──────────────────────────────────────────────────────
let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;

function handleSwipeGesture() {
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx < 50 && ady < 50) return;
  vibrate(50);
  if (adx > ady) {
    startConfetti();
    if (dx > 0) createBalloons(); else launchFireworks();
  } else {
    if (dy > 0) {
      for (let i = 0; i < 3; i++) setTimeout(() => startConfetti(), i * 200);
    } else {
      createMegaFireworks();
    }
  }
}

// ── 初期化 ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const name = getNameFromURL();
  if (name) document.getElementById('name').textContent = name;

  startConfetti();
  setTimeout(createBalloons,   500);
  setTimeout(launchFireworks, 1000);
  setTimeout(createSparkles,  1500);
  setInterval(startConfetti, 6000);

  let touchStartTime = 0;
  let longPressTimer = null;
  let isLongPress    = false;

  document.body.addEventListener('touchstart', function (e) {
    touchStartX    = e.changedTouches[0].screenX;
    touchStartY    = e.changedTouches[0].screenY;
    touchStartTime = Date.now();
    isLongPress    = false;

    longPressTimer = setTimeout(() => {
      isLongPress = true;
      const touch = e.touches[0];
      createRainbowFirework(touch.clientX, touch.clientY);
      vibrate([100, 50, 100, 50, 100]);
    }, 700);

    if (e.touches.length > 1) {
      clearTimeout(longPressTimer);
      const n = Math.min(e.touches.length, 8);
      for (let i = 0; i < n; i++) {
        setTimeout(() => {
          const touch = e.touches[i] || e.touches[0];
          createFirework(touch.clientX, touch.clientY);
        }, i * 120);
      }
      vibrate(Array(n).fill(50));
    }
  });

  document.body.addEventListener('touchend', function (e) {
    clearTimeout(longPressTimer);
    if (isLongPress) { isLongPress = false; return; }

    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    const touch = e.changedTouches[0];
    const dur   = Date.now() - touchStartTime;

    if (!e.target.closest('.candle') && !e.target.closest('.candles-container')) {
      const adx = Math.abs(touchEndX - touchStartX);
      const ady = Math.abs(touchEndY - touchStartY);
      if (adx < 10 && ady < 10 && dur < 500) {
        createFirework(touch.clientX, touch.clientY);
        vibrate(30);
        if (!window.musicPlayed) {
          playBirthdaySong();
          window.musicPlayed = true;
          setTimeout(() => { window.musicPlayed = false; }, 10000);
        }
      } else if (adx >= 10 || ady >= 10) {
        handleSwipeGesture();
      }
    }
  });

  document.body.addEventListener('touchcancel', () => clearTimeout(longPressTimer));

  // デスクトップ用クリック
  document.body.addEventListener('click', function (e) {
    if (e.target.closest('.candle') || e.target.closest('.candles-container')) return;
    if ('ontouchstart' in window) return;
    createFirework(e.clientX, e.clientY);
    if (!window.musicPlayed) {
      playBirthdaySong();
      window.musicPlayed = true;
      setTimeout(() => { window.musicPlayed = false; }, 10000);
    }
  });

  // ろうそくエリアのタップ → マイク検知
  const candlesContainer = document.querySelector('.candles-container');
  if (candlesContainer) {
    candlesContainer.addEventListener('click', function (e) {
      e.stopPropagation();
      const remaining = document.querySelectorAll('.candle:not(.blown)');
      if (remaining.length > 0) startBlowDetection();
    });
  }

  // 5秒後にろうそくのヒント
  setTimeout(() => showMessage('🕯️ ろうそくをタップして息を吹きかけてみて！'), 5000);
});
