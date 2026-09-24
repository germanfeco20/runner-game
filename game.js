const VERSION = 'v1';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let width = 0;
let height = 0;

// Ajusta el canvas al tamaño de la pantalla, nítido en pantallas de alta densidad.
function resize() {
  const dpr = window.devicePixelRatio || 1;
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function draw() {
  const groundY = Math.round(height * 0.75);

  // Cielo
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, width, groundY);

  // Suelo
  ctx.fillStyle = '#6b8e23';
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.fillStyle = '#4a6318';
  ctx.fillRect(0, groundY, width, 4);

  // Versión
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(VERSION, width - 8, height - 8);
}

// Bloquea scroll, zoom y gestos del navegador (Safari iOS ignora user-scalable=no).
const block = (e) => e.preventDefault();
document.addEventListener('touchmove', block, { passive: false });
document.addEventListener('gesturestart', block);
document.addEventListener('dblclick', block);
document.addEventListener('contextmenu', block);

window.addEventListener('resize', resize);
resize();
