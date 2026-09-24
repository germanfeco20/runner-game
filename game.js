const VERSION = 'v12';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Salto medido en "lados del personaje", así se siente igual en cualquier pantalla.
const JUMP_HEIGHT = 2.2; // altura máxima: pasa sobre un obstáculo de 1 lado con margen
const RISE_TIME = 0.25; // segundos hasta la cima
const FALL_FACTOR = 1.8; // la caída tiene más gravedad que la subida: salto con peso
const GRAVITY_UP = (2 * JUMP_HEIGHT) / (RISE_TIME * RISE_TIME);
const GRAVITY_DOWN = GRAVITY_UP * FALL_FACTOR;
const JUMP_SPEED = (2 * JUMP_HEIGHT) / RISE_TIME;
const AIR_TIME = RISE_TIME * (1 + 1 / Math.sqrt(FALL_FACTOR)); // ~0,44 s

// Obstáculos, también en lados del personaje.
const FIRST_OBSTACLE_DELAY = 2; // segundos antes del primer obstáculo

// Dificultad: sube en línea recta entre RAMP_START y RAMP_END segundos y luego se queda en el tope.
const RAMP_START = 5;
const RAMP_END = 28;
const SPEED_START = 8; // lados por segundo
const SPEED_MAX = 13;
// Separación entre patrones medida en tiempo desde que termina uno hasta que empieza el siguiente.
// El mínimo nunca baja de AIR_TIME + MIN_GROUND_TIME: siempre da tiempo de aterrizar y volver a saltar.
const MIN_GROUND_TIME = 0.25;
const GAP_EASY = [1.1, 2.0];
const GAP_HARD = [AIR_TIME + MIN_GROUND_TIME, 1.0];
// Tamaño [mín, máx]: a velocidad baja el obstáculo se cruza más lento, por eso empieza pequeño.
const OBSTACLE_EASY = { w: [0.4, 0.6], h: [0.6, 0.85] };
const OBSTACLE_HARD = { w: [0.5, 1], h: [0.7, 1] };
// Variedad: la probabilidad crece con la dificultad hasta estos topes.
const TALL_CHANCE = 0.3; // obstáculo más alto que el personaje
const TALL_H = [1.05, 1.3];
const DOUBLE_CHANCE = 0.3; // dos obstáculos juntos que se saltan de una vez
const DOUBLE_W = [0.35, 0.55];
const DOUBLE_GAP = [0.4, 0.8];
// Todo patrón debe dejar al menos este margen de tiempo para tocar; si no, se simplifica.
const MIN_WINDOW = 0.14;

// Choque justo: la zona de choque del personaje es más pequeña que su dibujo.
const HITBOX_INSET = 0.15; // lados recortados por cada borde
const RESTART_DELAY = 500; // ms en que se ignoran toques tras chocar

const BEST_KEY = 'runner-game.best';

// Animaciones: solo visuales, no cambian la física ni la zona de choque.
const SHAKE_TIME = 0.25; // s
const FLASH_TIME = 0.2; // s
const MAX_PARTICLES = 48;
// Cielo: color arriba y en el horizonte, de fácil a difícil. El horizonte queda claro para que
// personaje y obstáculos siempre contrasten.
const SKY_TOP = ['#87ceeb', '#3f4e9e'];
const SKY_HORIZON = ['#d6f1ff', '#ffc9a0'];
// Capas del fondo: posición como fracción del ciclo, altura y tamaño en lados. Velocidad relativa al suelo.
const CLOUDS = { speed: 0.08, items: [[0.05, 0.2, 1], [0.32, 0.64, 0.7], [0.55, 0.23, 1.2], [0.8, 0.68, 0.8]] };
const HILLS = { speed: 0.3, items: [[0, 4, 1.4], [0.27, 5, 2], [0.5, 3.5, 1.2], [0.74, 4.5, 1.7]] };
const GROUND_MARK_SPACING = 1.5;

let width = 0;
let height = 0;
let groundY = 0;
let size = 0;

// Posición vertical sobre el suelo y velocidad, en lados del personaje.
const player = { y: 0, vy: 0 };

// Cada obstáculo: x (borde izquierdo), w y h, en lados del personaje.
let obstacles = [];
let spawnTimer = FIRST_OBSTACLE_DELAY;

// Estados: 'ready' (toca para empezar), 'playing', 'paused' (toca para continuar), 'over' (congelado tras chocar).
let state = 'ready';

