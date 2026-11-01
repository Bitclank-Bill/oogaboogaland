// The Cloud Archive's one sound: the shelves loading in, a short digital-rain cue synthesized on the spot. A low swell,
// a filtered whoosh that follows the racks in, a scatter of high chirps through an echo, and a deep thunk as they lock
// in place. Nothing is sampled. The context opens on the LOAD press (a gesture), goes through the page's gated
// output (sound.js), so the page-wide mute holds, and closes in `dispose`. `play(seconds)` schedules the whole cue
// once; nothing runs per frame.
(() => {
  "use strict";
  const BL = window.BL;
  const CHIRPS = 34, NOTES = [880, 1047, 1175, 1397, 1568, 1760, 2093, 2349];
  const create = () => {
    let ctx = null, out = null;
    const open = () => {
      if (ctx) return ctx.state !== "closed";
      if (typeof AudioContext === "undefined") return false;
      try { ctx = new AudioContext(); } catch { ctx = null; return false; }
      out = BL.sound.output(ctx);
      return true;
    };
    const play = (seconds) => {
      if (!open()) return false;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const t0 = ctx.currentTime + 0.03, end = t0 + seconds;
      const master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(out);
      // The swell: two detuned saws under a low-pass that opens as the racks come in.
      const swell = ctx.createGain(), low = ctx.createBiquadFilter();
      low.type = "lowpass"; low.frequency.setValueAtTime(180, t0); low.frequency.exponentialRampToValueAtTime(900, end - 0.3);
      swell.gain.setValueAtTime(0.0001, t0); swell.gain.exponentialRampToValueAtTime(0.35, end - 0.4); swell.gain.exponentialRampToValueAtTime(0.0001, end + 0.6);
      low.connect(swell); swell.connect(master);
      for (const f of [55, 55.6]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth"; o.frequency.value = f;
        o.connect(low); o.start(t0); o.stop(end + 0.7);
      }
      // The whoosh: noise through a band-pass sweeping up as the racks rush in, then down as they brake.
      const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const hiss = ctx.createBufferSource(), band = ctx.createBiquadFilter(), whoosh = ctx.createGain();
      hiss.buffer = noise; hiss.loop = true;
      band.type = "bandpass"; band.Q.value = 1.4;
      band.frequency.setValueAtTime(300, t0); band.frequency.exponentialRampToValueAtTime(2600, t0 + seconds * 0.45); band.frequency.exponentialRampToValueAtTime(220, end);
      whoosh.gain.setValueAtTime(0.0001, t0); whoosh.gain.exponentialRampToValueAtTime(0.5, t0 + seconds * 0.4); whoosh.gain.exponentialRampToValueAtTime(0.0001, end + 0.2);
      hiss.connect(band); band.connect(whoosh); whoosh.connect(master);
      hiss.start(t0); hiss.stop(end + 0.3);
      // The rain: short sine chirps at random through a feedback echo, thinning out as the racks slow.
      const echo = ctx.createDelay(1), feedback = ctx.createGain(), wet = ctx.createGain();
      echo.delayTime.value = 0.19; feedback.gain.value = 0.42; wet.gain.value = 0.5;
      echo.connect(feedback); feedback.connect(echo); echo.connect(wet); wet.connect(master);
      for (let i = 0; i < CHIRPS; i++) {
        const at = t0 + seconds * Math.pow(Math.random(), 1.6), o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(NOTES[(Math.random() * NOTES.length) | 0], at);
        o.frequency.exponentialRampToValueAtTime(o.frequency.value * 0.5, at + 0.09);
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.16, at + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
        o.connect(g); g.connect(master); g.connect(echo);
        o.start(at); o.stop(at + 0.1);
      }
      // The lock: a pitch-dropping thunk as the racks stop.
      const thunk = ctx.createOscillator(), tg = ctx.createGain();
      thunk.type = "sine"; thunk.frequency.setValueAtTime(140, end - 0.05); thunk.frequency.exponentialRampToValueAtTime(38, end + 0.3);
      tg.gain.setValueAtTime(0.0001, end - 0.05); tg.gain.exponentialRampToValueAtTime(0.9, end); tg.gain.exponentialRampToValueAtTime(0.0001, end + 0.45);
      thunk.connect(tg); tg.connect(master);
      thunk.start(end - 0.05); thunk.stop(end + 0.5);
      return true;
    };
    const dispose = () => {
      if (ctx && ctx.state !== "closed") ctx.close().catch(() => {});
      ctx = out = null;
    };
    return { play, dispose };
  };
  BL.cloudArchiveAudio = { create };
})();
