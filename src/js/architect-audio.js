// The observatory: ventilation, restrained electrical resonance and a nearby monitor bank.
// One pooled graph, independent of screen refreshes; no recordings or per-frame/cue nodes.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const create = () => {
    const channel = BL.sound.channel("room"), voices = [];
    let ctx = null, master = null, bank = null, pan = null, relay = null, crossing = null;
    let enabled = true, disposed = false, timer = 0, since = 0, elapsed = 0, nextTick = 8;
    const gain = (value, to) => {
      const node = ctx.createGain(); node.gain.value = value; node.connect(to); return node;
    };
    const tone = (frequency, level, to) => {
      const volume = gain(level, to), source = ctx.createOscillator();
      source.type = "sine"; source.frequency.value = frequency; source.connect(volume); source.start();
      voices.push(source); return { source, volume };
    };
    const arrive = () => {
      if (!ctx || !enabled || BL.sound.muted || document.hidden) return;
      const now = ctx.currentTime;
      crossing.source.frequency.cancelScheduledValues(now);
      crossing.source.frequency.setValueAtTime(196, now);
      crossing.source.frequency.exponentialRampToValueAtTime(73.4, now + 0.8);
      crossing.volume.gain.cancelScheduledValues(now);
      crossing.volume.gain.setValueAtTime(0, now);
      crossing.volume.gain.linearRampToValueAtTime(0.045, now + 0.09);
      crossing.volume.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    };
    const activate = () => {
      if (disposed || !enabled || document.hidden || BL.sound.muted || typeof AudioContext === "undefined"
        || navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      if (ctx) { if (ctx.state === "suspended") ctx.resume().catch(() => {}); return; }
      ctx = new AudioContext(); master = gain(0, channel.node(ctx));
      tone(73.4, 0.055, master); tone(110.2, 0.018, master);
      pan = ctx.createStereoPanner(); pan.connect(master); bank = gain(0, pan);
      tone(293.7, 0.018, bank); tone(301.1, 0.009, bank);
      const air = ctx.createBiquadFilter(); air.type = "lowpass"; air.frequency.value = 460; air.Q.value = 0.4;
      air.connect(gain(0.035, master));
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), samples = buffer.getChannelData(0);
      const random = BL.math.mulberry32(71403);
      for (let i = 0; i < samples.length; i++) samples[i] = random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true; noise.connect(air); noise.start(); voices.push(noise);
      relay = tone(683, 0, pan); crossing = tone(196, 0, master);
      master.gain.setTargetAtTime(0.65, ctx.currentTime, 0.35); arrive();
    };
    const quiet = () => {
      clearTimeout(timer); timer = 0;
      if (!ctx) return;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now); master.gain.setTargetAtTime(0, now, 0.06);
      timer = setTimeout(() => { timer = 0; if (ctx && ctx.state === "running") ctx.suspend().catch(() => {}); }, 350);
    };
    const refresh = () => {
      if (!enabled || document.hidden || BL.sound.muted) { quiet(); return; }
      clearTimeout(timer); timer = 0; activate();
      if (ctx) master.gain.setTargetAtTime(0.65, ctx.currentTime, 0.25);
    };
    const setActive = (on) => {
      on = !!on; if (enabled === on) return;
      enabled = on; channel.show(on); refresh(); if (on) arrive();
    };
    const update = (dt, camera) => {
      if (!enabled || disposed || document.hidden) return;
      if (!ctx) activate();
      since += dt; elapsed += dt;
      if (!ctx || ctx.state !== "running" || since < 0.1 || BL.sound.muted) return;
      const step = since; since = 0;
      const eye = camera.position, dx = camera.target.x - eye.x, dz = camera.target.z - eye.z;
      const length = Math.max(0.001, Math.hypot(dx, dz)), radius = Math.hypot(eye.x, eye.z);
      // The north-east rack has a slightly louder cooling fan. Its pan follows the listener's right vector.
      const sx = 7.5 - eye.x, sz = -7.5 - eye.z, distance = Math.max(1, Math.hypot(sx, sz));
      pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, (-dz * sx + dx * sz) / (length * distance))), ctx.currentTime, 0.25);
      bank.gain.setTargetAtTime((0.16 + Math.min(1, radius / 9) * 0.6) * (0.9 + Math.sin(elapsed * 0.21) * 0.1), ctx.currentTime, 0.4);
      if ((nextTick -= step) <= 0) {
        nextTick = 9 + Math.random() * 12;
        const now = ctx.currentTime, volume = relay.volume.gain;
        volume.cancelScheduledValues(now); volume.setValueAtTime(0, now);
        volume.linearRampToValueAtTime(0.008, now + 0.004); volume.exponentialRampToValueAtTime(0.0001, now + 0.12);
      }
    };
    const off = BL.sound.subscribe(refresh);
    window.addEventListener("pointerdown", activate, true); window.addEventListener("keydown", activate, true);
    document.addEventListener("visibilitychange", refresh);
    return { update, setActive,
      dispose() {
        disposed = true; clearTimeout(timer); off(); channel.release();
        window.removeEventListener("pointerdown", activate, true); window.removeEventListener("keydown", activate, true);
        document.removeEventListener("visibilitychange", refresh);
        if (ctx) ctx.close().catch(() => {});
        ctx = master = bank = pan = relay = crossing = null; voices.length = 0;
      }
    };
  };
  BL.architectAudio = { create };
})();