// En celular (pantalla táctil) el juego solo corre en vertical. En PC no se bloquea la horizontal.
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
const isLandscape = () => isTouchDevice && width > height;

// Pausa la partida en curso; nunca se reanuda sola, solo con un toque.
function pause() {
  if (state === 'playing') state = 'paused';
}
let overAt = 0;

// Puntaje = lados recorridos. El récord vive en localStorage.
let distance = 0;
let elapsed = 0; // segundos de partida
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

const fx = { squash: 0, shake: 0, flash: 0, pop: 0, particles: [] };

const lerp = (a, b, t) => a + (b - a) * t;
const difficulty = () => Math.min(Math.max((elapsed - RAMP_START) / (RAMP_END - RAMP_START), 0), 1);
const speed = () => lerp(SPEED_START, SPEED_MAX, difficulty());

const random = (min, max) => min + Math.random() * (max - min);

function start() {
  player.y = 0;
  player.vy = 0;
  obstacles = [];
  spawnTimer = FIRST_OBSTACLE_DELAY;
  distance = 0;
  elapsed = 0;
  newRecord = false;
  fx.squash = 0;
  fx.particles = [];
  state = 'playing';
}

function onTap() {
  if (isLandscape()) return; // "Gira tu celular": se ignoran los toques
  if (state === 'paused') state = 'playing'; // continúa sin saltar
  else if (state === 'ready') start();
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
  if (isLandscape()) pause();
  draw();
}

function jump() {
  if (player.y > 0) return;
  player.vy = JUMP_SPEED;
  player.y = 0.0001; // despega en este mismo toque, sin esperar al siguiente cuadro
  fx.squash = -0.25; // se estira al despegar
  draw();
}

function updatePlayer(dt) {
  if (player.y <= 0) return;
  player.vy -= (player.vy > 0 ? GRAVITY_UP : GRAVITY_DOWN) * dt;
  player.y += player.vy * dt;
  if (player.y <= 0) {
    player.y = 0;
    player.vy = 0;
    land();
  }
}

// Se aplasta al aterrizar y levanta polvo.
function land() {
  fx.squash = 0.3;
  const x = (width * 0.2) / size + 0.5;
  for (let i = 0; i < 8; i++) {
    fx.particles.push({ x: x + random(-0.45, 0.45), y: 0.05, vx: random(-2.5, 1), vy: random(1, 3), life: 1, s: random(0.08, 0.16) });
  }
  if (fx.particles.length > MAX_PARTICLES) fx.particles.splice(0, fx.particles.length - MAX_PARTICLES);
}

function updateFx(dt) {
  fx.squash *= Math.exp(-12 * dt);
  fx.shake = Math.max(0, fx.shake - dt);
  fx.flash = Math.max(0, fx.flash - dt);
  fx.pop = Math.max(0, fx.pop - dt * 4);
  const ground = state === 'playing' ? speed() : 0;
  for (const p of fx.particles) {
    p.x += (p.vx - ground) * dt;
    p.vy -= 12 * dt;
    p.y = Math.max(0, p.y + p.vy * dt);
    p.life -= dt / 0.45;
  }
  fx.particles = fx.particles.filter((p) => p.life > 0);
}

function updateObstacles(dt) {
  for (const o of obstacles) o.x -= speed() * dt;
  obstacles = obstacles.filter((o) => o.x + o.w > 0);

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    const d = difficulty();
    const span = spawnPattern(d);
    const gap = random(lerp(GAP_EASY[0], GAP_HARD[0], d), lerp(GAP_EASY[1], GAP_HARD[1], d));
    spawnTimer = span / speed() + gap;
  }
}

// Segundos en que tocar hace pasar limpio un patrón de altura h y ancho total w a velocidad v.
function clearWindow(h, w, v) {
  const a = Math.max(h - HITBOX_INSET, 0);
  if (a >= JUMP_HEIGHT) return 0;
  const above = Math.sqrt((2 * (JUMP_HEIGHT - a)) / GRAVITY_UP) + Math.sqrt((2 * (JUMP_HEIGHT - a)) / GRAVITY_DOWN);
  return above - (1 - 2 * HITBOX_INSET + w) / v;
}

