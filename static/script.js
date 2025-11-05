const socket = io({
    auth: {
        csrf_token: csrfToken
    },
    transports: ['websocket', 'polling']
});

let playerTeam = null;
let playerNickname = null;
const territoryCount = 100;
let gameStartTime = null;
let gameTimer = null;
let soundEnabled = true;
let isFrozen = false;

// Sound effects (using Web Audio API)
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
    const baseFreq = 440;
    playSound('triangle', baseFreq * multiplier, 50);
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

// Combo display
function showCombo(count, multiplier) {
    const comboDisplay = document.getElementById('combo-display');
    comboDisplay.style.display = 'block';
    comboDisplay.innerHTML = `
        <div class="combo-text">COMBO x${count}</div>
        <div class="multiplier-text">${multiplier.toFixed(1)}x MULTIPLIER!</div>
    `;
    comboDisplay.classList.add('combo-pulse');

    playComboSound(multiplier);

    setTimeout(() => {
        comboDisplay.classList.remove('combo-pulse');
    }, 500);
}

// Achievement notifications
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

// Power-up effects
function showPowerUpEffect(type, data) {
    const messages = {
        bomb: `💣 ${data.player} dropped a BOMB!`,
        shield: `🛡️ ${data.player} activated SHIELD!`,
        lightning: `⚡ ${data.player} struck with LIGHTNING!`,
        chaos: `🌀 ${data.player} unleashed CHAOS!`,
        freeze: `❄️ ${data.player} activated FREEZE!`,
        rainbow: `🌈 ${data.player} summoned a RAINBOW!`
    };

    showNotification(messages[type], 'power-up');

    // Visual effects
    if (type === 'bomb' || type === 'lightning' || type === 'rainbow') {
        data.territories?.forEach((tid, index) => {
            setTimeout(() => {
                const element = document.getElementById(tid);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, '#ff6b6b');
                }
            }, index * 50);
        });
    }

    if (type === 'freeze' && data.target_team === playerTeam) {
        isFrozen = true;
        document.body.classList.add('frozen');
        showNotification('❄️ You are FROZEN!', 'freeze-warning');

        setTimeout(() => {
            isFrozen = false;
            document.body.classList.remove('frozen');
            showNotification('✨ You are unfrozen!', 'success');
        }, data.duration * 1000);
    }
}

// General notifications
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

