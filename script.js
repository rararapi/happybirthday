// 実績システム
const ACHIEVEMENTS = {
    first_tap: { id: 'first_tap', name: '🎆 はじめの一歩', desc: '初めてタップした', icon: '👆' },
    first_swipe: { id: 'first_swipe', name: '🌊 スワイプマスター', desc: '初めてスワイプした', icon: '👈' },
    first_candle: { id: 'first_candle', name: '🕯️ 火消し職人', desc: 'ろうそくを1本消した', icon: '💨' },
    all_candles: { id: 'all_candles', name: '🎂 完璧な祝福', desc: 'すべてのろうそくを消した', icon: '✨' },
    double_tap: { id: 'double_tap', name: '⏰ 時間の魔術師', desc: 'ダブルタップで時間停止', icon: '🔮' },
    long_press: { id: 'long_press', name: '🌈 虹の創造主', desc: '長押しで虹色花火', icon: '🎨' },
    multi_touch: { id: 'multi_touch', name: '🖐️ 多指使い', desc: '複数指でタップ', icon: '✋' },
    secret_command: { id: 'secret_command', name: '🎮 コナミマスター', desc: '隠しコマンド発動', icon: '🏆' },
    shake_master: { id: 'shake_master', name: '📱 シェイカー', desc: 'スマホを振った', icon: '💫' },
    tilt_master: { id: 'tilt_master', name: '🎢 傾けマスター', desc: 'スマホを大きく傾けた', icon: '🎪' },
    combo_3: { id: 'combo_3', name: '⚡ コンボ初級', desc: '3コンボ達成', icon: '⚡' },
    combo_5: { id: 'combo_5', name: '⚡⚡ コンボ中級', desc: '5コンボ達成', icon: '⭐' },
    combo_10: { id: 'combo_10', name: '⚡⚡⚡ コンボ上級', desc: '10コンボ達成', icon: '🔥' },
    tap_10: { id: 'tap_10', name: '👆 タップ好き', desc: '10回タップ', icon: '👍' },
    tap_50: { id: 'tap_50', name: '👆👆 タップマニア', desc: '50回タップ', icon: '💪' },
    tap_100: { id: 'tap_100', name: '👆👆👆 タップの鉄人', desc: '100回タップ', icon: '🏅' },
    firework_100: { id: 'firework_100', name: '🎆 花火師見習い', desc: '花火100発', icon: '🎇' },
    firework_500: { id: 'firework_500', name: '🎆🎆 花火師', desc: '花火500発', icon: '🎆' },
    confetti_10: { id: 'confetti_10', name: '🎊 紙吹雪好き', desc: '紙吹雪10回', icon: '🎉' },
    surprise_encounter: { id: 'surprise_encounter', name: '🎁 ラッキー', desc: 'ランダムサプライズ遭遇', icon: '🍀' },
    gift_opened: { id: 'gift_opened', name: '🎁 プレゼント開封', desc: 'ギフトボックスを開けた', icon: '🎀' },
    play_1min: { id: 'play_1min', name: '⏱️ お試し', desc: '1分間プレイ', icon: '⌚' },
    play_5min: { id: 'play_5min', name: '⏱️⏱️ じっくり', desc: '5分間プレイ', icon: '🕐' },
    all_swipes: { id: 'all_swipes', name: '🧭 四方八方', desc: '全方向スワイプ制覇', icon: '🌐' },
    explorer: { id: 'explorer', name: '🗺️ 探検家', desc: '10種類以上の実績解除', icon: '🔍' },
    master: { id: 'master', name: '👑 パーティーマスター', desc: '20種類以上の実績解除', icon: '👑' }
};

let achievementStats = {
    tapCount: 0,
    swipeCount: 0,
    fireworkCount: 0,
    confettiCount: 0,
    candlesBlown: 0,
    swipeDirections: new Set(),
    startTime: Date.now(),
    unlockedAchievements: []
};

