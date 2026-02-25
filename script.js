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

// バイブレーション
function vibrate(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// マイクで音量検知
let audioContext = null;
let analyser = null;
let microphone = null;
let isListeningForBlow = false;

async function startBlowDetection() {
    if (isListeningForBlow) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 512;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        isListeningForBlow = true;
        showMessage('🎤 息を吹きかけて！');

        const checkBlow = () => {
            if (!isListeningForBlow) return;

            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;

            // 音量が一定以上なら「息を吹きかけた」と判定
            if (average > 40) {
                blowOutCandles();
                stopBlowDetection();
            } else {
                requestAnimationFrame(checkBlow);
            }
        };

        checkBlow();
    } catch (err) {
        console.log('マイクアクセス不可:', err);
        showMessage('❌ マイクへのアクセスが必要です');
    }
}

function stopBlowDetection() {
    isListeningForBlow = false;
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
}

// ろうそくを吹き消す
function blowOutCandles() {
    const candles = document.querySelectorAll('.candle:not(.blown)');

    if (candles.length === 0) return;

    vibrate([100, 50, 100]);

    candles.forEach((candle, index) => {
        setTimeout(() => {
            candle.classList.add('blown');

            const allCandles = document.querySelectorAll('.candle');
            const blownCandles = document.querySelectorAll('.candle.blown');

            if (allCandles.length === blownCandles.length) {
                setTimeout(() => {
                    showMessage('🎂 おめでとう！全部消えたよ！ 🎉');
                    createMegaFireworks();
                    vibrate([200, 100, 200, 100, 200]);
                }, 500);
            }
        }, index * 300);
    });
}

// メガ花火
function createMegaFireworks() {
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight * 0.7;
            createFirework(x, y);
        }, i * 200);
    }
}

// ランダムメッセージ表示
const messages = [
    '🎊 最高の一年になりますように！',
    '✨ 夢が全部叶いますように！',
    '🌟 素敵な誕生日をお過ごしください！',
    '🎈 いつも笑顔でいてね！',
    '💝 あなたは特別な存在です！',
    '🎁 今日は主役！楽しんで！',
    '🌈 幸せがたくさん訪れますように！',
    '⭐ あなたの笑顔が大好き！'
];

function showMessage(customMessage) {
    const popup = document.getElementById('messagePopup');
    const message = customMessage || messages[Math.floor(Math.random() * messages.length)];

    popup.textContent = message;
    popup.classList.add('show');

    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

// タッチで星（スマホ用）
function createStarTrail(x, y) {
    const star = document.createElement('div');
    star.className = 'star-trail';
    star.style.left = x + 'px';
    star.style.top = y + 'px';
    star.textContent = '⭐';
    document.body.appendChild(star);

    setTimeout(() => star.remove(), 1000);
}

// スワイプジェスチャー検知
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function handleSwipeGesture() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    // 最小スワイプ距離
    if (absDiffX < 50 && absDiffY < 50) return;

    vibrate(50);

    if (absDiffX > absDiffY) {
        // 横スワイプ
        if (diffX > 0) {
            // 右スワイプ
            showMessage('👉 スワイプでパーティー！');
            startConfetti();
            createBalloons();
        } else {
            // 左スワイプ
            showMessage('👈 もっと盛り上げよう！');
            startConfetti();
            launchFireworks();
        }
    } else {
        // 縦スワイプ
        if (diffY > 0) {
            // 下スワイプ
            showMessage('👇 紙吹雪シャワー！');
            for (let i = 0; i < 3; i++) {
                setTimeout(() => startConfetti(), i * 200);
            }
        } else {
            // 上スワイプ
            showMessage('👆 花火打ち上げ！');
            createMegaFireworks();
        }
    }
}

// デバイスシェイク検知
let lastShake = 0;
let shakeThreshold = 15;

function handleShake(event) {
    const current = new Date().getTime();

    if (current - lastShake > 1000) {
        const acceleration = event.accelerationIncludingGravity;

        if (acceleration) {
            const totalAcceleration = Math.abs(acceleration.x) +
                                     Math.abs(acceleration.y) +
                                     Math.abs(acceleration.z);

            if (totalAcceleration > shakeThreshold) {
                lastShake = current;
                onShakeDetected();
            }
        }
    }
}

function onShakeDetected() {
    showMessage('🎊 シェイクでパーティータイム！ 🎊');
    createMegaFireworks();

    // 追加の紙吹雪
    for (let i = 0; i < 3; i++) {
        setTimeout(startConfetti, i * 500);
    }
}

// ギフトボックス
function setupGiftBox() {
    const giftBox = document.getElementById('giftBox');

    setTimeout(() => {
        giftBox.classList.add('show');
    }, 3000);

    giftBox.addEventListener('click', function() {
        if (!this.classList.contains('opened')) {
            this.classList.add('opened');
            showMessage('🎁 サプライズ！あなたは最高！ 💖');
            createMegaFireworks();

            // ギフトから紙吹雪が飛び出す
            for (let i = 0; i < 5; i++) {
                setTimeout(startConfetti, i * 200);
            }

            setTimeout(() => {
                this.style.display = 'none';
            }, 2000);
        }
    });
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

    // タッチで花火と音楽（スマホ最適化）
    document.body.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    });

    document.body.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;

        const touch = e.changedTouches[0];

        // ギフトボックスやろうそくのタッチは除外
        if (!e.target.closest('.gift-box') && !e.target.closest('.candle') && !e.target.closest('.blow-button')) {
            // スワイプかタップか判定
            const diffX = Math.abs(touchEndX - touchStartX);
            const diffY = Math.abs(touchEndY - touchStartY);

            if (diffX < 10 && diffY < 10) {
                // タップ
                createFirework(touch.clientX, touch.clientY);
                vibrate(30);

                if (!window.musicPlayed) {
                    playBirthdaySong();
                    window.musicPlayed = true;
                    setTimeout(() => window.musicPlayed = false, 10000);
                }
            } else {
                // スワイプ
                handleSwipeGesture();
            }
        }
    });

    // ろうそくエリアをタップでマイク検知開始
    const candlesContainer = document.querySelector('.candles-container');
    if (candlesContainer) {
        candlesContainer.addEventListener('click', function(e) {
            e.stopPropagation();
            const allCandles = document.querySelectorAll('.candle');
            const blownCandles = document.querySelectorAll('.candle.blown');

            if (allCandles.length > blownCandles.length) {
                startBlowDetection();
            }
        });
    }

    // タッチ移動で星の軌跡（スマホ用）
    let lastTouchTime = 0;
    document.addEventListener('touchmove', function(e) {
        const now = Date.now();
        if (now - lastTouchTime > 100) { // スロットル
            const touch = e.touches[0];
            if (Math.random() > 0.5) {
                createStarTrail(touch.clientX, touch.clientY);
            }
            lastTouchTime = now;
        }
    });

    // デバイスシェイク検知
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleShake);
    }

    // ギフトボックスのセットアップ
    setupGiftBox();

    // 定期的にランダムメッセージ
    setInterval(() => {
        if (Math.random() > 0.7) {
            showMessage();
        }
    }, 15000);

    // 5秒後にろうそくのヒントを表示
    setTimeout(() => {
        showMessage('🕯️ ろうそくエリアをタップして息を吹きかけてね！');
    }, 5000);

    // 10秒後にスワイプのヒント
    setTimeout(() => {
        showMessage('👈👉 画面をスワイプしてみて！');
    }, 10000);
});
