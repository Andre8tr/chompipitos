/* ============================================================
   CHOMPIPITOS - Motor del juego (física, colisiones, render).
   ============================================================ */

const GRAVITY = 1550;
const MOVE_SPEED = 230;
const JUMP_VELOCITY = -760;
const MAX_FALL = 820;
const PLAYER_W = 30;
const PLAYER_H = 46;
const INVULN_TIME = 1.4;
const BOSS_HURT_TIME = 0.7;
const SLIDE_SPEED = 320;

// Ambientación propia por nivel: cada uno se ve ligeramente distinto
// (cielo, cantidad de nubes, si hay sol o estrellas) aunque comparten los
// mismos tiles, para que no parezcan el mismo escenario repetido.
const LEVEL_THEMES = [
  { skyTop: '#7ec8e3', skyMid: '#a9dcef', skyBottom: '#cdeedd', cloudCount: 5, cloudAlpha: 0.9, showSun: true, stars: false },
  { skyTop: '#93a8c9', skyMid: '#b7c7dd', skyBottom: '#d8e2ea', cloudCount: 9, cloudAlpha: 0.75, showSun: false, stars: false },
  { skyTop: '#ff9a5c', skyMid: '#ffb26b', skyBottom: '#ffd9a0', cloudCount: 3, cloudAlpha: 0.5, showSun: true, stars: false },
  { skyTop: '#3f3160', skyMid: '#6a4a72', skyBottom: '#c97a5a', cloudCount: 3, cloudAlpha: 0.35, showSun: false, stars: true }
];

// Humor negro ligero al derrotar rivales zombis (nada gráfico, solo choteo).
const KILL_QUIPS = [
  '¡Al fin descansa en paz!',
  'Eso le pasa por no hacer la tarea.',
  'Un zombi menos en el recreo.',
  '¡Directo a la fosa común de libros!',
  'RIP, nunca entregó el trabajo.',
  '¡Aplastado como examen sorpresa!'
];

// Frases al perder: siempre hay una decepción de por medio.
const GAME_OVER_QUIPS = [
  'La profesora Miriam estaría profundamente decepcionada de ti.',
  'Miriam lo vio todo. Miriam está decepcionada.',
  'En algún lugar, Miriam suspira decepcionada.',
  'Esto va a tu expediente. Miriam ya lo sabe, y está decepcionada.',
  'Elena se ríe. Miriam solo niega con la cabeza, decepcionada.'
];

// Metadatos de cada tipo de coleccionable del modo historia: ícono para el
// HUD/popups y nombre "bonito" para los mensajes.
const ITEM_META = {
  chompipito: { icon: '🦃', label: 'CHOMPIPITO DE ORO' },
  gema: { icon: '💎', label: 'GEMA DE LA EMPATÍA' },
  lapicero: { icon: '🖊️', label: 'LAPICERO' },
  reloj: { icon: '⏰', label: 'RELOJ MÁGICO' }
};

function buildLevelGrid(level) {
  const solid = new Set();
  const tileType = new Map();
  const blockIndex = new Map();
  const floorRow = level.height - 1;
  const mark = (x, row, type) => { solid.add(x + ',' + row); tileType.set(x + ',' + row, type); };
  level.ground.forEach(([x1, x2]) => { for (let x = x1; x <= x2; x++) mark(x, floorRow, 'ground'); });
  level.platforms.forEach(p => { for (let x = p.x1; x <= p.x2; x++) mark(x, p.row, 'platform'); });
  (level.slides || []).forEach(p => { for (let x = p.x1; x <= p.x2; x++) mark(x, p.row, 'slide'); });
  // Cada coleccionable de la historia vive escondido dentro de un bloque
  // "?" (estilo Mario), justo una fila debajo de donde aparece al salir:
  // no hay una lista aparte de "secretBlocks", el bloque se deriva del
  // propio item (una fila más abajo de item.row).
  (level.items || []).forEach((item, i) => {
    const bx = item.x, brow = item.row + 1;
    mark(bx, brow, 'secret');
    blockIndex.set(bx + ',' + brow, i);
  });
  return { solid, tileType, blockIndex, floorRow };
}

function isSolid(grid, col, row) { return grid.solid.has(col + ',' + row); }

