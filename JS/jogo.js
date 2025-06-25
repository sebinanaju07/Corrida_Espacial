const canvas = document.getElementById("gameCanvas"); // Obtém o elemento canvas do HTML
const ctx = canvas.getContext("2d"); // Obtém o contexto 2D do canvas para desenhar elementos

const SPRITE_WIDTH = 160; // Define a largura de cada quadro da sprite da nave
const SPRITE_HEIGHT = 180; // Define a altura de cada quadro da sprite da nave

const naveImg = new Image(); // Cria o objeto de imagem da nave
naveImg.src = "./IMG/00002.png"; // Define o caminho da imagem da nave

const fundoImg = new Image(); // Cria o objeto de imagem do fundo
fundoImg.src = "./IMG/fase1prn.png"; // Define o caminho da imagem do fundo da fase 1

const aguiaImg = new Image(); // Cria o objeto de imagem da águia (obstáculo)
aguiaImg.src = "./IMG/06.png"; // Define o caminho da imagem da águia

const AGUIA_FRAME_WIDTH = 320; // Largura de cada frame da águia na sprite
const AGUIA_FRAME_HEIGHT = 325; // Altura de cada frame da águia na sprite

let fundoX = 0; // Posição do fundo (scrolling)
let fundoSpeed = 1; // Velocidade com que o fundo se move
let frames = 0; // Contador de quadros
let score = 0; // Pontuação do jogador
let pipeSpeed = 4; // Velocidade dos obstáculos
const speed = 3; // Velocidade da nave
let gameOver = false; // Estado de game over
let paused = false; // Estado de pausa do jogo
let fase1Passada = false; // Verifica se o jogador passou da fase 1
let fase2 = false; // Verifica se está na fase 2
let fimDeJogo = false; // Verifica se o jogo foi concluído

const musicaFundo = new Audio("./AUDIO/fundosom.mp3"); // Carrega o som de fundo
musicaFundo.loop = true; // Faz o som de fundo repetir em loop

const somExplosao = new Audio("./AUDIO/explosao.mp3"); // Carrega o som de explosão
const somGameOver = new Audio("./AUDIO/over.mp3"); // Carrega o som de game over

function tocarMusicaFundo() { // Toca a música de fundo se ainda não estiver tocando
  if (musicaFundo.paused) {
    musicaFundo.play().catch(() => { }); // Ignora erros (autoplay bloqueado, etc.)
  }
}

function pararMusicaFundo() { // Para a música de fundo e reseta o tempo para o início
  musicaFundo.pause();  // Pausa onde está
  musicaFundo.currentTime = 0; //define ou retorna o tempo de reprodução atual 
}

const bird = { // Objeto que representa a nave do jogador
  x: 50, // Posição horizontal
  y: 150, // Posição vertical
  w: 80, // Largura da nave
  h: 90, // Altura da nave
  moveUp: false, // Indicador de movimento para cima
  moveDown: false, // Indicador de movimento para baixo
  draw() {  // Função que desenha a nave
    let spriteY = 0; // Linha da sprite a ser usada
    if (this.moveUp) spriteY = 2 * SPRITE_HEIGHT; // Frame de subida
    else if (this.moveDown) spriteY = 1 * SPRITE_HEIGHT; // Frame de descida
    ctx.drawImage(naveImg, 0, spriteY, SPRITE_WIDTH, SPRITE_HEIGHT, this.x, this.y, this.w, this.h); // Desenha a sprite da nave de acordo com o movimento
  },
  update() { // Atualiza a posição da nave com base nos controles
    if (this.moveUp) this.y -= speed;
    if (this.moveDown) this.y += speed;
     // Impede que a nave ultrapasse o topo
    if (this.y < 0) this.y = 0;
    // Impede que a nave ultrapasse a parte inferior da tela
    if (this.y + this.h > canvas.height) this.y = canvas.height - this.h;
  }
};

const pipes = []; // Lista de obstáculos (águas ou pedras)
const pipeGap = 120; // Espaço vertical entre os obstáculos de cima e de baixo
const AGUIA_LARGURA = 40; // Largura do obstáculo desenhado na tela
const AGUIA_ALTURA = 60; // Altura do obstáculo desenhado na tela

function spawnPipe() { // Função que cria um novo obstáculo
  const topHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 20; // Altura aleatória para o obstáculo superior
  pipes.push({ x: canvas.width, top: topHeight, bottom: topHeight + pipeGap, passed: false });  // Adiciona o obstáculo à lista
}

