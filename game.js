const VERSION = 'v6';

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

// Choque justo: la zona de choque del personaje es más pequeña que su dibujo.
const HITBOX_INSET = 0.15; // lados recortados por cada borde
const RESTART_DELAY = 500; // ms en que se ignoran toques tras chocar

const BEST_KEY = 'runner-game.best';

let width = 0;
let height = 0;
let groundY = 0;
let size = 0;

// Posición vertical sobre el suelo y velocidad, en lados del personaje.
const player = { y: 0, vy: 0 };

// Cada obstáculo: x (borde izquierdo), w y h, en lados del personaje.
let obstacles = [];
let spawnTimer = FIRST_OBSTACLE_DELAY;

// Estados: 'ready' (toca para empezar), 'playing', 'over' (congelado tras chocar).
let state = 'ready';
let overAt = 0;

// Puntaje = lados recorridos. El récord vive en localStorage.
let distance = 0;
let best = loadBest();
let newRecord = false;

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Sin almacenamiento (p. ej. navegación privada): el récord dura solo esta sesión.
  }
}

const score = () => Math.floor(distance);

const random = (min, max) => min + Math.random() * (max - min);

function start() {
  player.y = 0;
  player.vy = 0;
  obstacles = [];
  spawnTimer = FIRST_OBSTACLE_DELAY;
  distance = 0;
  newRecord = false;
  state = 'playing';
}

function onTap() {
  if (state === 'ready') start();
  else if (state === 'playing') jump();
  else if (performance.now() - overAt >= RESTART_DELAY) start();
}

function hitsObstacle() {
  const left = (width * 0.2) / size + HITBOX_INSET;
  const right = left + 1 - 2 * HITBOX_INSET;
  const bottom = player.y + HITBOX_INSET;
  return obstacles.some((o) => o.x < right && o.x + o.w > left && bottom < o.h);
}

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
  distance += SPEED * dt;
  if (hitsObstacle()) gameOver();
}

function gameOver() {
  state = 'over';
  overAt = performance.now();
  newRecord = score() > best;
  if (newRecord) {
    best = score();
    saveBest(best);
  }
}

// Franja oscura centrada en el cielo con una o varias líneas: [texto, escala, color].
function drawPanel(lines) {
  const base = Math.max(18, Math.round(size * 0.6));
  const heights = lines.map(([, scale]) => base * scale * 1.5);
  const total = heights.reduce((a, b) => a + b, 0) + base;
  let y = Math.round(groundY * 0.45 - total / 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, y, width, total);
  y += base / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach(([text, scale, color], i) => {
    ctx.fillStyle = color || '#ffffff';
    ctx.font = `bold ${Math.round(base * scale)}px sans-serif`;
    ctx.fillText(text, width / 2, y + heights[i] / 2);
    y += heights[i];
  });
}

function drawScore() {
  const fontSize = Math.max(36, Math.round(size * 1.2));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = Math.max(4, fontSize / 8);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.strokeText(String(score()), width / 2, fontSize * 0.6);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(score()), width / 2, fontSize * 0.6);
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

  if (state === 'playing') drawScore();
  if (state === 'ready') drawPanel([['Toca para empezar', 1]]);
  if (state === 'over') {
    drawPanel([
      [`Puntaje: ${score()}`, 1.4],
      ...(newRecord ? [['¡Nuevo récord!', 1, '#ffd23f']] : []),
      [`Récord: ${best}`, 0.9],
      ['Toca para reiniciar', 0.8],
    ]);
  }

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
  if (state === 'playing') update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Controles: toque o clic (pointerdown) y barra espaciadora.
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  onTap();
});
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space') return;
  e.preventDefault();
  if (!e.repeat) onTap();
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
