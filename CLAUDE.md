# Runner Game

## Qué es
Juego casual para celular: endless runner de un toque. El personaje corre solo; tocar la pantalla = saltar. Hay que esquivar obstáculos. Puntaje = distancia recorrida. La velocidad aumenta con el tiempo. Al chocar: pantalla de Game Over con puntaje y récord; tocar para reiniciar.

## Stack (no cambiar sin preguntarme)
- HTML5 Canvas + JavaScript puro. Sin frameworks, sin npm, sin build.
- Archivos: index.html, style.css, game.js. App instalable: manifest.webmanifest e icons/. Página de prueba de arte: arte.html (no forma parte del juego).
- Se publica con GitHub Pages desde la rama main (raíz).

## Reglas de diseño
- Móvil primero, orientación vertical. Debe funcionar en Chrome Android y Safari iOS.
- Control: toque (pointerdown). También clic y barra espaciadora para probar en PC.
- Sin scroll, zoom ni selección de texto al tocar.
- Canvas responsive y nítido en pantallas de alta densidad (devicePixelRatio).
- Récord guardado en localStorage.

## Dirección de arte
- TEMA: ciudad cyberpunk con mucho neón. El personaje es un androide que corre.
- PERSONAJE: androide humanoide de perfil que corre hacia la derecha. Cuerpo mitad humano (chaqueta oscura) y mitad robot: brazo derecho y pierna izquierda metálicos, con articulaciones visibles y una línea de luz cian. Visor u ojo que brilla. Animaciones: carrera, salto, aterrizaje (se mantiene el estirar y aplastar) y choque (chispas).
- REGLA DE JUEGO: la zona de choque del personaje no cambia de tamaño. El dibujo puede ser un poco más grande, pero la jugabilidad no cambia.
- CIUDAD: 3 capas con movimiento a distinta velocidad: siluetas de rascacielos al fondo; edificios medios con ventanas y letreros de neón (palabras cortas en español o formas abstractas); primer plano con postes y cables. Suelo: calle o pasarela metálica con líneas de luz.
- MÁS NEÓN Y TECNOLOGÍA: anuncios holográficos, pantallas gigantes, letreros verticales, luces de aviso en techos (rojo anaranjado #ff5a36, solo en techos), antenas, puentes aéreos, cables, vehículos voladores en el fondo, vapor de ductos y, de noche, reflejos de neón en la pasarela. Letreros y pantallas quedan por encima de la franja de juego; una neblina baja el contraste detrás del androide. Densidad elegida: Muy denso.
- OBSTÁCULOS: barreras de energía o bloques con franjas de peligro, en magenta/rojo #ff2e63. Ese color es EXCLUSIVO de los obstáculos y no se usa en el fondo.
- CICLO DÍA/NOCHE: día → atardecer → noche → amanecer, en transición gradual (ciclo completo de ~120 s). De día (variante B elegida): cielo azul frío pálido (#9fc4d8 a #d6e4ec), edificios gris azulado (#4a5068) con bruma y neones casi apagados. De noche: fondo azul muy oscuro (#0a0e27), edificios #151a3d, neones encendidos en cian #00f0ff, violeta #b026ff y amarillo #ffd600. Al anochecer, los letreros se encienden con un parpadeo.
- LEGIBILIDAD: el fondo siempre tiene menos contraste que el personaje y los obstáculos, de día y de noche.
- TÉCNICA: todo dibujado con código en canvas, sin imágenes externas. Las capas fijas se dibujan una vez y se reutilizan. Brillo con moderación. Fluidez en S24 Ultra e iPhone 15.
- Cada partida empieza al atardecer. El ciclo día/noche reemplaza el cielo que cambiaba con la dificultad (paso 6b).
- El androide lleva un contorno de luz cian para leerse de noche; de día se lee por su silueta oscura.

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
| 6b | Animaciones: estiramiento, polvo, temblor y destello, fondo con capas, cielo según dificultad, puntaje que salta | Hecho (v10) |
| 7 | Pausa al cambiar de app, rotación y cambio de tamaño | Hecho (v12) |
| 8 | Instalable como app (PWA) en vertical; en horizontal, fondo liso con "Gira tu celular" | Hecho (v13) |

### Fase de arte (cyberpunk)
| # | Paso | Estado |
|---|---|---|
| A1.1 | arte.html, parte "arte 1": androide (carrera, salto, aterrizaje, choque) sobre la pasarela, fondo liso día/noche, zona de choque real, fps | Hecho (aprobado; ajustes de cadencia y humo en arte 2) |
| A1.2 | arte.html, parte "arte 2": ciudad en 3 capas, ciclo día/noche con parpadeo, 2 tipos de obstáculo, 3 variantes de día | Hecho (Día B elegido; ciudad rehecha en arte 3) |
| A1.3 | arte.html, parte "arte 3": ciudad con mucho más neón y tecnología, densidad Denso / Muy denso, pierna sin pie, humo oscuro de día | Hecho (aprobado: Muy denso) |
| A2 | Ciudad (Muy denso), pasarela y ciclo día/noche en el juego, empezando al atardecer; modo ?debug=1 con FPS y zona de choque | Hecho (v14) |
| A3 | Obstáculos #ff2e63 en el juego: barreras de energía y bloques con franjas | Hecho (v15) |
| A4 | Androide en el juego, zona de choque idéntica; corregir desfase al redimensionar en PC | Pendiente |
| A5 | Cierre: fluidez, contraste día/noche, ícono con el androide | Pendiente |