// localStorageから読み込み
function loadAchievements() {
    const saved = localStorage.getItem('birthday_achievements');
    if (saved) {
        const data = JSON.parse(saved);
        achievementStats = { ...achievementStats, ...data };
        achievementStats.swipeDirections = new Set(data.swipeDirections || []);
        achievementStats.startTime = Date.now(); // 新しいセッション
    }
}

// localStorageに保存
function saveAchievements() {
    const data = {
        ...achievementStats,
        swipeDirections: Array.from(achievementStats.swipeDirections)
    };
    localStorage.setItem('birthday_achievements', JSON.stringify(data));
}

// 実績解除チェック
function checkAchievement(achievementId) {
    if (achievementStats.unlockedAchievements.includes(achievementId)) {
        return false; // 既に解除済み
    }

    achievementStats.unlockedAchievements.push(achievementId);
    saveAchievements();
    showAchievementNotification(achievementId);
    return true;
}

// 実績解除通知
function showAchievementNotification(achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return;

    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-content">
            <div class="achievement-title">実績解除！</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.desc}</div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    vibrate([100, 50, 100, 50, 100]);

    // 花火エフェクト
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight * 0.5;
            createFirework(x, y);
        }, i * 200);
    }

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 4000);
}

// 統計更新と実績チェック
function updateStats(stat, value = 1) {
    achievementStats[stat] += value;

    // 実績チェック
    if (stat === 'tapCount') {
        if (achievementStats.tapCount === 1) checkAchievement('first_tap');
        if (achievementStats.tapCount === 10) checkAchievement('tap_10');
        if (achievementStats.tapCount === 50) checkAchievement('tap_50');
        if (achievementStats.tapCount === 100) checkAchievement('tap_100');
    }

    if (stat === 'swipeCount') {
        if (achievementStats.swipeCount === 1) checkAchievement('first_swipe');
    }

    if (stat === 'fireworkCount') {
        if (achievementStats.fireworkCount === 100) checkAchievement('firework_100');
        if (achievementStats.fireworkCount === 500) checkAchievement('firework_500');
    }

    if (stat === 'confettiCount') {
        if (achievementStats.confettiCount === 10) checkAchievement('confetti_10');
    }

    if (stat === 'candlesBlown') {
        if (achievementStats.candlesBlown === 1) checkAchievement('first_candle');
    }

    // 探検家・マスター実績
    const count = achievementStats.unlockedAchievements.length;
    if (count >= 10) checkAchievement('explorer');
    if (count >= 20) checkAchievement('master');

    saveAchievements();
}

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

  updateStats('confettiCount');
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

  updateStats('fireworkCount');
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

// コンボシステム
let comboCount = 0;
let comboTimeout = null;

function addCombo() {
    comboCount++;
    clearTimeout(comboTimeout);

    if (comboCount >= 10) {
        showMessage('🔥 SUPER COMBO × ' + comboCount + '!!! 🔥');
        createMegaFireworks();
        createMegaFireworks();
        vibrate([100, 50, 100, 50, 100]);
        checkAchievement('combo_10');
    } else if (comboCount >= 5) {
        showMessage('⚡ COMBO × ' + comboCount + '! ⚡');
        launchFireworks();
        vibrate([50, 50, 50]);
        checkAchievement('combo_5');
    } else if (comboCount >= 3) {
        showMessage('✨ Combo × ' + comboCount + ' ✨');
        vibrate(30);
        checkAchievement('combo_3');
    }

    comboTimeout = setTimeout(() => {
        comboCount = 0;
    }, 2000);
}

