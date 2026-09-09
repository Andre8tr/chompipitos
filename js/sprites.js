/* ============================================================
   CHOMPIPITOS - Pixel art generado por código (sin imágenes).
   Cada sprite es una grilla de caracteres + una paleta de colores.
   ============================================================ */

// Dibuja una grilla de texto (array de strings, mismo largo) en un canvas
// nuevo, escalado por pixelSize. '.' = transparente.
function rasterize(grid, palette, pixelSize) {
  const h = grid.length;
  const w = grid[0].length;
  const c = document.createElement('canvas');
  c.width = w * pixelSize;
  c.height = h * pixelSize;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let r = 0; r < h; r++) {
    const row = grid[r];
    for (let col = 0; col < w; col++) {
      const ch = row[col];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(col * pixelSize, r * pixelSize, pixelSize, pixelSize);
    }
  }
  return c;
}

/* ---------- PERSONAJES (14 x 18) ---------- */
// Filas 0-3: pelo (varía por estilo)
// Filas 4-7: cara (compartida)
// Fila 8: cuello (compartida)
// Filas 9-12: torso/brazos (compartida)
// Fila 13: cintura (compartida)
// Filas 14-17: piernas (varía por frame: idle, walk1, walk2, jump)

const HAIR_STYLES = {
  spiky: [
    "..H.H..H.H..H.",
    ".HHHHHHHHHHHH.",
    ".HHHHHHHHHHHH.",
    ".HH........HH."
  ],
  messy: [
    ".H..H.HH.H..H.",
    ".HHHHHHHHHHHH.",
    ".HHHHHHHHHHHH.",
    ".HH........HH."
  ],
  curly: [
    ".H.HH.HH.HH.H.",
    ".HHHHHHHHHHHH.",
    ".HHHHHHHHHHHH.",
    ".HH........HH."
  ],
  straight: [
    "..HHHHHHHHHH..",
    ".HHHHHHHHHHHH.",
    ".HHHHHHHHHHHH.",
    ".HH........HH."
  ],
  mohawk: [
    "......HH......",
    "......HH......",
    "......HH......",
    "......HH......"
  ],
  buzz: [
    "..............",
    ".HHHHHHHHHHHH.",
    ".HHHHHHHHHHHH.",
    ".H..........H."
  ],
  sideswept: [
    ".HHHHHHHHH....",
    ".HHHHHHHHHHH..",
    ".HHHHHHHHHHH..",
    ".HH........HH."
  ],
  sideswept_banda: [
    ".HHHHHHHHH....",
    ".HHHHHHHHHHH..",
    ".DDDDDDDDDDD..",
    ".HH........HH."
  ]
};

const FACE_ROWS = [
  "..FFFFFFFFFF..",
  "..FFEFFFFEFF..",
  "..FFFFFFFFFF..",
  "...FFFFFFFF..."
];

const NECK_ROW = "...FFFFFFFF...";

const TORSO_ROWS = [
  ".BBBBBBBBBBBB.",
  "FBBBBBBBBBBBBF",
  "FBBBBBBBBBBBBF",
  ".BBBBBBBBBBBB."
];

const WAIST_ROW = ".LLLLLLLLLLLL.";

const LEG_FRAMES = {
  idle: [
    ".LLLL....LLLL.",
    ".LLLL....LLLL.",
    ".WWWW....WWWW.",
    ".WWWW....WWWW."
  ],
  walk1: [
    ".LLLL....LLLL.",
    ".LLLL....LLLL.",
    ".WWWW....WWWW.",
    ".WWWW.........."
  ],
  walk2: [
    ".LLLL....LLLL.",
    ".LLLL....LLLL.",
    ".WWWW....WWWW.",
    "..........WWWW"
  ],
  jump: [
    ".LLLL....LLLL.",
    ".LLLLLLLLLLLL.",
    ".WWWWWWWWWWWW.",
    ".............."
  ]
};
// normaliza largo de filas de piernas a 14 caracteres
for (const k in LEG_FRAMES) {
  LEG_FRAMES[k] = LEG_FRAMES[k].map(row => (row + "..............").slice(0, 14));
}