function drawBackground() { // Desenha o fundo animado (rolagem infinita)
  ctx.drawImage(fundoImg, fundoX, 0, canvas.width, canvas.height);
  ctx.drawImage(fundoImg, fundoX + canvas.width, 0, canvas.width, canvas.height);
  fundoX -= fundoSpeed;
  if (fundoX <= -canvas.width) fundoX = 0;
}

function drawPipes() { // Desenha os obstáculos (águas ou pedras) na tela
  pipes.forEach(pipe => {
    const frame = Math.floor(frames / 10) % 3; // Frame atual da animação
    // Desenha o obstáculo superior
    ctx.drawImage(aguiaImg, frame * AGUIA_FRAME_WIDTH, 0, AGUIA_FRAME_WIDTH, AGUIA_FRAME_HEIGHT,
      pipe.x, pipe.top - AGUIA_ALTURA, AGUIA_LARGURA, AGUIA_ALTURA);
    // Desenha o obstáculo inferior
      ctx.drawImage(aguiaImg, frame * AGUIA_FRAME_WIDTH, 0, AGUIA_FRAME_WIDTH, AGUIA_FRAME_HEIGHT,
      pipe.x, pipe.bottom, AGUIA_LARGURA, AGUIA_ALTURA);
  });
}

function updatePipes() { // Atualiza a posição e estado dos obstáculos
  if (frames % 90 === 0) spawnPipe(); // Gera novo obstáculo a cada 90 frames
  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed; // Move o obstáculo para a esquerda
    const hitbox = { x: bird.x + 10, y: bird.y + 10, w: bird.w - 20, h: bird.h - 20 };  // Hitbox reduzida da nave
    const topBox = { x: pipe.x, y: pipe.top - AGUIA_ALTURA, w: AGUIA_LARGURA, h: AGUIA_ALTURA }; // Hitbox do obstáculo superior
    const bottomBox = { x: pipe.x, y: pipe.bottom, w: AGUIA_LARGURA, h: AGUIA_ALTURA }; // Hitbox do obstáculo inferior

    const colidiu = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; // Função que verifica colisão entre dois retângulos
    if (colidiu(hitbox, topBox) || colidiu(hitbox, bottomBox)) {   // Se houve colisão, ativa o game over
      if (!gameOver && !fimDeJogo) {
        gameOver = true;
        somExplosao.play();
        somGameOver.play();
        pararMusicaFundo();
      }
    }

    if (pipe.x + AGUIA_LARGURA < bird.x && !pipe.passed) { // Se passou do obstáculo e ainda não contou ponto
      pipe.passed = true; // Marca como passado
      score++; // Incrementa a pontuação
      if (score % 10 === 0) pipeSpeed += 0.5; // Aumenta a dificuldade a cada 10 pontos

      if (score >= 60 && !fase1Passada && !fase2) { // Se o jogador completou a fase 1
        fase1Passada = true; 
        paused = true; 
        document.getElementById("nextPhaseBtn").style.display = "inline-block";
      }

      if (score >= 30 && fase2 && !fimDeJogo) {  // Se o jogador completou a fase 2
        fimDeJogo = true; 
        paused = true; 
      }
    }
  });

  if (pipes.length && pipes[0].x + AGUIA_LARGURA < 0) pipes.shift(); // Remove obstáculos que saíram da tela
}

function drawScore() { // Desenha a pontuação na tela
  ctx.fillStyle = "#fff"; // Cor do texto
  ctx.font = "24px Arial"; // Fonte do texto
  ctx.fillText("Pontos: " + score, 10, 30);
}

function drawGameOver() { // Desenha a mensagem de "GAME OVER"
  ctx.fillStyle = "red"; // Cor do texto
  ctx.font = "48px Arial"; // Fonte do texto
  ctx.fillText("GAME OVER", 60, canvas.height / 2);
}

function drawPausedText() { // Desenha o texto de pausa
  ctx.fillStyle = "red";  // Cor do texto
  ctx.font = "48px Arial"; // Fonte do texto
  ctx.fillText("PAUSADO", canvas.width / 2 - 100, canvas.height / 2);
}

function drawParabensFase1() { // Mensagem de parabéns por passar a fase 1
  ctx.fillStyle = "green"; // Cor do texto
  ctx.font = "26px Arial"; // Fonte do texto
  ctx.fillText("Parabéns! Você passou a fase 1!", 20, canvas.height / 2);
}

function drawParabensFase2() { // Mensagem de parabéns por concluir o jogo
  ctx.fillStyle = "green"; // Cor do texto
  ctx.font = "26px Arial"; // Fonte do texto
  ctx.fillText("Parabéns! Você concluiu a missão", 20, canvas.height / 2);
}