// Crea un patrón (uno o dos obstáculos) en el borde derecho y devuelve su ancho total.
function spawnPattern(d) {
  const range = (key, i) => lerp(OBSTACLE_EASY[key][i], OBSTACLE_HARD[key][i], d);
  const height = () => (Math.random() < TALL_CHANCE * d ? random(...TALL_H) : random(range('h', 0), range('h', 1)));
  const single = () => [{ x: 0, w: random(range('w', 0), range('w', 1)), h: random(range('h', 0), range('h', 1)) }];
  let boxes;
  if (Math.random() < DOUBLE_CHANCE * d) {
    const w1 = random(...DOUBLE_W);
    boxes = [{ x: 0, w: w1, h: height() }, { x: w1 + random(...DOUBLE_GAP), w: random(...DOUBLE_W), h: height() }];
  } else {
    boxes = [{ x: 0, w: random(range('w', 0), range('w', 1)), h: height() }];
  }
  const fits = (b) => clearWindow(Math.max(...b.map((o) => o.h)), b[b.length - 1].x + b[b.length - 1].w, speed()) >= MIN_WINDOW;
  if (!fits(boxes)) boxes = single();

  const pattern = {};
  for (const b of boxes) obstacles.push({ x: width / size + b.x, w: b.w, h: b.h, pattern });
  const last = boxes[boxes.length - 1];
  return last.x + last.w;
}

function update(dt) {
  updatePlayer(dt);
  updateObstacles(dt);
  const hundreds = Math.floor(score() / 100);
  distance += speed() * dt;
  elapsed += dt;
  if (Math.floor(score() / 100) > hundreds) fx.pop = 1; // el puntaje salta cada 100
  if (hitsObstacle()) gameOver();
}

function gameOver() {
  state = 'over';
  overAt = performance.now();
  fx.shake = SHAKE_TIME;
  fx.flash = FLASH_TIME;
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
  const bump = Math.sin(fx.pop * Math.PI); // 0 → 1 → 0
  const fontSize = Math.round(Math.max(36, size * 1.2) * (1 + 0.35 * bump));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = Math.max(4, fontSize / 8);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.strokeText(String(score()), width / 2, Math.max(36, size * 1.2) * 0.6);
  ctx.fillStyle = bump > 0.05 ? mixColor('#ffffff', '#ffd23f', bump) : '#ffffff';
  ctx.fillText(String(score()), width / 2, Math.max(36, size * 1.2) * 0.6);
}

// Mezcla dos colores #rrggbb; t entre 0 y 1.
function mixColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift) => Math.round(lerp((pa >> shift) & 255, (pb >> shift) & 255, t));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

// Posición en pantalla (px) del borde izquierdo de un elemento que se repite en un ciclo.
// Vuelve a la derecha solo cuando ya salió `margin` lados por la izquierda: margin debe ser
// al menos el ancho del elemento, y el ciclo al menos el ancho de pantalla más ese margen.
function wrapX(fraction, layerSpeed, period, margin) {
  const x = (fraction * period - distance * layerSpeed) % period;
  return ((x + period) % period - margin) * size;
}

// El degradado del cielo es caro de pintar en cada cuadro: se pinta una vez en un canvas aparte
// y solo se rehace cuando la dificultad cambia un escalón (1/50) o cambia el tamaño de pantalla.
const skyCache = { canvas: document.createElement('canvas'), key: '' };

function skyImage(m) {
  const step = Math.round(difficulty() * 50);
  const key = `${step}:${width}:${height}`;
  if (skyCache.key !== key) {
    const dpr = window.devicePixelRatio || 1;
    const c = skyCache.canvas;
    c.width = Math.round((width + 2 * m) * dpr);
    c.height = Math.round((groundY + m) * dpr);
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, mixColor(SKY_TOP[0], SKY_TOP[1], step / 50));
    grad.addColorStop(1, mixColor(SKY_HORIZON[0], SKY_HORIZON[1], step / 50));
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
    skyCache.key = key;
  }
  return skyCache.canvas;
}