function buildCharGrid(hairStyle, legFrame) {
  return [
    ...HAIR_STYLES[hairStyle],
    ...FACE_ROWS,
    NECK_ROW,
    ...TORSO_ROWS,
    WAIST_ROW,
    ...LEG_FRAMES[legFrame]
  ];
}

const PANTS_COLOR = '#2b2138';
const SHOE_COLOR = '#151018';
const EYE_COLOR = '#161018';
const BANDANA_COLOR = '#c0392b';

const CHARACTERS = [
  { id: 'pedro',    name: 'Pedro',    skin: '#e8b382', hair: '#1b1b1b', hairStyle: 'spiky',            shirt: '#c0392b' },
  { id: 'andres',   name: 'Andrés',   skin: '#f4c9a4', hair: '#6b4423', hairStyle: 'messy',             shirt: '#2c6e91' },
  { id: 'cito',     name: 'Cito',     skin: '#8d5a2b', hair: '#0d0d0d', hairStyle: 'curly',             shirt: '#8e44ad' },
  { id: 'fernando', name: 'Fernando', skin: '#f6d2ac', hair: '#c99a2e', hairStyle: 'straight',          shirt: '#16a085' },
  { id: 'angel',    name: 'Ángel',    skin: '#c98a55', hair: '#a83232', hairStyle: 'mohawk',            shirt: '#2d2d2d' },
  { id: 'diego',    name: 'Diego',    skin: '#c9905c', hair: '#eef0ec', hairStyle: 'buzz',              shirt: '#d97b26' },
  { id: 'luis',     name: 'Luis',     skin: '#eebd94', hair: '#3b2414', hairStyle: 'sideswept',         shirt: '#34495e' },
  { id: 'andre',    name: 'Andre',    skin: '#d9a066', hair: '#141414', hairStyle: 'sideswept_banda',   shirt: '#1c1c1c' }
];

function charPalette(cfg) {
  return {
    H: cfg.hair, D: BANDANA_COLOR, F: cfg.skin, E: EYE_COLOR,
    B: cfg.shirt, L: PANTS_COLOR, W: SHOE_COLOR
  };
}

// genera { idle, walk1, walk2, jump } -> canvas, para un personaje, en un tamaño de pixel dado
function buildCharacterSheet(cfg, pixelSize) {
  const pal = charPalette(cfg);
  const sheet = {};
  for (const frame of ['idle', 'walk1', 'walk2', 'jump']) {
    const canvas = rasterize(buildCharGrid(cfg.hairStyle, frame), pal, pixelSize);
    applyAccessory(canvas, pixelSize, cfg.accessory);
    sheet[frame] = canvas;
  }
  return sheet;
}

// Atuendos opcionales de humor negro/desmadre (nada de sustancias, solo
// disfraces chistosos): se dibujan encima del personaje ya generado.
const ACCESSORIES = [
  { id: 'none', label: 'Ninguno' },
  { id: 'lentes', label: 'Lentes' },
  { id: 'fiesta', label: 'Fiesta' },
  { id: 'parche', label: 'Pirata' },
  { id: 'bigote', label: 'Bigote' },
  { id: 'venda', label: 'Vendado' }
];

