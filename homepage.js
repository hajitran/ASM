// Authentication System
class AuthSystem {
  constructor() {
    this.currentUser = null;
    this.users = JSON.parse(localStorage.getItem('gamingHubUsers') || '{}');
    this.init();
  }

  init() {
    this.checkLoginStatus();
    this.bindEvents();
  }

  bindEvents() {
    // Modal controls
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginBtn) loginBtn.addEventListener('click', () => this.showAuthModal('login'));
    if (signupBtn) signupBtn.addEventListener('click', () => this.showAuthModal('signup'));
    if (closeAuthModal) closeAuthModal.addEventListener('click', () => this.hideAuthModal());
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

    // Form switching
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    
    if (showSignup) {
      showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchToSignup();
      });
    }
    
    if (showLogin) {
      showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchToLogin();
      });
    }

    // Form submissions
    const loginSubmit = document.getElementById('loginSubmit');
    const signupSubmit = document.getElementById('signupSubmit');
    
    if (loginSubmit) loginSubmit.addEventListener('click', () => this.handleLogin());
    if (signupSubmit) signupSubmit.addEventListener('click', () => this.handleSignup());

    // Enter key support
    const loginPassword = document.getElementById('loginPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (loginPassword) {
      loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleLogin();
      });
    }
    
    if (confirmPassword) {
      confirmPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSignup();
      });
    }

    // Close modal on outside click
    const authModal = document.getElementById('authModal');
    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
          this.hideAuthModal();
        }
      });
    }
  }

  showAuthModal(type) {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    if (type === 'signup') {
      this.switchToSignup();
    } else {
      this.switchToLogin();
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    this.clearForms();
    this.clearMessages();
  }

  switchToLogin() {
    const title = document.getElementById('authModalTitle');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (title) title.textContent = 'Đăng nhập';
    if (loginForm) loginForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
    this.clearMessages();
  }

  switchToSignup() {
    const title = document.getElementById('authModalTitle');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (title) title.textContent = 'Đăng ký';
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'block';
    this.clearMessages();
  }

  handleLogin() {
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    
    if (!usernameInput || !passwordInput) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      this.showMessage('Vui lòng điền đầy đủ thông tin!', 'error', 'loginForm');
      return;
    }

    if (!this.users[username]) {
      this.showMessage('Tên đăng nhập không tồn tại!', 'error', 'loginForm');
      return;
    }

    if (this.users[username].password !== this.hashPassword(password)) {
      this.showMessage('Mật khẩu không chính xác!', 'error', 'loginForm');
      return;
    }

    this.login(username);
    this.showMessage('Đăng nhập thành công!', 'success', 'loginForm');
    
    setTimeout(() => {
      this.hideAuthModal();
    }, 1500);
  }

  handleSignup() {
    const usernameInput = document.getElementById('signupUsername');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (!usernameInput || !emailInput || !passwordInput || !confirmPasswordInput) return;
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!username || !email || !password || !confirmPassword) {
      this.showMessage('Vui lòng điền đầy đủ thông tin!', 'error', 'signupForm');
      return;
    }

    if (username.length < 3) {
      this.showMessage('Tên đăng nhập phải có ít nhất 3 ký tự!', 'error', 'signupForm');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showMessage('Email không hợp lệ!', 'error', 'signupForm');
      return;
    }

    if (password.length < 6) {
      this.showMessage('Mật khẩu phải có ít nhất 6 ký tự!', 'error', 'signupForm');
      return;
    }

    if (password !== confirmPassword) {
      this.showMessage('Mật khẩu xác nhận không khớp!', 'error', 'signupForm');
      return;
    }

    if (this.users[username]) {
      this.showMessage('Tên đăng nhập đã tồn tại!', 'error', 'signupForm');
      return;
    }

    // Check if email already exists
    const emailExists = Object.values(this.users).some(user => user.email === email);
    if (emailExists) {
      this.showMessage('Email đã được sử dụng!', 'error', 'signupForm');
      return;
    }

    this.register(username, email, password);
    this.showMessage('Đăng ký thành công! Đang đăng nhập...', 'success', 'signupForm');
    
    setTimeout(() => {
      this.login(username);
      this.hideAuthModal();
    }, 1500);
  }

  register(username, email, password) {
    this.users[username] = {
      email: email,
      password: this.hashPassword(password),
      createdAt: new Date().toISOString(),
      gamesPlayed: 0,
      totalScore: 0
    };
    
    localStorage.setItem('gamingHubUsers', JSON.stringify(this.users));
  }

  login(username) {
    this.currentUser = username;
    localStorage.setItem('currentUser', username);
    this.updateUI();
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.updateUI();
  }

  checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser && this.users[savedUser]) {
      this.currentUser = savedUser;
      this.updateUI();
    }
  }

  updateUI() {
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const currentUserSpan = document.getElementById('currentUser');

    if (this.currentUser) {
      if (authSection) authSection.style.display = 'none';
      if (userSection) userSection.style.display = 'block';
      if (currentUserSpan) currentUserSpan.textContent = this.currentUser;
    } else {
      if (authSection) authSection.style.display = 'block';
      if (userSection) userSection.style.display = 'none';
    }
  }

  showMessage(text, type, formId) {
    this.clearMessages();
    
    const message = document.createElement('div');
    message.className = `auth-message ${type}`;
    message.textContent = text;
    
    const form = document.getElementById(formId);
    if (form) {
      form.insertBefore(message, form.firstChild);
    }
  }

  clearMessages() {
    document.querySelectorAll('.auth-message').forEach(msg => msg.remove());
  }

  clearForms() {
    const fields = [
      'loginUsername', 'loginPassword', 'signupUsername', 
      'signupEmail', 'signupPassword', 'confirmPassword'
    ];
    
    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) field.value = '';
    });
  }

  hashPassword(password) {
    // Simple hash function - in production, use proper encryption
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  updateUserStats(gamesPlayed = 0, totalScore = 0) {
    if (this.currentUser && this.users[this.currentUser]) {
      this.users[this.currentUser].gamesPlayed += gamesPlayed;
      this.users[this.currentUser].totalScore += totalScore;
      localStorage.setItem('gamingHubUsers', JSON.stringify(this.users));
    }
  }
}

