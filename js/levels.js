/* ============================================================
   CHOMPIPITOS - Modo Historia: datos de los 4 niveles.
   Todo en coordenadas de "tile" (1 tile = TILE px). El motor
   (engine.js) convierte esto en la grilla de colisión.

   Cada nivel puede traer "items" (coleccionables obligatorios
   para la historia) y un bloque "story" con el texto que se
   muestra al empezar el nivel (intro) y al completarlo (outro).

   Los objetos NO flotan sueltos: cada uno vive escondido dentro
   de un bloque "?" (estilo Mario) que está justo una fila abajo
   de "item.row" -- el motor arma ese bloque solo, no hace falta
   declararlo aparte. Hay que golpearlo desde ABAJO (saltando
   parado justo debajo) para que el objeto salga y se pueda
   recoger. Por eso cada item queda diseñado con una plataforma o
   piso justo debajo del bloque, con un salto corto y vertical
   (2 filas) para golpearlo -- nada de saltos largos a ciegas.

   "slides" son tramos de tobogán: el jugador gana velocidad extra
   mientras está parado ahí (puede saltar para salirse cuando
   quiera), son atajos/adornos opcionales que no bloquean el
   camino principal.
   ============================================================ */

const TILE = 40;

const LEVELS = [
  {
    name: 'Nivel 1 · El Patio',
    music: 'level1',
    width: 64, height: 13,
    ground: [[0, 17], [21, 39], [42, 63]],
    platforms: [
      { x1: 8, x2: 10, row: 9 },
      { x1: 24, x2: 26, row: 8 },
      { x1: 33, x2: 35, row: 10 },
      { x1: 48, x2: 51, row: 9 },
      { x1: 55, x2: 57, row: 9 }
    ],
    slides: [
      { x1: 42, x2: 47, row: 12 }
    ],
    items: [
      { type: 'chompipito', x: 49, row: 5, points: 300 }
    ],
    spikes: [{ x: 30, row: 11 }, { x: 12, row: 11 }],
    enemies: [
      { type: 'libro', x: 6, row: 10, xMin: 3, xMax: 15, flying: true },
      { type: 'gis', x: 25, row: 11, xMin: 23, xMax: 37, flying: false },
      { type: 'libro', x: 55, row: 9, xMin: 53, xMax: 61, flying: true }
    ],
    playerStart: { x: 1, row: 11 },
    goal: { x: 62, row: 11 },
    boss: null,
    story: {
      intro: {
        title: 'MODO HISTORIA · Prólogo',
        body: 'En el colegio, un grupo de amigos está cansado de las reglas injustas de la maestra Elena. Así nace la Rebelión Chompipito.<br><br>' +
          'Para organizarse, primero necesitan encontrar al mítico <b>chompipito de oro</b>: el símbolo que marca a alguien como miembro oficial del grupo. Está escondido dentro de un bloque "?" -- hay que saltar justo debajo para romperlo.<br><br>' +
          '<b>Objetivo:</b> encuentra al chompipito y llega hasta el final del patio.'
      },
      outro: {
        title: '¡Bienvenido a los Chompipitos!',
        body: 'Encontraste al chompipito de oro. Desde hoy eres parte oficial del grupo revolucionario Chompipito. 🦃<br><br>' +
          'La misión apenas empieza: todavía hay varias injusticias que arreglar en este colegio.'
      }
    }
  },
  {
    name: 'Nivel 2 · Los Pasillos',
    music: 'level2',
    width: 80, height: 13,
    ground: [[0, 14], [17, 30], [34, 50], [53, 79]],
    platforms: [
      { x1: 5, x2: 7, row: 9 },
      { x1: 19, x2: 21, row: 9 },
      { x1: 25, x2: 27, row: 10 },
      { x1: 36, x2: 38, row: 9 },
      { x1: 42, x2: 44, row: 7 },
      { x1: 58, x2: 60, row: 8 },
      { x1: 65, x2: 67, row: 10 },
      { x1: 70, x2: 73, row: 7 }
    ],
    items: [
      { type: 'gema', x: 20, row: 5, points: 150 },
      { type: 'gema', x: 43, row: 3, points: 150 },
      { type: 'gema', x: 71, row: 3, points: 200 }
    ],
    spikes: [{ x: 22, row: 11 }, { x: 45, row: 11 }, { x: 61, row: 11 }],
    enemies: [
      { type: 'libro', x: 4, row: 10, xMin: 2, xMax: 13, flying: true },
      { type: 'gis', x: 24, row: 11, xMin: 23, xMax: 29, flying: false },
      { type: 'gis', x: 46, row: 11, xMin: 45, xMax: 49, flying: false },
      { type: 'libro', x: 58, row: 9, xMin: 54, xMax: 64, flying: true },
      { type: 'gis', x: 66, row: 11, xMin: 66, xMax: 69, flying: false }
    ],
    playerStart: { x: 1, row: 11 },
    goal: { x: 78, row: 11 },
    boss: null,
    decorNpc: { type: 'donaLoli', x: 76, row: 11 },
    story: {
      intro: {
        title: 'Nivel 2 · Los Pasillos',
        body: 'Doña Loli ha hecho llorar a media escuela con sus regaños. El grupo cree que solo le falta un poco de empatía.<br><br>' +
          '<b>Objetivo:</b> encuentra las <b>3 gemas de la empatía</b> escondidas en bloques "?" por los pasillos y llévaselas a Doña Loli, al final del camino.'
      },
      outro: {
        title: 'Doña Loli aprendió la lección',
        body: 'Le muestran las 3 gemas de la empatía a Doña Loli. Ella se queda pensando un largo rato...<br><br>' +
          '"Creo que... he sido muy dura. Lo siento." — Doña Loli<br><br>' +
          'Desde ese día deja de traumar a más niños. Un pasillo menos que temer. 💎'
      },
      hint: 'Todavía faltan gemas de la empatía para Doña Loli.'
    }
  },
  {
    name: 'Nivel 3 · La Petición',
    music: 'level3',
    width: 58, height: 13,
    ground: [[0, 16], [19, 34], [37, 57]],
    platforms: [
      { x1: 6, x2: 8, row: 9 },
      { x1: 12, x2: 14, row: 10 },
      { x1: 21, x2: 23, row: 9 },
      { x1: 27, x2: 29, row: 7 },
      { x1: 39, x2: 41, row: 9 },
      { x1: 45, x2: 47, row: 10 }
    ],
    items: [
      { type: 'lapicero', x: 7, row: 5, points: 150 },
      { type: 'lapicero', x: 27, row: 3, points: 200 },
      { type: 'lapicero', x: 46, row: 6, points: 150 }
    ],
    spikes: [{ x: 15, row: 11 }, { x: 33, row: 11 }],
    enemies: [
      { type: 'gis', x: 4, row: 11, xMin: 2, xMax: 15, flying: false },
      { type: 'libro', x: 22, row: 8, xMin: 19, xMax: 33, flying: true },
      { type: 'gis', x: 40, row: 11, xMin: 37, xMax: 51, flying: false },
      { type: 'libro', x: 48, row: 9, xMin: 44, xMax: 56, flying: true }
    ],
    playerStart: { x: 1, row: 11 },
    goal: { x: 55, row: 11 },
    boss: null,
    story: {
      intro: {
        title: 'Nivel 3 · La Petición',
        body: 'A Ángel lo sacaron injustamente de la sección. El grupo quiere pedir que lo regresen, y para eso necesitan una petición formal.<br><br>' +
          '<b>Objetivo:</b> encuentra los <b>3 lapiceros</b> escondidos en bloques "?" para firmar la petición y llévalos hasta la dirección.'
      },
      outro: {
        title: '¡Petición completa!',
        body: 'Con los 3 lapiceros, todo el grupo firma la petición para que Ángel regrese a la sección.<br><br>' +
          'La entregan en la dirección. Ahora solo queda esperar la respuesta... 🖊️'
      },
      hint: 'Todavía faltan lapiceros para completar la petición.'
    }
  },
  {
    name: 'Nivel 4 · Los Relojes Mágicos',
    music: 'boss',
    width: 70, height: 13,
    ground: [[0, 20], [23, 40], [44, 69]],
    platforms: [
      { x1: 5, x2: 9, row: 10 },
      { x1: 12, x2: 16, row: 8 },
      { x1: 25, x2: 29, row: 9 },
      { x1: 31, x2: 35, row: 7 },
      { x1: 37, x2: 39, row: 9 }
    ],
    slides: [
      { x1: 24, x2: 28, row: 12 }
    ],
    items: [
      { type: 'reloj', x: 15, row: 4, points: 250 },
      { type: 'reloj', x: 33, row: 3, points: 250 }
    ],
    spikes: [{ x: 10, row: 11 }, { x: 30, row: 11 }, { x: 36, row: 11 }],
    enemies: [
      { type: 'gis', x: 2, row: 11, xMin: 2, xMax: 4, flying: false },
      { type: 'libro', x: 30, row: 9, xMin: 30, xMax: 39, flying: true },
      { type: 'gis', x: 48, row: 11, xMin: 45, xMax: 56, flying: false }
    ],
    playerStart: { x: 1, row: 11 },
    goal: null,
    boss: { x: 64, row: 11, xMin: 59, xMax: 68, hp: 3 },
    story: {
      intro: {
        title: 'Nivel 4 · Los Relojes Mágicos',
        body: 'Última hora: van a mandar a Diego y a Cito a estudiar a La Roble. El grupo no lo va a permitir.<br><br>' +
          'Cuenta la leyenda del colegio que dos <b>relojes mágicos</b> escondidos en bloques "?" pueden detener el tiempo justo a tiempo.<br><br>' +
          'Al final del camino los espera la maestra Elena. <b>Objetivo:</b> encuentra los 2 relojes y enfréntala.'
      }
    }
  }
];
