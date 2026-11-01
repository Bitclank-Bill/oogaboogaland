// Cloud Hopper's score and local effects share one gesture-opened context.
// Fixed voices and one noise loop; music and cues only schedule automation.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const MASTER = 0.45, CLOUD_VOICES = 6, CLOUD_NEAR = 4, CLOUD_FAR = 50, WARN_VOICES = 3, WARN_FAR = 40;
  // Power-up and storm cues: pooled tones and filtered-noise voices, two thunder voices and the rain's bed.
  const TONE_VOICES = 4, AIR_VOICES = 3, THUNDER_VOICES = 2, SOUND_SPEED = 343, THUNDER_FAR = 260, RAIN = 0.055;
  const BACKGROUND_AHEAD = 2, BACKGROUND_MS = 250;
  const create = () => {
    let ctx = null, master = null, musicGain = null, jetGain = null, jetTone = null, jetWhine = null, jetFilter = null, music = null;
    let armed = false, disposed = false, resuming = false, jetOn = false, muted = BL.sound.muted, nextJump = 0;
    let musicStage = "", musicSong = 0, backgroundTimer = 0, rainGain = null, rainOn = false, nextTone = 0, nextAir = 0, nextThunder = 0;
    let musicLevel = 0, musicFrom = 0, musicAt = 0, musicUntil = 0, musicFade = 0.12;
    const jumps = [], clouds = [], warnings = [], tones = [], airs = [], thunders = [];
    const resultStage = value => value === "won" || value === "best" || value === "dq";
    const levelAt = now => musicUntil <= now ? musicLevel
      : musicFrom + (musicLevel - musicFrom) * Math.max(0, (now - musicAt) / (musicUntil - musicAt));
    const applyLevel = () => {
      if (!musicGain) return;
      const gain = musicGain.gain;
      gain.cancelScheduledValues(musicAt); gain.setValueAtTime(musicFrom, musicAt);
      gain.linearRampToValueAtTime(musicLevel, musicUntil);
    };
    // Spatial dock fades and ascent change only the score's mix. Restart a
    // finite ramp from its current level without interrupting notes or echoes.
    const level = (value, seconds = 0.12) => {
      if (disposed || !Number.isFinite(value)) return;
      const target = Math.max(0, Math.min(1, value));
      if (target === musicLevel) return;
      const now = ctx ? ctx.currentTime : 0;
      musicFrom = levelAt(now); musicLevel = target;
      musicFade = Number.isFinite(seconds) ? Math.max(0, seconds) : 0.12;
      musicAt = now; musicUntil = now + musicFade;
      applyLevel();
    };
    const quiet = (effectsOnly = false) => {
      jetOn = false;
      if (!ctx) return;
      const now = ctx.currentTime;
      for (let i = 0; i < jumps.length; i++) {
        const voice = jumps[i];
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(0, now);
      }
      for (const voices of [clouds, warnings, tones, airs]) for (let i = 0; i < voices.length; i++) {
        const voice = voices[i];
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(0, now);
        voice.until = 0;
      }
      for (let i = 0; i < thunders.length; i++) for (const level of [thunders[i].crack.gain, thunders[i].rumble.gain]) {
        level.cancelScheduledValues(now); level.setValueAtTime(0, now);
      }
      rainOn = false;
      if (rainGain) { rainGain.gain.cancelScheduledValues(now); rainGain.gain.setValueAtTime(0, now); }
      if (jetGain) {
        jetGain.gain.cancelScheduledValues(now);
        jetGain.gain.setValueAtTime(0, now);
        jetTone.frequency.cancelScheduledValues(now); jetTone.frequency.setValueAtTime(54, now);
        jetWhine.frequency.cancelScheduledValues(now); jetWhine.frequency.setValueAtTime(220, now);
        jetFilter.frequency.cancelScheduledValues(now); jetFilter.frequency.setValueAtTime(700, now);
      }
      // The score retains its timeline through results and skips unheard notes
      // when a muted or suspended context becomes audible again.
      if (music && !effectsOnly) music.quiet();
    };
    const audible = () => armed && !disposed && !muted && musicStage && ctx && ctx.state === "running";
    const clearBackground = () => {
      if (backgroundTimer) window.clearTimeout(backgroundTimer);
      backgroundTimer = 0;
    };
    // Rendering sleeps in a hidden tab. Keep only the score's AudioParam queue
    // supplied, with enough lead for a delayed background timer wakeup.
    const background = () => {
      backgroundTimer = 0;
      if (!document.hidden || !audible()) return;
      music.tick(BACKGROUND_AHEAD);
      backgroundTimer = window.setTimeout(background, BACKGROUND_MS);
    };
    const syncBackground = () => {
      clearBackground();
      if (document.hidden && audible()) background();
    };
    const stateChanged = () => {
      if (ctx && ctx.state !== "running") quiet();
      syncBackground();
    };
    const open = () => {
      if (ctx || typeof AudioContext === "undefined") return;
      try { ctx = new AudioContext(); } catch { return; }
      master = ctx.createGain();
      master.gain.value = muted ? 0 : MASTER;
      master.connect(ctx.destination);
      const gain = (value, to) => {
        const node = ctx.createGain();
        node.gain.value = value; node.connect(to);
        return node;
      };
      const filter = (type, frequency, q, to) => {
        const node = ctx.createBiquadFilter();
        node.type = type; node.frequency.value = frequency; node.Q.value = q; node.connect(to);
        return node;
      };
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate), data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer; noise.loop = true;
      for (let i = 0; i < 2; i++) {
        const level = gain(0, master), tone = ctx.createOscillator();
        tone.type = "triangle"; tone.frequency.value = 180;
        tone.connect(gain(0.65, level)); tone.start();
        const air = filter("bandpass", 1400, 0.7, gain(0.5, level));
        noise.connect(air);
        jumps.push({ gain: level, tone });
      }
      for (let i = 0; i < CLOUD_VOICES; i++) {
        // A broad, steady wash avoids the old descending nasal hiss.
        const level = gain(0, master), air = filter("lowpass", 1000, 0.45, level);
        noise.connect(filter("highpass", 150, 0.5, air));
        clouds.push({ gain: level, until: 0, level: 0 });
      }
      for (let i = 0; i < WARN_VOICES; i++) {
        // A soft whistle rising over a breath of air: a cloud is about to fade.
        const level = gain(0, master), tone = ctx.createOscillator();
        tone.type = "sine"; tone.frequency.value = 620;
        tone.connect(gain(0.5, level)); tone.start();
        noise.connect(filter("bandpass", 2600, 1.2, gain(0.35, level)));
        warnings.push({ gain: level, tone, until: 0, level: 0 });
      }
      for (let i = 0; i < TONE_VOICES; i++) {
        const level = gain(0, master), tone = ctx.createOscillator();
        tone.type = "sine"; tone.frequency.value = 440;
        tone.connect(level); tone.start();
        tones.push({ gain: level, tone, until: 0 });
      }
      for (let i = 0; i < AIR_VOICES; i++) {
        const level = gain(0, master), band = filter("bandpass", 800, 1.2, level);
        noise.connect(band);
        airs.push({ gain: level, band, until: 0 });
      }
      for (let i = 0; i < THUNDER_VOICES; i++) {
        // A crack in the upper band over a deep rumble, each its own level.
        const crack = gain(0, master), rumble = gain(0, master);
        noise.connect(filter("bandpass", 900, 0.6, crack));
        noise.connect(filter("lowpass", 140, 0.7, rumble));
        thunders.push({ crack, rumble });
      }
      // A storm's rain: a soft hiss under everything while it falls.
      rainGain = gain(0, master);
      noise.connect(filter("highpass", 900, 0.5, filter("lowpass", 5200, 0.5, rainGain)));
      jetGain = gain(0, master);
      // Soft exhaust, a warm motor body and a faint turbine whistle. A small
      // retained flutter keeps the air alive without a harsh sawtooth buzz.
      const jetAir = gain(0.66, jetGain), flutter = ctx.createOscillator();
      jetFilter = filter("lowpass", 700, 0.55, jetAir);
      noise.connect(filter("highpass", 100, 0.7, jetFilter));
      flutter.type = "sine"; flutter.frequency.value = 32;
      flutter.connect(gain(0.045, jetAir.gain)); flutter.start();
      jetTone = ctx.createOscillator();
      jetTone.type = "triangle"; jetTone.frequency.value = 54;
      jetTone.connect(filter("lowpass", 240, 0.7, gain(0.22, jetGain)));
      jetWhine = ctx.createOscillator();
      jetWhine.type = "sine"; jetWhine.frequency.value = 220;
      jetWhine.connect(gain(0.045, jetGain));
      musicGain = gain(0, master);
      musicFrom = 0; musicAt = ctx.currentTime; musicUntil = musicAt + musicFade;
      applyLevel();
      music = BL.cloudHopperMusic.create(ctx, musicGain, noise);
      music.song(musicSong); music.stage(musicStage);
      jetTone.start(); jetWhine.start(); noise.start();
      ctx.addEventListener("statechange", stateChanged);
    };
    // Dock entry and Start/Replay arm audio after the page's first gesture;
    // trusted input retries a browser-suspended context.
    const unlock = () => {
      if (disposed) return;
      armed = true;
      if (document.hidden || navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      open();
      if (ctx && ctx.state !== "running" && ctx.state !== "closed" && !resuming) {
        resuming = true;
        ctx.resume().then(() => { resuming = false; }, () => { resuming = false; });
      }
      syncBackground();
    };
    const ready = () => !document.hidden && audible();
    const stage = (next) => {
      if (disposed || next === musicStage) return;
      if (next !== "dock" && next !== "intro" && next !== "lifting" && next !== "briefing" && next !== "ready" && next !== "running" && !resultStage(next)) { stop(); return; }
      // Finish gameplay effects while the same music loop carries on underneath
      // the results panel, without restarting its beat or cutting its tails.
      if (next === "dock" || next === "intro" || resultStage(next)) quiet(true);
      musicStage = next;
      if (music) music.stage(next);
      syncBackground();
    };
    const tick = () => { if (ready()) music.tick(); };
    // Which level's score plays (0-based). A switch while one plays starts the new score on the next beat and
    // crossfades the two; before the context opens it only chooses the score that will start.
    const song = (index) => {
      if (disposed) return;
      musicSong = index;
      if (music) music.song(index);
    };
    const jump = () => {
      if (!ready()) return;
      const now = ctx.currentTime, voice = jumps[nextJump];
      nextJump = 1 - nextJump;
      const pitch = voice.tone.frequency, level = voice.gain.gain;
      pitch.cancelScheduledValues(now);
      pitch.setValueAtTime(180, now);
      pitch.exponentialRampToValueAtTime(390, now + 0.07);
      pitch.exponentialRampToValueAtTime(240, now + 0.22);
      level.cancelScheduledValues(now);
      level.setValueAtTime(0, now);
      level.linearRampToValueAtTime(0.26, now + 0.012);
      level.exponentialRampToValueAtTime(0.0001, now + 0.22);
      level.setValueAtTime(0, now + 0.23);
    };
    const fade = (distance) => {
      if (!ready() || !Number.isFinite(distance) || distance >= CLOUD_FAR) return;
      const near = Math.max(0, Math.min(1, (CLOUD_FAR - distance) / (CLOUD_FAR - CLOUD_NEAR)));
      const level = 0.18 * near * near, now = ctx.currentTime;
      let voice = null;
      for (let i = 0; i < clouds.length; i++) {
        const candidate = clouds[i];
        if (candidate.until <= now) { voice = candidate; break; }
        if (!voice || candidate.level < voice.level) voice = candidate;
      }
      // Keep a close disappearance audible when several remote ones overlap.
      if (voice.until > now && voice.level > level) return;
      voice.until = now + 0.76; voice.level = level;
      const volume = voice.gain.gain;
      volume.cancelScheduledValues(now);
      volume.setValueAtTime(0, now);
      volume.linearRampToValueAtTime(level, now + 0.14);
      volume.exponentialRampToValueAtTime(0.0001, now + 0.75);
      volume.setValueAtTime(0, now + 0.76);
    };
    // A cloud's warning starts: quieter and nearer-reaching than its fade, the same voice-stealing rule.
    const warn = (distance) => {
      if (!ready() || !Number.isFinite(distance) || distance >= WARN_FAR) return;
      const near = Math.max(0, Math.min(1, (WARN_FAR - distance) / (WARN_FAR - CLOUD_NEAR)));
      const level = 0.11 * near * near, now = ctx.currentTime;
      let voice = null;
      for (let i = 0; i < warnings.length; i++) {
        const candidate = warnings[i];
        if (candidate.until <= now) { voice = candidate; break; }
        if (!voice || candidate.level < voice.level) voice = candidate;
      }
      if (voice.until > now && voice.level > level) return;
      voice.until = now + 0.62; voice.level = level;
      const pitch = voice.tone.frequency, volume = voice.gain.gain;
      pitch.cancelScheduledValues(now);
      pitch.setValueAtTime(620, now);
      pitch.exponentialRampToValueAtTime(980, now + 0.55);
      volume.cancelScheduledValues(now);
      volume.setValueAtTime(0, now);
      volume.linearRampToValueAtTime(level, now + 0.08);
      volume.exponentialRampToValueAtTime(0.0001, now + 0.6);
      volume.setValueAtTime(0, now + 0.62);
    };
    // A pooled tone gliding `from` to `to` Hz over `seconds`, peaking at `peak`, `delay` seconds from now.
    const toneCue = (type, from, to, seconds, peak, delay = 0) => {
      const voice = tones[nextTone], now = ctx.currentTime + delay, pitch = voice.tone.frequency, level = voice.gain.gain;
      nextTone = (nextTone + 1) % tones.length;
      voice.tone.type = type;
      pitch.cancelScheduledValues(now); pitch.setValueAtTime(from, now); pitch.exponentialRampToValueAtTime(to, now + seconds);
      level.cancelScheduledValues(now); level.setValueAtTime(0, now);
      level.linearRampToValueAtTime(peak, now + 0.015);
      level.exponentialRampToValueAtTime(0.0001, now + seconds); level.setValueAtTime(0, now + seconds + 0.01);
    };
    // A pooled breath of noise through a band gliding `from` to `to` Hz.
    const airCue = (from, to, seconds, peak, q, delay = 0) => {
      const voice = airs[nextAir], now = ctx.currentTime + delay, band = voice.band.frequency, level = voice.gain.gain;
      nextAir = (nextAir + 1) % airs.length;
      voice.band.Q.setValueAtTime(q, now);
      band.cancelScheduledValues(now); band.setValueAtTime(from, now); band.exponentialRampToValueAtTime(to, now + seconds);
      level.cancelScheduledValues(now); level.setValueAtTime(0, now);
      level.linearRampToValueAtTime(peak, now + seconds * 0.3);
      level.exponentialRampToValueAtTime(0.0001, now + seconds); level.setValueAtTime(0, now + seconds + 0.01);
    };
    // A power-up taken: a two-note chime, and X-ray's shimmer rising as it comes on.
    const power = (kind) => {
      if (!ready()) return;
      toneCue("triangle", 1320, 1320, 0.16, 0.11); toneCue("triangle", 1980, 1980, 0.24, 0.09, 0.09);
      if (kind === "xray") { toneCue("sine", 520, 1700, 0.7, 0.08, 0.05); airCue(1500, 5200, 0.7, 0.06, 3, 0.05); }
    };
    // X-ray's shimmer falling, two seconds before it ends.
    const xrayEnding = () => {
      if (!ready()) return;
      toneCue("sine", 1700, 480, 0.9, 0.07); airCue(4800, 1300, 0.9, 0.045, 3);
    };
    // The sky feather's gust lifting the Ooga.
    const updraft = () => {
      if (!ready()) return;
      airCue(260, 2600, 0.75, 0.3, 1.1); toneCue("sine", 220, 660, 0.5, 0.05);
    };
    // The bone anchor biting: a stone thunk and the vine taking the strain; `creak` alone two seconds before it lets go.
    const creak = (delay = 0) => { if (ready()) toneCue("sawtooth", 150, 215, 0.45, 0.04, delay); };
    const anchor = () => {
      if (!ready()) return;
      toneCue("sine", 120, 52, 0.4, 0.3); airCue(420, 180, 0.18, 0.16, 0.8); creak(0.14);
    };
    // A lightning strike `distance` metres off: its crack and rumble arrive when its sound would, quieter further off.
    const thunder = (distance) => {
      if (!ready() || !Number.isFinite(distance)) return;
      const voice = thunders[nextThunder], near = Math.max(0.15, Math.min(1, 1 - distance / THUNDER_FAR));
      const now = ctx.currentTime + distance / SOUND_SPEED, crack = voice.crack.gain, rumble = voice.rumble.gain;
      nextThunder = (nextThunder + 1) % thunders.length;
      crack.cancelScheduledValues(now); crack.setValueAtTime(0, now);
      crack.linearRampToValueAtTime(0.22 * near, now + 0.02); crack.exponentialRampToValueAtTime(0.0001, now + 0.4); crack.setValueAtTime(0, now + 0.41);
      rumble.cancelScheduledValues(now); rumble.setValueAtTime(0, now);
      rumble.linearRampToValueAtTime(0.55 * (0.5 + 0.5 * near), now + 0.18);
      rumble.linearRampToValueAtTime(0.32 * (0.5 + 0.5 * near), now + 0.7);
      rumble.exponentialRampToValueAtTime(0.0001, now + 3.2); rumble.setValueAtTime(0, now + 3.21);
    };
    // The storm's rain bed, on while a storm level plays.
    const rain = (on) => {
      on = !!on && !!ready();
      if (on === rainOn || !rainGain) return;
      rainOn = on;
      const now = ctx.currentTime, level = rainGain.gain;
      level.cancelScheduledValues(now); level.setValueAtTime(level.value, now);
      level.setTargetAtTime(on ? RAIN : 0, now, on ? 0.6 : 0.25);
    };
    const jet = (on) => {
      on = !!on && !!ready();
      if (on === jetOn) return;
      jetOn = on;
      if (!ctx) return;
      const now = ctx.currentTime, level = jetGain.gain, body = jetTone.frequency, turbine = jetWhine.frequency, air = jetFilter.frequency;
      const volume = level.value, bodyHz = body.value, turbineHz = turbine.value, airHz = air.value;
      // Retain the current spool on quick taps; normal release winds down
      // briefly and reaches exact silence. Quiet/results bypass this tail.
      level.cancelScheduledValues(now); level.setValueAtTime(volume, now);
      level.setTargetAtTime(on ? 0.27 : 0, now, on ? 0.035 : 0.045);
      if (!on) level.setValueAtTime(0, now + 0.22);
      body.cancelScheduledValues(now); body.setValueAtTime(bodyHz, now);
      body.exponentialRampToValueAtTime(on ? 82 : 48, now + 0.18);
      turbine.cancelScheduledValues(now); turbine.setValueAtTime(turbineHz, now);
      turbine.exponentialRampToValueAtTime(on ? 390 : 180, now + 0.2);
      air.cancelScheduledValues(now); air.setValueAtTime(airHz, now);
      air.exponentialRampToValueAtTime(on ? 1650 : 600, now + 0.18);
    };
    const gate = () => {
      if (muted) quiet();
      else if (document.hidden) quiet(true);
      if (master) master.gain.setTargetAtTime(muted ? 0 : MASTER, ctx.currentTime, 0.015);
      // Prime before the frame loop stops; returning leaves queued notes intact.
      syncBackground();
    };
    const gesture = event => { if (armed && event.isTrusted) unlock(); };
    const offSound = BL.sound.subscribe(on => { muted = on; gate(); });
    document.addEventListener("visibilitychange", gate);
    window.addEventListener("pointerdown", gesture, true);
    window.addEventListener("keydown", gesture, true);
    const stop = () => {
      armed = false; musicStage = ""; clearBackground(); quiet();
      musicFrom = musicLevel = 0; musicAt = musicUntil = ctx ? ctx.currentTime : 0;
      applyLevel();
      if (music) music.stop();
    };
    const dispose = () => {
      if (disposed) return;
      disposed = true; stop(); offSound();
      document.removeEventListener("visibilitychange", gate);
      window.removeEventListener("pointerdown", gesture, true);
      window.removeEventListener("keydown", gesture, true);
      if (ctx) {
        ctx.removeEventListener("statechange", stateChanged);
        ctx.close().catch(() => {});
      }
      ctx = master = musicGain = jetGain = jetTone = jetWhine = jetFilter = music = null;
      jumps.length = clouds.length = warnings.length = tones.length = airs.length = thunders.length = 0;
      rainGain = null;
    };
    return { unlock, stage, level, tick, song, jump, fade, warn, jet, power, xrayEnding, updraft, anchor, creak, thunder, rain, stop, dispose };
  };
  BL.cloudHopperAudio = { create };
})();
