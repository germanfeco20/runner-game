const VERSION = 'v4';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Salto medido en "lados del personaje", así se siente igual en cualquier pantalla.
const JUMP_HEIGHT = 2.2; // altura máxima: pasa sobre un obstáculo de 1 lado con margen
const RISE_TIME = 0.3; // segundos hasta la cima
const FALL_FACTOR = 1.6; // la caída tiene más gravedad que la subida: salto con peso
const GRAVITY_UP = (2 * JUMP_HEIGHT) / (RISE_TIME * RISE_TIME);
const GRAVITY_DOWN = GRAVITY_UP * FALL_FACTOR;
const JUMP_SPEED = (2 * JUMP_HEIGHT) / RISE_TIME;

// Obstáculos, también en lados del personaje. Nunca más altos que el personaje.
const SPEED = 7; // lados por segundo: ritmo relajado
const FIRST_OBSTACLE_DELAY = 2; // segundos antes del primer obstáculo
// Separación medida en tiempo: con 0,54 s en el aire, 1,1 s deja tiempo de aterrizar y reaccionar.
const GAP_MIN = 1.1;
const GAP_MAX = 2.2;
const OBSTACLE_MIN_W = 0.5;
const OBSTACLE_MAX_W = 0.8;
const OBSTACLE_MIN_H = 0.7;
const OBSTACLE_MAX_H = 1;

let width = 0;
let height = 0;
let groundY = 0;
let size = 0;

// Posición vertical sobre el suelo y velocidad, en lados del personaje.
const player = { y: 0, vy: 0 };

// Cada obstáculo: x (borde izquierdo), w y h, en lados del personaje.
let obstacles = [];
let spawnTimer = FIRST_OBSTACLE_DELAY;

const random = (min, max) => min + Math.random() * (max - min);

// Ajusta el canvas al tamaño de la pantalla, nítido en pantallas de alta densidad.
function resize() {
  const dpr = window.devicePixelRatio || 1;
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  groundY = Math.round(height * 0.75);
  size = Math.round(Math.min(width, height * 0.6) * 0.1);
  draw();
}

function jump() {
  if (player.y > 0) return;
  player.vy = JUMP_SPEED;
  player.y = 0.0001; // despega en este mismo toque, sin esperar al siguiente cuadro
  draw();
}

function updatePlayer(dt) {
  if (player.y <= 0) return;
  player.vy -= (player.vy > 0 ? GRAVITY_UP : GRAVITY_DOWN) * dt;
  player.y += player.vy * dt;
  if (player.y <= 0) {
    player.y = 0;
    player.vy = 0;
  }
}

function updateObstacles(dt) {
  for (const o of obstacles) o.x -= SPEED * dt;
  obstacles = obstacles.filter((o) => o.x + o.w > 0);

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    obstacles.push({
      x: width / size,
      w: random(OBSTACLE_MIN_W, OBSTACLE_MAX_W),
      h: random(OBSTACLE_MIN_H, OBSTACLE_MAX_H),
    });
    spawnTimer = random(GAP_MIN, GAP_MAX);
  }
}

function update(dt) {
  updatePlayer(dt);
  updateObstacles(dt);
}

function draw() {
  // Cielo
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, width, groundY);

  // Suelo
  ctx.fillStyle = '#6b8e23';
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.fillStyle = '#4a6318';
  ctx.fillRect(0, groundY, width, 4);

  // Obstáculos
  ctx.fillStyle = '#5b2a86';
  for (const o of obstacles) {
    ctx.fillRect(o.x * size, groundY - o.h * size, o.w * size, o.h * size);
  }

  // Personaje
  ctx.fillStyle = '#e8452c';
  ctx.fillRect(Math.round(width * 0.2), groundY - size - player.y * size, size, size);

  // Versión
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(VERSION, width - 8, height - 8);
}

let lastTime = 0;
function loop(time) {
  // Tope de 1/30 s por cuadro para que el salto no se desborde tras una pausa.
  const dt = lastTime ? Math.min((time - lastTime) / 1000, 1 / 30) : 0;
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Controles: toque o clic (pointerdown) y barra espaciadora.
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  jump();
});
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space') return;
  e.preventDefault();
  if (!e.repeat) jump();
});

// Bloquea scroll, zoom y gestos del navegador (Safari iOS ignora user-scalable=no).
const block = (e) => e.preventDefault();
document.addEventListener('touchmove', block, { passive: false });
document.addEventListener('gesturestart', block);
document.addEventListener('dblclick', block);
document.addEventListener('contextmenu', block);

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(loop);
