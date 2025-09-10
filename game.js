(() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highscoreEl = document.getElementById('highscore');
  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const themeSelect = document.getElementById('theme-select');
  const speedRange = document.getElementById('speed-range');
  const speedLabel = document.getElementById('speed-label');

  const gridSize = 24;
  const cellSize = canvas.width / gridSize;
  const initialSnakeLength = 3;
  let baseSpeedMs = 120; // 会随着滑条变化
  const minSpeed = 60;   // 越小越快
  const maxSpeed = 240;  

  let snake = [];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let food = null;
  let score = 0;
  let highscore = 0;
  let running = false;
  let paused = false;
  let lastTick = 0;

  function initGame() {
    snake = [];
    for (let i = initialSnakeLength - 1; i >= 0; i--) {
      snake.push({ x: i + 4, y: 4 });
    }
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    updateScore();
    loadHighscore();
    spawnFood();
    drawBoard();
  }

  function startGame() {
    initGame();
    running = true;
    paused = false;
    lastTick = 0;
    requestAnimationFrame(tick);
  }

  function pauseGame() {
    if (!running) return;
    paused = !paused;
    btnPause.textContent = paused ? '继续' : '暂停';
  }

  function updateScore() {
    scoreEl.textContent = String(score);
    if (score > highscore) {
      highscore = score;
      saveHighscore();
      renderHighscore();
    }
  }

  function renderHighscore() {
    if (highscoreEl) highscoreEl.textContent = String(highscore);
  }

  function loadHighscore() {
    try {
      const v = localStorage.getItem('snake_highscore');
      highscore = v ? Number(v) : 0;
      if (Number.isNaN(highscore)) highscore = 0;
      renderHighscore();
    } catch {}
  }

  function saveHighscore() {
    try { localStorage.setItem('snake_highscore', String(highscore)); } catch {}
  }

  function spawnFood() {
    while (true) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      if (!snake.some(seg => seg.x === x && seg.y === y)) {
        food = { x, y };
        break;
      }
    }
  }

  function tick(timestamp) {
    if (!running) return;
    if (paused) {
      requestAnimationFrame(tick);
      return;
    }
    if (!lastTick) lastTick = timestamp;
    const elapsed = timestamp - lastTick;
    if (elapsed >= baseSpeedMs) {
      lastTick = timestamp;
      step();
      drawBoard();
    }
    requestAnimationFrame(tick);
  }

  function step() {
    direction = nextDirection;
    const newHead = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (newHead.x < 0 || newHead.x >= gridSize || newHead.y < 0 || newHead.y >= gridSize) {
      gameOver();
      return;
    }
    if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      gameOver();
      return;
    }
    snake.unshift(newHead);
    if (food && newHead.x === food.x && newHead.y === food.y) {
      score += 10;
      updateScore();
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    running = false;
    paused = false;
    btnPause.textContent = '暂停';
    drawBoard(true);
  }

  function drawBoard(isGameOver = false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.strokeStyle = getCssVar('--grid');
    ctx.lineWidth = 1;
    for (let i = 1; i < gridSize; i++) {
      const p = Math.floor(i * cellSize) + 0.5;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(canvas.width, p); ctx.stroke();
    }
    ctx.restore();
    if (food) drawCell(food.x, food.y, getCssVar('--food'));
    snake.forEach((seg, idx) => {
      drawCell(seg.x, seg.y, idx === 0 ? getCssVar('--primary') : getCssVar('--snake'));
    });
    if (isGameOver) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto';
      ctx.textAlign = 'center';
      ctx.fillText('游戏结束 - 点击开始重开', canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }
  }

  function drawCell(x, y, color) {
    const pad = 1;
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.floor(x * cellSize) + pad,
      Math.floor(y * cellSize) + pad,
      Math.floor(cellSize - pad * 2),
      Math.floor(cellSize - pad * 2)
    );
  }

  function getCssVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  function setDirection(dir) {
    const map = { up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} };
    const d = map[dir];
    if (!d) return;
    if (d.x + direction.x === 0 && d.y + direction.y === 0) return;
    nextDirection = d;
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') setDirection('up');
    if (k === 'arrowdown' || k === 's') setDirection('down');
    if (k === 'arrowleft' || k === 'a') setDirection('left');
    if (k === 'arrowright' || k === 'd') setDirection('right');
    if (k === ' ') { e.preventDefault(); pauseGame(); }
  });

  document.querySelectorAll('.pad').forEach(btn => {
    btn.addEventListener('click', () => setDirection(btn.dataset.dir));
  });

  btnStart.addEventListener('click', startGame);
  btnPause.addEventListener('click', () => pauseGame());

  function applyTheme(value) {
    const body = document.body;
    body.classList.remove('theme-dark','theme-light','theme-sunset','theme-forest','theme-ocean','theme-grape','theme-black','theme-pink');
    if (value === 'teal') return;
    body.classList.add(`theme-${value}`);
  }
  themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));

  // 速度控制：将 1-10 映射到 maxSpeed→minSpeed
  function applySpeedFromRange() {
    if (!speedRange) return;
    const level = Number(speedRange.value || 6);
    if (speedLabel) speedLabel.textContent = String(level);
    const t = (level - 1) / 9; // 0..1
    baseSpeedMs = Math.round(maxSpeed + (minSpeed - maxSpeed) * t);
  }
  if (speedRange) {
    applySpeedFromRange();
    speedRange.addEventListener('input', () => applySpeedFromRange());
    speedRange.addEventListener('change', () => applySpeedFromRange());
  }

  applyTheme('teal');
  initGame();
  drawBoard();
})();


