# Chompipitos: Rebelión Escolar

Plataformero pixel-art (estilo Mario Bros) hecho en HTML5 Canvas + JavaScript puro, sin frameworks ni dependencias externas de build. La música y los efectos de sonido se generan en vivo con Web Audio API (sin archivos .mp3).

## Jugar en local

No requiere build ni `npm install`. Solo necesitas servir los archivos estáticos (no abrir `index.html` con doble clic, porque los módulos JS necesitan `http://`):

```bash
npx serve .
# o
python3 -m http.server 8080
```

Y abre `http://localhost:8080` (o el puerto que indique).

## Desplegar en Vercel

```bash
npm i -g vercel
vercel --prod
```

Como es un sitio 100% estático, Vercel lo detecta automáticamente (sin "build command" ni "output directory" que configurar).

## Desplegar en Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir .
```

O simplemente arrastra la carpeta del proyecto a https://app.netlify.com/drop.

## Controles

- Mover: flechas ← → o A / D
- Saltar: flecha ↑, W o barra espaciadora — un solo toque basta, el salto siempre llega a la misma altura (no hay que mantener presionado ni calcular tiempos).
- Pausa: P o Escape
- En móvil: aparecen botones táctiles automáticamente

## Cómo funciona

- `js/sprites.js` — todo el pixel art (los 8 chompipitos, enemigos zombis, Elena, el chompipe de oro, bloques, accesorios) se dibuja por código en un `<canvas>`, no son imágenes.
- `js/audio.js` — motor de música/SFX 100% sintetizado con Web Audio API: pads cálidos, marimba y percusión suave, estilo relajado/nostálgico (inspirado en Donkey Kong Country). No hay archivos de audio.
- `js/highscore.js` — récord (highscore) por personaje. Si el juego corre como Artifact publicado usa la base de datos compartida del Artifact (récord visible para cualquiera que lo abra); si corre como sitio propio desplegado (Vercel/Netlify/local), usa `localStorage` del navegador como respaldo.
- `js/levels.js` — los 4 niveles del modo historia (plataformas, enemigos, coleccionables, meta/jefe, textos de intro/cierre) como datos.
- `js/engine.js` — física, colisiones, cámara, IA de enemigos y de la jefa final, sistema de coleccionables por nivel, frases de humor negro y bono de puntos por velocidad.
- `js/main.js` — conecta las pantallas HTML (título, controles, selección de personaje + accesorios, HUD, mensajes de historia) con el motor.

## Modo Historia

El juego es un modo historia de 4 niveles, todos conectados por la trama de la Rebelión Chompipito contra la maestra Elena. Antes de cada nivel aparece una pantalla de texto con el objetivo, y al completarlo otra que cierra ese capítulo:

1. **Nivel 1 · El Patio** — encontrar al **chompipito de oro**, símbolo que te vuelve miembro oficial del grupo revolucionario Chompipito.
2. **Nivel 2 · Los Pasillos** — recolectar las **3 gemas de la empatía** y llevárselas a "Doña Loli" para enseñarle empatía y que deje de traumar a más niños (encuentro de solo diálogo, sin combate).
3. **Nivel 3 · La Petición** — encontrar **3 lapiceros** para firmar la petición que pide que Ángel regrese a la sección.
4. **Nivel 4 · Los Relojes Mágicos** — encontrar los **2 relojes mágicos** para evitar que Diego y Cito se vayan a La Roble, y enfrentar a la maestra Elena al final (jefe final).

El progreso de los coleccionables de cada nivel se guarda mientras juegas esa partida (si mueres y reintentas el nivel no se resetean los que ya encontraste), y la pantalla de intro de cada nivel solo se muestra la primera vez que entras a él.

## Bloques "?", escenarios y toboganes

Los coleccionables de la historia (chompipito, gemas, lapiceros, relojes) no aparecen flotando sueltos: cada uno vive escondido dentro de un bloque **"?"** al estilo Mario. Hay que pararse justo debajo, en la plataforma que queda un par de filas más abajo, y saltar derecho hacia arriba para golpearlo desde abajo y que el objeto salga (el bloque queda "gastado" después, y suena un efecto de golpe). Esto está definido en `js/levels.js` (cada `item` trae su `row`; el bloque se arma automáticamente una fila arriba de esa posición) y resuelto en `engine.js` (`_bumpBlock`, disparado desde `_collideAxis` cuando el jugador choca con un bloque "secret" mientras salta).

Cada uno de los 4 niveles tiene su propio ambiente visual (cielo, nubes, sol/estrellas) para que no se sientan repetidos, definido en `LEVEL_THEMES` en `js/engine.js`: Nivel 1 es un día despejado y soleado, Nivel 2 está nublado, Nivel 3 tiene un atardecer anaranjado, y Nivel 4 es de noche con estrellas (además del efecto dramático ya existente cuando se acerca la jefa final).

También hay tramos de **tobogán** (Niveles 1 y 4): franjas planas y seguras pintadas como resbaladero de patio de recreo, con rayitas diagonales de "velocidad". Mientras el jugador está parado ahí gana impulso extra hacia la derecha (puede saltar para salirse cuando quiera); son atajos/adornos opcionales sobre el piso normal, nunca bloquean el camino principal ni pueden dejarte atorado.

## Chompipe de oro y puntaje

El chompipito de oro (nivel 1) se dibuja como un pavo reconocible (cola en abanico, moco rojo, pico) con un brillo dorado alrededor. Cada coleccionable de la historia (chompipito, gema, lapicero, reloj) da puntos base más un bono extra mientras más rápido lo encuentres en ese nivel (el bono baja a medida que pasa el tiempo, hasta llegar a 0).

## Récords (highscores)

Cada personaje guarda su propio récord. En la pantalla de selección de personaje se muestra el récord actual junto a cada chompipito. Al terminar una partida (ganada o perdida) se compara tu puntaje contra el récord guardado y se actualiza si lo superaste.

## Personalizar tu chompipito

En la pantalla de selección puedes ponerle un accesorio a tu personaje antes de jugar: lentes de sol, gorro de fiesta, parche de pirata, bigote o "cabeza vendada". Es solo estético (humor negro ligero, sin afectar el juego).

**Nota sobre una parte del pedido:** se pidió que los enemigos fueran genitales masculinos enfermos tipo zombie, y que los personajes se pudieran personalizar con cigarros o alcohol. No hice esa parte tal cual —no genero contenido sexual/anatómico ni represento consumo de cigarro o alcohol en los personajes. En su lugar, los enemigos quedaron como monstruos/zombis enfermos (verde ácido, con "goteo"), y la personalización quedó como accesorios cómicos (lentes, gorro de fiesta, parche, bigote, venda). El resto del pedido (humor negro en los textos, frases de "Teacher Miriam" al perder, chistes al derrotar enemigos) sí se implementó tal cual se pidió.

## Personalizar el código

- Agregar/editar personajes: `CHARACTERS` en `js/sprites.js` (color de piel, pelo, estilo de peinado y color de camisa).
- Agregar/editar accesorios: `ACCESSORIES` y `applyAccessory()` en `js/sprites.js`.
- Editar niveles o dificultad: `LEVELS` en `js/levels.js` (todo en coordenadas de "tile", 1 tile = 40px).
- Ajustar la física del salto: `GRAVITY`, `MOVE_SPEED`, `JUMP_VELOCITY` en `js/engine.js`.
- Reemplazar la música sintetizada por archivos propios: en `js/audio.js`, en vez de `MUSIC.playTrack(...)`, puedes usar un `<audio>` normal y llamar a `.play()`/`.pause()` en los mismos puntos donde se llama `MUSIC.playTrack` dentro de `js/engine.js`.
# chompipitos
