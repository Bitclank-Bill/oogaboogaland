// Bow & Bone: the archery simulation every round shares. No rendering, no DOM and no dependency on any
// other module, so the unit suite can drive it without a page: create, setMode, start, aim, beginDraw,
// release, step. A round is a fixed set of numbers; step takes the frame's own delta and spends it in whole
// fixed steps, so a slow frame never changes where an arrow lands.
//
// Three rounds share one arrow: the same gravity, wind and draw decide every shot. `range` is twelve arrows
// at three butts, `duel` is two archers of five arrows each taking turns, `defense` is waves walking in from
// the treeline against three hearts and a slow quiver. Only the rules differ; the flight never does.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};

  const STEP = 1 / 60;
  const GRAVITY = 150;
  const MAX_SPEED = 460;
  const MIN_SPEED = 220;
  const DRAW_SECONDS = 0.8;
  const AIM_MIN = -1.05;
  const AIM_MAX = 0.15;
  const AIM_RATE = 1.4;
  const WIND_MIN = -18;
  const WIND_MAX = 18;
  const ARROW_CAP = 8;
  const TARGET_CAP = 3;
  const ENEMY_CAP = 8;
  const ARCHER_X = 66;
  const ARCHER_Y = 204;
  const GROUND_Y = 230;

  // Outer first, so a hit reads the first ring it falls inside.
  const RINGS = Object.freeze([24, 17, 11, 5]);
  const POINTS = Object.freeze([1, 3, 6, 10]);

  const MODES = Object.freeze({
    range: Object.freeze({ arrows: 12, name: "Target range" }),
    duel: Object.freeze({ arrows: 5, name: "Duel" }),
    defense: Object.freeze({ arrows: 8, regen: 1.1, hearts: 3, name: "Legion defence" }),
  });
  const MODE_IDS = Object.freeze(["range", "duel", "defense"]);

  // xorshift32: seeded, so a round is the same round on every page and in the suite.
  const createRng = (seed) => {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  };

  const create = ({ seed = 1, mode = "range" } = {}) => {
    const arrows = new Array(ARROW_CAP);
    for (let i = 0; i < ARROW_CAP; i++) arrows[i] = { active: false, x: 0, y: 0, vx: 0, vy: 0, stuck: false };
    const targets = new Array(TARGET_CAP);
    for (let i = 0; i < TARGET_CAP; i++) targets[i] = { x: 0, y: 0, r: 0, baseY: 0, amp: 0, speed: 0, phase: 0 };
    const enemies = new Array(ENEMY_CAP);
    for (let i = 0; i < ENEMY_CAP; i++) enemies[i] = { active: false, x: 0, y: 0, hp: 1, speed: 0 };
    const players = new Array(2);
    for (let i = 0; i < 2; i++) players[i] = { score: 0, arrows: 0, hits: 0 };

    return {
      seed, mode, rng: createRng(seed),
      status: "ready",
      arrows, targets, enemies, players,
      events: [],
      score: 0, hits: 0, shots: 0,
      aim: -0.34, power: 0, drawing: false, drawTime: 0,
      wind: 0,
      arrowsLeft: MODES.range.arrows,
      turn: 0, round: 0,
      hearts: MODES.defense.hearts,
      wave: 0, waveTimer: 0, regen: 0,
      acc: 0, time: 0,
    };
  };

  const resetTargets = (s, rng) => {
    const spread = s.mode === "duel" ? 1 : 0;
    for (let i = 0; i < TARGET_CAP; i++) {
      const t = s.targets[i];
      t.x = 272 + i * 76;
      t.baseY = i === 1 ? 112 : i === 0 ? 148 : 168;
      t.y = t.baseY;
      t.r = i === 1 ? 20 : 24;
      t.amp = i === 1 ? 26 : 0;
      t.speed = i === 1 ? 1.1 : 0;
      t.phase = rng() * Math.PI * 2;
      if (spread && i === 1) t.x = 348;
    }
    s.wind = Math.round((rng() * 2 - 1) * WIND_MAX);
  };

  const reset = (s) => {
    const mode = MODES[s.mode] ? s.mode : "range";
    s.mode = mode;
    s.rng = createRng(s.seed);
    s.status = "ready";
    s.score = 0; s.hits = 0; s.shots = 0;
    s.aim = -0.34; s.power = 0; s.drawing = false; s.drawTime = 0;
    s.turn = 0; s.round = 0;
    s.hearts = MODES.defense.hearts;
    s.wave = 0; s.waveTimer = 0; s.regen = 0;
    s.acc = 0; s.time = 0;
    s.arrowsLeft = mode === "duel" ? MODES.duel.arrows : mode === "defense" ? MODES.defense.arrows : MODES.range.arrows;
    for (let i = 0; i < 2; i++) { s.players[i].score = 0; s.players[i].arrows = mode === "duel" ? MODES.duel.arrows : 0; s.players[i].hits = 0; }
    for (let i = 0; i < ARROW_CAP; i++) { s.arrows[i].active = false; s.arrows[i].stuck = false; }
    for (let i = 0; i < ENEMY_CAP; i++) s.enemies[i].active = false;
    resetTargets(s, s.rng);
  };

  const setMode = (s, id) => {
    if (s.status === "playing" || !MODES[id]) return false;
    s.mode = id;
    reset(s);
    return true;
  };

  const start = (s, opts = {}) => {
    if (typeof opts.seed === "number") s.seed = opts.seed;
    reset(s);
    s.status = "playing";
    if (s.mode === "defense") spawnWave(s);
    return true;
  };

  const aim = (s, dir) => {
    if (dir) s.aim = Math.max(AIM_MIN, Math.min(AIM_MAX, s.aim + dir * AIM_RATE * STEP));
  };

  const beginDraw = (s) => {
    if (s.status !== "playing" || s.drawing || s.arrowsLeft <= 0) return false;
    s.drawing = true; s.drawTime = 0; s.power = 0;
    return true;
  };

  const speedFor = (power) => MIN_SPEED + (MAX_SPEED - MIN_SPEED) * power;

  const release = (s) => {
    if (!s.drawing) return false;
    s.drawing = false;
    let slot = -1;
    for (let i = 0; i < ARROW_CAP; i++) if (!s.arrows[i].active) { slot = i; break; }
    const power = s.power;
    s.power = 0; s.drawTime = 0;
    if (slot < 0 || s.arrowsLeft <= 0) return false;
    const a = s.arrows[slot];
    const speed = speedFor(power);
    a.active = true; a.stuck = false;
    a.x = ARCHER_X; a.y = ARCHER_Y;
    a.vx = Math.cos(s.aim) * speed;
    a.vy = Math.sin(s.aim) * speed;
    s.arrowsLeft -= 1;
    s.shots += 1;
    if (s.mode === "duel") s.players[s.turn].arrows -= 1;
    s.events.push("loose");
    return true;
  };

  const pointsFor = (t, x, y) => {
    const d = Math.hypot(x - t.x, y - t.y);
    for (let i = 0; i < RINGS.length; i++) if (d <= RINGS[i] * (t.r / 24)) return POINTS[i];
    return 0;
  };

  const award = (s, points) => {
    if (!points) return;
    s.hits += 1;
    s.score += points;
    if (s.mode === "duel") {
      const p = s.players[s.turn];
      p.score += points; p.hits += 1;
    }
    s.events.push(points >= 10 ? "gold" : "hit");
  };

  const arrowDone = (s) => {
    if (s.mode !== "duel") return;
    const next = s.turn === 0 ? 1 : 0;
    if (s.players[next].arrows <= 0) return;
    s.turn = next;
    s.arrowsLeft = s.players[next].arrows;
    if (next === 0) s.round += 1;
  };

  const spawnWave = (s) => {
    s.wave += 1;
    const count = Math.min(ENEMY_CAP, 2 + s.wave);
    for (let i = 0; i < count; i++) {
      const e = s.enemies[i];
      e.active = true;
      e.x = 500 + i * 26;
      e.y = GROUND_Y;
      e.hp = 1;
      e.speed = 9 + s.wave * 1.6;
    }
    for (let i = count; i < ENEMY_CAP; i++) s.enemies[i].active = false;
    s.events.push("wave");
  };

  const hitEnemy = (s, x, y) => {
    for (let i = 0; i < ENEMY_CAP; i++) {
      const e = s.enemies[i];
      if (!e.active) continue;
      if (Math.abs(x - e.x) <= 11 && y >= e.y - 30 && y <= e.y + 2) {
        e.active = false;
        s.hits += 1;
        s.score += 10 * s.wave;
        s.events.push("kill");
        return true;
      }
    }
    return false;
  };

  const stepArrow = (s, a) => {
    a.x += a.vx * STEP;
    a.y += a.vy * STEP;
    a.vy += GRAVITY * STEP;
    a.vx += s.wind * STEP;
    if (s.mode !== "defense") {
      for (let i = 0; i < TARGET_CAP; i++) {
        const t = s.targets[i];
        if (pointsFor(t, a.x, a.y) > 0) {
          a.stuck = true; a.active = false;
          award(s, pointsFor(t, a.x, a.y));
          arrowDone(s);
          return;
        }
      }
    } else if (hitEnemy(s, a.x, a.y)) {
      a.active = false;
      return;
    }
    if (a.x > 520 || a.y > GROUND_Y + 4) {
      a.active = false;
      s.events.push("miss");
      arrowDone(s);
    }
  };

  const stepPlaying = (s) => {
    s.time += STEP;
    if (s.drawing) {
      s.drawTime += STEP;
      s.power = Math.min(1, s.drawTime / DRAW_SECONDS);
    }
    for (let i = 0; i < ARROW_CAP; i++) if (s.arrows[i].active) stepArrow(s, s.arrows[i]);

    if (s.mode !== "defense") {
      for (let i = 0; i < TARGET_CAP; i++) {
        const t = s.targets[i];
        if (t.amp) t.y = t.baseY + Math.sin(s.time * t.speed + t.phase) * t.amp;
      }
      const spent = s.mode === "duel"
        ? s.players[0].arrows <= 0 && s.players[1].arrows <= 0
        : s.arrowsLeft <= 0;
      let live = false;
      for (let i = 0; i < ARROW_CAP; i++) if (s.arrows[i].active) { live = true; break; }
      if (spent && !live) { s.status = "clear"; s.events.push("clear"); }
      return;
    }

    if (s.arrowsLeft < MODES.defense.arrows) {
      s.regen += STEP;
      if (s.regen >= MODES.defense.regen) { s.regen = 0; s.arrowsLeft += 1; }
    }
    let alive = 0;
    for (let i = 0; i < ENEMY_CAP; i++) {
      const e = s.enemies[i];
      if (!e.active) continue;
      e.x -= e.speed * STEP;
      if (e.x <= ARCHER_X + 12) {
        e.active = false;
        s.hearts -= 1;
        s.events.push("breach");
        if (s.hearts <= 0) { s.status = "over"; s.events.push("over"); return; }
        continue;
      }
      alive += 1;
    }
    if (alive === 0) { s.waveTimer += STEP; if (s.waveTimer > 1.6) { s.waveTimer = 0; spawnWave(s); } }
  };

  // The frame's delta, spent in whole fixed steps. The remainder carries, so the flight is the same at any
  // frame rate and nothing is allocated here.
  const step = (s, dt) => {
    if (s.status !== "playing") return;
    s.acc += dt > 0.25 ? 0.25 : dt;
    while (s.acc >= STEP) { s.acc -= STEP; stepPlaying(s); }
  };

  BL.archerySim = Object.freeze({
    STEP, GRAVITY, MAX_SPEED, MIN_SPEED, DRAW_SECONDS, AIM_MIN, AIM_MAX, AIM_RATE, WIND_MIN, WIND_MAX,
    ARROW_CAP, TARGET_CAP, ENEMY_CAP, ARCHER_X, ARCHER_Y, GROUND_Y, RINGS, POINTS, MODES, MODE_IDS,
    create, reset, setMode, start, aim, beginDraw, release, step, pointsFor,
  });
})();
