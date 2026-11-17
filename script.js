
const gameArea = document.getElementById("game-area");
const basket = document.getElementById("basket");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const message = document.getElementById("message");
const startBtn = document.getElementById("start-btn");
const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");

const WIN_SCORE = 15;
const MAX_LIVES = 3;
const BASKET_SPEED = 7;

let score = 0;
let lives = MAX_LIVES;
let basketX = 0;
let stars = [];
let running = false;
let animationId = null;
let spawnTimer = null;
let lastSpawn = 0;
let keys = {};
let touchDirection = 0;
let lastTime = 0;

function updateBasket() {
  const maxX = gameArea.clientWidth - basket.offsetWidth;
  basketX = Math.max(0, Math.min(basketX, maxX));
  basket.style.left = basketX + "px";
  basket.style.transform = "none";
}

function updateStats() {
  scoreDisplay.textContent = score;
  livesDisplay.textContent =
    "❤️ ".repeat(lives).trim() || "💔";
}

function clearStars() {
  stars.forEach(star => star.element.remove());
  stars = [];
}

function spawnStar() {
  if (!running) return;

  const star = document.createElement("div");
  star.className = "star";
  star.textContent = "⭐";

  const maxX = Math.max(0, gameArea.clientWidth - 30);
  const x = Math.random() * maxX;

  star.style.left = x + "px";
  star.style.top = "0px";

  gameArea.appendChild(star);

  stars.push({
    element: star,
    x: x,
    y: 0,
    speed: 2.5 + Math.random() * 2
  });
}

function endGame(won) {
  if (!running) return;

  running = false;
  clearTimeout(spawnTimer);

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  clearStars();
  keys = {};
  touchDirection = 0;

  message.style.display = "flex";

  if (won) {
    message.innerHTML = `
      <h2>🎉 You Win!</h2>
      <p>Amazing! You caught 15 stars!</p>
      <button id="restart-btn">Play Again</button>
    `;
  } else {
    message.innerHTML = `
      <h2>💔 Game Over!</h2>
      <p>Your final score: ${score}</p>
      <button id="restart-btn">Try Again</button>
    `;
  }

  document.getElementById("restart-btn")
    .addEventListener("click", startGame);
}

function gameLoop(timestamp) {
  if (!running) return;

  const delta = lastTime
    ? Math.min((timestamp - lastTime) / 16.67, 3)
    : 1;

  lastTime = timestamp;

  // Move basket
  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
    basketX -= BASKET_SPEED * delta;
  }

  if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
    basketX += BASKET_SPEED * delta;
  }

  if (touchDirection !== 0) {
    basketX += touchDirection * BASKET_SPEED * delta;
  }

  updateBasket();

  const basketRect = basket.getBoundingClientRect();
  const areaRect = gameArea.getBoundingClientRect();

  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];

    star.y += star.speed * delta;
    star.element.style.top = star.y + "px";

    const starRect = star.element.getBoundingClientRect();

    // Check if the basket catches the star
    const caught =
      starRect.bottom >= basketRect.top &&
      starRect.top <= basketRect.bottom &&
      starRect.right > basketRect.left &&
      starRect.left < basketRect.right;

    if (caught) {
      star.element.remove();
      stars.splice(i, 1);

      score++;
      updateStats();

      if (score >= WIN_SCORE) {
        endGame(true);
        return;
      }

      continue;
    }

    // Check if the star has fallen past the basket
    if (star.y + star.element.offsetHeight >= gameArea.clientHeight) {
      star.element.remove();
      stars.splice(i, 1);

      lives--;
      updateStats();

      if (lives <= 0) {
        endGame(false);
        return;
      }
    }
  }

  // Create stars at regular intervals
  if (timestamp - lastSpawn >= 850) {
    spawnStar();
    lastSpawn = timestamp;
  }

  animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }

  clearTimeout(spawnTimer);
  clearStars();

  score = 0;
  lives = MAX_LIVES;
  basketX = (gameArea.clientWidth - basket.offsetWidth) / 2;
  keys = {};
  touchDirection = 0;
  lastTime = 0;
  lastSpawn = 0;
  running = true;

  updateStats();
  updateBasket();

  message.style.display = "none";

  animationId = requestAnimationFrame(gameLoop);
}

// Keyboard controls
document.addEventListener("keydown", event => {
  if (
    ["ArrowLeft", "ArrowRight", " "].includes(event.key)
  ) {
    event.preventDefault();
  }

  keys[event.key] = true;

  if (!running && event.key === "Enter") {
    startGame();
  }
});

document.addEventListener("keyup", event => {
  keys[event.key] = false;
});

// Mobile and mouse controls
function holdDirection(direction) {
  touchDirection = direction;
}

function stopDirection() {
  touchDirection = 0;
}

leftBtn.addEventListener("pointerdown", event => {
  event.preventDefault();
  holdDirection(-1);
});

rightBtn.addEventListener("pointerdown", event => {
  event.preventDefault();
  holdDirection(1);
});

[leftBtn, rightBtn].forEach(button => {
  button.addEventListener("pointerup", stopDirection);
  button.addEventListener("pointerleave", stopDirection);
  button.addEventListener("pointercancel", stopDirection);
});

window.addEventListener("blur", () => {
  keys = {};
  stopDirection();
});

window.addEventListener("resize", updateBasket);

startBtn.addEventListener("click", startGame);

// Set initial basket position
requestAnimationFrame(updateBasket);
