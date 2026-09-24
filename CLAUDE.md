# Runner Game

## Qué es
Juego casual para celular: endless runner de un toque. El personaje corre solo; tocar la pantalla = saltar. Hay que esquivar obstáculos. Puntaje = distancia recorrida. La velocidad aumenta con el tiempo. Al chocar: pantalla de Game Over con puntaje y récord; tocar para reiniciar.

## Stack (no cambiar sin preguntarme)
- HTML5 Canvas + JavaScript puro. Sin frameworks, sin npm, sin build.
- Archivos: index.html, style.css, game.js.
- Se publica con GitHub Pages desde la rama main (raíz).

## Reglas de diseño
- Móvil primero, orientación vertical. Debe funcionar en Chrome Android y Safari iOS.
- Control: toque (pointerdown). También clic y barra espaciadora para probar en PC.
- Sin scroll, zoom ni selección de texto al tocar.
- Canvas responsive y nítido en pantallas de alta densidad (devicePixelRatio).
- Gráficos: solo formas geométricas y colores por ahora. Sin imágenes externas.
- Récord guardado en localStorage.

## Cómo trabajamos
- Un objetivo por cambio. Cambios pequeños.
- Antes de un cambio grande: proponer plan y esperar mi aprobación.
- Después de cada cambio: explicar en máximo 3 líneas qué cambió y cómo probarlo.
- No agregar funcionalidades que no pedí.
- Cada paso terminado se fusiona a main para probarlo en el celular vía GitHub Pages.
- Mostrar en la esquina inferior derecha un número de versión pequeño (v1, v2...) que se incrementa en cada paso.
- Al terminar cada paso, actualizar su estado en la tabla del Plan en el mismo commit.
- index.html carga style.css y game.js con ?v=N, el mismo número de la versión visible. Actualizarlo en cada cambio de versión.
- Después de fusionar, verificar que https://germanfeco20.github.io/runner-game/game.js?v=N contenga la versión nueva (esperar hasta 3 min). Si no puedes acceder a esa URL desde tu entorno, decirlo explícitamente.
- Subir a la rama y a main con dos comandos separados, sin -q, y después confirmar que aparece la publicación en Actions.

## Plan
| # | Paso | Estado |
|---|---|---|
| 1 | Canvas responsive y nítido, suelo, bloqueo de scroll y zoom | Hecho (v1) |
| 2 | Personaje cuadrado con salto con peso | Hecho (v2) |
| 3 | Obstáculos que aparecen a la derecha y se desplazan a la izquierda, sin choque | Hecho (v4) |
| 4 | Choque, estados de juego (inicio, jugando, game over) y reinicio | Hecho (v5) |
| 5 | Puntaje por distancia y récord en localStorage | Hecho (v6) |
| 6 | Dificultad progresiva con separación entre obstáculos siempre saltable | Hecho (v7, recalibrado en v9) |
| 6b | Animaciones: estiramiento, polvo, temblor y destello, fondo con capas, cielo según dificultad, puntaje que salta | Pendiente |
| 7 | Pausa al cambiar de app, rotación y cambio de tamaño | Pendiente |