// 虹色花火
function createRainbowFirework(x, y) {
    const container = document.getElementById('confettiContainer');
    const rainbowColors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework-particle rainbow-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.backgroundColor = rainbowColors[i % rainbowColors.length];

        const angle = (Math.PI * 2 * i) / 50;
        const velocity = 3 + Math.random() * 3;
        particle.style.setProperty('--tx', Math.cos(angle) * velocity * 100 + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * velocity * 100 + 'px');

        container.appendChild(particle);
        setTimeout(() => particle.remove(), 2000);
    }

    showMessage('🌈 レインボー花火！ 🌈');
    vibrate([200, 100, 200]);
}

// ダブルタップ検知
let lastTapTime = 0;
let tapCount = 0;

function handleDoubleTap(x, y) {
    const now = Date.now();
    const timeDiff = now - lastTapTime;

    if (timeDiff < 300 && timeDiff > 0) {
        tapCount++;
        if (tapCount === 1) {
            // ダブルタップ
            timeStopEffect();
            setTimeout(() => {
                createMegaFireworks();
                createMegaFireworks();
            }, 1000);
            showMessage('⏰ 時間停止！ドーン！ ⏰');
            vibrate([100, 100, 100, 100, 300]);
            checkAchievement('double_tap');
            tapCount = 0;
        }
    } else {
        tapCount = 0;
    }

    lastTapTime = now;
}

// 時間停止エフェクト
function timeStopEffect() {
    const body = document.body;
    body.style.filter = 'grayscale(1)';
    body.style.transition = 'filter 0.5s';

    setTimeout(() => {
        body.style.filter = 'grayscale(0)';
        body.style.transition = 'filter 0.3s';
    }, 1000);
}

// 画面傾き検知
let currentTilt = { x: 0, y: 0 };

function handleOrientation(event) {
    const beta = event.beta; // 前後の傾き
    const gamma = event.gamma; // 左右の傾き

    currentTilt.x = gamma;
    currentTilt.y = beta;

    // ケーキを傾ける
    const cake = document.querySelector('.cake-wrapper');
    if (cake) {
        const tiltX = Math.max(-15, Math.min(15, gamma / 3));
        const tiltY = Math.max(-15, Math.min(15, beta / 3));
        cake.style.transform = `rotate(${tiltX}deg)`;
    }

    // 大きく傾けたら特別エフェクト
    if (Math.abs(gamma) > 60 || Math.abs(beta) > 60) {
        if (!window.tiltEffectCooldown) {
            window.tiltEffectCooldown = true;
            showMessage('🎢 傾きすぎ！ケーキが落ちる～！');
            checkAchievement('tilt_master');
            for (let i = 0; i < 5; i++) {
                setTimeout(() => startConfetti(), i * 100);
            }
            vibrate([50, 50, 50, 50, 50]);

            setTimeout(() => {
                window.tiltEffectCooldown = false;
            }, 3000);
        }
    }
}

// 隠しコマンド（上上下下左右左右）
let secretCommandSequence = [];
const secretCode = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];

function checkSecretCommand(direction) {
    secretCommandSequence.push(direction);

    if (secretCommandSequence.length > secretCode.length) {
        secretCommandSequence.shift();
    }

    if (JSON.stringify(secretCommandSequence) === JSON.stringify(secretCode)) {
        activateSecretMode();
        secretCommandSequence = [];
    }
}

