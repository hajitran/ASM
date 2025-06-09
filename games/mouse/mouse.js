const holes = document.querySelectorAll('.hole');
const scoreBoard = document.getElementById('score');
const timeDisplay = document.getElementById('time');

let lastHole;
let timeUp = false;
let score = 0;
let timeLeft = 30;
let timerId;
let popupTimerId;
let gamePaused = false;
let popupInterval = 1500;
let countdownInterval;
let gameRunning = false;
let username = '';

const insects = ['mouse', 'rat'];

// Get current user from parent window
function getCurrentUser() {
  try {
    return window.parent.gamingHub?.authSystem?.getCurrentUser() || null;
  } catch {
    return null;
  }
}

function randomTime(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
  const idx = Math.floor(Math.random() * holes.length);
  if (idx === lastHole) {
    return randomHole(holes);
  }
  lastHole = idx;
  return holes[idx];
}

function peep() {
  if (gamePaused || timeUp || !gameRunning) return;
  
  const time = randomTime(popupInterval / 2, popupInterval);
  const hole = randomHole(holes);
  const insectType = insects[Math.floor(Math.random() * insects.length)];
  const insect = document.createElement('div');
  
  insect.classList.add('insect', insectType);
  hole.appendChild(insect);

  insect.addEventListener('click', hitInsect);

  // Hide insect after time
  popupTimerId = setTimeout(() => {
    insect.style.animation = 'hide 0.3s forwards';
    setTimeout(() => {
      if (hole.contains(insect)) {
        hole.removeChild(insect);
      }
    }, 300);
  }, time);

  if (!timeUp && !gamePaused && gameRunning) {
    timerId = setTimeout(peep, time);
  }
}

function hitInsect(e) {
  if (!e.isTrusted) return;
  
  if (document.getElementById('hitSound')) {
    const hitSound = document.getElementById('hitSound');
    hitSound.currentTime = 0;
    hitSound.play().catch(() => {});
  }

  const insect = e.target;
  const insectType = insect.classList.contains('rat') ? 'rat' : 'mouse';

  if (insectType === 'mouse') {
    score++;
  } else {
    score = Math.max(0, score - 1);
  }
  
  updateScoreDisplay();
  flashScore();

  const hole = insect.parentNode;
  insect.style.animation = 'hide 0.3s forwards';
  setTimeout(() => {
    if (hole.contains(insect)) {
      hole.removeChild(insect);
    }
  }, 300);
}

function updateScoreDisplay() {
  scoreBoard.textContent = 'Điểm: ' + score;
}

function flashScore() {
  scoreBoard.classList.add('flash');
  setTimeout(() => scoreBoard.classList.remove('flash'), 300);
}

function startGame() {
  score = 0;
  timeLeft = 30;
  timeUp = false;
  gamePaused = false;
  gameRunning = true;
  popupInterval = 1500;
  
  updateScoreDisplay();
  timeDisplay.textContent = 'Thời gian: 30s';

  document.getElementById('login').style.display = 'none';
  document.getElementById('game').style.display = 'flex';

  document.getElementById('pauseBtn').textContent = 'Pause';

  peep();
  countdown();
}

function countdown() {
  countdownInterval = setInterval(() => {
    if (!gamePaused && gameRunning) {
      timeLeft--;
      timeDisplay.textContent = `Thời gian: ${timeLeft}s`;
      
      // Increase difficulty as time decreases
      if (timeLeft <= 20 && popupInterval > 1000) {
        popupInterval = 1000;
      }
      if (timeLeft <= 10 && popupInterval > 800) {
        popupInterval = 800;
      }
      
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        endGame();
      }
    }
  }, 1000);
}

function endGame() {
  timeUp = true;
  gamePaused = true;
  gameRunning = false;
  
  clearTimeout(timerId);
  clearTimeout(popupTimerId);
  clearInterval(countdownInterval);

  // Clear remaining insects
  holes.forEach(hole => {
    hole.innerHTML = '';
  });

  showLeaderboard();
  updateParentLeaderboard(); // Add this line
}


function showLeaderboard() {
  let leaderboard = JSON.parse(localStorage.getItem('mouseLeaderboard') || '[]');
  
  if (username && score > 0) {
    leaderboard.push({
      name: username,
      score: score,
      date: new Date().toISOString()
    });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem('mouseLeaderboard', JSON.stringify(leaderboard));
  }

  displayLeaderboard(leaderboard);
  document.getElementById('game').style.display = 'none';
  document.getElementById('leaderboardOverlay').style.display = 'flex';
}

function displayLeaderboard(leaderboard = null) {
  if (!leaderboard) {
    leaderboard = JSON.parse(localStorage.getItem('mouseLeaderboard') || '[]');
  }
  
  const tbody = document.getElementById('leaderboardBody');
  tbody.innerHTML = '';
  
  for (let i = 0; i < 10; i++) {
    const tr = document.createElement('tr');
    const rank = i + 1;
    const name = leaderboard[i]?.name || '—';
    const pts = leaderboard[i]?.score ?? '—';
    tr.innerHTML = `<td>${rank}</td><td>${name}</td><td>${pts}</td>`;
    tbody.appendChild(tr);
  }
}

// Event listeners
window.addEventListener('load', () => {
  displayLeaderboard();
  document.getElementById('login').style.display = 'flex';
  document.getElementById('game').style.display = 'none';
  document.getElementById('leaderboardOverlay').style.display = 'none';
  
  // Auto-fill username if logged in
  const currentUser = getCurrentUser();
  if (currentUser) {
    document.getElementById('username').value = currentUser;
  }
});

document.getElementById('startBtn').addEventListener('click', () => {
  username = document.getElementById('username').value.trim();
  if (!username) {
    alert('Vui lòng nhập tên của bạn!');
    return;
  }
  startGame();
});

document.getElementById('restartBtn').addEventListener('click', () => {
  document.getElementById('leaderboardOverlay').style.display = 'none';
  document.getElementById('game').style.display = 'flex';
  startGame();
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  if (!gameRunning) return;
  
  gamePaused = !gamePaused;
  document.getElementById('pauseBtn').textContent = gamePaused ? 'Resume' : 'Pause';
  
  if (!gamePaused) {
    peep();
  } else {
    clearTimeout(timerId);
    clearTimeout(popupTimerId);
  }
});

function addToLeaderboard(name, score) {
  let leaderboard = JSON.parse(localStorage.getItem('mouseLeaderboard') || '[]');

  leaderboard.push({ 
    name, 
    score, 
    date: new Date().toISOString() 
  });
  
  // Sort by score descending
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Keep top 10
  leaderboard = leaderboard.slice(0, 10);

  localStorage.setItem('mouseLeaderboard', JSON.stringify(leaderboard));
}
