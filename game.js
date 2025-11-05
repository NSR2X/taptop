// 🎮 TapTop - Single Player vs AI
// The most AWESOME territory battle game!

const TERRITORY_COUNT = 100;
let soundEnabled = true;
let gameState = {
    territories: Array(TERRITORY_COUNT).fill(null), // null, 'player', 'ai'
    playerScore: 0,
    aiScore: 0,
    playerStreak: 0,
    aiStreak: 0,
    longestPlayerStreak: 0,
    comboCount: 0,
    comboMultiplier: 1.0,
    lastClickTime: 0,
    playerPowerUps: { bomb: 0, shield: 0, lightning: 0, chaos: 0, freeze: 0, rainbow: 0 },
    aiPowerUps: { bomb: 0, shield: 0, lightning: 0, chaos: 0, freeze: 0, rainbow: 0 },
    protectedTerritories: new Set(),
    achievements: new Set(),
    totalPowerUps: 0,
    difficulty: 'medium',
    aiInterval: null,
    aiFrozen: false,
    playerFrozen: false,
    gameOver: false
};

// Audio Context for sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type, frequency = 440, duration = 100) {
    if (!soundEnabled) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

function playCaptureSound() {
    playSound('sine', 523, 80);
}

function playPowerUpSound() {
    playSound('square', 659, 150);
    setTimeout(() => playSound('square', 784, 150), 100);
}

function playAchievementSound() {
    playSound('sine', 659, 100);
    setTimeout(() => playSound('sine', 784, 100), 100);
    setTimeout(() => playSound('sine', 880, 200), 200);
}

function playComboSound(multiplier) {
    playSound('triangle', 440 * multiplier, 50);
}

function playAISound() {
    playSound('sawtooth', 300, 60);
}

// Particle effects
function createParticle(x, y, color, count = 10) {
    const container = document.getElementById('particles-container');

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundColor = color;

        const angle = (Math.PI * 2 * i) / count;
        const velocity = 2 + Math.random() * 3;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        particle.style.setProperty('--vx', `${vx * 50}px`);
        particle.style.setProperty('--vy', `${vy * 50}px`);

        container.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
    }
}

function createExplosion(x, y, color) {
    createParticle(x, y, color, 20);
    playSound('sawtooth', 200, 200);
}

function createConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const container = document.getElementById('particles-container');

    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = -20;
            const color = colors[Math.floor(Math.random() * colors.length)];

            const confetto = document.createElement('div');
            confetto.className = 'confetto';
            confetto.style.left = `${x}px`;
            confetto.style.top = `${y}px`;
            confetto.style.backgroundColor = color;
            confetto.style.setProperty('--fall-distance', `${window.innerHeight + 100}px`);

            container.appendChild(confetto);

            setTimeout(() => confetto.remove(), 3000);
        }, i * 20);
    }
}

function shakeScreen(duration = 500) {
    const container = document.getElementById('game-container');
    container.style.animation = `shake ${duration}ms ease-in-out`;
    setTimeout(() => {
        container.style.animation = '';
    }, duration);
}

