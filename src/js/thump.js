// Ooga thump: a supportive reaction in island voice. A visitor in voice (talking, or listen-only without ever a
// microphone) presses Thump beside the voice controls, and their Ooga taps its club on the ground instead of them
// unmuting to say "yes!". The room takes `{"t":"thump"}` only from a voice participant and relays it only to that
// player's voice peers (`thumpPeers` in worker/src/protocol.js), two a second with a burst of three per account; this
// page mirrors that bucket so it never sends what the room would drop.
// Every page in the voice group then counts distinct supporters, never taps: three taps from one person are one Ooga.
// Three or more within WINDOW_MS make a crowd, announced in neutral words ("5 Oogas thumped", naming nobody supported)
// on a banner and as one local notice on the chat board (`BL.chat.support`, never a chat line: never sent, stored or
// in the history), after which the notice rests COOLDOWN_MS for the whole group on this page, whoever speaks next.
// A thump shows on the thumper's body (`BL.remotePlayers.thumped`: a one-off arm, or a fallback mallet where the body
// cannot safely move) and as a support mark pulsing beside their name in the roster and the players tab.
// Sound is one synthesized thump, never a recording: a sine thud falling 120 to 48 Hz over 35 ms with a 110 ms decay,
// a 30 ms low-passed noise puff and a 12 ms 1.6 kHz wood knock, slightly detuned each time and panned by where the
// thumper stands on screen. A crowd sounds only as its real thumps do. VOICES pooled voices, built once, sound at most
// at a time, at most RATE_MAX start in any second, quietly and lower still under speech; a thump that cannot sound now
// is dropped, never queued. Nothing plays, shows or counts while the tab is hidden, the room is not live or the zone
// is changing. Reaction sounds On/Off (`ooga-thump-sound`) silences every thump, own or heard; the bodies, marks and
// notices stay. It is not the microphone's mute, voice's volume or the page mute (`BL.sound`), which still silences
// everything through `output`. A player muted for this visitor (`BL.voice.muteLocal`) is neither heard nor shown.
// Calm (prefers-reduced-motion) holds the banner and marks still and shows the mallet rather than moving a body.
// No frame work and no idle timers: everything happens on a press or a relayed thump. Exports press, heard,
// toggleSound, setSound, soundOn, stats and, for the unit tier, createLedger and createMixer.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const SOUND_KEY = "ooga-thump-sound";
  // The room's own bucket (THUMP_HZ, THUMP_BURST in worker/src/protocol.js).
  const SEND_HZ = 2, SEND_BURST = 3;
  // Distinct supporters within WINDOW_MS make a crowd at CROWD; the notice then rests COOLDOWN_MS. At most
  // SUPPORTERS_MAX are held: the room's 32 and this page.
  const WINDOW_MS = 2000, CROWD = 3, COOLDOWN_MS = 12000, SUPPORTERS_MAX = 33;
  // A zone change into another voice group drops thumps for SETTLE_MS while voice settles there.
  const SETTLE_MS = 1500;
  // Sound: VOICES at once, each busy VOICE_S; at most RATE_MAX started in any RATE_S; LEVEL, DUCK of it under speech.
  const VOICES = 4, VOICE_S = 0.16, RATE_MAX = 6, RATE_S = 1, LEVEL = 0.22, DUCK = 0.5;
  const CROWD_MS = 2600;
  const CALM = window.matchMedia("(prefers-reduced-motion: reduce)");
  const CROWD_RISE = [{ opacity: 0, transform: "translate(-50%, 6px) scale(0.92)" }, { opacity: 1, transform: "translate(-50%, 0) scale(1.06)", offset: 0.1 },
    { opacity: 1, transform: "translate(-50%, 0) scale(1)", offset: 0.2 }, { opacity: 1, transform: "translate(-50%, 0) scale(1)", offset: 0.85 }, { opacity: 0, transform: "translate(-50%, 0) scale(1)" }];
  const CROWD_STILL = [{ opacity: 1 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }];

  // Who supported lately: one entry a supporter, refreshed by every thump, and the group's notice cooldown.
  const createLedger = ({ windowMs = WINDOW_MS, crowd = CROWD, cooldownMs = COOLDOWN_MS, max = SUPPORTERS_MAX } = {}) => {
    const seen = new Map();
    let quietUntil = -Infinity;
    return {
      // A thump from `id` at `now` (ms): the distinct supporters in the window, and whether to announce them.
      add(id, now) {
        for (const [who, at] of seen) if (now - at >= windowMs) seen.delete(who);
        if (seen.has(id)) seen.delete(id);
        else if (seen.size >= max) seen.delete(seen.keys().next().value);
        seen.set(id, now);
        const count = seen.size;
        if (count < crowd || now < quietUntil) return { count, crowd: false };
        quietUntil = now + cooldownMs;
        return { count, crowd: true };
      },
      // Another voice group: its supporters start over, and the cooldown stands.
      reset() { seen.clear(); },
      get size() { return seen.size; },
      get quietUntil() { return quietUntil; },
    };
  };

  // The pooled thump voices on `context`, into `out` (the page mute's gate). `play(pan, ducked)` schedules one now or
  // answers false; nothing is ever scheduled ahead.
  const createMixer = (context, out, random = Math.random) => {
    const master = context.createGain();
    master.gain.value = 1;
    master.connect(out);
    const noise = context.createBuffer(1, context.sampleRate, context.sampleRate), data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = random() * 2 - 1;
    const voices = [];
    for (let i = 0; i < VOICES; i++) {
      const pan = context.createStereoPanner();
      pan.connect(master);
      const body = context.createOscillator(), bodyGain = context.createGain();
      body.type = "sine"; bodyGain.gain.value = 0;
      body.connect(bodyGain); bodyGain.connect(pan);
      const knock = context.createOscillator(), knockGain = context.createGain();
      knock.type = "triangle"; knockGain.gain.value = 0;
      knock.connect(knockGain); knockGain.connect(pan);
      const puff = context.createBufferSource(), filter = context.createBiquadFilter(), puffGain = context.createGain();
      puff.buffer = noise; puff.loop = true; filter.type = "lowpass"; filter.frequency.value = 650; puffGain.gain.value = 0;
      puff.connect(filter); filter.connect(puffGain); puffGain.connect(pan);
      body.start(); knock.start(); puff.start(0, i * 0.23);
      voices.push({ pan, body, bodyGain, knock, knockGain, puffGain, until: 0 });
    }
    const starts = new Float64Array(RATE_MAX).fill(-Infinity);
    let next = 0, playing = 0;
    const counts = { played: 0, busy: 0, rate: 0 };
    const play = (pan, ducked) => {
      if (context.state !== "running") return false;
      const now = context.currentTime;
      // The oldest of the last RATE_MAX starts must be over a second gone.
      if (now - starts[next] < RATE_S) { counts.rate++; return false; }
      let v = null;
      playing = 0;
      for (const c of voices) if (c.until > now) playing++; else if (!v) v = c;
      if (!v) { counts.busy++; return false; }
      starts[next] = now; next = (next + 1) % RATE_MAX;
      v.until = now + VOICE_S;
      playing++;
      counts.played++;
      const peak = LEVEL * (ducked ? DUCK : 1), pitch = 1 + (random() - 0.5) * 0.12;
      v.pan.pan.setValueAtTime(Math.max(-1, Math.min(1, pan * 0.8)), now);
      const f = v.body.frequency, g = v.bodyGain.gain;
      f.cancelScheduledValues(now); f.setValueAtTime(120 * pitch, now); f.exponentialRampToValueAtTime(48 * pitch, now + 0.035);
      g.cancelScheduledValues(now); g.setValueAtTime(0, now); g.linearRampToValueAtTime(peak, now + 0.004); g.setTargetAtTime(0, now + 0.006, 0.024); g.setValueAtTime(0, now + VOICE_S);
      const p = v.puffGain.gain;
      p.cancelScheduledValues(now); p.setValueAtTime(0, now); p.linearRampToValueAtTime(peak * 0.45, now + 0.003); p.setTargetAtTime(0, now + 0.004, 0.007); p.setValueAtTime(0, now + 0.06);
      const kf = v.knock.frequency, k = v.knockGain.gain;
      kf.setValueAtTime(1600 * pitch, now);
      k.cancelScheduledValues(now); k.setValueAtTime(0, now); k.linearRampToValueAtTime(peak * 0.3, now + 0.001); k.setTargetAtTime(0, now + 0.002, 0.0028); k.setValueAtTime(0, now + 0.03);
      return true;
    };
    return { play, get playing() { return playing; }, counts, voices: VOICES };
  };

  const net = BL.net, voice = BL.voice;
  const $ = (id) => document.getElementById(id);
  const button = $("account-thump"), soundButton = $("account-thump-sound"), crowd = $("thump-crowd"), crowdText = $("thump-crowd-text");
  if (!button) {
    BL.thump = { createLedger, createMixer };
    return;
  }
  button.prepend(BL.hud.malletIcon.cloneNode(true));
  crowd.prepend(BL.hud.malletIcon.cloneNode(true));
  let soundOn = true;
  try { soundOn = localStorage.getItem(SOUND_KEY) !== "off"; } catch { /* storage off: on for this page */ }
  const ledger = createLedger(), bucket = { tokens: SEND_BURST, at: -Infinity };
  const stats = { sent: 0, heard: 0, shown: 0, dropped: 0, sounded: 0, silenced: 0, crowds: 0, crowd: 0 };
  let context = null, mixer = null, group = null, settleUntil = 0, crowdPulse = null;
  let shownHidden = null, shownSound = null;

  const groupOf = (zone) => { const dot = zone.indexOf("."); return dot < 0 ? zone : zone.slice(0, dot); };
  const participant = () => net.state.room === "live" && !!net.state.me && voice.stats.enabled;
  const quiet = (now) => document.hidden || !participant() || net.state.zone === "none" || now < settleUntil;
  const speech = () => {
    if (voice.stats.speaking) return true;
    for (const id of net.remotes.keys()) if (voice.speaking(id)) return true;
    return false;
  };
  const audio = () => {
    if (mixer) return context.state === "closed" ? null : mixer;
    if (!window.AudioContext || navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
    context = new window.AudioContext();
    mixer = createMixer(context, BL.sound.output(context));
    return mixer;
  };
  const closeAudio = () => {
    if (!context) return;
    context.close().catch(() => {});
    context = mixer = null;
  };

  const render = () => {
    const hidden = !participant();
    if (hidden !== shownHidden) { shownHidden = hidden; button.hidden = soundButton.hidden = hidden; }
    if (soundOn !== shownSound) {
      shownSound = soundOn;
      soundButton.textContent = soundOn ? "Reaction sounds: On" : "Reaction sounds: Off";
      soundButton.setAttribute("aria-pressed", String(soundOn));
      soundButton.title = soundOn ? "Thumps make a sound: click to silence them" : "Thumps are silent: click to hear them";
    }
  };
  const setSound = (on) => {
    soundOn = !!on;
    try { localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off"); } catch { /* storage off: this page only */ }
    render();
    return soundOn;
  };

  const announce = (count) => {
    stats.crowds++;
    stats.crowd = count;
    const words = `${count} Oogas thumped`;
    crowdText.textContent = words;
    crowd.hidden = false;
    if (crowdPulse) crowdPulse.cancel();
    const pulse = crowdPulse = crowd.animate(CALM.matches ? CROWD_STILL : CROWD_RISE, { duration: CROWD_MS, easing: "ease-out" });
    pulse.onfinish = () => { if (crowdPulse === pulse) { crowdPulse = null; crowd.hidden = true; } };
    BL.chat.support(words);
  };
  // One thump, the visitor's own (`id` 0) or a remote player's, on this page.
  const effect = (id, rec, now) => {
    stats.shown++;
    const pan = BL.remotePlayers ? BL.remotePlayers.thumped(id) : null;
    BL.hud.showSupport(rec.login, rec.body);
    BL.players.pulse(id);
    if (!soundOn) stats.silenced++;
    else {
      const m = audio();
      if (m && m.play(pan || 0, speech())) stats.sounded++;
      else stats.dropped++;
    }
    const counted = ledger.add(id || net.state.selfId, now);
    if (counted.crowd) announce(counted.count);
  };
  const take = (now) => {
    bucket.tokens = Math.min(SEND_BURST, bucket.tokens + (now - bucket.at) * SEND_HZ / 1000);
    bucket.at = now;
    if (bucket.tokens < 1) return false;
    bucket.tokens -= 1;
    return true;
  };
  const press = () => {
    const now = performance.now();
    if (quiet(now) || !take(now) || !net.sendThump()) return false;
    stats.sent++;
    effect(0, { login: net.state.me.login, body: net.state.body }, now);
    return true;
  };
  const heard = (id) => {
    stats.heard++;
    const now = performance.now(), rec = net.remotes.get(id);
    if (quiet(now) || !rec) { stats.dropped++; return; }
    if (voice.mutedLocally(rec.login)) return;
    effect(id, rec, now);
  };

  // Another voice group, or none: its supporters start over and thumps settle.
  const follow = () => {
    const now = performance.now(), live = net.state.room === "live", next = live ? groupOf(net.state.zone) : "";
    if (next !== group) {
      group = next;
      ledger.reset();
      settleUntil = now + SETTLE_MS;
    }
    render();
  };
  net.subscribe(follow);
  net.subscribeRoster(follow);
  net.subscribeThump(heard);
  voice.subscribe(() => {
    if (!voice.stats.enabled && !voice.stats.joining) closeAudio();
    render();
  });
  render();

  BL.thump = {
    press, heard, setSound, toggleSound: () => setSound(!soundOn), createLedger, createMixer,
    get soundOn() { return soundOn; },
    get stats() { return { ...stats, supporters: ledger.size, playing: mixer ? mixer.playing : 0, audio: mixer ? { ...mixer.counts } : null }; },
  };
})();