function resetGame() { // Reinicia o estado do jogo
  bird.y = 150; // Reseta a posição vertical da nave
  pipes.length = 0; // Limpa a lista de obstáculos
  score = 0; // Reseta a pontuação
  frames = 0; // Reseta o contador de frames
  pipeSpeed = fase2 ? 7 : 4; // Reseta a velocidade dos obstáculos dependendo da fase
  gameOver = false; // Reseta o estado de game over
  paused = false; // Reseta o estado de pausa
  fase1Passada = false; // Reseta o estado de fase 1
  fimDeJogo = false; // Reseta o estado de fim de jogo
  tocarMusicaFundo(); // Toca a música de fundo
}

function gameLoop() { // Loop principal do jogo, executado a cada frame
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa tela
  drawBackground(); // Desenha fundo
  
  if (!gameOver) {
    bird.draw(); // Desenha nave
    drawPipes(); // Desenha obstáculos
    drawScore(); // Desenha pontuação

    if (!paused) { // Se o jogo não estiver pausado
      bird.update(); // Atualiza posição da nave
      updatePipes(); // Atualiza obstáculos
    } else { // Se o jogo estiver pausado
      if (fimDeJogo && fase2) { // Se o jogo foi concluído na fase 2
        drawParabensFase2(); 
      } else if (fase1Passada && !fase2) { // Se o jogador passou da fase 1
        drawParabensFase1(); 
      } else { // Se o jogo estiver pausado sem fim de jogo
        drawPausedText(); 
      }
    }
  } else { // Se o jogo estiver em game over
    bird.draw(); // Desenha nave
    drawPipes(); // Desenha obstáculos
    drawScore(); // Desenha pontuação
    drawGameOver(); // Desenha mensagem de game over
    return; // Sai do loop se o jogo estiver em game over
  }

  frames++; // Incrementa o contador de frames
  requestAnimationFrame(gameLoop); // Solicita o próximo frame do loop de animação
}

// Botões e eventos
document.getElementById("pauseBtn").addEventListener("click", () => { 
  if (!gameOver) paused = !paused;  // Alterna o estado de pausa
});

// Botão de reiniciar o jogo
document.getElementById("resetBtn").addEventListener("click", () => { 
  resetGame(); // Reseta o jogo
  gameLoop(); // Inicia o loop do jogo
});

// Botão de iniciar jogo com cutscene
document.getElementById("startGameButton").addEventListener("click", () => { // Inicia o jogo com uma cutscene
  document.getElementById("startScreen").style.display = "none";  // Esconde a tela de início
  const cutscene = document.getElementById("video-cutscene"); // Obtém o elemento de vídeo da cutscene
  cutscene.style.display = "block"; // Exibe o vídeo da cutscene
  cutscene.play(); // Inicia a reprodução do vídeo
});

// Quando o vídeo termina, inicia o jogo
document.getElementById("video-cutscene").addEventListener("ended", function () { 
  this.style.display = "none"; // Esconde o vídeo da cutscene
  document.getElementById("game").style.display = "block"; // Exibe a tela do jogo
  resetGame(); // Reseta o jogo
  gameLoop(); // Inicia o loop do jogo
});

// Botão de sair do jogo
document.getElementById("exitGameButton").addEventListener("click", () => { 
  alert("Volte sempre!"); // Exibe mensagem de despedida
  window.close(); // Fecha a janela do jogo (funciona apenas em alguns navegadores)
});

// Eventos de teclado para controlar a nave
document.addEventListener("keydown", e => { 
  if (e.code === "ArrowUp") bird.moveUp = true; // Ativa movimento para cima
  if (e.code === "ArrowDown") bird.moveDown = true; // Ativa movimento para baixo
  if (e.code === "KeyP" && !gameOver) paused = !paused;  // Alterna pausa com a tecla P
});

// Eventos de teclado para parar o movimento da nave
document.addEventListener("keyup", e => { 
  if (e.code === "ArrowUp") bird.moveUp = false; // Desativa movimento para cima
  if (e.code === "ArrowDown") bird.moveDown = false; // Desativa movimento para baixo
});

document.getElementById("nextPhaseBtn").addEventListener("click", () => {
  fundoImg.src = "../IMG/fase2prn.png"; // Muda a imagem do fundo para a fase 2
  aguiaImg.src = "../IMG/pedra.png"; // Muda a imagem do obstáculo para a fase 2
  fase2 = true; // Ativa a fase 2
  resetGame(); // Reseta o jogo para a nova fase
  gameLoop(); // Inicia o loop do jogo
  document.getElementById("nextPhaseBtn").style.display = "none"; // Esconde o botão de próxima fase
});