// Notifications
function showNotification(message, type = 'info') {
    const container = document.getElementById('achievement-notifications');

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function showAchievement(achievement) {
    const container = document.getElementById('achievement-notifications');

    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-content">
            <div class="achievement-title">${achievement.name}</div>
            <div class="achievement-desc">${achievement.description}</div>
        </div>
    `;

    container.appendChild(notification);
    playAchievementSound();

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 4000);
}

function showCombo(count, multiplier) {
    const comboDisplay = document.getElementById('combo-display');
    comboDisplay.style.display = 'block';

    const comboText = comboDisplay.querySelector('.combo-text');
    const multiplierText = comboDisplay.querySelector('.multiplier-text');

    comboText.textContent = `COMBO x${count}`;
    multiplierText.textContent = `${multiplier.toFixed(1)}x MULTIPLIER!`;

    playComboSound(multiplier);

    setTimeout(() => {
        comboDisplay.style.display = 'none';
    }, 2000);
}

// Combo system
function updateCombo() {
    const now = Date.now();
    const timeSinceLastClick = now - gameState.lastClickTime;

    if (timeSinceLastClick > 2000) {
        gameState.comboCount = 1;
        gameState.comboMultiplier = 1.0;
    } else {
        gameState.comboCount++;

        if (gameState.comboCount >= 20) {
            gameState.comboMultiplier = 5.0;
        } else if (gameState.comboCount >= 15) {
            gameState.comboMultiplier = 4.0;
        } else if (gameState.comboCount >= 10) {
            gameState.comboMultiplier = 3.0;
        } else if (gameState.comboCount >= 5) {
            gameState.comboMultiplier = 2.0;
        } else {
            gameState.comboMultiplier = 1.0;
        }
    }

    gameState.lastClickTime = now;

    if (gameState.comboCount > 1) {
        showCombo(gameState.comboCount, gameState.comboMultiplier);
    }
}

// Achievement system
function checkAchievements() {
    const achievements = [
        { id: 'first_blood', name: 'First Blood', description: 'Captured your first territory', condition: () => gameState.playerScore === 1 },
        { id: 'conqueror', name: 'Conqueror', description: 'Captured 50 territories', condition: () => gameState.playerScore >= 50 },
        { id: 'destroyer', name: 'Destroyer', description: 'Captured 100 territories', condition: () => gameState.playerScore >= 100 },
        { id: 'speed_demon', name: 'Speed Demon', description: 'Achieved a 10 territory streak', condition: () => gameState.longestPlayerStreak >= 10 },
        { id: 'unstoppable', name: 'Unstoppable', description: 'Achieved a 20 territory streak', condition: () => gameState.longestPlayerStreak >= 20 },
        { id: 'combo_master', name: 'Combo Master', description: 'Achieved 5x combo multiplier', condition: () => gameState.comboMultiplier >= 5.0 },
    ];

    achievements.forEach(achievement => {
        if (achievement.condition() && !gameState.achievements.has(achievement.id)) {
            gameState.achievements.add(achievement.id);
            showAchievement(achievement);
        }
    });

    updateStats();
}

// Power-ups
function grantPowerUp(player, type) {
    if (player === 'player') {
        gameState.playerPowerUps[type]++;
        gameState.totalPowerUps++;
        showNotification(`⚡ You earned a ${type.toUpperCase()} power-up!`, 'power-up');
        playPowerUpSound();
    } else {
        gameState.aiPowerUps[type]++;
    }
    updatePowerUpUI();
}

function usePowerUp(player, type) {
    const powerUps = player === 'player' ? gameState.playerPowerUps : gameState.aiPowerUps;

    if (powerUps[type] <= 0) return false;

    powerUps[type]--;

    const playerName = player === 'player' ? 'You' : 'AI';
    const notifType = player === 'player' ? 'power-up' : 'ai';

    switch (type) {
        case 'bomb':
            handleBombPowerUp(player);
            showNotification(`💣 ${playerName} dropped a BOMB!`, notifType);
            break;
        case 'shield':
            handleShieldPowerUp(player);
            showNotification(`🛡️ ${playerName} activated SHIELD!`, notifType);
            break;
        case 'lightning':
            handleLightningPowerUp(player);
            showNotification(`⚡ ${playerName} struck with LIGHTNING!`, notifType);
            break;
        case 'chaos':
            handleChaosPowerUp();
            showNotification(`🌀 ${playerName} unleashed CHAOS!`, notifType);
            break;
        case 'freeze':
            handleFreezePowerUp(player);
            showNotification(`❄️ ${playerName} activated FREEZE!`, notifType);
            break;
        case 'rainbow':
            handleRainbowPowerUp(player);
            showNotification(`🌈 ${playerName} summoned a RAINBOW!`, notifType);
            break;
    }

    playPowerUpSound();
    shakeScreen(300);
    updatePowerUpUI();
    return true;
}

function handleBombPowerUp(player) {
    const unclaimed = gameState.territories
        .map((t, i) => t === null ? i : null)
        .filter(i => i !== null);

    const targets = [];
    for (let i = 0; i < Math.min(5, unclaimed.length); i++) {
        const idx = Math.floor(Math.random() * unclaimed.length);
        targets.push(unclaimed[idx]);
        unclaimed.splice(idx, 1);
    }

    targets.forEach((idx, i) => {
        setTimeout(() => {
            gameState.territories[idx] = player;
            if (player === 'player') gameState.playerScore++;
            else gameState.aiScore++;

            const element = document.getElementById(`territory-${idx}`);
            if (element) {
                const rect = element.getBoundingClientRect();
                createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, player === 'player' ? '#e74c3c' : '#3498db');
            }
            updateUI();
        }, i * 50);
    });
}

function handleShieldPowerUp(player) {
    gameState.territories.forEach((owner, idx) => {
        if (owner === player) {
            gameState.protectedTerritories.add(idx);
            const element = document.getElementById(`territory-${idx}`);
            if (element) element.classList.add('protected');
        }
    });

    setTimeout(() => {
        gameState.protectedTerritories.clear();
        document.querySelectorAll('.territory.protected').forEach(el => {
            el.classList.remove('protected');
        });
    }, 10000);
}

function handleLightningPowerUp(player) {
    const opponent = player === 'player' ? 'ai' : 'player';
    const opponentTerritories = gameState.territories
        .map((t, i) => t === opponent ? i : null)
        .filter(i => i !== null);

    const targets = [];
    for (let i = 0; i < Math.min(3, opponentTerritories.length); i++) {
        const idx = Math.floor(Math.random() * opponentTerritories.length);
        targets.push(opponentTerritories[idx]);
        opponentTerritories.splice(idx, 1);
    }

    targets.forEach((idx, i) => {
        setTimeout(() => {
            gameState.territories[idx] = player;
            if (player === 'player') {
                gameState.playerScore++;
                gameState.aiScore--;
            } else {
                gameState.aiScore++;
                gameState.playerScore--;
            }

            const element = document.getElementById(`territory-${idx}`);
            if (element) {
                const rect = element.getBoundingClientRect();
                createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, '#ffff00');
            }
            updateUI();
        }, i * 50);
    });
}

function handleChaosPowerUp() {
    const playerTerritories = gameState.territories
        .map((t, i) => t === 'player' ? i : null)
        .filter(i => i !== null);

    const aiTerritories = gameState.territories
        .map((t, i) => t === 'ai' ? i : null)
        .filter(i => i !== null);

    const swapCount = Math.min(10, playerTerritories.length, aiTerritories.length);

    for (let i = 0; i < swapCount; i++) {
        const playerIdx = playerTerritories[Math.floor(Math.random() * playerTerritories.length)];
        const aiIdx = aiTerritories[Math.floor(Math.random() * aiTerritories.length)];

        gameState.territories[playerIdx] = 'ai';
        gameState.territories[aiIdx] = 'player';
    }

    updateUI();
}

function handleFreezePowerUp(player) {
    if (player === 'player') {
        gameState.aiFrozen = true;
        setTimeout(() => {
            gameState.aiFrozen = false;
        }, 5000);
    } else {
        gameState.playerFrozen = true;
        document.body.classList.add('frozen');
        setTimeout(() => {
            gameState.playerFrozen = false;
            document.body.classList.remove('frozen');
            showNotification('✨ You are unfrozen!', 'success');
        }, 5000);
    }
}

function handleRainbowPowerUp(player) {
    const available = gameState.territories
        .map((t, i) => t === null ? i : null)
        .filter(i => i !== null);

    const targets = [];
    for (let i = 0; i < Math.min(8, available.length); i++) {
        const idx = Math.floor(Math.random() * available.length);
        targets.push(available[idx]);
        available.splice(idx, 1);
    }

    targets.forEach((idx, i) => {
        setTimeout(() => {
            gameState.territories[idx] = player;
            if (player === 'player') gameState.playerScore++;
            else gameState.aiScore++;

            const element = document.getElementById(`territory-${idx}`);
            if (element) {
                const rect = element.getBoundingClientRect();
                const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
                const color = colors[i % colors.length];
                createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, color);
            }
            updateUI();
        }, i * 50);
    });
}

// AI System - Multiple Personalities!
const AI_PERSONALITIES = {
    easy: {
        name: 'Friendly Bot',
        speed: 2000,
        powerUpChance: 0,
        strategy: 'random'
    },
    medium: {
        name: 'Strategic AI',
        speed: 1000,
        powerUpChance: 0,
        strategy: 'balanced'
    },
    hard: {
        name: 'Aggressive AI',
        speed: 500,
        powerUpChance: 0.1,
        strategy: 'aggressive'
    },
    insane: {
        name: 'DESTROYER 9000',
        speed: 300,
        powerUpChance: 0.3,
        strategy: 'god'
    }
};

function aiTurn() {
    if (gameState.aiFrozen || gameState.gameOver) return;

    const personality = AI_PERSONALITIES[gameState.difficulty];

    // AI decides whether to use power-up
    if (Math.random() < personality.powerUpChance) {
        const availablePowerUps = Object.keys(gameState.aiPowerUps)
            .filter(key => gameState.aiPowerUps[key] > 0);

        if (availablePowerUps.length > 0) {
            const powerUp = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
            usePowerUp('ai', powerUp);
            return; // AI used power-up this turn
        }
    }

    // AI captures territory based on strategy
    let targetIdx;

    switch (personality.strategy) {
        case 'random':
            targetIdx = aiStrategyRandom();
            break;
        case 'balanced':
            targetIdx = aiStrategyBalanced();
            break;
        case 'aggressive':
            targetIdx = aiStrategyAggressive();
            break;
        case 'god':
            targetIdx = aiStrategyGod();
            break;
    }

    if (targetIdx !== null) {
        captureTerritory(targetIdx, 'ai');
    }
}

function aiStrategyRandom() {
    const unclaimed = gameState.territories
        .map((t, i) => t === null ? i : null)
        .filter(i => i !== null);

    if (unclaimed.length === 0) return null;
    return unclaimed[Math.floor(Math.random() * unclaimed.length)];
}

function aiStrategyBalanced() {
    // 70% chance to capture unclaimed, 30% chance to attack player
    if (Math.random() < 0.7) {
        return aiStrategyRandom();
    } else {
        const playerTerritories = gameState.territories
            .map((t, i) => (t === 'player' && !gameState.protectedTerritories.has(i)) ? i : null)
            .filter(i => i !== null);

        if (playerTerritories.length === 0) return aiStrategyRandom();
        return playerTerritories[Math.floor(Math.random() * playerTerritories.length)];
    }
}

function aiStrategyAggressive() {
    // Prioritize attacking player territories
    const playerTerritories = gameState.territories
        .map((t, i) => (t === 'player' && !gameState.protectedTerritories.has(i)) ? i : null)
        .filter(i => i !== null);

    if (playerTerritories.length > 0 && Math.random() < 0.8) {
        return playerTerritories[Math.floor(Math.random() * playerTerritories.length)];
    }

    return aiStrategyRandom();
}

function aiStrategyGod() {
    // Always attack player territories if available
    const playerTerritories = gameState.territories
        .map((t, i) => (t === 'player' && !gameState.protectedTerritories.has(i)) ? i : null)
        .filter(i => i !== null);

    if (playerTerritories.length > 0) {
        return playerTerritories[Math.floor(Math.random() * playerTerritories.length)];
    }

    // Otherwise capture unclaimed
    return aiStrategyRandom();
}

// Territory capture
function captureTerritory(idx, player) {
    if (gameState.gameOver) return;

    const currentOwner = gameState.territories[idx];

    // Check if already owned by this player
    if (currentOwner === player) {
        return; // Can't capture your own territory
    }

    // Check if protected
    if (gameState.protectedTerritories.has(idx) && currentOwner !== player) {
        if (player === 'player') {
            showNotification('🛡️ This territory is protected!', 'error');
        }
        return;
    }

    // Update ownership
    if (currentOwner !== null && currentOwner !== player) {
        // Stealing from opponent
        if (currentOwner === 'player') {
            gameState.playerScore--;
            gameState.playerStreak = 0;
        } else {
            gameState.aiScore--;
            gameState.aiStreak = 0;
        }
    }

    gameState.territories[idx] = player;

    if (player === 'player') {
        gameState.playerScore++;
        gameState.playerStreak++;
        gameState.longestPlayerStreak = Math.max(gameState.longestPlayerStreak, gameState.playerStreak);
        gameState.aiStreak = 0;

        updateCombo();

        // Grant power-up every 10 captures
        if (gameState.playerScore % 10 === 0) {
            const powerTypes = ['bomb', 'shield', 'lightning', 'chaos', 'freeze', 'rainbow'];
            const powerType = powerTypes[Math.floor(Math.random() * powerTypes.length)];
            grantPowerUp('player', powerType);
        }

        checkAchievements();
        playCaptureSound();
    } else {
        gameState.aiScore++;
        gameState.aiStreak++;
        gameState.playerStreak = 0;

        // AI gets power-ups too (on insane mode more frequently)
        const powerUpFrequency = gameState.difficulty === 'insane' ? 8 : 15;
        if (gameState.aiScore % powerUpFrequency === 0) {
            const powerTypes = ['bomb', 'shield', 'lightning', 'chaos', 'freeze', 'rainbow'];
            const powerType = powerTypes[Math.floor(Math.random() * powerTypes.length)];
            grantPowerUp('ai', powerType);
        }

        playAISound();
    }

    // Visual feedback
    const element = document.getElementById(`territory-${idx}`);
    if (element) {
        element.classList.add('capturing');
        setTimeout(() => element.classList.remove('capturing'), 500);

        const rect = element.getBoundingClientRect();
        const color = player === 'player' ? '#e74c3c' : '#3498db';
        createParticle(rect.left + rect.width / 2, rect.top + rect.height / 2, color, 5);
    }

    updateUI();
    checkGameEnd();
}

// UI Updates
function updateUI() {
    // Update territories
    gameState.territories.forEach((owner, idx) => {
        const element = document.getElementById(`territory-${idx}`);
        if (element) {
            element.className = 'territory';
            if (owner === 'player') element.classList.add('red');
            else if (owner === 'ai') element.classList.add('blue');

            if (gameState.protectedTerritories.has(idx)) {
                element.classList.add('protected');
            }
        }
    });

    // Update scores
    document.getElementById('player-score').textContent = `You: ${gameState.playerScore}`;
    document.getElementById('ai-score').textContent = `AI: ${gameState.aiScore}`;

    // Update progress bar
    const total = TERRITORY_COUNT;
    const playerPercent = (gameState.playerScore / total) * 100;
    const aiPercent = (gameState.aiScore / total) * 100;

    document.querySelector('.progress-red').style.width = `${playerPercent}%`;
    document.querySelector('.progress-blue').style.width = `${aiPercent}%`;

    updateStats();
}

function updateStats() {
    document.getElementById('stat-player-score').textContent = gameState.playerScore;
    document.getElementById('stat-ai-score').textContent = gameState.aiScore;
    document.getElementById('stat-player-streak').textContent = gameState.playerStreak;
    document.getElementById('stat-multiplier').textContent = `${gameState.comboMultiplier.toFixed(1)}x`;
    document.getElementById('stat-achievements').textContent = gameState.achievements.size;
    document.getElementById('stat-powerups').textContent = gameState.totalPowerUps;
}

function updatePowerUpUI() {
    document.querySelectorAll('.power-up-btn').forEach(btn => {
        const powerType = btn.dataset.power;
        const count = gameState.playerPowerUps[powerType] || 0;
        const countSpan = btn.querySelector('.power-count');
        if (countSpan) {
            countSpan.textContent = count;
        }
        btn.disabled = count === 0;
    });
}

// Game end
function checkGameEnd() {
    if (gameState.playerScore === TERRITORY_COUNT) {
        gameState.gameOver = true;
        clearInterval(gameState.aiInterval);
        createConfetti();
        shakeScreen(1000);
        showNotification('🎉 YOU WON! AMAZING! 🎉', 'success');
        playAchievementSound();
    } else if (gameState.aiScore === TERRITORY_COUNT) {
        gameState.gameOver = true;
        clearInterval(gameState.aiInterval);
        showNotification('💔 AI Won! Try again! 💔', 'error');
    }
}

// Game initialization
function createMap() {
    const map = document.getElementById('map');
    map.innerHTML = '';

    for (let i = 0; i < TERRITORY_COUNT; i++) {
        const territory = document.createElement('div');
        territory.className = 'territory';
        territory.id = `territory-${i}`;
        territory.addEventListener('click', () => {
            if (!gameState.playerFrozen && !gameState.gameOver) {
                captureTerritory(i, 'player');
            }
        });
        map.appendChild(territory);
    }
}

function startGame(difficulty) {
    // Reset game state
    gameState = {
        territories: Array(TERRITORY_COUNT).fill(null),
        playerScore: 0,
        aiScore: 0,
        playerStreak: 0,
        aiStreak: 0,
        longestPlayerStreak: 0,
        comboCount: 0,
        comboMultiplier: 1.0,
        lastClickTime: 0,
        playerPowerUps: { bomb: 0, shield: 0, lightning: 0, chaos: 0, freeze: 0, rainbow: 0 },
        aiPowerUps: { bomb: 0, shield: 0, lightning: 0, chaos: 0, freeze: 0, rainbow: 0 },
        protectedTerritories: new Set(),
        achievements: new Set(),
        totalPowerUps: 0,
        difficulty: difficulty,
        aiInterval: null,
        aiFrozen: false,
        playerFrozen: false,
        gameOver: false
    };

    // Show battlefield
    document.getElementById('difficulty-selector').style.display = 'none';
    document.getElementById('battlefield').style.display = 'block';

    createMap();
    updateUI();
    updatePowerUpUI();

    const personality = AI_PERSONALITIES[difficulty];
    showNotification(`🤖 Battling ${personality.name}!`, 'ai');

    // Start AI
    if (gameState.aiInterval) clearInterval(gameState.aiInterval);
    gameState.aiInterval = setInterval(aiTurn, personality.speed);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Background effect
    const backgroundEffect = document.getElementById('background-effect');
    let circles = [];

    document.addEventListener('mousemove', (e) => {
        const circle = document.createElement('div');
        circle.classList.add('effect-circle');
        circle.style.left = `${e.clientX}px`;
        circle.style.top = `${e.clientY}px`;
        backgroundEffect.appendChild(circle);
        circles.push(circle);

        if (circles.length > 5) {
            const oldCircle = circles.shift();
            oldCircle.remove();
        }

        setTimeout(() => {
            circle.style.width = '300px';
            circle.style.height = '300px';
            circle.style.opacity = '0';
        }, 50);

        setTimeout(() => {
            circle.remove();
        }, 1000);
    });

    // Difficulty selection
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const difficulty = btn.dataset.difficulty;
            startGame(difficulty);
        });
    });

    // Control buttons
    document.getElementById('back-btn').addEventListener('click', () => {
        if (gameState.aiInterval) clearInterval(gameState.aiInterval);
        document.getElementById('battlefield').style.display = 'none';
        document.getElementById('difficulty-selector').style.display = 'block';
    });

    document.getElementById('sound-toggle').addEventListener('click', (e) => {
        soundEnabled = !soundEnabled;
        e.target.textContent = soundEnabled ? '🔊 Sound' : '🔇 Muted';
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
        startGame(gameState.difficulty);
    });

    // Power-up buttons
    document.querySelectorAll('.power-up-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (gameState.playerFrozen) {
                showNotification('❄️ You are frozen!', 'error');
                return;
            }

            const powerType = btn.dataset.power;
            if (usePowerUp('player', powerType)) {
                shakeScreen(300);
            }
        });
    });
});
