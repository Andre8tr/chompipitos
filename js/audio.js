/* ============================================================
   CHOMPIPITOS - Motor de audio 100% sintetizado (Web Audio API).
   No usa archivos externos: genera música original en vivo, con
   un aire relajado y nostálgico (pads cálidos + marimba suave),
   inspirado en el tono tranquilo de bandas sonoras como la de
   Donkey Kong Country, y efectos de sonido en tiempo real.
   ============================================================ */

function noteFreq(semisFromA4) {
  return 440 * Math.pow(2, semisFromA4 / 12);
}

// Todo en la tonalidad de Do mayor (cálida, nostálgica). "r" = fundamental
// del acorde (semitonos respecto a A4), "third" = 3 (menor) o 4 (mayor).
const TRACKS = {
  title: {
    bpm: 84,
    chords: [{ r: -4, third: 4 }, { r: -9, third: 4 }, { r: -2, third: 4 }, { r: -12, third: 3 }], // F - C - G - Am
    drums: { kick: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hat: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0] },
    lead: null, gain: 0.42
  },
  level1: {
    bpm: 100,
    chords: [{ r: -9, third: 4 }, { r: -12, third: 3 }, { r: -4, third: 4 }, { r: -2, third: 4 }], // C - Am - F - G
    drums: { kick: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0] },
    lead: [0,4,7,12, 7,4,0,4, -12,0,-9,0, -2,2,5,2],
    gain: 0.46
  },
  level2: {
    bpm: 96,
    chords: [{ r: -4, third: 4 }, { r: -9, third: 4 }, { r: -2, third: 4 }, { r: -12, third: 3 }], // F - C - G - Am
    drums: { kick: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0] },
    lead: [0,3,7,10, 5,9,12,9, -2,2,5,9, -12,-9,-5,-9],
    gain: 0.46
  },
  level3: {
    bpm: 104,
    chords: [{ r: -12, third: 3 }, { r: -4, third: 4 }, { r: -9, third: 4 }, { r: -2, third: 4 }], // Am - F - C - G
    drums: { kick: [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0] },
    lead: [-12,-9,-5,-9, -4,0,3,0, -9,-5,-2,-5, -2,2,5,9],
    gain: 0.48
  },
  boss: {
    bpm: 118,
    chords: [{ r: -7, third: 3 }, { r: -11, third: 4 }, { r: -4, third: 4 }, { r: -9, third: 4 }], // Dm - Bb - F - C
    drums: { kick: [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0] },
    lead: [-7,-3,0,3, -3,0,3,5, -4,0,3,5, -9,-5,-2,0],
    gain: 0.5
  },
  victory: {
    bpm: 116,
    chords: [{ r: -9, third: 4 }, { r: -2, third: 4 }, { r: -12, third: 3 }, { r: -4, third: 4 }], // C - G - Am - F
    drums: { kick: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0] },
    lead: [0,4,7,12, 7,11,14,11, -12,0,-9,0, -4,0,3,7],
    gain: 0.46
  }
};

class MusicEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.trackName = null;
    this.timer = null;
    this.step16 = 0;
    this.nextNoteTime = 0;
    this.lookahead = 25; // ms
    this.scheduleAhead = 0.12; // s
  }

  // El audio es "best effort": si el navegador bloquea o no soporta
  // Web Audio, el juego debe seguir funcionando en silencio, nunca romperse.
  ensureCtx() {
    if (this.disabled || this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.disabled = true; return; }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.85;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.disabled = true;
    }
  }

  resume() {
    try {
      this.ensureCtx();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch (e) { /* silencio si el navegador lo bloquea */ }
  }

  setMuted(m) {
    this.muted = m;
    try {
      if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.05);
    } catch (e) { /* ignorar */ }
  }

  playTrack(name) {
    try {
      this.ensureCtx();
      if (!this.ctx || this.disabled) return;
      if (this.trackName === name) return;
      this.stop();
      this.trackName = name;
      this.step16 = 0;
      this.nextNoteTime = this.ctx.currentTime + 0.05;
      this.track = TRACKS[name];
      this._scheduler();
      this.timer = setInterval(() => this._scheduler(), this.lookahead);
    } catch (e) { /* ignorar: la música es un extra, no algo crítico */ }
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.trackName = null;
  }

  _scheduler() {
    if (!this.ctx || !this.track) return;
    try {
      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAhead) {
        this._scheduleStep(this.step16, this.nextNoteTime);
        const secPerBeat = 60.0 / this.track.bpm;
        this.nextNoteTime += secPerBeat / 4; // 16th notes
        this.step16 = (this.step16 + 1) % 16;
      }
    } catch (e) {
      // si algo falla generando música, apagamos el intervalo en vez de
      // spamear errores cada 25ms
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
    }
  }

  _scheduleStep(step, t) {
    const tr = this.track;
    const chordIdx = Math.floor(step / 4) % tr.chords.length;
    const chord = tr.chords[chordIdx];

    // Percusión suave
    if (tr.drums.kick[step]) this._kick(t);
    if (tr.drums.snare[step]) this._softSnare(t);
    if (tr.drums.hat[step]) this._shaker(t);

    // Bajo cálido (una octava debajo del acorde), en los tiempos
    if (step % 4 === 0) this._bass(t, chord.r - 12, tr.gain);

    // Pad de acorde cálido, sostenido, al inicio de cada compás
    if (step % 8 === 0) this._pad(t, chord, tr.gain, (60 / tr.bpm) * 2);

    // Marimba / melodía relajada
    if (tr.lead) {
      const note = tr.lead[step % tr.lead.length];
      if (note !== null && step % 2 === 0) this._marimba(t, chord.r + note, tr.gain);
    }
  }

  _env(gainNode, t, attack, sustain, release, peak) {
    const g = gainNode.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0.0001, t);
    g.linearRampToValueAtTime(peak, t + attack);
    g.setTargetAtTime(peak * 0.75, t + attack, sustain);
    g.setTargetAtTime(0.0001, t + attack + sustain, release);
  }

  _pad(t, chord, level, dur) {
    const semis = [chord.r, chord.r + chord.third, chord.r + 7, chord.r + 12];
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1800;
    g.connect(lp); lp.connect(this.master);
    this._env(g, t, 0.25, dur * 0.5, dur * 0.4, level * 0.5);
    semis.forEach((s, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = noteFreq(s);
      osc.detune.value = (i % 2 === 0) ? -4 : 4;
      osc.connect(g);
      osc.start(t);
      osc.stop(t + dur + 0.2);
    });
  }

  _bass(t, semis, level) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900;
    osc.type = 'sine';
    osc.frequency.value = noteFreq(semis);
    osc.connect(lp); lp.connect(g); g.connect(this.master);
    this._env(g, t, 0.02, 0.22, 0.25, level * 0.85);
    osc.start(t); osc.stop(t + 0.5);
  }

  _marimba(t, semis, level) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    osc.type = 'triangle';
    osc.frequency.value = noteFreq(semis + 12);
    osc.connect(lp); lp.connect(g); g.connect(this.master);
    this._env(g, t, 0.004, 0.06, 0.18, level * 0.55);
    osc.start(t); osc.stop(t + 0.3);
  }

  _kick(t) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.14);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 0.24);
  }

  _noiseBuffer() {
    if (this._noiseBuf) return this._noiseBuf;
    const len = this.ctx.sampleRate * 0.3;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this._noiseBuf = buf;
    return buf;
  }

  _softSnare(t) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this._noiseBuffer();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    noise.connect(bp); bp.connect(g); g.connect(this.master);
    noise.start(t); noise.stop(t + 0.1);
  }

  _shaker(t) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this._noiseBuffer();
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    noise.connect(hp); hp.connect(g); g.connect(this.master);
    noise.start(t); noise.stop(t + 0.06);
  }

  /* ---------- SFX puntuales ---------- */

  sfxJump() {
    try {
    this.ensureCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.1);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 0.15);
    } catch (e) { /* el salto debe funcionar aunque el sonido falle */ }
  }

  sfxStomp() {
    try {
    this.ensureCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 0.14);
    } catch (e) { /* ignorar */ }
  }

  // Golpe seco de "bonk" al pegarle a un bloque "?" desde abajo, estilo Mario.
  sfxBump() {
    try {
    this.ensureCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(340, t + 0.06);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 0.1);
    } catch (e) { /* ignorar */ }
  }

  sfxTurkey() {
    try {
    this.ensureCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 4, 7, 12].forEach((semi, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = noteFreq(semi);
      g.gain.setValueAtTime(0.001, t + i * 0.07);
      g.gain.linearRampToValueAtTime(0.3, t + i * 0.07 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.2);
      osc.connect(g); g.connect(this.master);
      osc.start(t + i * 0.07); osc.stop(t + i * 0.07 + 0.22);
    });
    } catch (e) { /* ignorar */ }
  }

  sfxHurt() {
    try {
    this.ensureCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.25);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 0.3);
    } catch (e) { /* ignorar */ }
  }

  sfxBossHit() {
    try {
    this.ensureCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this._noiseBuffer();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 900;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    noise.connect(bp); bp.connect(g); g.connect(this.master);
    noise.start(t); noise.stop(t + 0.29);
    } catch (e) { /* ignorar */ }
  }

  sfxGameOver() {
    try {
    this.ensureCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, -2, -4, -7].forEach((semi, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = noteFreq(semi - 12);
      g.gain.setValueAtTime(0.001, t + i * 0.18);
      g.gain.linearRampToValueAtTime(0.25, t + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.3);
      osc.connect(g); g.connect(this.master);
      osc.start(t + i * 0.18); osc.stop(t + i * 0.18 + 0.32);
    });
    } catch (e) { /* ignorar */ }
  }
}

const MUSIC = new MusicEngine();
