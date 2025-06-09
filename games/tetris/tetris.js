const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');
const ROW = 20, COL = 10, BLOCK = 30, PREVIEW_BLOCK = 20;
ctx.scale(BLOCK, BLOCK);
previewCtx.scale(PREVIEW_BLOCK, PREVIEW_BLOCK);

const colors = [null,
  '#ff0d72','#0dc2ff','#0dff72',
  '#f538ff','#ff8e0d','#ffe138','#3877ff'
];

const SHAPES = [
  [], [[1,1,1],[0,1,0],[0,0,0]],
  [[0,2,2],[2,2,0],[0,0,0]],
  [[3,3,0],[0,3,3],[0,0,0]],
  [[4,0,0],[4,4,4],[0,0,0]],
  [[0,0,5],[5,5,5],[0,0,0]],
  [[6,6],[6,6]],
  [[7,7,7,7],[0,0,0,0],[0,0,0,0],[0,0,0,0]]
];

function createMatrix(r,c){
  const m = [];
  while(r--) m.push(new Array(c).fill(0));
  return m;
}

function createPiece(t){ 
  return JSON.parse(JSON.stringify(SHAPES[t])); 
}

function drawBlock(x,y,c,context=ctx){
  context.fillStyle = colors[c];
  context.fillRect(x,y,1,1);
  context.strokeStyle = '#222222';
  context.lineWidth = 0.05;
  context.strokeRect(x,y,1,1);
}

function drawMatrix(m,off,context=ctx){
  m.forEach((row,y) => row.forEach((v,x) => {
    if(v) drawBlock(x+off.x,y+off.y,v,context);
  }));
}

function drawPreview(shape) {
  previewCtx.fillStyle = '#111111';
  previewCtx.fillRect(0, 0, 6, 6);
  
  if (!shape) return;
  
  const offsetX = (6 - shape[0].length) / 2;
  const offsetY = (6 - shape.length) / 2;
  
  drawMatrix(shape, {x: offsetX, y: offsetY}, previewCtx);
}

function collide(b,p,off){
  for(let y=0; y<p.length; y++){
    for(let x=0; x<p[y].length; x++){
      if(!p[y][x]) continue;
      const nx = x+off.x, ny = y+off.y;
      if(nx<0 || nx>=COL || ny>=ROW || (b[ny] && b[ny][nx])!==0) return true;
    }
  }
  return false;
}

function merge(b,p,off){
  p.forEach((row,y) => row.forEach((v,x) => {
    if(v) b[y+off.y][x+off.x] = v;
  }));
}

function animateClear(rows, onComplete) {
  const flashColor = '#ffffff';
  let flashCount = 0;
  const maxFlashes = 3;
  
  function flash() {
    rows.forEach(y => {
      for (let x = 0; x < COL; x++) {
        if (flashCount % 2 === 0) {
          ctx.fillStyle = flashColor;
        } else {
          ctx.fillStyle = colors[board[y][x]] || '#111111';
        }
        ctx.fillRect(x, y, 1, 1);
      }
    });
    
    flashCount++;
    if (flashCount < maxFlashes * 2) {
      setTimeout(flash, 100);
    } else {
      onComplete();
    }
  }
  
  flash();
}

function sweep() {
  const rowsToClear = [];
  
  for (let y = 0; y < ROW; y++) {
    let isComplete = true;
    for (let x = 0; x < COL; x++) {
      if (board[y][x] === 0) {
        isComplete = false;
        break;
      }
    }
    if (isComplete) {
      rowsToClear.push(y);
    }
  }
  
  if (rowsToClear.length === 0) return;
  
  animateClear(rowsToClear, () => {
    const newBoard = createMatrix(ROW, COL);
    let newY = ROW - 1;
    
    for (let y = ROW - 1; y >= 0; y--) {
      if (!rowsToClear.includes(y)) {
        for (let x = 0; x < COL; x++) {
          newBoard[newY][x] = board[y][x];
        }
        newY--;
      }
    }
    
    for (let y = 0; y < ROW; y++) {
      for (let x = 0; x < COL; x++) {
        board[y][x] = newBoard[y][x];
      }
    }
    
    const linesCleared = rowsToClear.length;
    const baseScore = [0, 40, 100, 300, 1200][Math.min(linesCleared, 4)];
    score += baseScore;
    
    updateScoreDisplay();
    flashScore();
  });
}

function updateScoreDisplay(){
  document.getElementById('score').textContent = 'Điểm: ' + score;
}

function flashScore(){
  const scoreEl = document.getElementById('score');
  scoreEl.classList.add('flash');
  setTimeout(() => scoreEl.classList.remove('flash'), 300);
}

