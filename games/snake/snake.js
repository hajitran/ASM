const loginScreen = document.getElementById('loginScreen');
const gameScreen = document.getElementById('gameScreen');
const playerNameInput = document.getElementById('playerName');
const startBtn = document.getElementById('startBtn');
const leaderboardEl = document.getElementById('leaderboard');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const playerDisplay = document.getElementById('playerDisplay');
const restartGameBtn = document.getElementById('restartGameBtn');
const exitGameBtn = document.getElementById('exitGameBtn');

// Game configuration
const box = 20;
const cols = canvas.width / box;
const rows = canvas.height / box;

// Game state
let snake = [];
let direction = 'RIGHT';
let food = null;
let score = 0;
let playerName = '';
let isPlaying = false;
let speed = 150;
let gameTimer;
let bonusFood = null;
let bonusTimer = null;

// Fruit types
const FRUITS = [
  { emoji: '🍎', color: '#ff4444', points: 1 },
  { emoji: '🍊', color: '#ff8800', points: 1 },
  { emoji: '🍌', color: '#ffdd00', points: 1 },
  { emoji: '🍇', color: '#8844ff', points: 2 },
  { emoji: '🍓', color: '#ff0044', points: 2 },
  { emoji: '🥝', color: '#88dd00', points: 3 },
  { emoji: '🍑', color: '#ff2266', points: 3 }
];

// Controls
document.addEventListener('keydown', e => {
  if (!isPlaying) return;
  
  switch(e.key) {
    case 'ArrowLeft':
      if (direction !== 'RIGHT') direction = 'LEFT';
      break;
    case 'ArrowUp':
      if (direction !== 'DOWN') direction = 'UP';
      break;
    case 'ArrowRight':
      if (direction !== 'LEFT') direction = 'RIGHT';
      break;
    case 'ArrowDown':
      if (direction !== 'UP') direction = 'DOWN';
      break;
  }
  e.preventDefault();
});

// Data management
function loadScores() {
  try {
    return JSON.parse(localStorage.getItem('snakeHighScores')) || [];
  } catch {
    return [];
  }
}

function saveScore(name, points) {
  if (!name || points <= 0) return;
  
  const scores = loadScores();
  scores.push({ name, score: points, date: new Date().toISOString() });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem('snakeHighScores', JSON.stringify(scores.slice(0, 10)));
}

function updateLeaderboard() {
  const scores = loadScores();
  leaderboardEl.innerHTML = '';
  
  for (let i = 0; i < 10; i++) {
    const li = document.createElement('li');
    if (scores[i]) {
      const medal = ["🥇", "🥈", "🥉", "🎖️", "🏅", "⭐", "⭐", "⭐", "⭐", "⭐"][i] || "";
      li.textContent = `${medal} ${scores[i].name} - ${scores[i].score} điểm`;
    } else {
      li.textContent = `${i + 1}. ---`;
      li.style.opacity = '0.5';
    }
    leaderboardEl.appendChild(li);
  }
}

// Game logic
function createFood() {
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  } while (snake.some(s => s.x === position.x && s.y === position.y));
  
  // Assign random fruit type
  const fruitType = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  return { ...position, ...fruitType };
}

function spawnBonusFood() {
  if (bonusFood || Math.random() > 0.015) return;
  
  // Bonus food is always high-value fruit
  const bonusFruits = FRUITS.filter(f => f.points >= 2);
  const fruitType = bonusFruits[Math.floor(Math.random() * bonusFruits.length)];
  
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  } while (snake.some(s => s.x === position.x && s.y === position.y) || 
           (food && position.x === food.x && position.y === food.y));
  
  bonusFood = { ...position, ...fruitType, points: fruitType.points * 2 };
  
  bonusTimer = setTimeout(() => {
    bonusFood = null;
  }, 4000);
}

function drawSnakeSegment(x, y, isHead, segmentIndex) {
  const px = x * box;
  const py = y * box;
  
  if (isHead) {
    // Draw snake head with eyes and direction
    const gradient = ctx.createRadialGradient(
      px + box/2, py + box/3, box/8,
      px + box/2, py + box/2, box/2
    );
    gradient.addColorStop(0, '#66bb6a');
    gradient.addColorStop(0.7, '#4caf50');
    gradient.addColorStop(1, '#2e7d32');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(px + 2, py + 2, box - 4, box - 4);
    
    // Draw eyes
    ctx.fillStyle = '#000000';
    let eyeX1, eyeY1, eyeX2, eyeY2;
    
    switch(direction) {
      case 'UP':
        eyeX1 = px + 6; eyeY1 = py + 6;
        eyeX2 = px + 14; eyeY2 = py + 6;
        break;
      case 'DOWN':
        eyeX1 = px + 6; eyeY1 = py + 14;
        eyeX2 = px + 14; eyeY2 = py + 14;
        break;
      case 'LEFT':
        eyeX1 = px + 6; eyeY1 = py + 6;
        eyeX2 = px + 6; eyeY2 = py + 14;
        break;
      case 'RIGHT':
        eyeX1 = px + 14; eyeY1 = py + 6;
        eyeX2 = px + 14; eyeY2 = py + 14;
        break;
    }
    
    ctx.fillRect(eyeX1, eyeY1, 3, 3);
    ctx.fillRect(eyeX2, eyeY2, 3, 3);
    
    // Draw pupils
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(eyeX1 + 1, eyeY1 + 1, 1, 1);
    ctx.fillRect(eyeX2 + 1, eyeY2 + 1, 1, 1);
    
  } else {
    // Draw body segments with pattern
    const bodyGradient = ctx.createRadialGradient(
      px + box/2, py + box/3, box/8,
      px + box/2, py + box/2, box/2
    );
    
    // Alternate colors for body segments
    if (segmentIndex % 2 === 0) {
      bodyGradient.addColorStop(0, '#4caf50');
      bodyGradient.addColorStop(0.7, '#388e3c');
      bodyGradient.addColorStop(1, '#2e7d32');
    } else {
      bodyGradient.addColorStop(0, '#66bb6a');
      bodyGradient.addColorStop(0.7, '#4caf50');
      bodyGradient.addColorStop(1, '#388e3c');
    }
    
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(px + 3, py + 3, box - 6, box - 6);
    
    // Add scale pattern
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 3, py + 3, box - 6, box - 6);
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    drawSnakeSegment(segment.x, segment.y, index === 0, index);
  });
}

