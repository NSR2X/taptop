const socket = io({
    auth: {
        csrf_token: csrfToken
    },
    transports: ['websocket', 'polling']
});

let playerTeam = null;
let playerNickname = null;
const territoryCount = 538;
let gameStartTime = null;
let gameTimer = null;

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

    function displayStats(data) {
        const redScore = Object.values(data.red).filter(Boolean).length;
        const blueScore = Object.values(data.blue).filter(Boolean).length;
        const totalTerritories = territoryCount;
        const unclaimedTerritories = totalTerritories - redScore - blueScore;
        const totalPlayers = Object.keys(data.players).length;

        // Calculate additional stats
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

    // Helper functions for calculating additional stats
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
        nicknameDisplay.textContent = `Your nickname: ${playerNickname}`;
        nicknameDisplay.style.color = playerTeam === 'red' ? '#e74c3c' : '#3498db';
        document.getElementById('battlefield').insertBefore(nicknameDisplay, document.getElementById('score'));
        
        createMap();
        updateGameState(data.game_state);
        
        if (data.game_start_time) {
            gameStartTime = new Date(data.game_start_time);
            startGameTimer();
        }
    }

    // Add this function to handle the game timer
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

    function updateGameState(data) {
        for (let i = 0; i < territoryCount; i++) {
            const territoryId = `territory-${i}`;
            const territory = document.getElementById(territoryId);
            if (territory) {
                if (data.red[territoryId]) {
                    territory.className = 'territory red';
                } else if (data.blue[territoryId]) {
                    territory.className = 'territory blue';
                } else {
                    territory.className = 'territory';
                }
            }
        }
        updateScore(data);
        updateChat(data.chat);
        displayStats(data);
        updateLeaderboard(data.leaderboard);
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
        leaderboardList.innerHTML = leaderboardData.map(player => `
            <li>
                <span class="leaderboard-name" style="color: ${player.team === 'red' ? '#e74c3c' : '#3498db'};">
                    ${player.nickname}
                </span>
                <span class="leaderboard-score">${player.score}</span>
            </li>
        `).join('');
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
        if (!playerTeam) return; // Ensure player has joined a team
        const territoryId = event.target.id;
        let action = event.target.classList.contains(playerTeam) ? 'unclaim' : 'claim';
        socket.emit('update', {
            team: playerTeam,
            territoryId: territoryId,
            action: action
        });
    }

    function goBackToTeamSelection() {
        // Hide battlefield and chat
        document.getElementById('battlefield').style.display = 'none';
        document.getElementById('chat-container').style.display = 'none';
        
        // Show team selection
        document.getElementById('team-selection').style.display = 'flex';
        
        // Reset player data
        playerTeam = null;
        playerNickname = null;
        
        // Emit a leave event to the server
        socket.emit('leave');

        // Display initial stats again
        displayStats(initialState);
    }

    // Add this event listener after your DOMContentLoaded event listener
    document.getElementById('back-button').addEventListener('click', goBackToTeamSelection);

    // Display initial stats
    displayStats(initialState);
});