// Screen shake
function shakeScreen(intensity = 10, duration = 500) {
    const container = document.getElementById('game-container');
    container.style.animation = `shake ${duration}ms ease-in-out`;

    setTimeout(() => {
        container.style.animation = '';
    }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
    const backgroundEffect = document.getElementById('background-effect');
    let circles = [];

    function createCircle(x, y) {
        const circle = document.createElement('div');
        circle.classList.add('effect-circle');
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;
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
    }

    document.addEventListener('mousemove', (e) => {
        createCircle(e.clientX, e.clientY);
    });

    // Sound toggle
    document.getElementById('sound-toggle')?.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        const btn = document.getElementById('sound-toggle');
        btn.textContent = soundEnabled ? '🔊' : '🔇';
        showNotification(soundEnabled ? 'Sound enabled' : 'Sound disabled', 'info');
    });

    // Game mode selector
    document.getElementById('mode-select')?.addEventListener('change', (e) => {
        const mode = e.target.value;
        socket.emit('set_game_mode', { mode });
    });

    // Power-up buttons
    document.querySelectorAll('.power-up-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (isFrozen) {
                showNotification('❄️ You are frozen!', 'error');
                return;
            }

            const powerType = btn.dataset.power;
            socket.emit('use_power_up', { type: powerType });
            playPowerUpSound();
            shakeScreen(5, 300);
        });
    });

    function displayStats(data) {
        const redScore = Object.values(data.red).filter(Boolean).length;
        const blueScore = Object.values(data.blue).filter(Boolean).length;
        const totalTerritories = territoryCount;
        const unclaimedTerritories = totalTerritories - redScore - blueScore;
        const totalPlayers = Object.keys(data.players).length;

        const avgTerritoriesPerPlayer = totalPlayers > 0 ? ((redScore + blueScore) / totalPlayers).toFixed(2) : 0;
        const mostActivePlayer = getMostActivePlayer(data.players);
        const longestPlayerStreak = getLongestPlayerStreak(data.players);
        const lastVictory = getLastVictory(data);

        const statsHtml = `
            <h2>Game Stats</h2>
            <div class="stats-container">
                <div class="stats-column">
                    <h3>Basic Stats</h3>
                    <p>Red Team: ${redScore} territories (${((redScore / totalTerritories) * 100).toFixed(1)}%)</p>
                    <p>Blue Team: ${blueScore} territories (${((blueScore / totalTerritories) * 100).toFixed(1)}%)</p>
                    <p>Unclaimed: ${unclaimedTerritories} territories (${((unclaimedTerritories / totalTerritories) * 100).toFixed(1)}%)</p>
                    <p>Total Players: ${totalPlayers}</p>
                    <p>Game Mode: ${data.game_mode ? data.game_mode.replace('_', ' ').toUpperCase() : 'CLASSIC'}</p>
                </div>
                <div class="stats-column">
                    <h3>Advanced Stats</h3>
                    <p>Avg. Territories/Player: ${avgTerritoriesPerPlayer}</p>
                    <p>Most Active Player: ${mostActivePlayer.nickname} (${mostActivePlayer.score} territories)</p>
                    <p>Longest Player Streak: ${longestPlayerStreak.nickname} (${longestPlayerStreak.streak} territories)</p>
                    <p>Last Victory: ${lastVictory}</p>
                </div>
            </div>
        `;

        const instructionsElement = document.getElementById('instructions');
        instructionsElement.innerHTML = statsHtml;
    }

    function getMostActivePlayer(players) {
        return Object.values(players).reduce((max, player) => player.score > max.score ? player : max, { score: 0, nickname: 'N/A' });
    }

    function getLongestPlayerStreak(players) {
        return Object.values(players).reduce(
            (max, player) => player.longest_streak > max.streak ? { nickname: player.nickname, streak: player.longest_streak } : max,
            { nickname: 'N/A', streak: 0 }
        );
    }

    function getLastVictory(data) {
        const redScore = Object.values(data.red).filter(Boolean).length;
        const blueScore = Object.values(data.blue).filter(Boolean).length;

        if (redScore > blueScore) {
            return 'Red team';
        } else if (blueScore > redScore) {
            return 'Blue team';
        } else {
            return 'Tie';
        }
    }

    function joinTeam(team) {
        const mode = document.getElementById('mode-select')?.value || 'classic';
        socket.emit('set_game_mode', { mode });
        socket.emit('join', { team: team });
    }

    document.getElementById('red-team').addEventListener('click', () => joinTeam('red'));
    document.getElementById('blue-team').addEventListener('click', () => joinTeam('blue'));

    socket.on('reconnect', (data) => {
        playerTeam = data.team;
        playerNickname = data.nickname;
        handleTeamAssignment(data);
    });

    socket.on('team_assigned', handleTeamAssignment);

    function handleTeamAssignment(data) {
        playerTeam = data.team;
        playerNickname = data.nickname;
        document.getElementById('team-selection').style.display = 'none';
        document.getElementById('battlefield').style.display = 'block';
        document.getElementById('chat-container').style.display = 'block';

        const nicknameDisplay = document.getElementById('nickname-display') || document.createElement('div');
        nicknameDisplay.id = 'nickname-display';
        nicknameDisplay.innerHTML = `<strong>Your nickname:</strong> ${playerNickname}`;
        nicknameDisplay.style.cssText = `
            color: ${playerTeam === 'red' ? '#e74c3c' : '#3498db'};
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            padding: 10px;
            background: rgba(255,255,255,0.9);
            border-radius: 8px;
            margin-bottom: 10px;
        `;
        document.getElementById('battlefield').insertBefore(nicknameDisplay, document.getElementById('score'));

        createMap();
        updateGameState(data.game_state);

        if (data.game_start_time) {
            gameStartTime = new Date(data.game_start_time);
            startGameTimer();
        }

        showNotification(`Welcome, ${playerNickname}! You joined the ${playerTeam} team!`, 'success');
    }

    function startGameTimer() {
        if (gameTimer) {
            clearInterval(gameTimer);
        }
        updateGameTimerDisplay();
        gameTimer = setInterval(updateGameTimerDisplay, 1000);
    }

    function updateGameTimerDisplay() {
        if (!gameStartTime) return;

        const now = new Date();
        const timeDiff = now - gameStartTime;

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        const timerElement = document.getElementById('large-chronometer');
        if (timerElement) {
            timerElement.innerHTML = `
                <div class="chrono-unit">
                    <span class="chrono-value">${days.toString().padStart(2, '0')}</span>
                    <span class="chrono-label">Days</span>
                </div>
                <div class="chrono-separator">:</div>
                <div class="chrono-unit">
                    <span class="chrono-value">${hours.toString().padStart(2, '0')}</span>
                    <span class="chrono-label">Hours</span>
                </div>
                <div class="chrono-separator">:</div>
                <div class="chrono-unit">
                    <span class="chrono-value">${minutes.toString().padStart(2, '0')}</span>
                    <span class="chrono-label">Minutes</span>
                </div>
                <div class="chrono-separator">:</div>
                <div class="chrono-unit">
                    <span class="chrono-value">${seconds.toString().padStart(2, '0')}</span>
                    <span class="chrono-label">Seconds</span>
                </div>
            `;
        }
    }

    socket.on('game_state_update', (data) => {
        updateGameState(data.game_state);
    });

    socket.on('state_update', updateGameState);

    socket.on('chat_update', updateChat);

    socket.on('achievement_unlocked', (data) => {
        data.achievements.forEach(achievement => {
            showAchievement(achievement);
        });
    });

    socket.on('power_up_granted', (data) => {
        showNotification(`⚡ You earned a ${data.type.toUpperCase()} power-up!`, 'power-up');
        playPowerUpSound();
    });

    socket.on('power_up_effect', (data) => {
        showPowerUpEffect(data.type, data);
    });

    socket.on('random_event', (data) => {
        shakeScreen(15, 800);
        if (data.type === 'meteor_shower') {
            // Animate meteor shower
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const x = Math.random() * window.innerWidth;
                    createExplosion(x, 0, '#ff6b00');
                }, i * 100);
            }
        } else if (data.type === 'gold_rush') {
            // Golden effect
            document.body.style.filter = 'hue-rotate(45deg)';
            setTimeout(() => {
                document.body.style.filter = '';
            }, 30000);
        }
    });

    socket.on('game_end', () => {
        createConfetti();
        shakeScreen(20, 1000);
    });

    function updateGameState(data) {
        for (let i = 0; i < territoryCount; i++) {
            const territoryId = `territory-${i}`;
            const territory = document.getElementById(territoryId);
            if (territory) {
                // Check if it's a golden territory
                const isGolden = data.golden_territories?.includes(territoryId);

                if (data.red[territoryId]) {
                    territory.className = `territory red${isGolden ? ' golden' : ''}`;
                } else if (data.blue[territoryId]) {
                    territory.className = `territory blue${isGolden ? ' golden' : ''}`;
                } else {
                    territory.className = `territory${isGolden ? ' golden' : ''}`;
                }

                // Add protected class if territory is protected
                if (data.protected_territories?.[territoryId]) {
                    territory.classList.add('protected');
                }
            }
        }

        updateScore(data);
        updateChat(data.chat);
        displayStats(data);
        updateLeaderboard(data.leaderboard);
        updatePowerUps(data);
        updateCombo(data);
    }

    function updatePowerUps(data) {
        if (!playerTeam || !data.power_ups) return;

        const playerPowerUps = Object.entries(data.power_ups).find(([pid]) => pid === socket.id)?.[1];
        if (!playerPowerUps) return;

        document.querySelectorAll('.power-up-btn').forEach(btn => {
            const powerType = btn.dataset.power;
            const count = playerPowerUps[powerType] || 0;
            const countSpan = btn.querySelector('.power-count');
            if (countSpan) {
                countSpan.textContent = count;
            }
            btn.disabled = count === 0;
            btn.style.opacity = count === 0 ? '0.5' : '1';
        });
    }

    function updateCombo(data) {
        if (!playerTeam || !data.combos) return;

        const playerCombo = data.combos[socket.id];
        if (playerCombo && playerCombo.count > 1) {
            showCombo(playerCombo.count, playerCombo.multiplier);
        }
    }

    function updateChat(chatData) {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        for (const message of chatData) {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';

            if (message.team === 'system') {
                messageElement.classList.add('system');
                messageElement.textContent = message.message;
            } else {
                messageElement.classList.add(message.team);
                messageElement.innerHTML = `<strong>${message.nickname}:</strong> ${message.message}`;
            }

            chatMessages.appendChild(messageElement);
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    document.getElementById('send-message').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (message) {
            socket.emit('chat', { message: message });
            input.value = '';
        }
    }

    function updateScore(data) {
        const redScore = Object.values(data.red).filter(Boolean).length;
        const blueScore = Object.values(data.blue).filter(Boolean).length;
        const totalTerritories = territoryCount;

        document.getElementById('red-score').textContent = `Red: ${redScore}`;
        document.getElementById('blue-score').textContent = `Blue: ${blueScore}`;

        const progressBar = document.getElementById('progress-bar');
        const redPercentage = (redScore / totalTerritories) * 100;
        const bluePercentage = (blueScore / totalTerritories) * 100;

        progressBar.innerHTML = `
            <div class="progress-red" style="width: ${redPercentage}%"></div>
            <div class="progress-blue" style="width: ${bluePercentage}%"></div>
        `;
    }

    function updateLeaderboard(leaderboardData) {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = leaderboardData.map((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            return `
                <li>
                    <span class="leaderboard-name" style="color: ${player.team === 'red' ? '#e74c3c' : '#3498db'};">
                        ${medal} ${player.nickname}
                    </span>
                    <span class="leaderboard-score">${player.score}</span>
                </li>
            `;
        }).join('');
    }

    function createMap() {
        const map = document.getElementById('map');
        map.innerHTML = '';
        for (let i = 0; i < territoryCount; i++) {
            const territory = document.createElement('div');
            territory.className = 'territory';
            territory.id = `territory-${i}`;
            territory.addEventListener('click', handleTerritoryClick);
            map.appendChild(territory);
        }
    }

    function handleTerritoryClick(event) {
        if (!playerTeam) return;
        if (isFrozen) {
            showNotification('❄️ You are frozen!', 'error');
            return;
        }

        const territoryId = event.target.id;
        let action = event.target.classList.contains(playerTeam) ? 'unclaim' : 'claim';

        socket.emit('update', {
            team: playerTeam,
            territoryId: territoryId,
            action: action
        });

        // Visual feedback
        const rect = event.target.getBoundingClientRect();
        const color = playerTeam === 'red' ? '#e74c3c' : '#3498db';
        createParticle(rect.left + rect.width / 2, rect.top + rect.height / 2, color, 5);
        playCaptureSound();

        event.target.classList.add('capturing');
        setTimeout(() => event.target.classList.remove('capturing'), 500);
    }

    function goBackToTeamSelection() {
        document.getElementById('battlefield').style.display = 'none';
        document.getElementById('chat-container').style.display = 'none';
        document.getElementById('team-selection').style.display = 'flex';

        playerTeam = null;
        playerNickname = null;

        socket.emit('leave');
        displayStats(initialState);
    }

    document.getElementById('back-button').addEventListener('click', goBackToTeamSelection);

    // Display initial stats
    displayStats(initialState);
});
