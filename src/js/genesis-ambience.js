// Genesis museum: the hall's ambience. Quiet and calm on purpose: a soft room tone under everything, a slow
// four-note pad that glides to each room's own chord and colour as the visitor walks from the atrium into a gallery,
// and now and then a faint distant bell from that chord (none in Calm). Synthesized and built once: one context made
// after the visitor's first gesture (the browser's rule), a fixed set of voices, the page-wide mute (sound.js), closed
// on dispose. update allocates nothing; nothing here fetches.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const MASTER = 0.05, ROOM = 0.35, PAD = 0.5, BELL = 0.22, GLIDE = 3.5;
  const hz = (semis) => 110 * Math.pow(2, semis / 12);
  // Each room's chord (semitones above A2) and its pad's brightness: the atrium, then the eras in order.
  const ROOMS = [
    { chord: [3, 10, 14, 19], cutoff: 900 },     // atrium: C, G, B, E
    { chord: [0, 7, 12, 16], cutoff: 650 },      // 1956-1969: A, E, A, C#
    { chord: [-2, 5, 9, 14], cutoff: 800 },      // 1970s: G, D, F#, B
    { chord: [5, 12, 15, 19], cutoff: 1300 },    // 1980s: D, A, C, E
    { chord: [2, 9, 14, 17], cutoff: 1000 },     // 1990-1995: B, F#, B, D
    { chord: [-4, 3, 8, 12], cutoff: 1100 },     // 1996-1999: F, C, F, A
    { chord: [7, 14, 19, 23], cutoff: 1500 },    // 2000-2007: E, B, E, G#
    { chord: [3, 7, 10, 15], cutoff: 800 },      // 2008: C, E, G, C
    { chord: [0, 3, 7, 12], cutoff: 600 }        // 2009: A, C, E, A (minor, a cold January)
  ];
  const create = () => {
    let ctx = null, master = null, filter = null, room = -2, bellAt = 0, ready = false;
    const pads = [], bells = [];
    const stats = { ready: false, room: -2, bells: 0 };
    const build = () => {
      ctx = new AudioContext();
      master = ctx.createGain(); master.gain.value = 0; master.connect(BL.sound.output(ctx));
      master.gain.setTargetAtTime(MASTER, ctx.currentTime, 2.5);
      // The room tone: noise, lowpassed to a hush.
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) { last = last * 0.98 + (Math.random() * 2 - 1) * 0.02; d[i] = last * 6; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const hush = ctx.createBiquadFilter(); hush.type = "lowpass"; hush.frequency.value = 380;
      const roomGain = ctx.createGain(); roomGain.gain.value = ROOM;
      src.connect(hush); hush.connect(roomGain); roomGain.connect(master); src.start();
      // The pad: four soft triangles through one lowpass, each breathing slowly at its own rate.
      filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = ROOMS[0].cutoff; filter.Q.value = 0.4;
      const padGain = ctx.createGain(); padGain.gain.value = PAD; filter.connect(padGain); padGain.connect(master);
      for (let k = 0; k < 4; k++) {
        const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
        o.type = "triangle"; o.frequency.value = hz(ROOMS[0].chord[k]); o.detune.value = (k - 1.5) * 4;
        g.gain.value = 0.18; lfo.frequency.value = 0.05 + k * 0.023; depth.gain.value = 0.08;
        lfo.connect(depth); depth.connect(g.gain); o.connect(g); g.connect(filter); o.start(); lfo.start();
        pads.push({ o, g, lfo });
      }
      // Two bell voices, used in turn: a sine with a soft strike and a long fade.
      for (let k = 0; k < 2; k++) {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; g.gain.value = 0; o.connect(g); g.connect(master); o.start();
        bells.push({ o, g });
      }
      ready = stats.ready = true;
    };
    // Called from a gesture (a key, a tap, a click): the context may start now.
    const wake = () => {
      if (ready) { if (ctx.state === "suspended") ctx.resume(); return; }
      if (typeof AudioContext === "undefined" || BL.sound.muted || navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      build();
    };
    // Each frame: the room the visitor is in (-1 the atrium, else the era), and whether Calm is on.
    const update = (dt, era, calm) => {
      if (!ready) return;
      const r = era < 0 ? 0 : era + 1;
      if (r !== room) {
        room = stats.room = r;
        const t = ctx.currentTime, R = ROOMS[r];
        for (let k = 0; k < 4; k++) pads[k].o.frequency.setTargetAtTime(hz(R.chord[k]), t, GLIDE / 3);
        filter.frequency.setTargetAtTime(R.cutoff, t, GLIDE / 3);
      }
      if (calm) return;
      bellAt -= dt;
      if (bellAt > 0) return;
      bellAt = 6 + Math.random() * 8;
      const b = bells[stats.bells++ % 2], t = ctx.currentTime, note = ROOMS[room].chord[Math.floor(Math.random() * 4)] + 24;
      b.o.frequency.setValueAtTime(hz(note), t);
      b.g.gain.cancelScheduledValues(t); b.g.gain.setValueAtTime(0, t);
      b.g.gain.linearRampToValueAtTime(BELL, t + 0.04); b.g.gain.setTargetAtTime(0, t + 0.05, 1.2);
    };
    const dispose = () => { if (ctx) ctx.close(); ctx = null; ready = stats.ready = false; pads.length = bells.length = 0; room = -2; };
    return { wake, update, dispose, stats };
  };
  BL.genesisAmbience = { create, ROOMS, MASTER };
})();