function applyAccessory(canvas, s, accessory) {
  if (!accessory || accessory === 'none') return canvas;
  const ctx = canvas.getContext('2d');
  switch (accessory) {
    case 'lentes':
      ctx.fillStyle = '#141414';
      ctx.fillRect(2.5 * s, 4.6 * s, 3.2 * s, 1.6 * s);
      ctx.fillRect(8.3 * s, 4.6 * s, 3.2 * s, 1.6 * s);
      ctx.fillRect(5.7 * s, 4.9 * s, 2.6 * s, 0.7 * s);
      break;
    case 'fiesta':
      ctx.fillStyle = '#d13b4a';
      ctx.beginPath();
      ctx.moveTo(7 * s, 0);
      ctx.lineTo(4.3 * s, 3.4 * s);
      ctx.lineTo(9.7 * s, 3.4 * s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e8c34a';
      ctx.lineWidth = 0.35 * s;
      ctx.beginPath();
      ctx.moveTo(5.2 * s, 2.6 * s); ctx.lineTo(8.8 * s, 1.8 * s);
      ctx.moveTo(5.5 * s, 1.4 * s); ctx.lineTo(8.5 * s, 2.8 * s);
      ctx.stroke();
      ctx.fillStyle = '#e8c34a';
      ctx.beginPath();
      ctx.arc(7 * s, 0.2 * s, 0.9 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'parche':
      ctx.fillStyle = '#141414';
      ctx.beginPath();
      ctx.ellipse(9.7 * s, 5.3 * s, 1.9 * s, 1.7 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 0.5 * s;
      ctx.beginPath();
      ctx.moveTo(9.7 * s, 4 * s);
      ctx.lineTo(1.5 * s, 2.5 * s);
      ctx.stroke();
      break;
    case 'bigote':
      ctx.fillStyle = '#2b2138';
      ctx.beginPath();
      ctx.moveTo(4.3 * s, 7.4 * s);
      ctx.quadraticCurveTo(7 * s, 6.5 * s, 9.7 * s, 7.4 * s);
      ctx.quadraticCurveTo(7 * s, 8.3 * s, 4.3 * s, 7.4 * s);
      ctx.fill();
      break;
    case 'venda':
      // vendaje de "última noche difícil" alrededor de la cabeza
      ctx.fillStyle = '#e8e2d0';
      ctx.fillRect(2 * s, 3.6 * s, 10 * s, 1.5 * s);
      ctx.fillStyle = '#c9302c';
      ctx.fillRect(6.3 * s, 3.6 * s, 1.2 * s, 1.5 * s);
      break;
  }
  return canvas;
}

/* ---------- ENEMIGOS ---------- */

// Libro zombi: un cuaderno podrido, mohoso y con ojos inyectados en
// sangre (enemigo "enfermo" con humor negro, sin contenido explícito).
const BOOK_GRID_A = [
  "..CCCCCCCC",
  ".CCCVCCCCC",
  "CCRRRRRRCC",
  "CCRExxxERC",
  "CCRxxVxxRC",
  "CCRRRRRRCC",
  ".CCCCCVCC.",
  "..C.DD.C..",
  "...C.D....",
  "....D.....",
];
const BOOK_GRID_B = [
  "..........",
  "..CCCCCCCC",
  ".CCCVCCCCC",
  "CCRRRRRRCC",
  "CCRExxxERC",
  "CCRxxVxxRC",
  "CCRRRRRRCC",
  ".CCCCCVCC.",
  "..C.DD.C..",
  "...D.D....",
].map(r => r.slice(0, 10));

const BOOK_PALETTE = { C: '#4a5c2a', V: '#6e8a3a', R: '#3a4a1e', E: '#0d0d0d', x: '#c9c98a', D: '#7fae3a' };

// Gis/borrador zombi: cubierto de moho, chorreando baba verde (humor
// negro tipo "enfermo", sin anatomía explícita).
const CHALK_GRID_A = [
  "..MMMMMM..",
  ".MMMMVMMM.",
  "MMMExxxEMM",
  "MMMxxVxxMM",
  "MMMMMMMMMM",
  ".MMVMMMMM.",
  "..M.DD.M..",
  ".M..D...M.",
  "....D.....",
  "..........",
];
const CHALK_GRID_B = [
  "..MMMMMM..",
  ".MMMMVMMM.",
  "MMMExxxEMM",
  "MMMxxVxxMM",
  "MMMMMMMMMM",
  ".MMMMMMMV.",
  ".M..D...M.",
  "..M.DD.M..",
  "....D.....",
  "..........",
].map(r => r.slice(0, 10));
const CHALK_PALETTE = { M: '#a8b89a', V: '#7fae3a', E: '#0d0d0d', x: '#5a6a4a', D: '#6e8a3a' };

function buildEnemySheets(pixelSize) {
  return {
    libro: {
      a: rasterize(BOOK_GRID_A, BOOK_PALETTE, pixelSize),
      b: rasterize(BOOK_GRID_B, BOOK_PALETTE, pixelSize)
    },
    gis: {
      a: rasterize(CHALK_GRID_A, CHALK_PALETTE, pixelSize),
      b: rasterize(CHALK_GRID_B, CHALK_PALETTE, pixelSize)
    }
  };
}

/* ---------- ELENA, LA MAESTRA MALVADA (16x22) ---------- */

const ELENA_GRID_IDLE = [
  "....HHHHHHHH....",
  "...HHHHHHHHHH...",
  "...HHHHHHHHHH...",
  "..FFFFFFFFFFFF..",
  "..FGGFFFFGGFF...",
  "..FFFFFFFFFFFF..",
  "...FFFFFFFFFF...",
  "..RRRRRRRRRRRR..",
  ".RRRRRRRRRRRRRR.",
  ".RRRRRRRRRRRRRR.",
  "FRRRRRRRRRRRRRF.",
  "FRRRRRRRRRRRRRF.",
  ".RRRRRRRRRRRRRR.",
  ".RRRRRRRRRRRRRR.",
  "..RRRRRRRRRRRR..",
  "..RRRRRRRRRRRR..",
  "..DDDDDDDDDDDD..",
  "..DDDDDDDDDDDD..",
  "..DD........DD..",
  "..DD........DD..",
  ".WWWW....WWWW..",
  ".WWWW....WWWW..",
];
const ELENA_GRID_ATTACK = ELENA_GRID_IDLE.map((row, i) =>
  (i === 10 || i === 11) ? row.slice(0, 14) + ".." : row
);
const ELENA_PALETTE = {
  H: '#2a2130', F: '#e9c9a5', G: '#161018', R: '#7a1f2b', D: '#2b2138', W: '#151018'
};

function buildElenaSheet(pixelSize) {
  return {
    idle: rasterize(ELENA_GRID_IDLE, ELENA_PALETTE, pixelSize),
    attack: rasterize(ELENA_GRID_ATTACK, ELENA_PALETTE, pixelSize)
  };
}

/* ---------- DOÑA LOLI (NPC decorativo del nivel 2, 16x22) ---------- */
// Reutiliza la silueta de Elena pero con una paleta cálida y amigable
// (cardigan café, moño gris) para que se lea claramente como un personaje
// distinto y menos amenazante — solo aparece parada, sin ataque.
const DONALOLI_PALETTE = {
  H: '#8a8690', F: '#e9c9a5', G: '#161018', R: '#8a5a34', D: '#5c4326', W: '#3a2a1a'
};
function buildDonaLoliSheet(pixelSize) {
  return { idle: rasterize(ELENA_GRID_IDLE, DONALOLI_PALETTE, pixelSize) };
}

// Proyectil de Elena: tiza voladora (6x6)
const CHALKBOLT_GRID = [
  "..MM..",
  ".MMMM.",
  "MMMMMM",
  "MMMMMM",
  ".MMMM.",
  "..MM.."
];
function buildChalkBolt(pixelSize) {
  return rasterize(CHALKBOLT_GRID, { M: '#e8e2d0' }, pixelSize);
}

/* ---------- CHOMPIPE DE ORO (ficha secreta, 12x12) ---------- */

// Dibujado con formas (no grilla de píxeles) para que se lea claramente
// como un chompipe: cola en abanico dorado/rojo, cuerpo redondo, moco
// rojo y pico, bien visible sobre el bloque secreto.
function buildTurkeySprite(scale) {
  const UNIT = 32;
  const c = document.createElement('canvas');
  c.width = c.height = UNIT * scale;
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);

  const cx = UNIT / 2;
  const bodyY = UNIT * 0.6;

  // cola en abanico
  const feathers = [
    { a: -155, len: 12, col: '#a8241f' },
    { a: -132, len: 13.5, col: '#e8c34a' },
    { a: -109, len: 14.5, col: '#c9861f' },
    { a: -90, len: 15.5, col: '#e8c34a' },
    { a: -71, len: 14.5, col: '#c9861f' },
    { a: -48, len: 13.5, col: '#e8c34a' },
    { a: -25, len: 12, col: '#a8241f' }
  ];
  feathers.forEach(f => {
    ctx.save();
    ctx.translate(cx, bodyY);
    ctx.rotate(f.a * Math.PI / 180);
    ctx.fillStyle = f.col;
    ctx.beginPath();
    ctx.ellipse(0, -f.len * 0.55, 3.1, f.len * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // cuerpo
  ctx.fillStyle = '#8a5a2f';
  ctx.beginPath();
  ctx.ellipse(cx, bodyY, 8.2, 7.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9861f';
  ctx.beginPath();
  ctx.ellipse(cx, bodyY + 1.5, 5.6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // cabeza
  const headX = cx + 0.5, headY = bodyY - 10;
  ctx.fillStyle = '#7a5030';
  ctx.beginPath();
  ctx.arc(headX, headY, 4.2, 0, Math.PI * 2);
  ctx.fill();

  // moco (carúncula) rojo, bien visible
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(headX - 0.5, headY + 2.5);
  ctx.quadraticCurveTo(headX - 3.2, headY + 6.5, headX - 0.8, headY + 8);
  ctx.quadraticCurveTo(headX + 1, headY + 5, headX - 0.5, headY + 2.5);
  ctx.fill();

  // pico
  ctx.fillStyle = '#e8a020';
  ctx.beginPath();
  ctx.moveTo(headX + 3.4, headY - 1);
  ctx.lineTo(headX + 8, headY + 0.3);
  ctx.lineTo(headX + 3.4, headY + 1.8);
  ctx.closePath();
  ctx.fill();

  // ojo
  ctx.fillStyle = '#161018';
  ctx.beginPath();
  ctx.arc(headX + 1.2, headY - 2.2, 1, 0, Math.PI * 2);
  ctx.fill();

  // patitas
  ctx.strokeStyle = '#e8a020';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 3, bodyY + 7); ctx.lineTo(cx - 3, bodyY + 11.5);
  ctx.moveTo(cx + 3, bodyY + 7); ctx.lineTo(cx + 3, bodyY + 11.5);
  ctx.stroke();

  return c;
}

/* ---------- GEMA DE LA EMPATÍA (nivel 2, coleccionable) ---------- */
// Gema facetada rosa/violeta con un pequeño destello, bien distinta del
// chompipe de oro para que se identifique de inmediato como otro objeto.
function buildGemSprite(scale) {
  const UNIT = 32;
  const c = document.createElement('canvas');
  c.width = c.height = UNIT * scale;
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  const cx = UNIT / 2, cy = UNIT * 0.58;

  ctx.fillStyle = '#c04fd6';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 11);
  ctx.lineTo(cx + 8, cy - 3);
  ctx.lineTo(cx + 5, cy + 10);
  ctx.lineTo(cx - 5, cy + 10);
  ctx.lineTo(cx - 8, cy - 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#e79bf2';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 11);
  ctx.lineTo(cx + 8, cy - 3);
  ctx.lineTo(cx, cy - 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#8a1fa8';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 3);
  ctx.lineTo(cx - 5, cy + 10);
  ctx.lineTo(cx, cy - 1);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 11); ctx.lineTo(cx, cy - 1);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 6, 1.4, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

/* ---------- LAPICERO (nivel 3, coleccionable) ---------- */
function buildPenSprite(scale) {
  const UNIT = 32;
  const c = document.createElement('canvas');
  c.width = c.height = UNIT * scale;
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  ctx.save();
  ctx.translate(UNIT / 2, UNIT * 0.58);
  ctx.rotate(-35 * Math.PI / 180);

  ctx.fillStyle = '#2c6e91';
  ctx.fillRect(-3, -11, 6, 18);
  ctx.fillStyle = '#e8c34a';
  ctx.fillRect(-3, -11, 6, 4);
  ctx.fillStyle = '#c9861f';
  ctx.beginPath();
  ctx.moveTo(-3, 7); ctx.lineTo(3, 7); ctx.lineTo(0, 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#161018';
  ctx.beginPath();
  ctx.moveTo(-1, 10); ctx.lineTo(1, 10); ctx.lineTo(0, 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4ead8';
  ctx.fillRect(-1.2, -13, 2.4, 3);

  ctx.restore();
  return c;
}

/* ---------- RELOJ MÁGICO (nivel 4, coleccionable) ---------- */
function buildClockSprite(scale) {
  const UNIT = 32;
  const c = document.createElement('canvas');
  c.width = c.height = UNIT * scale;
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  const cx = UNIT / 2, cy = UNIT * 0.58;

  ctx.fillStyle = '#e8c34a';
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2138';
  ctx.beginPath();
  ctx.arc(cx, cy, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a4fd6';
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#f4ead8';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 4.5);
  ctx.moveTo(cx, cy); ctx.lineTo(cx + 3.2, cy + 1);
  ctx.stroke();

  ctx.fillStyle = '#e8c34a';
  for (let a = 0; a < 12; a++) {
    const rad = a * Math.PI / 6;
    ctx.beginPath();
    ctx.arc(cx + Math.sin(rad) * 6.6, cy - Math.cos(rad) * 6.6, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // orejas de campana (llaves de cuerda)
  ctx.fillStyle = '#c9861f';
  ctx.fillRect(cx - 13, cy - 2, 2.5, 4);
  ctx.fillRect(cx + 10.5, cy - 2, 2.5, 4);

  // destello mágico
  ctx.strokeStyle = 'rgba(232,195,74,0.9)';
  ctx.lineWidth = 1;
  [[-1, -1], [1, 1], [1, -1]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * 13, cy + dy * 13);
    ctx.lineTo(cx + dx * 16, cy + dy * 16);
    ctx.stroke();
  });

  return c;
}

/* ---------- TILES (bloques) ---------- */

function buildTileSprites(pixelSize) {
  const size = 16;
  const out = {};

  // suelo: pasto arriba + tierra abajo (estilo amigable, no mazmorra)
  const brick = document.createElement('canvas');
  brick.width = brick.height = size * pixelSize;
  let bctx = brick.getContext('2d');
  bctx.fillStyle = '#8a5a34';
  bctx.fillRect(0, 0, brick.width, brick.height);
  bctx.strokeStyle = '#6e4526';
  bctx.lineWidth = pixelSize * 0.5;
  bctx.beginPath();
  bctx.moveTo(brick.width / 2, pixelSize * 3); bctx.lineTo(brick.width / 2, brick.height);
  bctx.moveTo(brick.width / 4, brick.height * 0.6); bctx.lineTo(brick.width / 4, brick.height);
  bctx.moveTo(3 * brick.width / 4, brick.height * 0.6); bctx.lineTo(3 * brick.width / 4, brick.height);
  bctx.stroke();
  bctx.fillStyle = '#6fb84f';
  bctx.fillRect(0, 0, brick.width, pixelSize * 3);
  bctx.fillStyle = '#8fd66a';
  bctx.fillRect(0, 0, brick.width, pixelSize * 1.2);
  out.ground = brick;

  // plataforma (madera cálida con franja de color alegre)
  const plat = document.createElement('canvas');
  plat.width = plat.height = size * pixelSize;
  let pctx = plat.getContext('2d');
  pctx.fillStyle = '#c98a4b';
  pctx.fillRect(0, 0, plat.width, plat.height);
  pctx.fillStyle = '#e8a95f';
  pctx.fillRect(pixelSize, pixelSize, plat.width - pixelSize * 2, plat.height * 0.35);
  pctx.fillStyle = '#a8672f';
  pctx.fillRect(pixelSize, plat.height - pixelSize * 2, plat.width - pixelSize * 2, pixelSize);
  out.platform = plat;

  // bloque especial (dorado, para pista de ficha secreta)
  const secret = document.createElement('canvas');
  secret.width = secret.height = size * pixelSize;
  let sctx = secret.getContext('2d');
  sctx.fillStyle = '#b5891f';
  sctx.fillRect(0, 0, secret.width, secret.height);
  sctx.fillStyle = '#e8c34a';
  sctx.fillRect(pixelSize, pixelSize, secret.width - pixelSize * 2, secret.height - pixelSize * 2);
  sctx.fillStyle = '#8a6414';
  sctx.font = `${8 * pixelSize}px monospace`;
  sctx.textAlign = 'center';
  sctx.fillText('?', secret.width / 2, secret.height / 2 + 3 * pixelSize);
  out.secret = secret;

  // bloque "?" ya golpeado (estilo Mario: queda un bloque liso, gastado)
  const secretUsed = document.createElement('canvas');
  secretUsed.width = secretUsed.height = size * pixelSize;
  let suctx = secretUsed.getContext('2d');
  suctx.fillStyle = '#7a6a52';
  suctx.fillRect(0, 0, secretUsed.width, secretUsed.height);
  suctx.fillStyle = '#8f7d62';
  suctx.fillRect(pixelSize, pixelSize, secretUsed.width - pixelSize * 2, secretUsed.height - pixelSize * 2);
  suctx.strokeStyle = '#5c4f3c';
  suctx.lineWidth = pixelSize * 0.4;
  suctx.beginPath();
  suctx.moveTo(0, secretUsed.height / 2); suctx.lineTo(secretUsed.width, secretUsed.height / 2);
  suctx.moveTo(secretUsed.width / 2, 0); suctx.lineTo(secretUsed.width / 2, secretUsed.height);
  suctx.stroke();
  out.secretUsed = secretUsed;

  // tobogán: franja plana y sólida (igual de segura que una plataforma
  // normal, sin ninguna forma puntiaguda que se confunda con un peligro),
  // pintada como plástico de resbaladero con rayas diagonales de "velocidad".
  const slide = document.createElement('canvas');
  slide.width = slide.height = size * pixelSize;
  let slctx = slide.getContext('2d');
  slctx.fillStyle = '#f2b632';
  slctx.fillRect(0, 0, slide.width, slide.height);
  slctx.fillStyle = '#ffd766';
  slctx.fillRect(pixelSize, pixelSize, slide.width - pixelSize * 2, slide.height * 0.35);
  slctx.save();
  slctx.beginPath();
  slctx.rect(pixelSize, pixelSize, slide.width - pixelSize * 2, slide.height - pixelSize * 2);
  slctx.clip();
  slctx.strokeStyle = '#ffffff';
  slctx.globalAlpha = 0.55;
  slctx.lineWidth = pixelSize * 0.9;
  for (let i = -1; i <= 3; i++) {
    slctx.beginPath();
    slctx.moveTo(i * pixelSize * 5 - slide.width, slide.height);
    slctx.lineTo(i * pixelSize * 5, 0);
    slctx.stroke();
  }
  slctx.restore();
  slctx.strokeStyle = '#c47f13';
  slctx.lineWidth = pixelSize * 0.6;
  slctx.strokeRect(pixelSize * 0.3, pixelSize * 0.3, slide.width - pixelSize * 0.6, slide.height - pixelSize * 0.6);
  out.slide = slide;

  // pincho / peligro
  const spike = document.createElement('canvas');
  spike.width = spike.height = size * pixelSize;
  let spctx = spike.getContext('2d');
  spctx.fillStyle = 'rgba(0,0,0,0)';
  spctx.fillStyle = '#8a8a94';
  spctx.beginPath();
  spctx.moveTo(0, spike.height);
  spctx.lineTo(spike.width * 0.16, spike.height * 0.25);
  spctx.lineTo(spike.width * 0.33, spike.height);
  spctx.lineTo(spike.width * 0.5, spike.height * 0.25);
  spctx.lineTo(spike.width * 0.66, spike.height);
  spctx.lineTo(spike.width * 0.83, spike.height * 0.25);
  spctx.lineTo(spike.width, spike.height);
  spctx.closePath();
  spctx.fill();
  out.spike = spike;

  return out;
}

// Bandera de meta
function buildFlagSprite(pixelSize, poleHeightTiles) {
  const w = 16 * pixelSize;
  const h = 16 * poleHeightTiles * pixelSize;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a8a94';
  ctx.fillRect(w * 0.45, 0, w * 0.1, h);
  ctx.fillStyle = '#d13b4a';
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.03);
  ctx.lineTo(w * 0.5 + w * 0.9, h * 0.09);
  ctx.lineTo(w * 0.5, h * 0.16);
  ctx.closePath();
  ctx.fill();
  return c;
}

// Nube de fondo decorativa (blanca y esponjosa, cielo amigable)
function buildCloudSprite(pixelSize) {
  const grid = [
    "..CCCC......",
    ".CCCCCCCC...",
    "CCCCCCCCCCC.",
    "CCCCCCCCCCCC",
    ".CCCCCCCCCC.",
  ];
  return rasterize(grid, { C: '#ffffff' }, pixelSize);
}

// Sol amigable para el fondo diurno
function buildSunSprite(pixelSize) {
  const grid = [
    "....SSSS....",
    "..SSSSSSSS..",
    ".SSSSSSSSSS.",
    "SSSSSSSSSSSS",
    "SSSSSSSSSSSS",
    ".SSSSSSSSSS.",
    "..SSSSSSSS..",
    "....SSSS....",
  ];
  return rasterize(grid, { S: '#ffe27a' }, pixelSize);
}
