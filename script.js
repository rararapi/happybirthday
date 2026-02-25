// 復号化関数
function decryptName(encryptedValue) {
  var key = CryptoJS.enc.Utf8.parse('12345678901234567890123456789012');
  var iv = CryptoJS.enc.Utf8.parse('1234567890123456');

  var base64Decoded = encryptedValue.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  var ciphertext = CryptoJS.enc.Base64.parse(base64Decoded);

  var decryptedData = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return decryptedData.toString(CryptoJS.enc.Utf8);
}

function getNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    if (name) {
        return name.toUpperCase();
    }
    const n_enc = params.get('n_enc');
    if (n_enc) {
        return decryptName(n_enc);
    }
    return '';
}

// 紙吹雪アニメーション
function startConfetti() {
  const container = document.getElementById('confettiContainer');
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#ff85c0', '#95e1d3', '#f38181', '#aa96da'];

  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      container.appendChild(confetti);

      setTimeout(() => confetti.remove(), 5000);
    }, i * 50);
  }
}

// バルーンアニメーション
function createBalloons() {
  const container = document.getElementById('confettiContainer');
  const balloonColors = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#ff85c0', '#95e1d3'];

  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const balloon = document.createElement('div');
      balloon.className = 'balloon';
      balloon.style.left = Math.random() * 90 + '%';
      balloon.style.backgroundColor = balloonColors[Math.floor(Math.random() * balloonColors.length)];
      balloon.style.animationDelay = Math.random() * 2 + 's';
      balloon.style.animationDuration = (Math.random() * 4 + 6) + 's';
      container.appendChild(balloon);

      setTimeout(() => balloon.remove(), 12000);
    }, i * 300);
  }
}

// 花火エフェクト
function createFirework(x, y) {
  const container = document.getElementById('confettiContainer');
  const colors = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#ff85c0', '#95e1d3'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'firework-particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.backgroundColor = color;

    const angle = (Math.PI * 2 * i) / 30;
    const velocity = 2 + Math.random() * 2;
    particle.style.setProperty('--tx', Math.cos(angle) * velocity * 100 + 'px');
    particle.style.setProperty('--ty', Math.sin(angle) * velocity * 100 + 'px');

    container.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }
}

// ランダムに花火を打ち上げ
function launchFireworks() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight * 0.6;
      createFirework(x, y);
    }, i * 800);
  }
}

// キラキラエフェクト
function createSparkles() {
  const container = document.getElementById('confettiContainer');

  setInterval(() => {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = Math.random() * 100 + '%';
    sparkle.style.top = Math.random() * 100 + '%';
    container.appendChild(sparkle);

    setTimeout(() => sparkle.remove(), 1000);
  }, 300);
}

// 誕生日の歌を再生
function playBirthdaySong() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const notes = [
    {freq: 262, duration: 0.5}, {freq: 262, duration: 0.5}, {freq: 294, duration: 1},
    {freq: 262, duration: 1}, {freq: 349, duration: 1}, {freq: 330, duration: 2},
    {freq: 262, duration: 0.5}, {freq: 262, duration: 0.5}, {freq: 294, duration: 1},
    {freq: 262, duration: 1}, {freq: 392, duration: 1}, {freq: 349, duration: 2},
    {freq: 262, duration: 0.5}, {freq: 262, duration: 0.5}, {freq: 523, duration: 1},
    {freq: 440, duration: 1}, {freq: 349, duration: 1}, {freq: 330, duration: 1}, {freq: 294, duration: 2}
  ];

  let currentTime = audioContext.currentTime;
  notes.forEach(note => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = note.freq;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + note.duration);

    currentTime += note.duration * 0.4;
  });
}

// ページが読み込まれたときに名前をセット
document.addEventListener('DOMContentLoaded', function () {
    const name = getNameFromURL();
    if (name) {
        document.getElementById('name').textContent = name;
    }

    // 各種エフェクトを開始
    startConfetti();
    setTimeout(createBalloons, 500);
    setTimeout(launchFireworks, 1000);
    setTimeout(createSparkles, 1500);

    // 6秒ごとに紙吹雪を追加
    setInterval(startConfetti, 6000);

    // クリックで花火と音楽
    document.body.addEventListener('click', function(e) {
        createFirework(e.clientX, e.clientY);
        if (!window.musicPlayed) {
            playBirthdaySong();
            window.musicPlayed = true;
            setTimeout(() => window.musicPlayed = false, 10000);
        }
    });
});
