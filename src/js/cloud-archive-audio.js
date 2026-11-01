// The Cloud Archive's one sound: the racks loading in (LOAD), synthesized, nothing sampled. Three candidate cues while
// the owner chooses (`VARIANTS`), each our own, written after the character of reference clips, never from them:
//   dive  - a sine dives from 300 Hz to the sub-bass in a fifth of a second, warbles there while the racks run, and
//           swoops back up as they lock (a fast "jump" warp);
//   slow  - the same warp, slower and heavier, a quiet fifth above it, gliding down through the whole run;
//   cue   - a dark open fifth (E and B) swelling over an E sub drone and digital-rain chirps, ending on a high C bell
//           and a thunk as the racks stop.
// The page's rules: sound is synthesized and pooled (every node is built once, when the context opens; a cue only
// schedules automation on those voices), the context opens only after a gesture the browser has registered
// (`navigator.userActivation`), goes through the page's gated output (sound.js) so the mute holds, and closes in
// `dispose`. `render(context, destination, variant, seconds)` builds the same voices into any context, so an
// OfflineAudioContext can render a cue to listen to outside the game.
(() => {
  "use strict";
  const BL = window.BL;
  const VARIANTS = ["dive", "slow", "cue"];
  const CHIRPS = 28, NOTES = [880, 1047, 1175, 1397, 1568, 1760, 2093, 2349];
  const E1 = 41.2, E3 = 164.8, B3 = 246.9, C5 = 523.3;
  // A gentle tanh curve: warmth on the sine so the sub-bass reads on small speakers.
  const warmth = (amount) => {
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) { const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * amount) / Math.tanh(amount); }
    return curve;
  };
  // Every voice, built once and left running silent; cues move only their gains and frequencies.
  const build = (ctx, destination) => {
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(destination);
    const osc = (type, frequency, to) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = frequency; g.gain.value = 0;
      o.connect(g); g.connect(to); o.start();
      return { o, g };
    };
    // The warp: a sine and a quieter fifth above, through a soft clip and a low-pass.
    const shaper = ctx.createWaveShaper(), warpLow = ctx.createBiquadFilter();
    shaper.curve = warmth(2.2); warpLow.type = "lowpass"; warpLow.frequency.value = 1400;
    shaper.connect(warpLow); warpLow.connect(master);
    const warp = osc("sine", 300, shaper), fifth = osc("triangle", 450, shaper), wobble = osc("sine", 6, warp.o.frequency);
    wobble.g.connect(fifth.o.frequency);
    // The fifth: four saws (two an E, two a B, detuned) under a low-pass that opens, and the E sub drone.
    const padLow = ctx.createBiquadFilter(), pad = ctx.createGain();
    padLow.type = "lowpass"; padLow.frequency.value = 200; padLow.Q.value = 3;
    pad.gain.value = 0; padLow.connect(pad); pad.connect(master);
    const saws = [E3, E3 * 1.004, B3, B3 * 0.996].map((f) => { const s = osc("sawtooth", f, padLow); s.g.gain.value = 0.18; return s; });
    const drone = osc("sine", E1, master);
    // The bell: a high C with a partial, through the echo.
    const echo = ctx.createDelay(1), feedback = ctx.createGain(), wet = ctx.createGain();
    echo.delayTime.value = 0.19; feedback.gain.value = 0.42; wet.gain.value = 0.5;
    echo.connect(feedback); feedback.connect(echo); echo.connect(wet); wet.connect(master);
    const bell = osc("sine", C5, master), bellHigh = osc("sine", C5 * 2.76, master);
    bell.g.connect(echo);
    // The rain: one chirp voice retuned for every chirp, through the echo.
    const chirp = osc("sine", NOTES[0], master);
    chirp.g.connect(echo);
    // The rush: looped noise through a sweeping band-pass.
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const hiss = ctx.createBufferSource(), band = ctx.createBiquadFilter(), rush = ctx.createGain();
    hiss.buffer = noise; hiss.loop = true; band.type = "bandpass"; band.Q.value = 1.4; rush.gain.value = 0;
    hiss.connect(band); band.connect(rush); rush.connect(master); hiss.start();
    // The lock: a thunk that drops in pitch.
    const thunk = osc("sine", 140, master);
    return { ctx, warp, fifth, wobble, padLow, pad, saws, drone, bell, bellHigh, chirp, band, rush, thunk };
  };
  const env = (param, t, points) => {
    param.cancelScheduledValues(t);
    param.setValueAtTime(points[0][1], t + points[0][0]);
    for (let i = 1; i < points.length; i++) param.linearRampToValueAtTime(points[i][1], t + points[i][0]);
  };
  const glide = (param, t, points) => {
    param.cancelScheduledValues(t);
    param.setValueAtTime(points[0][1], t + points[0][0]);
    for (let i = 1; i < points.length; i++) param.exponentialRampToValueAtTime(points[i][1], t + points[i][0]);
  };
  const lock = (v, at) => {
    glide(v.thunk.o.frequency, at, [[0, 140], [0.35, 38]]);
    env(v.thunk.g.gain, at, [[0, 0], [0.02, 0.9], [0.45, 0]]);
  };
  const rushIn = (v, t, s, level) => {
    glide(v.band.frequency, t, [[0, 300], [s * 0.45, 2600], [s, 220]]);
    env(v.rush.gain, t, [[0, 0], [s * 0.4, level], [s, 0.02], [s + 0.2, 0]]);
  };
  // Each cue over `s` seconds from `t`, the racks locking at t + s.
  const CUES = {
    dive(v, t, s) {
      glide(v.warp.o.frequency, t, [[0, 300], [0.22, 46], [s - 0.32, 40], [s, 165]]);
      env(v.warp.g.gain, t, [[0, 0], [0.02, 0.85], [s - 0.05, 0.75], [s + 0.12, 0]]);
      env(v.wobble.g.gain, t, [[0, 0], [0.3, 6], [s - 0.35, 4], [s - 0.3, 0]]);
      env(v.fifth.g.gain, t, [[0, 0]]);
      rushIn(v, t, s, 0.2);
      lock(v, t + s);
    },
    slow(v, t, s) {
      glide(v.warp.o.frequency, t, [[0, 370], [s * 0.35, 80], [s - 0.4, 55], [s, 92]]);
      glide(v.fifth.o.frequency, t, [[0, 555], [s * 0.35, 120], [s - 0.4, 82], [s, 138]]);
      env(v.warp.g.gain, t, [[0, 0], [0.03, 0.85], [s - 0.05, 0.8], [s + 0.2, 0]]);
      env(v.fifth.g.gain, t, [[0, 0], [0.05, 0.18], [s, 0.14], [s + 0.2, 0]]);
      env(v.wobble.g.gain, t, [[0, 0], [s * 0.4, 3.5], [s - 0.4, 3.5], [s - 0.3, 0]]);
      rushIn(v, t, s, 0.14);
      lock(v, t + s);
    },
    cue(v, t, s) {
      env(v.pad.gain, t, [[0, 0], [s * 0.85, 0.55], [s + 0.05, 0.2], [s + 1.4, 0]]);
      glide(v.padLow.frequency, t, [[0, 160], [s * 0.85, 2200], [s + 1.4, 300]]);
      env(v.drone.g.gain, t, [[0, 0], [s * 0.5, 0.5], [s, 0.7], [s + 1.2, 0]]);
      env(v.bell.g.gain, t + s, [[0, 0], [0.01, 0.35], [1.6, 0]]);
      env(v.bellHigh.g.gain, t + s, [[0, 0], [0.01, 0.08], [0.5, 0]]);
      // The chirp voice is retuned for each chirp, earlier ones denser, none after the racks lock.
      const g = v.chirp.g.gain, f = v.chirp.o.frequency;
      g.cancelScheduledValues(t); f.cancelScheduledValues(t);
      g.setValueAtTime(0, t);
      let at = t + 0.05;
      for (let i = 0; i < CHIRPS && at < t + s - 0.15; i++) {
        const note = NOTES[(Math.random() * NOTES.length) | 0];
        f.setValueAtTime(note, at); f.exponentialRampToValueAtTime(note * 0.5, at + 0.09);
        g.setValueAtTime(0, at); g.linearRampToValueAtTime(0.13, at + 0.006); g.linearRampToValueAtTime(0, at + 0.09);
        at += 0.06 + Math.random() * 0.12 * (1 + (at - t) / s);
      }
      rushIn(v, t, s, 0.16);
      lock(v, t + s);
    }
  };
  const render = (ctx, destination, variant, seconds, at = ctx.currentTime + 0.03) => {
    const voices = build(ctx, destination);
    CUES[variant](voices, at, seconds);
    return voices;
  };
  const create = (variant = VARIANTS[0]) => {
    let ctx = null, voices = null;
    const open = () => {
      if (ctx) return ctx.state !== "closed";
      if (typeof AudioContext === "undefined" || navigator.userActivation && !navigator.userActivation.hasBeenActive) return false;
      try { ctx = new AudioContext(); } catch { ctx = null; return false; }
      voices = build(ctx, BL.sound.output(ctx));
      return true;
    };
    const play = (seconds) => {
      if (!open()) return false;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      CUES[variant](voices, ctx.currentTime + 0.03, seconds);
      return true;
    };
    const dispose = () => {
      if (ctx && ctx.state !== "closed") ctx.close().catch(() => {});
      ctx = voices = null;
    };
    return { play, dispose, variant };
  };
  BL.cloudArchiveAudio = { create, render, VARIANTS };
})();
