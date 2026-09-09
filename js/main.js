/* ============================================================
   CHOMPIPITOS - Cableado de la interfaz (pantallas HTML) con
   el motor del juego (engine.js).
   ============================================================ */

(function () {
  const canvas = document.getElementById('game');
  const screenTitle = document.getElementById('screen-title');
  const screenControls = document.getElementById('screen-controls');
  const screenSelect = document.getElementById('screen-select');
  const screenMessage = document.getElementById('screen-message');
  const hud = document.getElementById('hud');
  const roster = document.getElementById('roster');
  const charNameEl = document.getElementById('char-name');
  const accessoryRow = document.getElementById('accessory-row');
  const btnStart = document.getElementById('btn-start');
  const btnControlsOk = document.getElementById('btn-controls-ok');
  const msgTitle = document.getElementById('message-title');
  const msgBody = document.getElementById('message-body');
  const btnMsgAction = document.getElementById('btn-message-action');
  const btnSound = document.getElementById('btn-sound');
  const touchControls = document.getElementById('touch-controls');

  const hudLives = document.getElementById('hud-lives');
  const hudLevel = document.getElementById('hud-level');
  const hudTurkey = document.getElementById('hud-turkey');
  const hudScore = document.getElementById('hud-score');

  let selectedChar = null;
  let selectedAccessory = 'none';
  let uiState = 'title';
  const rosterItems = {}; // charId -> { el, canvasHolder }

  Highscores.init();

  // Desbloquear el audio en el primer toque posible (en iOS/Safari el
  // AudioContext solo se puede crear/reanudar dentro de un gesto real del
  // usuario). Escuchamos en 'capture' y en varios tipos de evento para no
  // depender de que el primer toque caiga justo en un botón.
  let audioUnlocked = false;
  function unlockAudioOnce() {
    MUSIC.resume();
    if (audioUnlocked) return;
    audioUnlocked = true;
    ['pointerdown', 'touchend', 'mousedown', 'keydown'].forEach(evt => {
      document.removeEventListener(evt, unlockAudioOnce, { capture: true });
    });
  }
  ['pointerdown', 'touchend', 'mousedown', 'keydown'].forEach(evt => {
    document.addEventListener(evt, unlockAudioOnce, { capture: true, passive: true });
  });

  function showOnly(el) {
    [screenTitle, screenControls, screenSelect, screenMessage].forEach(s => s.classList.add('hidden'));
    if (el) el.classList.remove('hidden');
  }

  function goTitle() {
    uiState = 'title';
    hud.classList.add('hidden');
    touchControls.classList.add('hidden');
    showOnly(screenTitle);
  }

  function goControls() {
    uiState = 'controls';
    showOnly(screenControls);
  }

  function goSelect() {
    uiState = 'select';
    showOnly(screenSelect);
  }

  function buildRoster() {
    CHARACTERS.forEach(cfg => {
      const item = document.createElement('div');
      item.className = 'roster-item';
      const sheet = buildCharacterSheet(cfg, 3);
      item.appendChild(sheet.idle);
      const label = document.createElement('span');
      label.textContent = cfg.name;
      item.appendChild(label);
      const hs = document.createElement('span');
      hs.className = 'highscore';
      hs.textContent = 'Récord: —';
      item.appendChild(hs);
      item.addEventListener('click', () => selectChar(cfg, item));
      roster.appendChild(item);
      rosterItems[cfg.id] = { el: item };
      Highscores.watch(cfg.id, score => { hs.textContent = 'Récord: ' + score; });
    });
  }

  function refreshRosterPreview(cfg) {
    const entry = rosterItems[cfg.id];
    if (!entry) return;
    const oldCanvas = entry.el.querySelector('canvas');
    const sheet = buildCharacterSheet({ ...cfg, accessory: selectedAccessory }, 3);
    entry.el.replaceChild(sheet.idle, oldCanvas);
  }

  function buildAccessoryRow() {
    ACCESSORIES.forEach(acc => {
      const btn = document.createElement('button');
      btn.className = 'accessory-btn' + (acc.id === 'none' ? ' selected' : '');
      btn.textContent = acc.label;
      btn.dataset.id = acc.id;
      btn.addEventListener('click', () => {
        selectedAccessory = acc.id;
        document.querySelectorAll('.accessory-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (selectedChar) refreshRosterPreview(selectedChar);
      });
      accessoryRow.appendChild(btn);
    });
  }

  function selectChar(cfg, itemEl) {
    selectedChar = cfg;
    charNameEl.textContent = cfg.name;
    document.querySelectorAll('.roster-item').forEach(el => el.classList.remove('selected'));
    itemEl.classList.add('selected');
  }

  function startGameWithSelection() {
    if (!selectedChar) return;
    MUSIC.resume();
    Game.setCharacter({ ...selectedChar, accessory: selectedAccessory });
    // Game.newGame() dispara startLevel(0), que a su vez emite 'storyIntro'
    // con el prólogo del modo historia; el handler de ese evento se encarga
    // de mostrar el HUD y arrancar la partida cuando el jugador confirme.
    Game.newGame();
  }

  function showMessage(title, body, btnText, action) {
    msgTitle.textContent = title;
    msgBody.innerHTML = body;
    btnMsgAction.textContent = btnText;
    btnMsgAction.onclick = action;
    showOnly(screenMessage);
  }

  function heartString(n) {
    let s = '';
    for (let i = 0; i < 3; i++) s += i < n ? '❤' : '🖤';
    return s;
  }

  Game.on('hud', data => {
    hudLives.textContent = heartString(data.lives);
    hudLevel.textContent = data.levelName.toUpperCase();
    hudTurkey.textContent = data.itemIcon + ' ' + data.itemsCollected + '/' + data.itemsTotal;
    hudScore.textContent = String(data.score).padStart(6, '0');
  });

  // Modo historia: pantalla de texto al empezar cada nivel (prólogo /
  // objetivo). El jugador confirma para que arranque la jugabilidad.
  Game.on('storyIntro', payload => {
    uiState = 'message';
    showMessage(
      payload.title,
      payload.body,
      payload.isFirstLevel ? '¡EMPEZAR!' : 'CONTINUAR',
      () => {
        showOnly(null);
        hud.classList.remove('hidden');
        touchControls.classList.remove('hidden');
        Game.beginPlay();
        uiState = 'playing';
        canvas.focus();
      }
    );
  });

  Game.on('levelComplete', payload => {
    uiState = 'message';
    showMessage(
      payload.outroTitle,
      `${payload.outroBody}<br><br>Puntaje: ${payload.score}`,
      'SIGUIENTE NIVEL',
      () => {
        showOnly(null);
        hud.classList.add('hidden');
        touchControls.classList.add('hidden');
        Game.startLevel(Game.levelIndex + 1);
      }
    );
  });

  Game.on('gameOver', payload => {
    uiState = 'message';
    if (payload.charId) Highscores.submit(payload.charId, payload.score);
    showMessage(
      'GAME OVER',
      `${payload.quip}<br><br>Puntaje: ${payload.score}`,
      'REINTENTAR',
      () => {
        showOnly(null);
        Game.retryLevel();
        uiState = 'playing';
        canvas.focus();
      }
    );
  });

  Game.on('victory', payload => {
    uiState = 'message';
    hud.classList.add('hidden');
    touchControls.classList.add('hidden');
    let recordMsg = '';
    if (payload.charId) {
      Highscores.submit(payload.charId, payload.score).then(isRecord => {
        if (isRecord) {
          msgBody.innerHTML += '<br><br>🏆 ¡Nuevo récord con este personaje!';
        }
      });
    }
    const full = payload.itemsCollected >= payload.itemsTotal;
    const wrap = full
      ? 'La Rebelión Chompipito ganó en todos los frentes: se unieron al grupo, le enseñaron empatía a Doña Loli, consiguieron que Ángel regresara a la sección y detuvieron a tiempo el traslado de Diego y Cito.'
      : 'La Rebelión Chompipito venció a Elena, aunque no en todos los frentes se consiguió el 100% — siempre se puede volver a intentarlo para completar la historia entera.';
    showMessage(
      '¡VICTORIA! 🦃👑',
      `Derrotaron a la maestra Elena en la confrontación final.<br>` +
      `Hasta la profesora Miriam tuvo que admitirlo, aunque de mala gana.<br><br>` +
      `${wrap}<br><br>` +
      `Objetivos de la historia: ${payload.itemsCollected}/${payload.itemsTotal}<br>` +
      `Puntaje final: ${payload.score}${recordMsg}<br><br>` +
      `¡Gracias por jugar!`,
      'VOLVER AL INICIO',
      () => { showOnly(null); goTitle(); }
    );
  });

  Game.on('enter', () => {
    if (uiState === 'title') goControls();
    else if (uiState === 'controls') goSelect();
    else if (uiState === 'select') startGameWithSelection();
  });

  Game.on('pauseKey', () => {
    if (Game.state === 'playing') {
      Game.pause();
      uiState = 'message';
      showMessage('PAUSA', 'Presiona continuar para seguir jugando.', 'CONTINUAR', () => {
        showOnly(null);
        Game.resume();
        uiState = 'playing';
        canvas.focus();
      });
    } else if (Game.state === 'paused') {
      showOnly(null);
      Game.resume();
      uiState = 'playing';
      canvas.focus();
    }
  });

  screenTitle.addEventListener('click', () => { if (uiState === 'title') goControls(); });
  btnControlsOk.addEventListener('click', goSelect);
  btnStart.addEventListener('click', startGameWithSelection);

  btnSound.addEventListener('click', () => {
    const muted = !MUSIC.muted;
    MUSIC.setMuted(muted);
    btnSound.textContent = muted ? '🔇' : '🔊';
  });

  // Botones táctiles: usamos Pointer Events (unifica mouse/touch/lápiz y es
  // más confiable dentro de iframes o vistas embebidas) con varios
  // respaldos por si el navegador no dispara pointerup/touchend a tiempo.
  function bindHold(btnEl, key) {
    if (!btnEl) return;
    let active = false;

    const press = e => {
      if (e.cancelable) e.preventDefault();
      if (btnEl.setPointerCapture && e.pointerId !== undefined) {
        try { btnEl.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }
      }
      active = true;
      Game.setInput(key, true);
    };
    const release = e => {
      if (!active) return;
      active = false;
      if (e && e.cancelable) e.preventDefault();
      Game.setInput(key, false);
    };

    btnEl.addEventListener('pointerdown', press);
    btnEl.addEventListener('pointerup', release);
    btnEl.addEventListener('pointercancel', release);
    btnEl.addEventListener('pointerleave', release);
    btnEl.addEventListener('lostpointercapture', release);

    // Respaldo por si el dispositivo no soporta bien Pointer Events:
    // un toque corto (tap/click) siempre produce al menos un pulso de salto.
    btnEl.addEventListener('click', () => {
      if (active) return;
      Game.setInput(key, true);
      setTimeout(() => Game.setInput(key, false), 120);
    });

    btnEl.addEventListener('contextmenu', e => e.preventDefault());
  }
  bindHold(document.getElementById('tc-left'), 'left');
  bindHold(document.getElementById('tc-right'), 'right');
  bindHold(document.getElementById('tc-jump'), 'jump');

  Game.init(canvas);
  buildRoster();
  buildAccessoryRow();
  goTitle();
})();
