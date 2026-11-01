// The Genesis Voyage's sound: one original synthesized theme per era, crossfaded as the boat crosses into the next,
// the boat's engine and the ride's cues. Synthesized and pooled, on the drop and mine pattern: the context is made
// only in `wake` (from a gesture the browser has activated), every node is built there once, and a note or a cue only
// schedules automation on a voice that is already running. `dispose` closes the context; the scene's leave calls it.
//
// The music is a small lookahead sequencer. A timer every TICK_MS asks `plan` which sixteenth-note steps fall inside
// the next LOOKAHEAD seconds and schedules them at their exact times; `plan` is pure and fills preallocated buffers,
// so the timer allocates nothing. Two decks carry the music: the era playing and the era fading out. Each deck has
// its own bus, ramped to `busTargets`: the era's level, lower in calm mode, nothing for any other era.
//
// Every motif below was written for this module as note numbers. None quotes or approximates a real song.
// Every sound goes through the page-wide mute (`BL.sound.output`); without it nothing is built.
//
// Lifecycle (docs/genesis-voyage/audio-handoff.md): `wake` builds the context only once the browser has counted a
// real user gesture (`navigator.userActivation.hasBeenActive`, as footsteps.js does; the scene calls it from its
// pointer and key handlers) and later resumes a suspended one; `setPaused` holds the
// music and engine; `dispose` stops and disconnects every source, closes the context and may be called twice; a
// later `wake` from a gesture builds fresh audio on the same instance.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const ERAS = 8, STEPS = 64, BAR = 16;
  const TICK_MS = 25, LOOKAHEAD = 0.12, FADE = 2.4;
  const MASTER = 0.8, MUSIC = 0.34, CALM_MUSIC = 0.6, CALM_DRUMS = 0.3, CALM_ENGINE = 0.6, SFX = 0.7;
  const CUE_VOICES = 6, NOISE_SECONDS = 2, PLAN_SLOTS = 16;
  const REST = 0, HOLD = -1;
  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  // --- Themes -------------------------------------------------------------------------------------------------------
  // Melodic tracks are space-separated tokens, one per `div` steps: a semitone above the theme's root (plus the
  // track's `oct`), "." to release, "-" to hold. "|" only marks bars for the reader. An arp's numbers are chord
  // degrees instead (0-2 the chord, 3-5 an octave up), so it follows the bar's chord. Drums are one character per
  // step: "k" a kick; "h" hat, "o" open hat, "s" snare, "b" brush on the noise voice. A pattern repeats inside the
  // theme's 64 steps; chords change each bar of 16 steps; `comp` says on which steps of a bar the pad strikes.
  // Instruments: wave, attack, decay (time constant), sustain (of peak), release, level; optional glide (time
  // constant), fm ratio and depth (the lead's modulator), pad cutoff and detune (cents per pad voice).
  const THEMES = [
    { // 0 · 1956-1969 · small combo: drawbar-ish organ stabs, a walking bass, brushes, a shuffle
      name: "combo", bpm: 112, swing: 0.2, root: 57,
      chords: [[0, 3, 10], [5, 9, 15], [0, 3, 10], [7, 11, 17]], comp: "x.....x...x.....",
      lead: { oct: 0, div: 2, notes: "12 . 15 17 15 . 12 - | 10 12 . 15 - - . . | 12 . 15 17 19 17 15 12 | 14 - 11 - 12 - - ." },
      bass: { oct: -24, div: 4, notes: "0 3 5 7 | 5 9 12 9 | 0 3 7 10 | 7 11 14 -1" },
      arp: null, kick: "k.......k.......", noise: "..h.b.h...h.b.hh",
      inst: { lead: ["square", 0.01, 0.18, 0.45, 0.08, 0.10], bass: ["triangle", 0.005, 0.25, 0.5, 0.1, 0.42], arp: null,
        pad: ["square", 0.01, 0.22, 0.25, 0.1, 0.07], cutoff: 1500, detune: [0, 3, -3], kick: 0.35, noise: 0.18 } },
    { // 1 · 1970s · analog synth: slow detuned saw pads, a gliding lead, a sequencer pulse, no drums
      name: "analog", bpm: 92, swing: 0, root: 50,
      chords: [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -2, 2]], comp: "x...............",
      lead: { oct: 12, div: 4, notes: "7 - 10 12 | 14 - - 12 | 10 - 7 5 | 7 - - ." },
      bass: { oct: -12, div: 2, notes: "0 . 0 12 . 0 . . | -2 . -2 10 . -2 . . | -4 . -4 8 . -4 . . | -5 . -5 7 . 2 . ." },
      arp: { oct: 12, div: 1, notes: "0 1 2 1 3 2 1 2 0 1 2 1 4 2 1 2" }, kick: "", noise: "",
      inst: { lead: ["triangle", 0.12, 0.6, 0.7, 0.4, 0.16, 0.06], bass: ["sawtooth", 0.01, 0.3, 0.4, 0.15, 0.22],
        arp: ["sine", 0.003, 0.08, 0.2, 0.05, 0.06], pad: ["sawtooth", 0.7, 1.2, 0.8, 0.9, 0.06], cutoff: 900, detune: [-7, 0, 6], kick: 0, noise: 0 } },
    { // 2 · 1980s · 8-bit chiptune: square lead, fast square arpeggio, triangle octave bass, noise drums
      name: "chip", bpm: 140, swing: 0, root: 60,
      chords: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], comp: "",
      lead: { oct: 0, div: 2, notes: "7 . 7 9 7 4 . 0 | 2 . 4 - 0 . . . | 9 . 9 12 9 5 . 4 | 2 4 5 7 - - . ." },
      bass: { oct: -24, div: 2, notes: "0 12 0 12 0 12 0 12 | -3 9 -3 9 -3 9 -3 9 | 5 17 5 17 5 17 5 17 | 7 19 7 19 7 19 7 19" },
      arp: { oct: 12, div: 1, notes: "0 1 2 1" }, kick: "k...k...k...k.k.", noise: "h.h.s.h.h.h.s.hh",
      inst: { lead: ["square", 0.003, 0.15, 0.6, 0.03, 0.11], bass: ["triangle", 0.002, 0.2, 0.7, 0.02, 0.4],
        arp: ["square", 0.002, 0.04, 0.3, 0.02, 0.035], pad: null, kick: 0.45, noise: 0.2 } },
    { // 3 · 1990-1995 · 16-bit FM: a bell-ish FM lead, a short slap bass, a busier kit
      name: "fm", bpm: 112, swing: 0, root: 64,
      chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]], comp: "x.......x.......",
      lead: { oct: 0, div: 2, notes: "12 . 14 15 . 14 12 10 | 7 - - . 10 12 . . | 12 . 14 15 . 17 19 . | 17 15 14 - 11 - . ." },
      bass: { oct: -24, div: 2, notes: "0 0 12 0 . 0 10 12 | -4 -4 8 -4 . -4 7 8 | -2 -2 10 -2 . -2 9 10 | -5 -5 7 -5 . 2 -1 ." },
      arp: null, kick: "k.....k.k.......", noise: "h.h.s.h.h.h.s.h.",
      inst: { lead: ["sine", 0.004, 0.35, 0.35, 0.12, 0.15, 0, 2, 2.2], bass: ["sawtooth", 0.002, 0.09, 0.15, 0.05, 0.26],
        arp: null, pad: ["triangle", 0.2, 0.8, 0.6, 0.4, 0.06], cutoff: 2200, detune: [0, 4, -4], kick: 0.5, noise: 0.22 } },
    { // 4 · 1996-1999 · breakbeat-lite: a broken kit with a little swing, saw stabs, a sparse lead
      name: "break", bpm: 128, swing: 0.08, root: 55,
      chords: [[0, 3, 10], [-4, 3, 7], [-7, 0, 3], [-2, 2, 5]], comp: "x.....x...x.....",
      lead: { oct: 0, div: 2, notes: "15 . . 14 . 10 . . | . . 12 . 10 . 7 . | 15 . . 17 . 19 . 17 | 15 - - . . . . ." },
      bass: { oct: -24, div: 2, notes: "0 . . 0 . . 12 . | -4 . . -4 . . 8 . | -7 . . -7 . . 5 . | -2 . . -2 . 2 -2 ." },
      arp: null, kick: "k.....k...k.....", noise: "h.h.s.h.h.hhs.oh",
      inst: { lead: ["triangle", 0.01, 0.3, 0.5, 0.1, 0.14], bass: ["sawtooth", 0.004, 0.2, 0.5, 0.06, 0.25],
        arp: null, pad: ["sawtooth", 0.005, 0.18, 0.2, 0.12, 0.07], cutoff: 1800, detune: [-5, 0, 5], kick: 0.55, noise: 0.24 } },
    { // 5 · 2000-2007 · clean electronic: four on the floor, offbeat hats, a plucked arp, soft pads
      name: "clean", bpm: 122, swing: 0, root: 53,
      chords: [[0, 4, 11], [-3, 0, 7], [5, 9, 14], [7, 11, 14]], comp: "x...............",
      lead: { oct: 12, div: 4, notes: "12 . 16 . | 14 . . . | 17 . 16 14 | 12 . . ." },
      bass: { oct: -24, div: 2, notes: "0 . 0 . 0 . 12 . | -3 . -3 . -3 . 9 . | 5 . 5 . 5 . 17 . | 7 . 7 . 7 . 19 ." },
      arp: { oct: 0, div: 1, notes: "0 1 2 4 2 1 0 2" }, kick: "k...k...k...k...", noise: "..h.s.h...h.s.h.",
      inst: { lead: ["sine", 0.02, 0.5, 0.5, 0.2, 0.12], bass: ["sine", 0.003, 0.2, 0.6, 0.05, 0.42],
        arp: ["triangle", 0.002, 0.1, 0.1, 0.05, 0.07], pad: ["triangle", 0.4, 1, 0.7, 0.6, 0.06], cutoff: 3000, detune: [0, 5, -5], kick: 0.5, noise: 0.14 } },
    { // 6 · 31 Oct 2008 · the whitepaper: slow, calm and thoughtful, an electric-piano-ish sine, no drums
      name: "paper", bpm: 76, swing: 0, root: 57,
      chords: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]], comp: "x...............",
      lead: { oct: 0, div: 2, notes: "7 . . . 9 . 11 . | 12 . . . . . . . | 4 . . . 7 . 9 . | 11 . . 9 7 . . ." },
      bass: { oct: -24, div: 8, notes: "0 . | -3 . | -7 . | -5 ." },
      arp: { oct: 0, div: 2, notes: "0 1 2 1 3 2 1 2" }, kick: "", noise: "",
      inst: { lead: ["sine", 0.006, 0.9, 0.15, 0.6, 0.15], bass: ["sine", 0.05, 1.2, 0.6, 0.6, 0.32],
        arp: ["triangle", 0.004, 0.4, 0.1, 0.3, 0.05], pad: ["sine", 0.9, 1.6, 0.8, 1.2, 0.07], cutoff: 1400, detune: [0, 3, -3], kick: 0, noise: 0 } },
    { // 7 · 3-12 Jan 2009 · genesis: a gentle music-box epilogue over a held pad
      name: "genesis", bpm: 68, swing: 0, root: 62,
      chords: [[0, 4, 7], [0, 5, 9], [-3, 0, 4], [-5, -1, 2]], comp: "x...............",
      lead: { oct: 12, div: 4, notes: "12 . 11 9 | 7 . . . | 9 . 7 4 | 2 . . ." },
      bass: { oct: -24, div: 16, notes: "0 | 0 | -3 | -5" },
      arp: { oct: 12, div: 2, notes: "0 2 1 3 2 4 3 1" }, kick: "", noise: "",
      inst: { lead: ["sine", 0.004, 0.7, 0.1, 0.5, 0.1], bass: ["sine", 0.3, 2, 0.7, 1, 0.26],
        arp: ["triangle", 0.002, 0.35, 0.05, 0.3, 0.05], pad: ["sine", 1.2, 2, 0.8, 1.5, 0.06], cutoff: 1200, detune: [0, 2, -2], kick: 0, noise: 0 } }
  ];
  const NOISE_HITS = { h: [8000, 0.9, 0.025, 0.5], o: [7500, 0.8, 0.12, 0.45], s: [1700, 0.6, 0.08, 1], b: [3500, 0.5, 0.07, 0.45] };
  const NOISE_CODES = "hosb";

  // Parsed once at load into typed tables: a frequency per token (REST, HOLD), a frequency per bar and token for an
  // arp, and a code per step for the drums, so a step is only table reads.
  const tokens = (text) => text.split(/\s+/).filter((t) => t && t !== "|");
  const compileTrack = (track, root) => {
    const list = tokens(track.notes), f = new Float32Array(list.length);
    for (let i = 0; i < list.length; i++) f[i] = list[i] === "." ? REST : list[i] === "-" ? HOLD : hz(root + track.oct + Number(list[i]));
    return { div: track.div, f };
  };
  const compileArp = (track, root, chords) => {
    const list = tokens(track.notes), f = new Float32Array(list.length * chords.length);
    for (let b = 0; b < chords.length; b++) for (let i = 0; i < list.length; i++) {
      const t = list[i], d = Number(t);
      f[b * list.length + i] = t === "." ? REST : t === "-" ? HOLD : hz(root + track.oct + chords[b][d % 3] + 12 * Math.floor(d / 3));
    }
    return { div: track.div, f, length: list.length };
  };
  const compileHits = (text, codes) => {
    const out = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) out[i] = codes.indexOf(text[i]) + 1;
    return out;
  };
  const instrument = (a) => a && { type: a[0], attack: a[1], decay: a[2], sustain: a[3], release: a[4], level: a[5], glide: a[6] || 0, ratio: a[7] || 0, depth: a[8] || 0 };
  const compile = (theme) => {
    const chords = new Float32Array(theme.chords.length * 3);
    for (let b = 0; b < theme.chords.length; b++) for (let k = 0; k < 3; k++) chords[b * 3 + k] = hz(theme.root - 12 + theme.chords[b][k]);
    const i = theme.inst;
    return {
      name: theme.name, bpm: theme.bpm, swing: theme.swing, stepSeconds: 60 / theme.bpm / 4, steps: STEPS, bars: theme.chords.length,
      chords, comp: compileHits(theme.comp, "x"),
      lead: compileTrack(theme.lead, theme.root), bass: compileTrack(theme.bass, theme.root),
      arp: theme.arp ? compileArp(theme.arp, theme.root, theme.chords) : null,
      kick: compileHits(theme.kick, "k"), noise: compileHits(theme.noise, NOISE_CODES),
      inst: { lead: instrument(i.lead), bass: instrument(i.bass), arp: instrument(i.arp), pad: instrument(i.pad),
        cutoff: i.cutoff || 1500, detune: i.detune || [0, 0, 0], kick: i.kick, noise: i.noise }
    };
  };
  const COMPILED = THEMES.map(compile);

  // --- Pure scheduling ----------------------------------------------------------------------------------------------
  // Which steps to schedule now: every step from the cursor whose time falls before now + ahead, written into
  // `times` and `steps` (at most their length), the cursor moved past them. A step already in the past (a throttled
  // timer, a hidden tab) is skipped, never played late or twice. Odd steps are pushed later by `swing` of a step.
  const plan = (cursor, now, ahead, stepSeconds, swing, length, times, steps) => {
    if (cursor.time < now) {
      const missed = Math.ceil((now - cursor.time) / stepSeconds - 1e-9);
      cursor.time += missed * stepSeconds;
      cursor.step = (cursor.step + missed) % length;
    }
    let n = 0;
    while (n < times.length && cursor.time < now + ahead) {
      times[n] = cursor.time + (cursor.step & 1 ? swing * stepSeconds : 0);
      steps[n] = cursor.step;
      n++;
      cursor.time += stepSeconds;
      cursor.step = (cursor.step + 1) % length;
    }
    return n;
  };
  // Each era's bus level: the era playing at full (lower when calm), every other era silent.
  const busTargets = (era, calm, out) => {
    for (let i = 0; i < ERAS; i++) out[i] = i === era ? MUSIC * (calm ? CALM_MUSIC : 1) : 0;
    return out;
  };
  // The boat per era, from the table in BUILD-PLAN.md: a rowboat has no motor (only water), the concept boat hums.
  const ENGINES = [
    { wave: "sawtooth", motor: 0, base: 40, span: 30, putt: 0, water: 0.16 },
    { wave: "sawtooth", motor: 0.10, base: 46, span: 60, putt: 0.5, water: 0.12 },
    { wave: "sawtooth", motor: 0.11, base: 55, span: 80, putt: 0.4, water: 0.13 },
    { wave: "square", motor: 0.08, base: 70, span: 120, putt: 0.25, water: 0.14 },
    { wave: "sawtooth", motor: 0.12, base: 60, span: 140, putt: 0.2, water: 0.15 },
    { wave: "sawtooth", motor: 0.10, base: 65, span: 120, putt: 0.15, water: 0.14 },
    { wave: "sine", motor: 0.12, base: 110, span: 160, putt: 0, water: 0.12 },
    { wave: "sine", motor: 0.10, base: 100, span: 140, putt: 0, water: 0.10 }
  ];
  // The engine voice's targets for a throttle (0..1) and boost, written into `out`.
  const engineTarget = (profile, throttle, boost, out) => {
    const t = clamp(throttle, 0, 1), b = boost ? 1 : 0;
    out.freq = profile.base + profile.span * t * (1 + 0.3 * b);
    out.level = profile.motor * (0.3 + 0.7 * t) * (1 + 0.25 * b);
    out.cutoff = 300 + 1600 * t + 900 * b;
    out.water = profile.water * (0.15 + 0.85 * t) * (1 + 0.35 * b);
    out.putt = profile.putt * (1 - 0.6 * t);
    out.puttRate = 3 + out.freq / 10;
    return out;
  };

  // --- Instance -----------------------------------------------------------------------------------------------------
  const create = () => {
    let ctx = null, master = null, musicBus = null, engineBus = null, sfxBus = null, timer = 0, ready = false;
    let era = 0, calm = false, engineOn = true, throttle = 0, boost = false, volume = 1, current = 0;
    const decks = [], cueVoices = [], targets = new Float32Array(ERAS);
    const times = new Float64Array(PLAN_SLOTS), steps = new Int16Array(PLAN_SLOTS);
    const eng = { freq: 0, level: 0, cutoff: 0, water: 0, putt: 0, puttRate: 0 }, applied = { t: -1, b: false };
    const engine = { osc: null, sub: null, filter: null, gain: null, lfo: null, lfoGain: null, water: null, waterFilter: null };
    let noiseVoice = null, cueNext = 0, paused = false;
    // Every node `build` starts (oscillators, noise loops), stopped and disconnected by `dispose`. Fixed length.
    const sources = [];
    const stats = { ready: false, era: 0, active: 0, scheduled: 0, contexts: 0, sources: 0 };

    const build = () => {
      ctx = new AudioContext();
      stats.contexts++;
      current = 0; cueNext = 0;
      const out = BL.sound.output(ctx);
      const gain = (value, to) => { const g = ctx.createGain(); g.gain.value = value; if (to) g.connect(to); return g; };
      const filter = (type, freq, q, to) => {
        const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; f.connect(to); return f;
      };
      const osc = (type, freq, to) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.connect(to); o.start(); sources.push(o); return o; };
      master = gain(MASTER * volume, out);
      musicBus = gain(paused ? 0 : 1, master);
      engineBus = gain(paused ? 0 : calm ? CALM_ENGINE : 1, master);
      sfxBus = gain(SFX, master);
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * NOISE_SECONDS), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = (to) => { const s = ctx.createBufferSource(); s.buffer = buffer; s.loop = true; s.connect(to); s.start(); sources.push(s); return s; };
      const voice = (to) => { const g = gain(0, to); return { osc: osc("sine", 220, g), gain: g, inst: null }; };
      for (let d = 0; d < 2; d++) {
        const bus = gain(0, musicBus), drums = gain(calm ? CALM_DRUMS : 1, bus);
        const lead = voice(bus), modGain = gain(0, lead.osc.frequency);
        lead.mod = osc("sine", 440, modGain); lead.modGain = modGain;
        const padGain = gain(0, bus), padFilter = filter("lowpass", 1500, 0.7, padGain), pad = [];
        for (let k = 0; k < 3; k++) pad.push(osc("sawtooth", 220, padFilter));
        const kickGain = gain(0, drums), noiseGain = gain(0, drums), noiseFilter = filter("bandpass", 8000, 0.9, noiseGain);
        decks.push({
          bus, drums, lead, bass: voice(bus), arp: voice(bus), pad, padGain, padFilter,
          kick: osc("sine", 60, kickGain), kickGain, noiseSrc: noise(noiseFilter), noiseFilter, noiseGain,
          era: -1, active: false, until: 0, fadeAt: 0, cursor: { time: 0, step: 0 }
        });
      }
      // The engine: a motor and its sub through a lowpass, putting by an LFO on its level; the water's wash beside it.
      engine.gain = gain(0, engineBus);
      engine.filter = filter("lowpass", 400, 1.2, engine.gain);
      engine.osc = osc("sawtooth", 50, engine.filter);
      engine.sub = osc("square", 25, gain(0.4, engine.filter));
      engine.lfoGain = gain(0, engine.gain.gain);
      engine.lfo = osc("sine", 6, engine.lfoGain);
      engine.water = gain(0, engineBus);
      engine.waterFilter = filter("bandpass", 600, 0.6, engine.water);
      noise(engine.waterFilter);
      for (let i = 0; i < CUE_VOICES; i++) {
        const g = gain(0, sfxBus);
        cueVoices.push({ osc: osc("sine", 440, g), gain: g, until: 0 });
      }
      const ng = gain(0, sfxBus), nf = filter("bandpass", 1200, 0.5, ng);
      noiseVoice = { src: noise(nf), filter: nf, gain: ng, until: 0 };
      ready = stats.ready = true;
      stats.sources = sources.length;
      const now = ctx.currentTime;
      startDeck(decks[0], era, now + 0.05);
      current = 0;
      applyBuses(now, 0.4);
      applyEngineProfile();
      applied.t = -1;
      setThrottle(throttle, boost);
      timer = setInterval(tick, TICK_MS);
      tick();
    };

    // --- Music ---
    const setType = (v, inst) => { v.inst = inst; if (inst) v.osc.type = inst.type; };
    const startDeck = (d, e, at) => {
      const th = COMPILED[e], inst = th.inst;
      d.era = e; d.active = true; d.until = Infinity; d.fadeAt = at;
      d.cursor.time = at; d.cursor.step = 0;
      setType(d.lead, inst.lead); setType(d.bass, inst.bass); setType(d.arp, inst.arp);
      d.lead.modGain.gain.setValueAtTime(0, at);
      if (inst.pad) for (let k = 0; k < 3; k++) { d.pad[k].type = inst.pad.type; d.pad[k].detune.setValueAtTime(inst.detune[k], at); }
      d.padFilter.frequency.setValueAtTime(inst.cutoff, at);
    };
    // Silence a deck quickly so it can carry another era: its pending notes are cancelled and its voices let go.
    const cut = (param, now) => { param.cancelScheduledValues(now); param.setTargetAtTime(0, now, 0.015); };
    const hush = (d, now) => {
      cut(d.lead.gain.gain, now); cut(d.bass.gain.gain, now); cut(d.arp.gain.gain, now); cut(d.padGain.gain, now);
      cut(d.kickGain.gain, now); cut(d.noiseGain.gain, now); cut(d.bus.gain, now); cut(d.lead.modGain.gain, now);
    };
    const release = (d, now) => {
      d.lead.gain.gain.setTargetAtTime(0, now, 0.05); d.bass.gain.gain.setTargetAtTime(0, now, 0.05);
      d.arp.gain.gain.setTargetAtTime(0, now, 0.05); d.padGain.gain.setTargetAtTime(0, now, 0.1);
    };
    const applyBuses = (now, tau) => {
      busTargets(era, calm, targets);
      for (let i = 0; i < decks.length; i++) {
        const d = decks[i];
        d.bus.gain.setTargetAtTime(d.active ? targets[d.era] : 0, Math.max(now, d.fadeAt), tau);
      }
    };
    const note = (v, f, t) => {
      const p = v.inst, g = v.gain.gain;
      if (f === HOLD) return;
      if (f === REST) { g.setTargetAtTime(0, t, p.release / 3 + 0.005); return; }
      if (p.glide) v.osc.frequency.setTargetAtTime(f, t, p.glide);
      else v.osc.frequency.setValueAtTime(f, t + 0.006);
      if (v.modGain && p.depth) {
        v.mod.frequency.setValueAtTime(f * p.ratio, t + 0.006);
        v.modGain.gain.setValueAtTime(f * p.depth, t + 0.006);
        v.modGain.gain.setTargetAtTime(f * p.depth * 0.15, t + 0.01, p.decay / 2);
      }
      g.setTargetAtTime(0, t, 0.003);
      g.setTargetAtTime(p.level, t + 0.008, p.attack / 3 + 0.001);
      g.setTargetAtTime(p.level * p.sustain, t + 0.008 + p.attack, p.decay);
    };
    const track = (v, tr, s, t, offset = 0, length = tr ? tr.f.length : 0) => {
      if (!tr || !v.inst || s % tr.div) return;
      note(v, tr.f[offset + ((s / tr.div) | 0) % length], t);
    };
    const playStep = (d, s, t) => {
      const th = COMPILED[d.era], inst = th.inst, bar = ((s / BAR) | 0) % th.bars;
      track(d.lead, th.lead, s, t);
      track(d.bass, th.bass, s, t);
      if (th.arp) track(d.arp, th.arp, s, t, bar * th.arp.length, th.arp.length);
      if (inst.pad && th.comp.length && th.comp[s % BAR % th.comp.length]) {
        const p = inst.pad, g = d.padGain.gain;
        for (let k = 0; k < 3; k++) d.pad[k].frequency.setValueAtTime(th.chords[bar * 3 + k], t + 0.004);
        g.setTargetAtTime(0, t, 0.004);
        g.setTargetAtTime(p.level, t + 0.006, p.attack / 3 + 0.001);
        g.setTargetAtTime(p.level * p.sustain, t + 0.006 + p.attack, p.decay);
      }
      if (inst.kick && th.kick.length && th.kick[s % th.kick.length]) {
        d.kick.frequency.setValueAtTime(150, t);
        d.kick.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        d.kickGain.gain.setTargetAtTime(inst.kick, t, 0.002);
        d.kickGain.gain.setTargetAtTime(0, t + 0.02, 0.07);
      }
      const code = inst.noise && th.noise.length ? th.noise[s % th.noise.length] : 0;
      if (code) {
        const hit = NOISE_HITS[NOISE_CODES[code - 1]];
        d.noiseFilter.frequency.setValueAtTime(hit[0], t);
        d.noiseFilter.Q.setValueAtTime(hit[1], t);
        d.noiseGain.gain.setTargetAtTime(inst.noise * hit[3], t, 0.002);
        d.noiseGain.gain.setTargetAtTime(0, t + 0.01, hit[2]);
      }
      stats.scheduled++;
    };
    const tick = () => {
      // Nothing to schedule while the context is suspended (its clock stands still) or the voyage is paused; on
      // carrying on, `plan` skips the steps that fell in the gap rather than playing them late.
      if (!ready || paused || ctx.state !== "running") return;
      const now = ctx.currentTime;
      let active = 0;
      for (let i = 0; i < decks.length; i++) {
        const d = decks[i];
        if (!d.active) continue;
        if (i !== current && now > d.until) { d.active = false; release(d, now); continue; }
        active++;
        const th = COMPILED[d.era];
        let n;
        do {
          n = plan(d.cursor, now, LOOKAHEAD, th.stepSeconds, th.swing, th.steps, times, steps);
          for (let k = 0; k < n; k++) playStep(d, steps[k], times[k]);
        } while (n === PLAN_SLOTS);
      }
      stats.active = active;
    };

    const setEra = (e) => {
      e = clamp(e | 0, 0, ERAS - 1);
      if (e === era && (!ready || decks[current].era === e)) return;
      era = stats.era = e;
      if (!ready) return;
      const now = ctx.currentTime, cur = decks[current], other = decks[1 - current];
      if (other.active && other.era === e) {
        other.until = Infinity; other.fadeAt = now;
      } else {
        if (other.active) hush(other, now);
        startDeck(other, e, now + (other.active ? 0.08 : 0.03));
      }
      cur.until = now + FADE + 0.4; cur.fadeAt = now;
      current = 1 - current;
      applyBuses(now, FADE / 4);
      applyEngineProfile();
      applied.t = -1;
      setThrottle(throttle, boost);
    };

    // --- Engine ---
    const applyEngineProfile = () => {
      if (!ready) return;
      const p = ENGINES[era];
      engine.osc.type = p.wave;
    };
    const setThrottle = (t, b) => {
      throttle = clamp(+t || 0, 0, 1); boost = !!b;
      if (!ready) return;
      if (Math.abs(throttle - applied.t) < 0.004 && boost === applied.b) return;
      applied.t = throttle; applied.b = boost;
      const now = ctx.currentTime, on = engineOn ? 1 : 0;
      engineTarget(ENGINES[era], throttle, boost, eng);
      engine.osc.frequency.setTargetAtTime(eng.freq, now, 0.12);
      engine.sub.frequency.setTargetAtTime(eng.freq / 2, now, 0.12);
      engine.filter.frequency.setTargetAtTime(eng.cutoff, now, 0.1);
      engine.gain.gain.setTargetAtTime(eng.level * on, now, 0.1);
      engine.lfo.frequency.setTargetAtTime(eng.puttRate, now, 0.2);
      engine.lfoGain.gain.setTargetAtTime(eng.level * eng.putt * on, now, 0.2);
      engine.water.gain.setTargetAtTime(eng.water * on, now, 0.15);
      engine.waterFilter.frequency.setTargetAtTime(500 + throttle * 900, now, 0.15);
    };
    const setEngine = (on) => { engineOn = !!on; applied.t = -1; setThrottle(throttle, boost); };
    const setCalm = (on) => {
      calm = !!on;
      if (!ready) return;
      const now = ctx.currentTime;
      for (let i = 0; i < decks.length; i++) decks[i].drums.gain.setTargetAtTime(calm ? CALM_DRUMS : 1, now, 0.3);
      engineBus.gain.setTargetAtTime(paused ? 0 : calm ? CALM_ENGINE : 1, now, 0.3);
      applyBuses(now, 0.3);
    };
    const setVolume = (v) => {
      volume = clamp(+v || 0, 0, 1);
      if (ready) master.gain.setTargetAtTime(MASTER * volume, ctx.currentTime, 0.05);
    };
    // Pause (the voyage's P, or a held ride): the music and the engine fade out and the sequencer stops scheduling;
    // cues still sound. Carrying on fades them back in at the current era, from the next step.
    const setPaused = (on) => {
      paused = !!on;
      if (!ready) return;
      const now = ctx.currentTime;
      musicBus.gain.setTargetAtTime(paused ? 0 : 1, now, 0.12);
      engineBus.gain.setTargetAtTime(paused ? 0 : calm ? CALM_ENGINE : 1, now, 0.12);
      if (paused) for (let i = 0; i < decks.length; i++) if (decks[i].active) release(decks[i], now);
    };

    // --- Cues ---
    const cueVoice = () => {
      const now = ctx.currentTime;
      for (let i = 0; i < CUE_VOICES; i++) {
        const v = cueVoices[(cueNext + i) % CUE_VOICES];
        if (v.until <= now) { cueNext = (cueNext + i + 1) % CUE_VOICES; return v; }
      }
      const v = cueVoices[cueNext];
      cueNext = (cueNext + 1) % CUE_VOICES;
      return v;
    };
    // One tone on a pooled voice: f0 sliding to f1 over attack + hold + release, from `delay` seconds on.
    const blip = (type, f0, f1, attack, hold, release, level, delay = 0) => {
      const t = ctx.currentTime + delay, v = cueVoice(), end = t + attack + hold + release;
      v.osc.type = type;
      v.osc.frequency.cancelScheduledValues(t);
      v.osc.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) v.osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), end);
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setValueAtTime(0, t);
      v.gain.gain.linearRampToValueAtTime(level, t + attack);
      v.gain.gain.setValueAtTime(level, t + attack + hold);
      v.gain.gain.linearRampToValueAtTime(0, end);
      v.until = end + 0.02;
    };
    const hiss = (f0, f1, q, level, attack, length, delay = 0) => {
      const t = ctx.currentTime + delay, v = noiseVoice;
      v.filter.frequency.cancelScheduledValues(t);
      v.filter.frequency.setValueAtTime(f0, t);
      v.filter.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + length);
      v.filter.Q.setValueAtTime(q, t);
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setValueAtTime(0, t);
      v.gain.gain.linearRampToValueAtTime(level, t + attack);
      v.gain.gain.setTargetAtTime(0, t + attack, length / 4);
      v.until = t + length;
    };
    // A dial-up-style handshake, written for this module from generic phone-line signal types: a line tone, a run
    // of two-tone keypad beeps, an answer tone, a warbling carrier and a burst of hiss as the line settles.
    const DIGITS = [[697, 1336], [770, 1209], [852, 1477], [697, 1209], [941, 1336], [770, 1477], [852, 1336]];
    const pairOn = (a, b, f1, f2, t, length, level) => {
      a.osc.frequency.setValueAtTime(f1, t); b.osc.frequency.setValueAtTime(f2, t);
      a.gain.gain.setTargetAtTime(level, t, 0.003); b.gain.gain.setTargetAtTime(level, t, 0.003);
      a.gain.gain.setTargetAtTime(0, t + length, 0.004); b.gain.gain.setTargetAtTime(0, t + length, 0.004);
    };
    const clear = (v, now) => { v.osc.type = "sine"; v.osc.frequency.cancelScheduledValues(now); v.gain.gain.cancelScheduledValues(now); v.gain.gain.setValueAtTime(0, now); };
    const modem = () => {
      const now = ctx.currentTime, a = cueVoice(), b = cueVoice();
      clear(a, now); clear(b, now);
      let t = now + 0.02;
      pairOn(a, b, 350, 440, t, 0.5, 0.05); t += 0.62;
      for (let i = 0; i < DIGITS.length; i++) { pairOn(a, b, DIGITS[i][0], DIGITS[i][1], t, 0.08, 0.06); t += 0.13; }
      t += 0.35;
      a.osc.type = "sine";
      a.osc.frequency.setValueAtTime(2100, t); a.gain.gain.setTargetAtTime(0.05, t, 0.004); a.gain.gain.setTargetAtTime(0, t + 0.55, 0.01);
      t += 0.7;
      for (let i = 0; i < 14; i++) a.osc.frequency.setValueAtTime(i & 1 ? 1650 : 980, t + i * 0.045);
      a.gain.gain.setTargetAtTime(0.05, t, 0.004);
      b.osc.frequency.setValueAtTime(1200, t + 0.3); b.osc.frequency.linearRampToValueAtTime(2400, t + 0.63);
      b.gain.gain.setTargetAtTime(0.03, t + 0.3, 0.01); b.gain.gain.setTargetAtTime(0, t + 0.63, 0.01);
      a.gain.gain.setTargetAtTime(0, t + 0.63, 0.01);
      t += 0.7;
      hiss(2600, 1500, 0.4, 0.12, 0.02, 1, t - ctx.currentTime);
      for (let i = 0; i < 6; i++) a.osc.frequency.setValueAtTime(i & 1 ? 1800 : 2250, t + i * 0.12);
      a.gain.gain.setTargetAtTime(0.025, t, 0.01); a.gain.gain.setTargetAtTime(0, t + 0.75, 0.05);
      a.until = b.until = t + 1;
    };
    const cues = {
      splash: () => {
        hiss(2600, 380, 0.45, 0.5, 0.01, 0.7);
        blip("sine", 130, 48, 0.005, 0.05, 0.35, 0.35);
        hiss(1800, 500, 0.6, 0.22, 0.01, 0.4, 0.22);
      },
      modem,
      board: () => {
        blip("triangle", hz(72), hz(72), 0.005, 0.06, 0.25, 0.14);
        blip("triangle", hz(79), hz(79), 0.005, 0.08, 0.35, 0.12, 0.09);
      },
      step: () => blip("triangle", 190, 90, 0.002, 0.02, 0.06, 0.12),
      stamp: () => { blip("square", 140, 70, 0.003, 0.04, 0.14, 0.08); blip("sine", 70, 49, 0.003, 0.05, 0.2, 0.14); },
      link: () => blip("triangle", 880, 1320, 0.005, 0.1, 0.25, 0.05),
      broken: () => { blip("sawtooth", 220, 132, 0.01, 0.2, 0.4, 0.04); blip("sawtooth", 233, 140, 0.01, 0.2, 0.4, 0.04); }
    };
    const cue = (name) => {
      if (!ready || ctx.state === "closed") return false;
      const fn = cues[name];
      if (!fn) return false;
      fn();
      return true;
    };

    // Builds only once the browser has counted a real user gesture (call it from the gesture's own handler), and
    // only with the page-wide mute to route through; later calls resume a context the browser suspended. Calling it
    // again while ready, or with no gesture, does nothing else.
    const wake = () => {
      if (ready) { if (ctx.state === "suspended") ctx.resume().catch(() => {}); return false; }
      if (typeof AudioContext === "undefined" || !BL.sound || !BL.sound.output) return false;
      if (typeof navigator !== "undefined" && navigator.userActivation && !navigator.userActivation.hasBeenActive) return false;
      build();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      return true;
    };
    // Safe to call twice, or before any wake. Stops and disconnects every source, lets go of the buses, closes the
    // context (which also releases the page-wide mute's subscription for it, sound.js) and forgets every node.
    const dispose = () => {
      if (timer) clearInterval(timer);
      timer = 0;
      for (let i = 0; i < sources.length; i++) { const s = sources[i]; try { s.stop(); } catch (_) {} s.disconnect(); }
      sources.length = 0;
      if (master) master.disconnect();
      if (ctx) { const c = ctx; ctx = null; if (c.state !== "closed") Promise.resolve(c.close()).catch(() => {}); }
      ready = stats.ready = false;
      master = musicBus = engineBus = sfxBus = noiseVoice = null;
      decks.length = 0; cueVoices.length = 0; stats.active = 0;
      for (const k in engine) engine[k] = null;
    };
    return {
      wake, setEra, setThrottle, cue, dispose, setEngine, setCalm, setVolume, setPaused, tick, stats,
      get paused() { return paused; },
      get ready() { return ready; },
      get era() { return era; },
      get context() { return ctx; },
      get buses() { return targets; }
    };
  };
  BL.genesisAudio = { create, plan, busTargets, engineTarget, THEMES, COMPILED, ENGINES, ERAS, STEPS, LOOKAHEAD, FADE, MUSIC, REST, HOLD };
})();