function drawBackground(m) {
  ctx.drawImage(skyImage(m), -m, -m, width + 2 * m, groundY + m);

  // Nubes: solo en la mitad alta del cielo, lejos de los obstáculos.
  const cloudPeriod = width / size + 4;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (const [f, y, s] of CLOUDS.items) {
    const x = wrapX(f, CLOUDS.speed, cloudPeriod, 2);
    const cy = groundY * y;
    const r = s * size * 0.45;
    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.9, cy - r * 0.35, r * 0.8, 0, Math.PI * 2);
    ctx.arc(x + r * 1.8, cy, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Colinas: tenues, para que los obstáculos resalten delante.
  const hillMargin = Math.max(...HILLS.items.map(([, w]) => w)) + 1; // +1: que salga del todo, sin dejar un borde
  const hillPeriod = width / size + 2 * hillMargin;
  ctx.fillStyle = 'rgba(107, 142, 35, 0.28)';
  for (const [f, w, h] of HILLS.items) {
    const x = wrapX(f, HILLS.speed, hillPeriod, hillMargin);
    ctx.beginPath();
    ctx.ellipse(x + (w * size) / 2, groundY, (w * size) / 2, h * size, 0, Math.PI, 0);
    ctx.fill();
  }

  // Suelo con marcas que avanzan a la velocidad del juego.
  ctx.fillStyle = '#6b8e23';
  ctx.fillRect(-m, groundY, width + 2 * m, height - groundY + m);
  ctx.fillStyle = '#4a6318';
  ctx.fillRect(-m, groundY, width + 2 * m, 4);
  ctx.fillStyle = '#5d7d1e';
  const markPeriod = Math.ceil(width / size / GROUND_MARK_SPACING + 2) * GROUND_MARK_SPACING;
  for (let i = 0; i * GROUND_MARK_SPACING < markPeriod; i++) {
    const x = wrapX((i * GROUND_MARK_SPACING) / markPeriod, 1, markPeriod, 1);
    ctx.fillRect(x, groundY + size * 0.45, size * 0.5, Math.max(2, size * 0.08));
  }
}

function drawPlayer() {
  // Estira en el aire según la velocidad y aplica el golpe de despegue o aterrizaje.
  const air = player.y > 0 ? -0.12 * Math.min(Math.abs(player.vy) / JUMP_SPEED, 1) : 0;
  const k = Math.min(Math.max(fx.squash + air, -0.3), 0.35);
  const w = size * (1 + k);
  const h = size * (1 - k);
  const cx = Math.round(width * 0.2) + size / 2;
  const bottom = groundY - player.y * size;
  ctx.fillStyle = '#e8452c';
  ctx.fillRect(cx - w / 2, bottom - h, w, h);
}

function draw() {
  const m = size; // margen para que el temblor no deje bordes vacíos
  const shake = fx.shake > 0 ? (fx.shake / SHAKE_TIME) * size * 0.25 : 0;
  ctx.save();
  if (shake) ctx.translate(random(-shake, shake), random(-shake, shake));

  drawBackground(m);

  // Polvo: detrás de los obstáculos para no taparlos.
  for (const p of fx.particles) {
    ctx.fillStyle = `rgba(222, 232, 190, ${0.8 * p.life})`;
    const s = p.s * size;
    ctx.fillRect(p.x * size - s / 2, groundY - p.y * size - s, s, s);
  }

  // Obstáculos
  ctx.fillStyle = '#5b2a86';
  for (const o of obstacles) {
    ctx.fillRect(o.x * size, groundY - o.h * size, o.w * size, o.h * size);
  }

  drawPlayer();
  ctx.restore();

  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * (fx.flash / FLASH_TIME)})`;
    ctx.fillRect(0, 0, width, height);
  }

  if (state === 'playing' || state === 'paused') drawScore();
  if (isLandscape()) drawPanel([['Gira tu celular', 1]]);
  else if (state === 'paused') drawPanel([['Toca para continuar', 1]]);
  else if (state === 'ready') drawPanel([['Toca para empezar', 1]]);
  else if (state === 'over') {
    drawPanel([
      [`Puntaje: ${score()}`, 1.4],
      ...(newRecord ? [['¡Nuevo récord!', 1, '#ffd23f']] : []),
      [`Tiempo: ${Math.floor(elapsed)} s`, 0.9],
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
  if (state !== 'paused') updateFx(dt);
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

// Cambio de app, bloqueo de pantalla o llamada entrante: pausa.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});
window.addEventListener('pagehide', pause);
window.addEventListener('blur', pause);

window.addEventListener('resize', resize);
// Algunos navegadores informan el tamaño nuevo un poco después de girar.
window.addEventListener('orientationchange', () => setTimeout(resize, 150));
resize();
requestAnimationFrame(loop);
