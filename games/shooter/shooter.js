const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loginPanel = document.getElementById('loginPanel');
const gameArea = document.getElementById('gameArea');
const leaderboardPanel = document.getElementById('leaderboardPanel');
const loginBtn = document.getElementById('loginBtn');
const playerNameInput = document.getElementById('playerName');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverText = document.getElementById('gameOverText');
const scoreList = document.getElementById('scoreList');
const currentScoreDisplay = document.getElementById('currentScore');
const playerDisplay = document.getElementById('playerDisplay');

let playerName = "";
let player = { x: 180, y: 540, width: 40, height: 40, speed: 4 };
let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false;
let keys = {};
let gameStarted = false;
let gameRunning = false;
let lastShotTime = 0;
const shotCooldown = 300;
let enemySpawnInterval;

document.addEventListener('keydown', e => {
  if (document.activeElement === playerNameInput) return;
  
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
    keys[e.code] = true;
    e.preventDefault();
  }
});

document.addEventListener('keyup', e => {
  if (document.activeElement === playerNameInput) return;
  
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
    keys[e.code] = false;
    e.preventDefault();
  }
});

window.addEventListener('load', () => {
  playerNameInput.focus();
  showLeaderboard();
});

playerNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginBtn.click();
  }
});

function updateScoreDisplay() {
  currentScoreDisplay.textContent = `Score: ${score}`;
}

function shoot() {
  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    speed: 5
  });
}

function spawnEnemy() {
  if (gameStarted && !gameOver && gameRunning) {
    const x = Math.random() * (canvas.width - 30);
    enemies.push({
      x, y: -30, width: 30, height: 30, speed: 1.2
    });
  }
}

function isColliding(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}

function update() {
  if (!gameStarted || gameOver || !gameRunning) return;

  if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x + player.width < canvas.width) player.x += player.speed;

  const currentTime = Date.now();
  if (keys['Space'] && currentTime - lastShotTime > shotCooldown) {
    shoot();
    lastShotTime = currentTime;
  }

  bullets = bullets.filter(b => b.y > 0);
  bullets.forEach(b => b.y -= b.speed);

  enemies.forEach(e => e.y += e.speed);

  for(let ei = enemies.length - 1; ei >= 0; ei--) {
    const enemy = enemies[ei];
    
    for(let bi = bullets.length - 1; bi >= 0; bi--) {
      const bullet = bullets[bi];
      if (isColliding(enemy, bullet)) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score++;
        updateScoreDisplay();
        break;
      }
    }

    if (enemy && enemy.y + enemy.height > canvas.height) {
      gameOver = true;
      gameRunning = false;
      gameOverText.textContent = "💥 GAME OVER 💥";
      restartBtn.style.display = 'inline-block';
      clearInterval(enemySpawnInterval);
      saveScore(playerName, score);
      showLeaderboard();
      break;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!gameStarted) return;

  ctx.fillStyle = '#00ff88';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = '#ffff00';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  ctx.fillStyle = '#ff0000';
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function resetGame() {
  player.x = 180;
  bullets = [];
  enemies = [];
  score = 0;
  gameOver = false;
  gameRunning = true;
  gameOverText.textContent = "";
  restartBtn.style.display = 'none';
  updateScoreDisplay();
  
  if(enemySpawnInterval) clearInterval(enemySpawnInterval);
  enemySpawnInterval = setInterval(spawnEnemy, 2000);
}

function saveScore(name, point) {
  if(!name || point <= 0) return;
  
  const scores = JSON.parse(localStorage.getItem('shooterHighScores') || '[]');
  scores.push({ name, point, date: new Date().toISOString() });
  scores.sort((a, b) => b.point - a.point);
  localStorage.setItem('shooterHighScores', JSON.stringify(scores.slice(0, 10)));
}

function showLeaderboard() {
  const scores = JSON.parse(localStorage.getItem('shooterHighScores') || '[]');
  scoreList.innerHTML = "";
  
  for(let i = 0; i < 10; i++) {
    const scoreItem = document.createElement('div');
    scoreItem.className = 'score-item';
    
    if(scores[i]) {
      const medal = ["🥇", "🥈", "🥉", "🎖️", "🏅", "⭐", "⭐", "⭐", "⭐", "⭐"][i] || "";
      scoreItem.innerHTML = `
        <span>${medal} ${i + 1}</span>
        <span>${scores[i].name}</span>
        <span>${scores[i].point}</span>
      `;
    } else {
      scoreItem.innerHTML = `
        <span>${i + 1}</span>
        <span class="empty-slot">—</span>
        <span class="empty-slot">—</span>
      `;
      scoreItem.classList.add('empty-slot');
    }
    
    scoreList.appendChild(scoreItem);
  }
  
  leaderboardPanel.style.display = 'block';
}

startBtn.onclick = () => {
  gameStarted = true;
  startBtn.style.display = 'none';
  resetGame();
};

restartBtn.onclick = () => {
  resetGame();
};

loginBtn.onclick = () => {
  const name = playerNameInput.value.trim();
  if (name === "") {
    alert("Vui lòng nhập tên!");
    playerNameInput.focus();
    return;
  }
  playerName = name;
  playerDisplay.textContent = name;
  loginPanel.style.display = 'none';
  gameArea.style.display = 'flex';
  updateScoreDisplay();
  showLeaderboard();
};

loop();