function activateSecretMode() {
    showMessage('🎮 隠しコマンド発動！！！ 🎮');
    vibrate([100, 50, 100, 50, 100, 50, 500]);
    checkAchievement('secret_command');

    // 超豪華エフェクト
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            createRainbowFirework(x, y);
        }, i * 100);
    }

    for (let i = 0; i < 10; i++) {
        setTimeout(() => startConfetti(), i * 200);
    }

    // 背景をレインボーに
    let hue = 0;
    const rainbowInterval = setInterval(() => {
        document.body.style.background = `hsl(${hue}, 50%, 90%)`;
        hue = (hue + 5) % 360;
    }, 50);

    setTimeout(() => {
        clearInterval(rainbowInterval);
        document.body.style.background = '#f0e8f2';
    }, 5000);
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
            updateStats('candlesBlown');

            const allCandles = document.querySelectorAll('.candle');
            const blownCandles = document.querySelectorAll('.candle.blown');

            if (allCandles.length === blownCandles.length) {
                setTimeout(() => {
                    showMessage('🎂 おめでとう！全部消えたよ！ 🎉');
                    createMegaFireworks();
                    vibrate([200, 100, 200, 100, 200]);
                    checkAchievement('all_candles');
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
    addCombo(); // コンボ追加
    updateStats('swipeCount');

    let direction = '';

    if (absDiffX > absDiffY) {
        // 横スワイプ
        if (diffX > 0) {
            // 右スワイプ
            direction = 'right';
            showMessage('👉 スワイプでパーティー！');
            startConfetti();
            createBalloons();
        } else {
            // 左スワイプ
            direction = 'left';
            showMessage('👈 もっと盛り上げよう！');
            startConfetti();
            launchFireworks();
        }
    } else {
        // 縦スワイプ
        if (diffY > 0) {
            // 下スワイプ
            direction = 'down';
            showMessage('👇 紙吹雪シャワー！');
            for (let i = 0; i < 3; i++) {
                setTimeout(() => startConfetti(), i * 200);
            }
        } else {
            // 上スワイプ
            direction = 'up';
            showMessage('👆 花火打ち上げ！');
            createMegaFireworks();
        }
    }

    // スワイプ方向記録
    achievementStats.swipeDirections.add(direction);
    if (achievementStats.swipeDirections.size === 4) {
        checkAchievement('all_swipes');
    }

    // 隠しコマンドチェック
    checkSecretCommand(direction);
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
    checkAchievement('shake_master');

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
            checkAchievement('gift_opened');

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
    let touchStartTime = 0;
    let longPressTimer = null;
    let isLongPress = false;

    document.body.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        touchStartTime = Date.now();
        isLongPress = false;

        // 長押し検知（700ms）
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            const touch = e.touches[0];
            createRainbowFirework(touch.clientX, touch.clientY);
            vibrate([100, 50, 100, 50, 100]);
            checkAchievement('long_press');
        }, 700);

        // マルチタッチ検知
        if (e.touches.length > 1) {
            clearTimeout(longPressTimer);
            const touchCount = Math.min(e.touches.length, 10);
            showMessage(`🖐️ ${touchCount}本指タッチ！ 🖐️`);
            checkAchievement('multi_touch');

            // 指の本数分だけ花火
            for (let i = 0; i < touchCount; i++) {
                setTimeout(() => {
                    const touch = e.touches[i] || e.touches[0];
                    createFirework(touch.clientX, touch.clientY);
                }, i * 100);
            }

            vibrate(Array(touchCount).fill(50));
        }
    });

    document.body.addEventListener('touchend', function(e) {
        clearTimeout(longPressTimer);

        if (isLongPress) {
            isLongPress = false;
            return;
        }

        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;

        const touch = e.changedTouches[0];
        const touchDuration = Date.now() - touchStartTime;

        // ギフトボックスやろうそくのタッチは除外
        if (!e.target.closest('.gift-box') && !e.target.closest('.candle') && !e.target.closest('.blow-button')) {
            // スワイプかタップか判定
            const diffX = Math.abs(touchEndX - touchStartX);
            const diffY = Math.abs(touchEndY - touchStartY);

            if (diffX < 10 && diffY < 10 && touchDuration < 500) {
                // タップ
                handleDoubleTap(touch.clientX, touch.clientY);
                createFirework(touch.clientX, touch.clientY);
                addCombo();
                vibrate(30);
                updateStats('tapCount');

                if (!window.musicPlayed) {
                    playBirthdaySong();
                    window.musicPlayed = true;
                    setTimeout(() => window.musicPlayed = false, 10000);
                }
            } else if (diffX >= 10 || diffY >= 10) {
                // スワイプ
                handleSwipeGesture();
            }
        }
    });

    document.body.addEventListener('touchcancel', function() {
        clearTimeout(longPressTimer);
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

    // 画面傾き検知
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
    }

    // ランダムサプライズ（時々特別なエフェクト）
    setInterval(() => {
        const random = Math.random();
        if (random > 0.95) {
            // 5%の確率でサプライズ
            checkAchievement('surprise_encounter');
            const surprises = [
                () => {
                    showMessage('🎁 サプライズ！ランダムギフト！');
                    createMegaFireworks();
                },
                () => {
                    showMessage('🌟 突然の星降り！');
                    for (let i = 0; i < 100; i++) {
                        setTimeout(() => {
                            const x = Math.random() * window.innerWidth;
                            const y = Math.random() * window.innerHeight;
                            createStarTrail(x, y);
                        }, i * 10);
                    }
                },
                () => {
                    showMessage('🎈 バルーンパーティー！');
                    createBalloons();
                    createBalloons();
                    createBalloons();
                }
            ];

            const surprise = surprises[Math.floor(Math.random() * surprises.length)];
            surprise();
            vibrate([100, 50, 100, 50, 100]);
        }
    }, 5000);

    // プレイ時間チェック
    setInterval(() => {
        const playTime = (Date.now() - achievementStats.startTime) / 1000 / 60; // 分
        if (playTime >= 1 && !achievementStats.unlockedAchievements.includes('play_1min')) {
            checkAchievement('play_1min');
        }
        if (playTime >= 5 && !achievementStats.unlockedAchievements.includes('play_5min')) {
            checkAchievement('play_5min');
        }
    }, 10000); // 10秒ごとにチェック

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

    // ヒントボタンのトグル
    const hintButton = document.getElementById('hintButton');
    const touchHints = document.getElementById('touchHints');
    let hintsVisible = false;

    hintButton.addEventListener('click', function(e) {
        e.stopPropagation();
        hintsVisible = !hintsVisible;

        if (hintsVisible) {
            touchHints.classList.add('visible');
            hintButton.textContent = '❌ 閉じる';
        } else {
            touchHints.classList.remove('visible');
            hintButton.textContent = '💡 ヒント';
        }

        vibrate(30);
    });

    // 実績ボタンのトグル
    const achievementButton = document.getElementById('achievementButton');
    const achievementModal = document.getElementById('achievementModal');

    achievementButton.addEventListener('click', function(e) {
        e.stopPropagation();
        showAchievementList();
        vibrate(30);
    });

    // 実績モーダルを閉じる
    document.getElementById('closeAchievements').addEventListener('click', function(e) {
        e.stopPropagation();
        achievementModal.classList.remove('show');
        vibrate(20);
    });

    // 実績リストを読み込み
    loadAchievements();
});

// 実績一覧を表示
function showAchievementList() {
    const modal = document.getElementById('achievementModal');
    const container = document.getElementById('achievementsList');

    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    const unlockedCount = achievementStats.unlockedAchievements.length;

    container.innerHTML = `
        <div class="achievement-progress">
            <div class="progress-text">${unlockedCount} / ${totalAchievements} 実績解除</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(unlockedCount / totalAchievements * 100)}%"></div>
            </div>
        </div>
    `;

    Object.values(ACHIEVEMENTS).forEach(ach => {
        const isUnlocked = achievementStats.unlockedAchievements.includes(ach.id);
        const item = document.createElement('div');
        item.className = `achievement-list-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        item.innerHTML = `
            <div class="achievement-list-icon">${isUnlocked ? ach.icon : '🔒'}</div>
            <div class="achievement-list-content">
                <div class="achievement-list-name">${isUnlocked ? ach.name : '???'}</div>
                <div class="achievement-list-desc">${isUnlocked ? ach.desc : '未解除'}</div>
            </div>
        `;
        container.appendChild(item);
    });

    modal.classList.add('show');
}
