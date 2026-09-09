/* ============================================================
   CHOMPIPITOS - Mejores puntajes por personaje.
   Si el juego corre publicado como Artifact (con la capacidad
   "db" disponible), el récord se comparte entre todos los que
   jueguen. Si no (por ejemplo, desplegado en Vercel/Netlify),
   cae automáticamente a localStorage (récord local del navegador).
   ============================================================ */

const Highscores = {
  db: null,
  ready: false,

  async init() {
    try {
      if (typeof claude !== 'undefined' && claude && typeof claude.use === 'function') {
        this.db = await claude.use('db');
      }
    } catch (e) {
      this.db = null;
    }
    this.ready = true;
  },

  _lsKey(charId) {
    return 'chompipitos_highscore_' + charId;
  },

  _readLocal(charId) {
    try {
      return parseInt(localStorage.getItem(this._lsKey(charId)) || '0', 10) || 0;
    } catch (e) {
      return 0;
    }
  },

  _writeLocal(charId, score) {
    try {
      localStorage.setItem(this._lsKey(charId), String(score));
    } catch (e) { /* ignorar */ }
  },

  // Se suscribe al mejor puntaje de un personaje; llama a cb(score) ahora
  // y cada vez que cambie. Devuelve una función para cancelar.
  watch(charId, cb) {
    if (this.db) {
      try {
        return this.db.doc('highscores/' + charId).onSnapshot(
          snap => cb(snap.exists ? (snap.data().score || 0) : 0),
          () => cb(this._readLocal(charId))
        );
      } catch (e) { /* cae a local abajo */ }
    }
    cb(this._readLocal(charId));
    return () => {};
  },

  async get(charId) {
    if (this.db) {
      try {
        const snap = await this.db.doc('highscores/' + charId).get();
        return snap.exists ? (snap.data().score || 0) : 0;
      } catch (e) { /* cae a local abajo */ }
    }
    return this._readLocal(charId);
  },

  // Solo guarda si el puntaje nuevo supera el récord actual.
  async submit(charId, score) {
    if (!charId) return false;
    if (this.db) {
      try {
        const ref = this.db.doc('highscores/' + charId);
        const snap = await ref.get();
        const current = snap.exists ? (snap.data().score || 0) : 0;
        if (score > current) {
          await ref.set({ score, updatedAt: new Date().toISOString() });
          return true;
        }
        return false;
      } catch (e) { /* cae a local abajo */ }
    }
    const current = this._readLocal(charId);
    if (score > current) { this._writeLocal(charId, score); return true; }
    return false;
  }
};