const board = createMatrix(ROW,COL);
let score = 0, username = '', paused = false, gameRunning = false;
const player = { pos:{x:3,y:0}, piece:null };
let nextPiece = null;
let dropCounter = 0, dropInterval = 1000, lastTime = 0;
let animationId;

function getRandomPieceType() {
  return Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
}

function playerReset(){
  if (nextPiece) {
    player.piece = nextPiece;
  } else {
    player.piece = createPiece(getRandomPieceType());
  }
  
  nextPiece = createPiece(getRandomPieceType());
  drawPreview(nextPiece);
  
  player.pos.y = 0;
  player.pos.x = Math.floor(COL/2) - Math.floor(player.piece[0].length/2);
  
  if(collide(board,player.piece,player.pos)){
    gameRunning = false;
    showLeaderboard();
  }
}

function playerDrop(){
  player.pos.y++;
  if(collide(board,player.piece,player.pos)){
    player.pos.y--;
    merge(board,player.piece,player.pos);
    sweep();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir){
  player.pos.x += dir;
  if(collide(board,player.piece,player.pos)) player.pos.x -= dir;
}

function playerRotate(){
  const original = JSON.parse(JSON.stringify(player.piece));
  player.piece = rotate(player.piece);
  let offset = 1;
  while(collide(board,player.piece,player.pos)){
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if(offset > player.piece[0].length){
      player.piece = original;
      return;
    }
  }
}

function rotate(matrix){
  const N = matrix.length;
  const result = createMatrix(N, N);
  for(let y = 0; y < N; y++){
    for(let x = 0; x < N; x++){
      result[x][N-1-y] = matrix[y][x];
    }
  }
  return result;
}

function update(time = 0){
  if(!gameRunning) return;
  
  const dt = time - lastTime;
  lastTime = time;
  
  if(!paused){
    dropCounter += dt;
    if(dropCounter > dropInterval) playerDrop();
  }
  
  draw();
  animationId = requestAnimationFrame(update);
}

function draw(){
  ctx.fillStyle = '#111111';
  ctx.fillRect(0,0,COL,ROW);
  drawMatrix(board,{x:0,y:0});
  if(player.piece) drawMatrix(player.piece,player.pos);
}

function showLeaderboard(){
  let lb = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
  
  if(username && score > 0){
    lb.push({name:username, score:score, date: new Date().toISOString()});
    lb.sort((a,b) => b.score - a.score);
    lb = lb.slice(0,10);
    localStorage.setItem('tetrisLeaderboard', JSON.stringify(lb));
  }

  displayLeaderboard(lb);
  document.getElementById('game').style.display = 'none';
  document.getElementById('leaderboardOverlay').style.display = 'flex';
}

function displayLeaderboard(lb = null){
  if(!lb) lb = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
  
  const tb = document.getElementById('leaderboardBody');
  tb.innerHTML = '';
  
  for(let i = 0; i < 10; i++){
    const tr = document.createElement('tr');
    const rank = i + 1;
    const name = lb[i]?.name || '—';
    const pts = lb[i]?.score ?? '—';
    tr.innerHTML = `<td>${rank}</td><td>${name}</td><td>${pts}</td>`;
    tb.appendChild(tr);
  }
}

function initGame(){
  board.forEach(r => r.fill(0));
  score = 0;
  paused = false;
  gameRunning = true;
  dropCounter = 0;
  dropInterval = 1000;
  lastTime = 0;
  nextPiece = null;
  
  if(animationId) cancelAnimationFrame(animationId);
  
  updateScoreDisplay();
  playerReset();
  update();
}

window.addEventListener('load', () => {
  displayLeaderboard();
  document.getElementById('login').style.display = 'flex';
  document.getElementById('game').style.display = 'none';
  document.getElementById('leaderboardOverlay').style.display = 'none';
});

document.getElementById('startBtn').addEventListener('click', () => {
  username = document.getElementById('username').value.trim();
  if(!username) return alert('Vui lòng nhập tên của bạn!');
  document.getElementById('login').style.display = 'none';
  document.getElementById('game').style.display = 'flex';
  initGame();
});

document.getElementById('restartBtn').addEventListener('click', () => {
  document.getElementById('leaderboardOverlay').style.display = 'none';
  document.getElementById('game').style.display = 'flex';
  initGame();
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause';
});

document.addEventListener('keydown', e => {
  if(!gameRunning || paused) return;
  if(e.key === 'ArrowLeft') playerMove(-1);
  if(e.key === 'ArrowRight') playerMove(1);
  if(e.key === 'ArrowDown') playerDrop();
  if(e.key === 'ArrowUp') playerRotate();
});
