// The observatory: quiet air, slow harmonic motion and distant glass settling.
// One pooled graph, independent of screen refreshes; no recordings or per-frame/cue nodes.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const create = () => {
    const channel = BL.sound.channel("room"), voices = [];
    channel.show(false);
    let ctx = null, master = null, ambience = null, foundation = null, airLevel = null, airFilter = null, bank = null, pan = null, relay = null, crossing = null, penNoise = null, penBody = null, penTone = null, penFilter = null, acoustics = null;
    let enabled = false, disposed = false, timer = 0, since = 0, elapsed = 0, nextTick = 18;
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
      acoustics = BL.roomAcoustics.create(ctx, master, channel.node(ctx), 0.4);
      ambience = gain(1, master); foundation = gain(1, ambience);
      // Open octaves/fifths instead of close-pitched electrical beats. The room breathes
      // through levels and air colour, leaving speech frequencies mostly empty.
      tone(49, 0.026, foundation); tone(98, 0.008, foundation);
      pan = ctx.createStereoPanner(); pan.connect(ambience); bank = gain(0, pan);
      tone(147, 0.009, bank); tone(196, 0.004, bank);
      airFilter = ctx.createBiquadFilter(); airFilter.type = "lowpass"; airFilter.frequency.value = 720; airFilter.Q.value = 0.4;
      const airHigh = ctx.createBiquadFilter(); airHigh.type = "highpass"; airHigh.frequency.value = 150; airHigh.Q.value = 0.4;
      airHigh.connect(airFilter); airLevel = gain(0.021, ambience); airFilter.connect(airLevel);
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), samples = buffer.getChannelData(0);
      const random = BL.math.mulberry32(71403);
      for (let i = 0; i < samples.length; i++) samples[i] = random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true; noise.connect(airHigh); noise.start(); voices.push(noise);
      penFilter = ctx.createBiquadFilter(); penFilter.type = "bandpass"; penFilter.frequency.value = 3200; penFilter.Q.value = 0.8;
      penNoise = gain(0, master); noise.connect(penFilter); penFilter.connect(penNoise);
      const bodyFilter = ctx.createBiquadFilter(); bodyFilter.type = "bandpass"; bodyFilter.frequency.value = 850; bodyFilter.Q.value = 1.1;
      penBody = gain(0, master); noise.connect(bodyFilter); bodyFilter.connect(penBody);
      penTone = tone(2300, 0, master);
      relay = tone(392, 0, pan); crossing = tone(196, 0, master);
      master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.6); arrive();
    };
    const clickPulse = (volume, at, level, tail) => {
      volume.setValueAtTime(0, at - 0.001);
      volume.linearRampToValueAtTime(level, at);
      volume.exponentialRampToValueAtTime(0.0001, at + tail);
      volume.setValueAtTime(0, at + tail + 0.002);
    };
    const clickEnvelope = (volume, down, up, now, tail) => {
      volume.cancelScheduledValues(now); volume.setValueAtTime(0, now);
      // A dry latch, silence, then a brighter return-stop click: two attacks, never a swelling second beep.
      clickPulse(volume, now + 0.05, down, tail);
      clickPulse(volume, now + 0.17, up, tail * 0.7);
    };
    const click = () => {
      activate();
      if (!ctx || !enabled || disposed || document.hidden || BL.sound.muted) return;
      const now = ctx.currentTime, strength = 0.94 + Math.random() * 0.12;
      // Match the button reaching its stop at 50 ms and springing fully back at 170 ms.
      // Low plastic-body noise gives the press weight; the release is shorter and sharper.
      clickEnvelope(penNoise.gain, 0.16 * strength, 0.2 * strength, now, 0.013);
      clickEnvelope(penBody.gain, 0.12 * strength, 0.065 * strength, now, 0.024);
      clickEnvelope(penTone.volume.gain, 0.008 * strength, 0.005 * strength, now, 0.009);
      const filter = penFilter.frequency, spring = penTone.source.frequency;
      filter.cancelScheduledValues(now); filter.setValueAtTime(3200 * strength, now);
      filter.setValueAtTime(4600 * strength, now + 0.16);
      spring.cancelScheduledValues(now); spring.setValueAtTime(2300 * strength, now);
      spring.setValueAtTime(2300 * strength, now + 0.049);
      spring.exponentialRampToValueAtTime(1600 * strength, now + 0.063);
      spring.setValueAtTime(3100 * strength, now + 0.169);
      spring.exponentialRampToValueAtTime(2200 * strength, now + 0.18);
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
      if (ctx) master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.5);
    };
    const setActive = (on) => {
      on = !!on; if (enabled === on) return;
      const ready = !!ctx;
      enabled = on; channel.show(on); BL.roomAcoustics.setActive(on); refresh(); if (on && ready) arrive();
    };
    const update = (dt, camera, face = false, seated = false) => {
      if (!enabled || disposed || document.hidden) return;
      if (!ctx) activate();
      since += dt; elapsed += dt;
      if (!ctx || ctx.state !== "running" || since < 0.1 || BL.sound.muted) return;
      const step = since; since = 0;
      const eye = camera.position, dx = camera.target.x - eye.x, dz = camera.target.z - eye.z;
      const length = Math.max(0.001, Math.hypot(dx, dz)), radius = Math.hypot(eye.x, eye.z);
      // The north-east rack is a quiet spatial anchor, rather than a constant buzzing foreground.
      const sx = 7.5 - eye.x, sz = -7.5 - eye.z, distance = Math.max(1, Math.hypot(sx, sz));
      pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, (-dz * sx + dx * sz) / (length * distance))), ctx.currentTime, 0.25);
      const now = ctx.currentTime, talking = BL.voice.stats.speaking || BL.voice.stats.hearing > 0;
      ambience.gain.setTargetAtTime(talking ? 0.55 : 1, now, 0.6);
      foundation.gain.setTargetAtTime((face ? 0.68 : 1) * (0.92 + Math.sin(elapsed * 0.17) * 0.08), now, 1.2);
      bank.gain.setTargetAtTime((0.12 + Math.min(1, radius / 9) * 0.35) * (seated ? 0.65 : 1), now, 0.7);
      airFilter.frequency.setTargetAtTime((face ? 1050 : 720) + Math.sin(elapsed * 0.11) * 110, now, 1.2);
      airLevel.gain.setTargetAtTime((face ? 0.026 : 0.021) * (0.9 + Math.sin(elapsed * 0.23) * 0.1), now, 1);
      if ((nextTick -= step) <= 0) {
        nextTick = 18 + Math.random() * 18;
        const volume = relay.volume.gain;
        relay.source.frequency.setValueAtTime(392 * (Math.random() < 0.5 ? 1 : 1.5), now);
        volume.cancelScheduledValues(now); volume.setValueAtTime(0, now);
        volume.linearRampToValueAtTime(0.006, now + 0.025); volume.exponentialRampToValueAtTime(0.0001, now + 2.4);
      }
    };
    const off = BL.sound.subscribe(refresh);
    window.addEventListener("pointerdown", activate, true); window.addEventListener("keydown", activate, true);
    document.addEventListener("visibilitychange", refresh);
    return { update, setActive, click,
      dispose() {
        disposed = true; clearTimeout(timer); off(); BL.roomAcoustics.setActive(false); acoustics?.dispose(); acoustics = null; channel.release();
        window.removeEventListener("pointerdown", activate, true); window.removeEventListener("keydown", activate, true);
        document.removeEventListener("visibilitychange", refresh);
        if (ctx) ctx.close().catch(() => {});
        ctx = master = ambience = foundation = airLevel = airFilter = bank = pan = relay = crossing = penNoise = penBody = penTone = penFilter = null; voices.length = 0;
      }
    };
  };
  BL.architectAudio = { create };
})();
