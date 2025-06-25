// -----------------------------
//  FASE 2  –  Jogo da Nave
//  Mesmo gameplay da fase 1, porém com
//  sprites e velocidades diferentes.
// -----------------------------

// Canvas & contexto -------------------------------------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Dimensões do spritesheet do jogador --------------------------------
const SPRITE_WIDTH  = 160;
const SPRITE_HEIGHT = 180;

// ---  SPRITES DA FASE 2  -------------------------------------------
const naveImg   = new Image();
naveImg.src     = "IMG/002.png";      // novo spritesheet do jogador

const fundoImg  = new Image();
fundoImg.src    = "IMG/fase2prn.png";  // fundo da fase 2

// Caso deseje trocar o inimigo, basta mudar a origem abaixo.
// (mantive o mesmo spritesheet para simplicidade)
const aguiaImg = new Image();
aguiaImg.src   = "IMG/pedra.png";        // inimigo 
const AGUIA_FRAME_WIDTH  = 320;
const AGUIA_FRAME_HEIGHT = 325;

// Variáveis de estado ------------------------------------------------
let fundoX      = 0;
let fundoSpeed  = 1.5;   // mais rápido que na fase 1
let frames      = 0;
let score       = 0;
let pipeSpeed   = 7;    // velocidade inicial maior
const speed     = 4;     // velocidade vertical do player aumentada
let gameOver    = false;
let paused      = false;

// Música & efeitos ---------------------------------------------------
const musicaFundo = new Audio("fundosom.mp3");
musicaFundo.loop = true;
const somExplosao = new Audio("explosao.mp3");


function tocarMusicaFundo() {
  if (musicaFundo.paused) {
    musicaFundo.play().catch(() => {});
  }
}
function pararMusicaFundo() {
  musicaFundo.pause();
  musicaFundo.currentTime = 0;
}

// Entidade jogador ---------------------------------------------------
const bird = {
  x: 50,
  y: 150,
  w: 80,
  h: 90,
  moveUp: false,
  moveDown: false,
  draw() {
    let spriteY = 0;
    if (this.moveUp)      spriteY = 2 * SPRITE_HEIGHT; // linha 2
    else if (this.moveDown) spriteY = 1 * SPRITE_HEIGHT; // linha 1
    ctx.drawImage(naveImg, 0, spriteY, SPRITE_WIDTH, SPRITE_HEIGHT,
                  this.x, this.y, this.w, this.h);
  },
  update() {
    if (this.moveUp)   this.y -= speed;
    if (this.moveDown) this.y += speed;
    if (this.y < 0)                    this.y = 0;
    if (this.y + this.h > canvas.height) this.y = canvas.height - this.h;
  }
};

// Fundo animado ------------------------------------------------------
function drawBackground() {
  ctx.drawImage(fundoImg, fundoX, 0, canvas.width, canvas.height);
  ctx.drawImage(fundoImg, fundoX + canvas.width, 0, canvas.width, canvas.height);
  fundoX -= fundoSpeed;
  if (fundoX <= -canvas.width) fundoX = 0;
}

// "Canos" (águias inimigas) -----------------------------------------
const pipes    = [];
const pipeGap  = 120;
const AGUIA_LARGURA = 40;
const AGUIA_ALTURA  = 60;

function spawnPipe() {
  const topHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 20;
  pipes.push({ x: canvas.width, top: topHeight, bottom: topHeight + pipeGap, passed: false });
}

function drawPipes() {
  pipes.forEach(pipe => {
    const frame = Math.floor(frames / 10) % 3;
    ctx.drawImage(aguiaImg, frame * AGUIA_FRAME_WIDTH, 0, AGUIA_FRAME_WIDTH, AGUIA_FRAME_HEIGHT,
                  pipe.x, pipe.top - AGUIA_ALTURA, AGUIA_LARGURA, AGUIA_ALTURA);
    ctx.drawImage(aguiaImg, frame * AGUIA_FRAME_WIDTH, 0, AGUIA_FRAME_WIDTH, AGUIA_FRAME_HEIGHT,
                  pipe.x, pipe.bottom, AGUIA_LARGURA, AGUIA_ALTURA);
  });
}

function updatePipes() {
  if (frames % 80 === 0) spawnPipe(); // aparece um pouco mais rápido
  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed;

    const hitbox = { x: bird.x + 10, y: bird.y + 10, w: bird.w - 20, h: bird.h - 20 };
    const topBox    = { x: pipe.x, y: pipe.top - AGUIA_ALTURA, w: AGUIA_LARGURA, h: AGUIA_ALTURA };
    const bottomBox = { x: pipe.x, y: pipe.bottom,              w: AGUIA_LARGURA, h: AGUIA_ALTURA };

    const colidiu = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    if (colidiu(hitbox, topBox) || colidiu(hitbox, bottomBox)) {
      gameOver = true;
      somExplosao.play();
      pararMusicaFundo();
    }

    if (pipe.x + AGUIA_LARGURA < bird.x && !pipe.passed) {
      pipe.passed = true;
      score++;
      if (score % 10 === 0) pipeSpeed += 0.5; // progressão de dificuldade
    }
  });
  if (pipes.length && pipes[0].x + AGUIA_LARGURA < 0) pipes.shift();
}

// UI -----------------------------------------------------------------
function drawScore() {
  ctx.fillStyle = "#fff";
  ctx.font = "24px Arial";
  ctx.fillText(`Pontos: ${score}`, 10, 30);
}
function drawGameOver() {
  ctx.fillStyle = "red";
  ctx.font = "48px Arial";
  ctx.fillText("GAME OVER", 60, canvas.height / 2);
}

// Reset --------------------------------------------------------------
function resetGame() {
  bird.y      = 150;
  pipes.length = 0;
  score       = 0;
  frames      = 0;
  pipeSpeed   = 10;
  gameOver    = false;
  paused      = false;
  tocarMusicaFundo();
}

// Game Loop ----------------------------------------------------------
function gameLoop() {
  if (!paused) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    if (!gameOver) {
      bird.update();
      updatePipes();
      bird.draw();
      drawPipes();
      drawScore();
    } else {
      bird.draw();
      drawPipes();
      drawScore();
      drawGameOver();
      return; // para o loop se game over
    }

    frames++;
  }
  requestAnimationFrame(gameLoop);
}

// Controles -----------------------------------------------------------
document.addEventListener("keydown", e => {
  if (e.code === "ArrowUp")   bird.moveUp = true;
  if (e.code === "ArrowDown") bird.moveDown = true;
});
document.addEventListener("keyup", e => {
  if (e.code === "ArrowUp")   bird.moveUp = false;
  if (e.code === "ArrowDown") bird.moveDown = false;
});

// Botões de interface -------------------------------------------------
document.getElementById("pauseBtn").addEventListener("click", () => {
  if (!gameOver) paused = !paused;
});

document.getElementById("resetBtn").addEventListener("click", () => {
  resetGame();
  if (!paused) gameLoop();
});

document.getElementById("startGameButton").addEventListener("click", () => {
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("game").style.display = "block";
  resetGame();
  gameLoop();
});

document.getElementById("exitGameButton").addEventListener("click", () => {
  alert("Volte sempre!");
  window.close();
});

// Auto‑start música no primeiro clique -------------------------------
canvas.addEventListener("click", tocarMusicaFundo);


function iniciarFase2() {
  if (typeof fase1Ativa !== "undefined") {
    fase1Ativa = false; // desativa o loop da fase 1
  }
  resetGame(); // da Fase 2
  gameLoop();  // da Fase 2
}

