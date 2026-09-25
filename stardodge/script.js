const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const startButton = document.getElementById('startButton');

const game = {
  width: canvas.width,
  height: canvas.height,
  running: false,
  score: 0,
  best: Number(localStorage.getItem('star-dodge-best') || 0),
  lastTime: 0,
  spawnTimer: 0,
  stars: [],
  player: {
    width: 54,
    height: 18,
    speed: 360,
    x: canvas.width / 2 - 27,
    y: canvas.height - 36,
  },
  keys: {
    left: false,
    right: false,
  },
};

bestEl.textContent = String(game.best);

function resetGame() {
  game.running = true;
  game.score = 0;
  game.lastTime = 0;
  game.spawnTimer = 0.6;
  game.stars = [];
  game.player.x = canvas.width / 2 - game.player.width / 2;
  game.player.y = canvas.height - 36;
  scoreEl.textContent = '0';
  startButton.textContent = 'Restart game';
}

function spawnStar() {
  const radius = 12 + Math.random() * 16;
  game.stars.push({
    x: Math.random() * (game.width - radius * 2) + radius,
    y: -radius,
    radius,
    speed: 180 + Math.random() * 140,
    drift: (Math.random() - 0.5) * 80,
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function checkCollision(star) {
  const playerLeft = game.player.x;
  const playerRight = game.player.x + game.player.width;
  const playerTop = game.player.y;
  const playerBottom = game.player.y + game.player.height;

  const closestX = clamp(star.x, playerLeft, playerRight);
  const closestY = clamp(star.y, playerTop, playerBottom);
  const dx = star.x - closestX;
  const dy = star.y - closestY;

  return dx * dx + dy * dy < star.radius * star.radius;
}

function update(delta) {
  if (!game.running) {
    return;
  }

  if (game.keys.left) {
    game.player.x -= game.player.speed * delta;
  }
  if (game.keys.right) {
    game.player.x += game.player.speed * delta;
  }

  game.player.x = clamp(game.player.x, 0, game.width - game.player.width);

  game.spawnTimer -= delta;
  if (game.spawnTimer <= 0) {
    spawnStar();
    game.spawnTimer = Math.max(0.38, 0.9 - game.score * 0.015) + Math.random() * 0.25;
  }

  for (const star of game.stars) {
    star.y += star.speed * delta;
    star.x += star.drift * delta;

    if (star.x < star.radius) {
      star.x = star.radius;
      star.drift *= -1;
    }

    if (star.x > game.width - star.radius) {
      star.x = game.width - star.radius;
      star.drift *= -1;
    }
  }

  game.score += delta * 12;
  scoreEl.textContent = String(Math.floor(game.score));

  const visibleStars = [];
  for (const star of game.stars) {
    if (star.y - star.radius <= game.height + 10) {
      visibleStars.push(star);
    }
  }
  game.stars = visibleStars;

  for (const star of game.stars) {
    if (checkCollision(star)) {
      endGame();
      return;
    }
  }
}

function endGame() {
  game.running = false;

  const finalScore = Math.floor(game.score);
  if (finalScore > game.best) {
    game.best = finalScore;
    localStorage.setItem('star-dodge-best', String(game.best));
    bestEl.textContent = String(game.best);
  }

  startButton.textContent = 'Play again';
}

function drawBackground() {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, game.width, game.height);

  for (let i = 0; i < 60; i += 1) {
    const x = (i * 97) % game.width;
    const y = (i * 53 + (performance.now() * 0.03)) % (game.height + 40);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawPlayer() {
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(game.player.x + 10, game.player.y - 8, game.player.width - 20, 8);
}

function drawStars() {
  for (const star of game.stars) {
    ctx.beginPath();
    ctx.fillStyle = '#fbbf24';
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.arc(star.x - star.radius * 0.25, star.y - star.radius * 0.2, star.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

function render() {
  drawBackground();
  drawStars();
  drawPlayer();

  if (!game.running) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(0, 0, game.width, game.height);

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('Star Dodge', game.width / 2, game.height / 2 - 20);
    ctx.font = '24px Arial';
    ctx.fillText('Press Start or Space', game.width / 2, game.height / 2 + 24);
    ctx.textAlign = 'left';
  }
}

function gameLoop(timestamp) {
  if (!game.lastTime) {
    game.lastTime = timestamp;
  }

  const delta = Math.min((timestamp - game.lastTime) / 1000, 0.035);
  game.lastTime = timestamp;

  update(delta);
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
    game.keys.left = true;
  }
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
    game.keys.right = true;
  }
  if (event.code === 'Space') {
    event.preventDefault();
    resetGame();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
    game.keys.left = false;
  }
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
    game.keys.right = false;
  }
});

startButton.addEventListener('click', () => {
  resetGame();
});

requestAnimationFrame(gameLoop);