const Game = {
  canvas: null, ctx: null,
  callbacks: {},
  state: 'boot',
  input: { left: false, right: false, jump: false, jumpHeld: false },
  keysBound: false,
  charConfig: null,
  charSheet: null,
  enemySheets: null,
  elenaSheet: null,
  tileSheets: null,
  turkeySprite: null,
  gemSprite: null,
  penSprite: null,
  clockSprite: null,
  donaLoliSheet: null,
  cloudSprite: null,
  chalkBoltSprite: null,
  flagSprite: null,
  levelIndex: 0,
  level: null,
  grid: null,
  camera: { x: 0 },
  player: null,
  enemies: [],
  boss: null,
  itemsCollected: [],
  blocksHit: [],
  itemPopAnim: [],
  goalReached: false,
  goalHintCooldown: 0,
  lives: 3,
  score: 0,
  levelProgress: [],
  animClock: 0,
  paused: false,
  lastTime: 0,
  introHint: 0,

  on(evt, fn) { this.callbacks[evt] = fn; },
  emit(evt, payload) { if (this.callbacks[evt]) this.callbacks[evt](payload); },

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    canvas.tabIndex = 0;

    this.enemySheets = buildEnemySheets(3);
    this.elenaSheet = buildElenaSheet(3);
    this.donaLoliSheet = buildDonaLoliSheet(3);
    this.tileSheets = buildTileSprites(TILE / 16);
    this.turkeySprite = buildTurkeySprite(1.15);
    this.gemSprite = buildGemSprite(1.15);
    this.penSprite = buildPenSprite(1.15);
    this.clockSprite = buildClockSprite(1.15);
    this.itemSprites = { chompipito: this.turkeySprite, gema: this.gemSprite, lapicero: this.penSprite, reloj: this.clockSprite };
    this.cloudSprite = buildCloudSprite(3);
    this.sunSprite = buildSunSprite(4);
    this.chalkBoltSprite = buildChalkBolt(3);
    this.flagSprite = buildFlagSprite(TILE / 16, 3);

    this._charSheetCache = {};

    if (!this.keysBound) {
      window.addEventListener('keydown', e => this._onKey(e, true));
      window.addEventListener('keyup', e => this._onKey(e, false));
      this.keysBound = true;
    }

    this.state = 'idle';
    requestAnimationFrame(t => this._loop(t));
  },

  _onKey(e, down) {
    const k = e.key;
    if (['ArrowLeft', 'a', 'A'].includes(k)) { this.input.left = down; e.preventDefault(); }
    if (['ArrowRight', 'd', 'D'].includes(k)) { this.input.right = down; e.preventDefault(); }
    if (['ArrowUp', ' ', 'w', 'W'].includes(k)) {
      if (down && !this.input.jumpHeld) this.input.jump = true;
      this.input.jumpHeld = down;
      e.preventDefault();
    }
    if (k === 'Enter' && down) this.emit('enter');
    if ((k === 'p' || k === 'P' || k === 'Escape') && down) this.emit('pauseKey');
  },

  setInput(key, val) {
    if (key === 'jump') {
      if (val && !this.input.jumpHeld) this.input.jump = true;
      this.input.jumpHeld = val;
    } else {
      this.input[key] = val;
    }
  },

  setCharacter(cfg) {
    this.charConfig = cfg;
    if (!this._charSheetCache[cfg.id]) {
      this._charSheetCache[cfg.id] = buildCharacterSheet(cfg, 3);
    }
    this.charSheet = this._charSheetCache[cfg.id];
  },

  newGame() {
    this.lives = 3;
    this.score = 0;
    this.levelProgress = LEVELS.map(lvl => (lvl.items || []).map(() => false));
    this.levelIntroShown = LEVELS.map(() => false);
    this.levelIndex = 0;
    this.startLevel(0);
  },

  startLevel(idx) {
    this.levelIndex = idx;
    this.level = LEVELS[idx];
    this.grid = buildLevelGrid(this.level);
    if (!this.levelProgress[idx]) this.levelProgress[idx] = (this.level.items || []).map(() => false);
    this.itemsCollected = this.levelProgress[idx].slice();
    // Los bloques "?" de los objetos ya recolectados en visitas anteriores
    // aparecen de una vez como bloques usados; el resto arranca cerrado.
    this.blocksHit = this.itemsCollected.slice();
    this.itemPopAnim = this.itemsCollected.map(() => 0);
    this.goalReached = false;
    this.goalHintCooldown = 0;
    this.camera.x = 0;
    this.bossMusicSwitched = false;
    this.introHint = 0;
    this.levelClock = 0;
    this.popups = [];

    const ps = this.level.playerStart;
    this.player = {
      x: ps.x * TILE, y: ps.row * TILE,
      w: PLAYER_W, h: PLAYER_H,
      vx: 0, vy: 0, onGround: false,
      facing: 1, frame: 'idle', animTimer: 0,
      invuln: 0, jumpBuffer: 0, coyote: 0
    };

    this.enemies = this.level.enemies.map(e => ({
      type: e.type, flying: e.flying,
      x: e.x * TILE, y: e.row * TILE,
      w: 28, h: 28,
      xMin: e.xMin * TILE, xMax: e.xMax * TILE,
      vx: e.flying ? 45 : 55,
      dead: false, animTimer: 0, frame: 'a'
    }));

    if (this.level.boss) {
      const b = this.level.boss;
      this.boss = {
        x: b.x * TILE, y: b.row * TILE - 20,
        w: 40, h: 66,
        xMin: b.xMin * TILE, xMax: b.xMax * TILE,
        vx: 40, hp: b.hp, maxHp: b.hp,
        hurtTimer: 0, shootTimer: 1.2,
        dead: false, projectiles: []
      };
    } else {
      this.boss = null;
    }

    // Modo historia: antes de jugar se muestra la pantalla de historia del
    // nivel (intro), pero solo la primera vez que se entra a ese nivel: si
    // es un reintento tras perder una vida/game over, se salta directo a
    // jugar para no repetir el texto. El motor no arranca la partida hasta
    // que main.js llama a Game.beginPlay() (cuando el jugador confirma).
    if (!this.levelIntroShown) this.levelIntroShown = LEVELS.map(() => false);
    if (this.levelIntroShown[idx]) {
      this.beginPlay();
      return;
    }
    this.levelIntroShown[idx] = true;
    this.state = 'story';
    const story = this.level.story;
    this.emit('storyIntro', {
      title: story ? story.intro.title : this.level.name,
      body: story ? story.intro.body : '',
      isFirstLevel: idx === 0
    });
  },

  beginPlay() {
    this.state = 'playing';
    this.introHint = this.levelIndex === 0 ? 5 : 0;
    MUSIC.resume();
    MUSIC.playTrack(this.level.music);
    this._pushHud();
  },

  pause() { if (this.state === 'playing') { this.state = 'paused'; } },
  resume() { if (this.state === 'paused') { this.state = 'playing'; } },

  retryLevel() {
    this.startLevel(this.levelIndex);
  },

  _pushHud() {
    const items = this.level && this.level.items ? this.level.items : [];
    const collected = this.itemsCollected ? this.itemsCollected.filter(Boolean).length : 0;
    const meta = items.length ? ITEM_META[items[0].type] : null;
    this.emit('hud', {
      lives: this.lives,
      levelName: this.level ? this.level.name : '',
      itemsCollected: collected,
      itemsTotal: items.length,
      itemIcon: meta ? meta.icon : '🦃',
      score: this.score
    });
  },

  _loop(t) {
    const dt = Math.min(0.033, (t - (this.lastTime || t)) / 1000);
    this.lastTime = t;
    // El update y el render van protegidos: un fallo puntual (p. ej. audio
    // bloqueado por el navegador) nunca debe congelar el bucle del juego.
    try {
      if (this.state === 'playing') this._update(dt);
    } catch (err) {
      console.error('Chompipitos: error en update()', err);
    }
    try {
      this._render();
    } catch (err) {
      console.error('Chompipitos: error en render()', err);
    }
    requestAnimationFrame(tt => this._loop(tt));
  },

  _update(dt) {
    this.animClock += dt;
    this.levelClock += dt;
    if (this.introHint > 0) this.introHint -= dt;
    this.popups.forEach(p => { p.timer -= dt; p.y -= 24 * dt; });
    this.popups = this.popups.filter(p => p.timer > 0);
    if (this.itemPopAnim) {
      for (let i = 0; i < this.itemPopAnim.length; i++) {
        if (this.itemPopAnim[i] > 0) this.itemPopAnim[i] = Math.max(0, this.itemPopAnim[i] - dt);
      }
    }
    this._updatePlayer(dt);
    this._updateEnemies(dt);
    if (this.boss) this._updateBoss(dt);
    this._updateCamera();
    this._checkHazardsAndTriggers();
  },

  _updatePlayer(dt) {
    const p = this.player;
    if (p.invuln > 0) p.invuln -= dt;

    p.vx = 0;
    if (this.input.left) { p.vx = -MOVE_SPEED; p.facing = -1; }
    if (this.input.right) { p.vx = MOVE_SPEED; p.facing = 1; }

    // Tobogán: si estabas parado sobre una franja de tobogán al final del
    // frame anterior, te sigue empujando hacia adelante más rápido de lo
    // normal (podés saltar en cualquier momento para salirte antes).
    if (p.onSlideTile) {
      p.vx = this.input.left ? SLIDE_SPEED * 0.35 : SLIDE_SPEED;
      if (!this.input.left) p.facing = 1;
    }

    // Buffer de salto: si presionas justo un instante antes de tocar el
    // suelo, el salto igual se ejecuta en cuanto aterrizas.
    if (this.input.jump) {
      p.jumpBuffer = 0.14;
      this.input.jump = false;
    } else if (p.jumpBuffer > 0) {
      p.jumpBuffer -= dt;
    }

    // Coyote time: da un pequeño margen para saltar justo después de
    // dejar una plataforma, aunque "onGround" ya haya pasado a falso.
    if (p.onGround) p.coyote = 0.1;
    else if (p.coyote > 0) p.coyote -= dt;

    if (p.jumpBuffer > 0 && p.coyote > 0) {
      p.vy = JUMP_VELOCITY;
      p.onGround = false;
      p.jumpBuffer = 0;
      p.coyote = 0;
      MUSIC.sfxJump();
      this.introHint = 0;
    }

    // Salto simple y parejo: la altura no depende de cuánto mantengas
    // presionado, así que un toque rápido salta igual que uno largo.

    p.vy += GRAVITY * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;

    p.x += p.vx * dt;
    this._collideAxis(p, 'x');
    p.y += p.vy * dt;
    p.onGround = false;
    this._collideAxis(p, 'y');

    // Sonda de suelo: sin esto, "onGround" puede parpadear a falso por un
    // redondeo de subpíxel incluso con el jugador quieto sobre el piso,
    // haciendo que el salto se sienta poco confiable.
    if (!p.onGround && p.vy >= 0 && this._probeGround(p)) {
      p.onGround = true;
    }

    // Detecta si el tile bajo los pies es un tobogán, para el impulso del
    // próximo frame (se calcula al final para no depender del orden).
    p.onSlideTile = false;
    if (p.onGround) {
      const footCol = Math.floor((p.x + p.w / 2) / TILE);
      const footRow = Math.floor((p.y + p.h + 1) / TILE);
      if (this.grid.tileType.get(footCol + ',' + footRow) === 'slide') p.onSlideTile = true;
    }

    if (p.x < 0) p.x = 0;
    const maxX = this.level.width * TILE - p.w;
    if (p.x > maxX) p.x = maxX;

    // cae al vacío
    if (p.y > this.level.height * TILE + 100) {
      this._loseLife();
      return;
    }

    // animación
    if (!p.onGround) p.frame = 'jump';
    else if (p.vx !== 0) {
      p.animTimer += dt;
      p.frame = Math.floor(p.animTimer * 8) % 2 === 0 ? 'walk1' : 'walk2';
    } else { p.frame = 'idle'; p.animTimer = 0; }
  },

  _collideAxis(entity, axis) {
    const grid = this.grid;
    const left = Math.floor(entity.x / TILE);
    const right = Math.floor((entity.x + entity.w - 1) / TILE);
    const top = Math.floor(entity.y / TILE);
    const bottom = Math.floor((entity.y + entity.h - 1) / TILE);
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (!isSolid(grid, col, row)) continue;
        if (axis === 'x') {
          if (entity.vx > 0) entity.x = col * TILE - entity.w;
          else if (entity.vx < 0) entity.x = (col + 1) * TILE;
          entity.vx = 0;
        } else {
          if (entity.vy > 0) { entity.y = row * TILE - entity.h; entity.onGround = true; }
          else if (entity.vy < 0) {
            entity.y = (row + 1) * TILE;
            // Golpe de bloque "?" desde abajo, al estilo Mario: solo el
            // jugador puede activarlo, y solo si venía saltando hacia arriba.
            if (entity === this.player && grid.tileType.get(col + ',' + row) === 'secret') {
              this._bumpBlock(col, row);
            }
          }
          entity.vy = 0;
        }
      }
    }
  },

  _probeGround(entity) {
    const grid = this.grid;
    const left = Math.floor(entity.x / TILE);
    const right = Math.floor((entity.x + entity.w - 1) / TILE);
    const row = Math.floor((entity.y + entity.h + 1) / TILE);
    for (let col = left; col <= right; col++) {
      if (isSolid(grid, col, row)) return true;
    }
    return false;
  },

  _bumpBlock(col, row) {
    const idx = this.grid.blockIndex.get(col + ',' + row);
    if (idx === undefined) return;
    if (this.blocksHit[idx] || this.itemsCollected[idx]) return; // ya estaba usado, no hace nada de nuevo
    this.blocksHit[idx] = true;
    this.itemPopAnim[idx] = 0.4;
    MUSIC.sfxBump();
  },

  _updateEnemies(dt) {
    this.enemies.forEach(en => {
      if (en.dead) return;
      en.animTimer += dt;
      en.frame = Math.floor(en.animTimer * 6) % 2 === 0 ? 'a' : 'b';
      en.x += en.vx * dt;
      if (en.x < en.xMin) { en.x = en.xMin; en.vx *= -1; }
      if (en.x + en.w > en.xMax) { en.x = en.xMax - en.w; en.vx *= -1; }

      const p = this.player;
      if (this._overlap(p, en)) {
        const stomp = p.vy > 0 && (p.y + p.h) - en.y < 18;
        if (stomp) {
          en.dead = true;
          p.vy = JUMP_VELOCITY * 0.55;
          this.score += 100;
          MUSIC.sfxStomp();
          this._pushHud();
          const quip = KILL_QUIPS[Math.floor(Math.random() * KILL_QUIPS.length)];
          this._addPopup(en.x + en.w / 2, en.y, quip, '#a8e0a0');
        } else {
          this._damagePlayer();
        }
      }
    });
    this.enemies = this.enemies.filter(en => !en.dead);
  },

  _updateBoss(dt) {
    const b = this.boss;
    if (b.dead) return;
    if (b.hurtTimer > 0) b.hurtTimer -= dt;

    if (!this.bossMusicSwitched && Math.abs(this.player.x - b.x) < 420) {
      MUSIC.playTrack('boss');
      this.bossMusicSwitched = true;
    }

    if (b.hurtTimer <= 0) {
      b.x += b.vx * dt;
      if (b.x < b.xMin) { b.x = b.xMin; b.vx *= -1; }
      if (b.x + b.w > b.xMax) { b.x = b.xMax - b.w; b.vx *= -1; }
    }

    b.shootTimer -= dt;
    if (b.shootTimer <= 0 && this.bossMusicSwitched) {
      b.shootTimer = 1.6;
      const dir = this.player.x < b.x ? -1 : 1;
      b.projectiles.push({ x: b.x + b.w / 2, y: b.y + 20, vx: dir * 260, w: 18, h: 18 });
    }

    b.projectiles.forEach(pr => { pr.x += pr.vx * dt; });
    b.projectiles = b.projectiles.filter(pr => pr.x > -50 && pr.x < this.level.width * TILE + 50);

    const p = this.player;
    b.projectiles.forEach(pr => {
      if (this._overlap(p, pr)) { this._damagePlayer(); pr.hit = true; }
    });
    b.projectiles = b.projectiles.filter(pr => !pr.hit);

    if (this._overlap(p, b)) {
      const stomp = p.vy > 0 && (p.y + p.h) - b.y < 22;
      if (stomp && b.hurtTimer <= 0) {
        b.hp -= 1;
        b.hurtTimer = BOSS_HURT_TIME;
        p.vy = JUMP_VELOCITY * 0.6;
        MUSIC.sfxBossHit();
        if (b.hp <= 0) {
          b.dead = true;
          this.score += 1000;
          this._winGame();
        }
      } else if (b.hurtTimer <= 0) {
        this._damagePlayer();
      }
    }
  },

  _addPopup(x, y, text, color) {
    this.popups.push({ x, y, text, color: color || '#fff6df', timer: 1.3 });
  },

  _overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  },

  _damagePlayer() {
    const p = this.player;
    if (p.invuln > 0) return;
    p.invuln = INVULN_TIME;
    p.vy = -350;
    p.vx = p.facing * -150;
    this.lives -= 1;
    MUSIC.sfxHurt();
    this._pushHud();
    if (this.lives <= 0) this._gameOver();
  },

  _loseLife() {
    this.lives -= 1;
    MUSIC.sfxHurt();
    this._pushHud();
    if (this.lives <= 0) { this._gameOver(); return; }
    const ps = this.level.playerStart;
    this.player.x = ps.x * TILE; this.player.y = ps.row * TILE;
    this.player.vx = 0; this.player.vy = 0; this.player.invuln = INVULN_TIME;
  },

  _gameOver() {
    this.state = 'gameover';
    MUSIC.stop();
    MUSIC.sfxGameOver();
    const quip = GAME_OVER_QUIPS[Math.floor(Math.random() * GAME_OVER_QUIPS.length)];
    this.emit('gameOver', { score: this.score, quip, charId: this.charConfig ? this.charConfig.id : null });
  },

  _checkHazardsAndTriggers() {
    const p = this.player;
    const lvl = this.level;
    if (this.goalHintCooldown > 0) this.goalHintCooldown -= 1 / 60;

    lvl.spikes.forEach(s => {
      const box = { x: s.x * TILE + 4, y: s.row * TILE + 10, w: TILE - 8, h: TILE - 10 };
      if (this._overlap(p, box)) this._damagePlayer();
    });

    (lvl.items || []).forEach((item, i) => {
      if (this.itemsCollected[i]) return;
      if (!this.blocksHit[i]) return; // todavía escondido en el bloque "?"
      const box = { x: item.x * TILE + 6, y: item.row * TILE + 6, w: TILE - 12, h: TILE - 12 };
      if (this._overlap(p, box)) {
        this.itemsCollected[i] = true;
        this.levelProgress[this.levelIndex][i] = true;
        const meta = ITEM_META[item.type] || { icon: '⭐', label: item.type.toUpperCase() };
        const basePoints = item.points || 200;
        const speedBonus = Math.max(0, Math.round((45 - this.levelClock) * 10));
        const total = basePoints + speedBonus;
        this.score += total;
        MUSIC.sfxTurkey();
        this._pushHud();
        this._addPopup(p.x + p.w / 2, p.y - 10,
          speedBonus > 0 ? `${meta.icon} ¡${meta.label}! +${total} (bono veloz +${speedBonus})` : `${meta.icon} ¡${meta.label}! +${total}`,
          '#e8c34a');
      }
    });

    if (!this.goalReached && lvl.goal) {
      const g = lvl.goal;
      const box = { x: g.x * TILE, y: 0, w: TILE, h: lvl.height * TILE };
      if (this._overlap(p, box)) {
        const total = (lvl.items || []).length;
        const collected = this.itemsCollected.filter(Boolean).length;
        if (total > 0 && collected < total) {
          if (this.goalHintCooldown <= 0) {
            this.goalHintCooldown = 1.6;
            const hint = (lvl.story && lvl.story.hint) || `Todavía faltan ${total - collected} objetos por encontrar.`;
            this._addPopup(p.x + p.w / 2, p.y - 10, hint, '#ffb3b3');
          }
          return;
        }
        this.goalReached = true;
        this.score += 200;
        this._levelComplete();
      }
    }
  },

  _levelComplete() {
    this.state = 'levelcomplete';
    const isLast = this.levelIndex >= LEVELS.length - 1;
    const story = this.level.story;
    this.emit('levelComplete', {
      levelName: this.level.name,
      outroTitle: story && story.outro ? story.outro.title : '¡NIVEL SUPERADO!',
      outroBody: story && story.outro ? story.outro.body : '',
      isLast,
      score: this.score
    });
  },

  _winGame() {
    this.state = 'victory';
    MUSIC.playTrack('victory');
    const totalItems = this.levelProgress.reduce((n, arr) => n + arr.length, 0);
    const collectedItems = this.levelProgress.reduce((n, arr) => n + arr.filter(Boolean).length, 0);
    this.emit('victory', {
      score: this.score,
      itemsCollected: collectedItems,
      itemsTotal: totalItems,
      charId: this.charConfig ? this.charConfig.id : null
    });
  },

  _updateCamera() {
    const viewW = this.canvas.width;
    let cx = this.player.x + this.player.w / 2 - viewW / 2;
    const maxX = Math.max(0, this.level.width * TILE - viewW);
    if (cx < 0) cx = 0;
    if (cx > maxX) cx = maxX;
    this.camera.x = cx;
  },

  /* ---------------- RENDER ---------------- */

  _render() {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!this.level) {
      ctx.fillStyle = '#120c14';
      ctx.fillRect(0, 0, w, h);
      return;
    }

    const theme = LEVEL_THEMES[this.levelIndex] || LEVEL_THEMES[0];
    const bossGlow = this.boss && this.bossMusicSwitched;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (bossGlow) {
      // atardecer cálido e intenso para el duelo final (tensión sin dar miedo)
      grad.addColorStop(0, '#ffb26b'); grad.addColorStop(0.55, '#ff8c69'); grad.addColorStop(1, '#e8735a');
    } else {
      // cada nivel tiene su propio cielo, para que no se sientan repetidos
      grad.addColorStop(0, theme.skyTop); grad.addColorStop(0.6, theme.skyMid); grad.addColorStop(1, theme.skyBottom);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // estrellas (solo en niveles de anochecer, y no durante el resplandor del jefe)
    if (theme.stars && !bossGlow) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const starOffset = this.camera.x * 0.15;
      for (let i = 0; i < 20; i++) {
        const sx = (((i * 137) - starOffset) % (w + 80) + (w + 80)) % (w + 80) - 40;
        const sy = 18 + (i * 53) % 170;
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // sol (no en el nivel nublado, salvo que ya empezó el brillo del jefe)
    if (theme.showSun || bossGlow) {
      ctx.drawImage(this.sunSprite, w - 130, 30);
    }

    // nubes con parallax (cada nivel trae su propia densidad/opacidad)
    const cloudOffset = -(this.camera.x * 0.3) % 260;
    for (let i = -1; i < theme.cloudCount; i++) {
      ctx.globalAlpha = theme.cloudAlpha;
      ctx.drawImage(this.cloudSprite, cloudOffset + i * 260, 40 + (i % 2) * 30);
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(-this.camera.x, 0);

    const startCol = Math.floor(this.camera.x / TILE) - 1;
    const endCol = startCol + Math.ceil(w / TILE) + 3;

    // tiles
    for (const key of this.grid.solid) {
      const [colStr, rowStr] = key.split(',');
      const col = +colStr, row = +rowStr;
      if (col < startCol || col > endCol) continue;
      const type = this.grid.tileType.get(key);
      let sprite;
      if (type === 'platform') sprite = this.tileSheets.platform;
      else if (type === 'slide') sprite = this.tileSheets.slide;
      else if (type === 'secret') {
        const idx = this.grid.blockIndex.get(key);
        sprite = this.blocksHit[idx] ? this.tileSheets.secretUsed : this.tileSheets.secret;
      } else sprite = this.tileSheets.ground;
      ctx.drawImage(sprite, col * TILE, row * TILE);
    }

    // pinchos
    this.level.spikes.forEach(s => {
      if (s.x < startCol || s.x > endCol) return;
      ctx.drawImage(this.tileSheets.spike, s.x * TILE, s.row * TILE);
    });

    // coleccionables de la historia (chompipito, gemas, lapiceros, relojes):
    // solo aparecen una vez que su bloque "?" fue golpeado desde abajo.
    (this.level.items || []).forEach((item, i) => {
      if (this.itemsCollected[i]) return;
      if (!this.blocksHit[i]) return;
      const sprite = this.itemSprites[item.type];
      if (!sprite) return;
      const pop = this.itemPopAnim[i] || 0;
      const popOffset = pop > 0 ? -20 * (pop / 0.4) : 0;
      const bob = Math.sin(this.animClock * 4 + i) * 4;
      const cx = item.x * TILE + TILE / 2;
      const cy = item.row * TILE + TILE / 2 + bob + popOffset;
      const glowR = 22 + Math.sin(this.animClock * 3 + i) * 3;
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, glowR);
      glow.addColorStop(0, 'rgba(255,224,120,0.55)');
      glow.addColorStop(1, 'rgba(255,224,120,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);
      ctx.drawImage(sprite, cx - sprite.width / 2, cy - sprite.height / 2);
    });

    // meta
    if (this.level.goal) {
      const g = this.level.goal;
      ctx.drawImage(this.flagSprite, g.x * TILE, (this.level.height - 4) * TILE - this.flagSprite.height + TILE);
    }

    // NPC decorativo (p. ej. Doña Loli esperando al final del nivel 2)
    if (this.level.decorNpc && this.level.decorNpc.type === 'donaLoli' && this.donaLoliSheet) {
      const npc = this.level.decorNpc;
      ctx.drawImage(this.donaLoliSheet.idle, npc.x * TILE - 4, (npc.row + 1) * TILE - this.donaLoliSheet.idle.height);
    }

    // enemigos
    this.enemies.forEach(en => {
      const sheet = this.enemySheets[en.type];
      const img = en.frame === 'a' ? sheet.a : sheet.b;
      ctx.save();
      if (en.vx < 0) {
        ctx.translate(en.x + en.w, en.y);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0);
      } else {
        ctx.drawImage(img, en.x, en.y);
      }
      ctx.restore();
    });

    // jefa Elena
    if (this.boss && !this.boss.dead) {
      const b = this.boss;
      const img = b.hurtTimer > 0 ? this.elenaSheet.attack : this.elenaSheet.idle;
      ctx.save();
      if (b.hurtTimer > 0) ctx.globalAlpha = 0.6;
      if (b.vx < 0) {
        ctx.translate(b.x + b.w, b.y);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0);
      } else {
        ctx.drawImage(img, b.x, b.y);
      }
      ctx.restore();

      // barra de vida
      ctx.fillStyle = '#000';
      ctx.fillRect(b.x - 10, b.y - 16, b.w + 20, 8);
      ctx.fillStyle = '#d13b4a';
      ctx.fillRect(b.x - 8, b.y - 14, (b.w + 16) * (b.hp / b.maxHp), 4);

      b.projectiles.forEach(pr => {
        ctx.drawImage(this.chalkBoltSprite, pr.x - 9, pr.y - 9);
      });
    }

    // jugador
    if (this.player && this.charSheet) {
      const p = this.player;
      const blink = p.invuln > 0 && Math.floor(this.animClock * 14) % 2 === 0;
      if (!blink) {
        const img = this.charSheet[p.frame];
        ctx.save();
        if (p.facing < 0) {
          ctx.translate(p.x + img.width, p.y - 6);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0);
        } else {
          ctx.drawImage(img, p.x - 6, p.y - 6);
        }
        ctx.restore();
      }
    }

    // textos flotantes (puntos, humor negro)
    ctx.textAlign = 'center';
    this.popups.forEach(pop => {
      const alpha = Math.min(1, pop.timer / 0.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(20,12,10,0.85)';
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    });

    ctx.restore();

    // pista de controles al iniciar el nivel 1
    if (this.introHint > 0) {
      const alpha = Math.min(1, this.introHint);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.font = '16px "Press Start 2P", monospace';
      const text = 'SALTA: ↑ o ESPACIO   ·   MUEVE: ← →';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(20,12,10,0.8)';
      ctx.strokeText(text, w / 2, h - 34);
      ctx.fillStyle = '#fff6df';
      ctx.fillText(text, w / 2, h - 34);
      ctx.restore();
    }
  }
};