function drawFruit(fruit) {
  if (!fruit) return;
  
  const px = fruit.x * box;
  const py = fruit.y * box;
  
  // Draw fruit shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(px + 2, py + 18, box - 4, 4);
  
  // Draw fruit background circle
  const gradient = ctx.createRadialGradient(
    px + box/2, py + box/3, box/6,
    px + box/2, py + box/2, box/2
  );
  gradient.addColorStop(0, 'white');
  gradient.addColorStop(0.3, fruit.color);
  gradient.addColorStop(1, fruit.color);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(px + box/2, py + box/2, box/2 - 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw fruit emoji
  ctx.font = `${box - 4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fruit.emoji, px + box/2, py + box/2);
}

function drawBonusFood() {
  if (!bonusFood) return;
  
  const px = bonusFood.x * box;
  const py = bonusFood.y * box;
  
  // Glowing effect for bonus food
  const time = Date.now() * 0.01;
  const glow = Math.sin(time) * 0.3 + 0.7;
  
  ctx.shadowColor = bonusFood.color;
  ctx.shadowBlur = 10 * glow;
  
  drawFruit(bonusFood);
  
  // Reset shadow
  ctx.shadowBlur = 0;
  
  // Draw bonus indicator
  ctx.font = '12px Arial';
  ctx.fillStyle = '#ffff00';
  ctx.textAlign = 'center';
  ctx.fillText(`+${bonusFood.points}`, px + box/2, py - 5);
}

function update() {
  const head = { ...snake[0] };
  
  // Move head
  switch(direction) {
    case 'LEFT': head.x--; break;
    case 'RIGHT': head.x++; break;
    case 'UP': head.y--; break;
    case 'DOWN': head.y++; break;
  }
  
  // Check collisions
  if (
    head.x < 0 || head.x >= cols ||
    head.y < 0 || head.y >= rows ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    return gameOver();
  }
  
  snake.unshift(head);
  
  // Check food collision
  let foodEaten = false;
  if (food && head.x === food.x && head.y === food.y) {
    score += food.points;
    food = createFood();
    foodEaten = true;
    
    // Increase speed slightly
    if (speed > 80) {
      speed -= 1;
      clearInterval(gameTimer);
      gameTimer = setInterval(gameLoop, speed);
    }
  }
  
  // Check bonus food collision
  if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
    score += bonusFood.points;
    bonusFood = null;
    clearTimeout(bonusTimer);
    foodEaten = true;
  }
  
  if (!foodEaten) {
    snake.pop();
  }
  
  // Spawn bonus food occasionally
  spawnBonusFood();
  
  scoreDisplay.textContent = `Điểm: ${score}`;
}

function draw() {
  // Clear canvas with grass-like background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1b5e20');
  gradient.addColorStop(0.5, '#2e7d32');
  gradient.addColorStop(1, '#1b5e20');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grass pattern
  ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if ((x + y) % 2 === 0) {
        ctx.fillRect(x * box, y * box, box, box);
      }
    }
  }
  
  drawSnake();
  drawFruit(food);
  drawBonusFood();
}

function gameLoop() {
  update();
  draw();
}

function gameOver() {
  clearInterval(gameTimer);
  clearTimeout(bonusTimer);
  isPlaying = false;
  
  // Create a more elaborate game over message
  let message = `🐍 Game Over!\n`;
  message += `Điểm số: ${score}\n`;
  message += `Độ dài rắn: ${snake.length}\n`;
  message += `Chúc mừng ${playerName}!`;
  
  alert(message);
  
  saveScore(playerName, score);
  showLoginScreen();
}

function startGame() {
  // Initialize game state
  snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
  direction = 'RIGHT';
  score = 0;
  speed = 150;
  food = createFood();
  bonusFood = null;
  
  // Update UI
  scoreDisplay.textContent = `Điểm: ${score}`;
  playerDisplay.textContent = playerName;
  
  // Switch screens
  gameScreen.classList.add('active');
  loginScreen.classList.remove('active');
  
  // Start game
  isPlaying = true;
  clearInterval(gameTimer);
  gameTimer = setInterval(gameLoop, speed);
}

function showLoginScreen() {
  isPlaying = false;
  clearInterval(gameTimer);
  clearTimeout(bonusTimer);
  
  gameScreen.classList.remove('active');
  loginScreen.classList.add('active');
  
  updateLeaderboard();
  playerNameInput.value = '';
  startBtn.disabled = true;
}

// Event listeners
startBtn.addEventListener('click', () => {
  playerName = playerNameInput.value.trim();
  if (playerName) {
    startGame();
  }
});

playerNameInput.addEventListener('input', () => {
  startBtn.disabled = playerNameInput.value.trim() === '';
});

playerNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !startBtn.disabled) {
    startBtn.click();
  }
});

restartGameBtn.addEventListener('click', startGame);

exitGameBtn.addEventListener('click', () => {
  if (score > 0) {
    saveScore(playerName, score);
  }
  showLoginScreen();
});

// Initialize
showLoginScreen();