// Initialize authentication system
const authSystem = new AuthSystem();

// Game functions
function openGame(gameType) {
  const modal = document.getElementById('gameModal');
  const iframe = document.getElementById('gameFrame');
  const title = document.getElementById('gameTitle');
  
  if (!modal || !iframe || !title) return;
  
  // Check if user is logged in
  if (!authSystem.getCurrentUser()) {
    authSystem.showAuthModal('login');
    return;
  }
  
  if (gameType === 'tetris') {
    iframe.src = 'games/tetris/tetris.html';
    title.textContent = 'Tetris Classic';
  } else if (gameType === 'shooter') {
    iframe.src = 'games/shooter/shooter.html';
    title.textContent = '🚀 Game Bắn Máy Bay';
  } else if (gameType === 'snake') {
    iframe.src = 'games/snake/snake.html';
    title.textContent = '🐍 Snake Game';
  } else if (gameType === 'mouse') {
    iframe.src = 'games/mouse/mouse.html';
    title.textContent = '🐭 Whack a Mouse';
  }
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeGame() {
  const modal = document.getElementById('gameModal');
  const iframe = document.getElementById('gameFrame');
  
  if (!modal || !iframe) return;
  
  iframe.src = '';
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Refresh leaderboards after closing game
  loadLeaderboards();
}

function loadLeaderboards() {
  loadTetrisLeaderboard();
  loadShooterLeaderboard();
  loadSnakeLeaderboard();
  loadMouseLeaderboard(); // Add this line
}

function loadTetrisLeaderboard() {
  const tetrisScores = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
  const tbody = document.getElementById('tetrisLeaderboard');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (tetrisScores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-leaderboard">Chưa có điểm số nào</td></tr>';
    return;
  }
  
  tetrisScores.slice(0, 10).forEach((score, index) => {
    const tr = document.createElement('tr');
    const medal = ['🥇', '🥈', '🥉'][index] || '';
    tr.innerHTML = `
      <td>${medal} ${index + 1}</td>
      <td>${score.name}</td>
      <td>${score.score}</td>
    `;
    tbody.appendChild(tr);
  });
}

function loadShooterLeaderboard() {
  const shooterScores = JSON.parse(localStorage.getItem('shooterHighScores') || '[]');
  const tbody = document.getElementById('shooterLeaderboard');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (shooterScores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-leaderboard">Chưa có điểm số nào</td></tr>';
    return;
  }
  
  shooterScores.slice(0, 10).forEach((score, index) => {
    const tr = document.createElement('tr');
    const medal = ['🥇', '🥈', '🥉'][index] || '';
    tr.innerHTML = `
      <td>${medal} ${index + 1}</td>
      <td>${score.name}</td>
      <td>${score.point}</td>
    `;
    tbody.appendChild(tr);
  });
}

function loadSnakeLeaderboard() {
  const snakeScores = JSON.parse(localStorage.getItem('snakeHighScores') || '[]');
  const tbody = document.getElementById('snakeLeaderboard');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (snakeScores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-leaderboard">Chưa có điểm số nào</td></tr>';
    return;
  }
  
  snakeScores.slice(0, 10).forEach((score, index) => {
    const tr = document.createElement('tr');
    const medal = ['🥇', '🥈', '🥉'][index] || '';
    tr.innerHTML = `
      <td>${medal} ${index + 1}</td>
      <td>${score.name}</td>
      <td>${score.score}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ADD THIS NEW FUNCTION FOR MOUSE GAME LEADERBOARD
function loadMouseLeaderboard() {
  const mouseScores = JSON.parse(localStorage.getItem('mouseLeaderboard') || '[]');
  const tbody = document.getElementById('mouseLeaderboard');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (mouseScores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-leaderboard">Chưa có điểm số nào</td></tr>';
    return;
  }
  
  mouseScores.slice(0, 10).forEach((score, index) => {
    const tr = document.createElement('tr');
    const medal = ['🥇', '🥈', '🥉'][index] || '';
    tr.innerHTML = `
      <td>${medal} ${index + 1}</td>
      <td>${score.name}</td>
      <td>${score.score}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Game filter functionality
function initializeGameFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const gameCards = document.querySelectorAll('.game-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      gameCards.forEach(card => {
        if (filter === 'all') {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 100);
        } else {
          const category = card.getAttribute('data-category');
          if (category === filter) {
            card.style.display = 'block';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            }, 100);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 300);
          }
        }
      });
    });
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize game filters
  initializeGameFilters();
  
  // Load leaderboards
  loadLeaderboards();
});

window.onclick = function(event) {
  const modal = document.getElementById('gameModal');
  if (event.target === modal) {
    closeGame();
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const gameModal = document.getElementById('gameModal');
    const authModal = document.getElementById('authModal');
    
    if (gameModal && gameModal.style.display === 'block') {
      closeGame();
    } else if (authModal && authModal.style.display === 'block') {
      authSystem.hideAuthModal();
    }
  }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Header background change on scroll
window.addEventListener('scroll', function() {
  const header = document.querySelector('.main-header');
  if (header) {
    if (window.scrollY > 100) {
      header.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
      header.style.background = 'rgba(255, 255, 255, 0.95)';
    }
  }
});

// Load leaderboards when page loads
window.addEventListener('load', function() {
  loadLeaderboards();
});

// Refresh leaderboards every 30 seconds
setInterval(loadLeaderboards, 30000);

// Game statistics tracking
function trackGamePlay(gameType, score) {
  if (authSystem.getCurrentUser()) {
    authSystem.updateUserStats(1, score);
  }
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Export functions for use in other scripts if needed
window.gamingHub = {
  authSystem,
  openGame,
  closeGame,
  loadLeaderboards,
  trackGamePlay
};
